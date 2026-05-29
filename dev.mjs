import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import http from 'http';
import { exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const SRC = path.join(ROOT, 'sites');
const SHARED = path.join(ROOT, 'shared');
const DIST = path.join(ROOT, 'dist');
const PORT = 3000;
const DEV_MODE = true;

const SITES = {
  hub: { name: 'GameHub', domain: 'savebook.net', canonical: 'https://savebook.net', desc: 'Unified hub for game guides.', ogImg: 'https://savebook.net/og-image.png', localPath: '/' },
  fh6guide: { name: 'Forza Horizon 6 Guide', domain: 'fh6.savebook.net', canonical: 'https://fh6.savebook.net', desc: 'Forza Horizon 6 Japan Complete Guide.', ogImg: 'https://fh6.savebook.net/og-image.png', localPath: '/fh6guide/' },
  'dead-as-disco': { name: 'Dead As Disco Guide', domain: 'disco.savebook.net', canonical: 'https://disco.savebook.net', desc: 'Dead As Disco official walkthrough.', ogImg: 'https://disco.savebook.net/og-image.png', localPath: '/dead-as-disco/' },
  subnautica2: { name: 'Subnautica 2 Wiki', domain: 'subnautica2.savebook.net', canonical: 'https://subnautica2.savebook.net', desc: 'Subnautica 2 complete guide.', ogImg: 'https://subnautica2.savebook.net/og-image.png', localPath: '/subnautica2/' },
};

/* ============================================
   Build Functions (same as build.mjs)
   ============================================ */

function log(msg) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${msg}`);
}

function copyDir(src, dest, skipDirs = ['.git', 'node_modules']) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipDirs.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, skipDirs);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getDepth(filePath, siteName) {
  const destSiteDir = path.join(DIST, siteName);
  const fileDir = path.dirname(filePath);
  const rel = path.relative(destSiteDir, fileDir);
  const parts = rel.split(path.sep).filter(p => p && p !== '');
  return Math.max(0, parts.length);
}

function injectMeta(html, site) {
  const d = SITES[site];
  if (!d) return html;
  let out = html;

  // In dev mode, rewrite external domain links to local paths
  if (DEV_MODE && d.localPath) {
    const otherSites = Object.entries(SITES).filter(([key]) => key !== site);
    for (const [key, siteInfo] of otherSites) {
      const escapedDomain = siteInfo.domain.replace('.', '\\.');
      out = out.replace(new RegExp(`https?://${escapedDomain}`, 'g'), siteInfo.localPath);
    }
  }

  const replacements = [
    [/<meta property="og:title"[^>]*content="[^"]*"/, `<meta property="og:title" content="${d.name}"`],
    [/<meta property="og:description"[^>]*content="[^"]*"/, `<meta property="og:description" content="${d.desc}"`],
    [/<meta property="og:image"[^>]*content="[^"]*"/, `<meta property="og:image" content="${d.ogImg}"`],
    [/<meta name="twitter:title"[^>]*content="[^"]*"/, `<meta name="twitter:title" content="${d.name}"`],
    [/<meta name="twitter:description"[^>]*content="[^"]*"/, `<meta name="twitter:description" content="${d.desc}"`],
    [/<meta name="twitter:image"[^>]*content="[^"]*"/, `<meta name="twitter:image" content="${d.ogImg}"`],
    [/<link rel="canonical"[^>]*href="[^"]*"/, `<link rel="canonical" href="${d.canonical}/`],
  ];
  for (const [regex, replacement] of replacements) {
    out = out.replace(regex, replacement);
  }
  return out;
}

function injectSharedLinks(html, filePath, siteName) {
  const depth = getDepth(filePath, siteName);
  const prefix = depth > 0 ? '../'.repeat(depth) : './';

  const sharedCssBase = `${prefix}shared/css/base.css`;
  const sharedCssLayout = `${prefix}shared/css/layout.css`;
  const sharedCssComponents = `${prefix}shared/css/components.css`;
  const sharedJs = `${prefix}shared/js/shared.js`;

  let out = html;

  // Inject shared CSS AFTER site's main stylesheet
  const sharedCssTags = `  <link rel="stylesheet" href="${sharedCssBase}">
  <link rel="stylesheet" href="${sharedCssLayout}">
  <link rel="stylesheet" href="${sharedCssComponents}">`;

  if (!out.includes('shared/css/base.css')) {
    const styleSheetRegex = /<link rel="stylesheet"[^>]*href="[^"]*(?:style\.css|index\.css)[^"]*"[^>]*>/i;
    const match = out.match(styleSheetRegex);
    if (match) {
      out = out.replace(match[0], match[0] + '\n' + sharedCssTags);
    } else {
      out = out.replace(/<\/head>/, sharedCssTags + '\n</head>');
    }
  }

  // Add shared JS before </body>
  if (!out.includes('shared/js/shared.js')) {
    out = out.replace(/<\/body>/, `  <script src="${sharedJs}"></script>\n</body>`);
  }

  return out;
}

function normalizeFooter(html, filePath, siteName) {
  // Determine prefix and about/privacy/terms links based on actual file location
  const relativeToRoot = path.relative(path.join(DIST, siteName), path.dirname(filePath));
  const depth = relativeToRoot.split(path.sep).filter(p => p).length;

  let aboutPrivacyPrefix;
  let termsHref;

  if (depth === 0) {
    // File is at site root (e.g., /subnautica2/about.html or /fh6guide/terms.html)
    // All legal pages (about, privacy, terms) are at root with this file
    aboutPrivacyPrefix = '';
    termsHref = 'terms.html';  // points to same file
  } else if (depth === 1) {
    // File is in pages/ (e.g., /subnautica2/pages/about.html)
    aboutPrivacyPrefix = '';
    termsHref = '../terms.html';
  } else if (depth === 2) {
    // File is in pages/legal/ or similar (e.g., /subnautica2/pages/legal/about.html)
    aboutPrivacyPrefix = './';
    termsHref = './terms.html';
  } else {
    // Deeper subdirectory
    aboutPrivacyPrefix = '../';
    termsHref = '../terms.html';
  }

  const standardFooter = `  <footer class="footer">
    <div class="container">
      <div class="footer-inner">
        <span class="footer-copy">© 2026 savebook.net — Unofficial Fan Site</span>
        <div class="footer-legal">
          <a href="${aboutPrivacyPrefix}about.html">About</a>
          <a href="${aboutPrivacyPrefix}privacy.html">Privacy</a>
          <a href="${termsHref}">Terms</a>
        </div>
      </div>
    </div>
  </footer>`;

  let out = html;
  // Replace footer content but preserve scripts after footer
  const footerStart = out.indexOf('<footer class="footer">');
  if (footerStart !== -1) {
    const footerEnd = out.indexOf('</footer>', footerStart);
    if (footerEnd !== -1) {
      const beforeFooter = out.substring(0, footerStart);
      const afterFooter = out.substring(footerEnd + '</footer>'.length);
      out = beforeFooter + standardFooter + afterFooter;
    }
  }
  // Remove any toast divs
  out = out.replace(/\s*<div id="toast"[^>]*>.*?<\/div>/gs, '');
  return out;
}

function processFile(filePath, siteName) {
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);
  try {
    if (ext === '.html') {
      let html = fs.readFileSync(filePath, 'utf8');
      html = html.replace(/<html/i, `<html data-original-path="${filePath}"`);

      // Don't modify relative paths - they are already correct in source

      html = injectMeta(html, siteName);
      html = injectSharedLinks(html, filePath, siteName);
      html = normalizeFooter(html, filePath, siteName);
      fs.writeFileSync(filePath, html, 'utf8');
    }
    if (filename === 'sitemap.xml') {
      const d = SITES[siteName];
      if (d) {
        let xml = fs.readFileSync(filePath, 'utf8');
        const escapedDomain = d.domain.replace('.', '\\.');
        xml = xml.replace(new RegExp(`https?://[^/]+${escapedDomain}/[^/]+/`, 'g'), `${d.canonical}/`);
        fs.writeFileSync(filePath, xml, 'utf8');
      }
    }
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
  }
}

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, callback);
    } else {
      callback(full);
    }
  }
}

function copyShared(targetDir) {
  const sharedDest = path.join(targetDir, 'shared');
  if (fs.existsSync(SHARED)) {
    copyDir(SHARED, sharedDest);
  }
}

function buildSite(siteName) {
  const srcDir = path.join(SRC, siteName);
  const destDir = path.join(DIST, siteName);
  if (!fs.existsSync(srcDir)) return;
  copyDir(srcDir, destDir, ['.git', 'node_modules']);
  copyShared(destDir);
  walkDir(destDir, f => processFile(f, siteName));
}

function buildAll() {
  log('🔨 Building all sites...');
  for (const siteName of Object.keys(SITES)) {
    buildSite(siteName);
  }
  log('✅ Build complete');
}

/* ============================================
   Static File Server
   ============================================ */

function getContentType(filePath) {
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}

function serveStatic(dir) {
  return (req, res) => {
    let filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url);
    // Handle SPA-style routing - try .html extension
    if (!fs.existsSync(filePath) && !path.extname(filePath)) {
      filePath = filePath + '.html';
    }
    // Security: prevent directory traversal
    if (!filePath.startsWith(dir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found: ' + req.url);
    }
  };
}

/* ============================================
   Dev Server with Watch
   ============================================ */

async function startDevServer() {
  // Initial build
  buildAll();

  // Start static server
  const server = http.createServer((req, res) => {
    // Route to appropriate site based on hostname or path
    const url = req.url.split('?')[0];
    let site = 'hub';
    // Check if requesting a specific site via path
    const match = url.match(/^\/(hub|fh6guide|dead-as-disco|subnautica2)/);
    if (match) {
      site = match[1];
    }
    // Remove site prefix and leading slash
    let remainingPath = url.replace(`/${site}`, '') || '/';
    if (remainingPath === '/') {
      // Root of site - serve index.html
      remainingPath = '/index.html';
    } else if (!path.extname(remainingPath)) {
      // No extension - try .html
      remainingPath = remainingPath + '.html';
    }
    const filePath = path.join(DIST, site, remainingPath);
    const finalPath = fs.existsSync(filePath) && fs.statSync(filePath).isFile() ? filePath : path.join(DIST, site, 'index.html');

    if (fs.existsSync(finalPath)) {
      res.writeHead(200, { 'Content-Type': getContentType(finalPath) });
      fs.createReadStream(finalPath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(PORT, () => {
    log(`🖥️  Dev server running at http://localhost:${PORT}/`);
    log(`   Press Ctrl+C to stop`);
  });

  // Watch for changes
  const watchPaths = [SRC, SHARED];
  log(`👀 Watching for changes in sites/ and shared/`);

  const watcher = chokidar.watch(watchPaths, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
  });

  let rebuildTimeout = null;

  watcher.on('all', (event, filePath) => {
    if (rebuildTimeout) clearTimeout(rebuildTimeout);
    rebuildTimeout = setTimeout(() => {
      log(`📝 ${event}: ${path.relative(ROOT, filePath)}`);
      buildAll();
    }, 100);
  });

  process.on('SIGINT', () => {
    log('\n👋 Stopping dev server...');
    watcher.close();
    server.close();
    process.exit(0);
  });
}

startDevServer();