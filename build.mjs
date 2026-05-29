import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const SRC = path.join(ROOT, 'sites');
const SHARED = path.join(ROOT, 'shared');
const DIST = path.join(ROOT, 'dist');

const SITES = {
  hub: {
    name: 'GameHub',
    domain: 'savebook.net',
    canonical: 'https://savebook.net',
    desc: 'Unified hub for game guides. Explore Forza Horizon 6, Dead As Disco, Subnautica 2.',
    ogImg: 'https://savebook.net/og-image.png',
  },
  fh6guide: {
    name: 'Forza Horizon 6 Guide',
    domain: 'fh6.savebook.net',
    canonical: 'https://fh6.savebook.net',
    desc: 'Forza Horizon 6 Japan Complete Guide. Walkthroughs, tips, cheats.',
    ogImg: 'https://fh6.savebook.net/og-image.png',
  },
  'dead-as-disco': {
    name: 'Dead As Disco Guide',
    domain: 'disco.savebook.net',
    canonical: 'https://disco.savebook.net',
    desc: 'Dead As Disco official walkthrough, cheats, and complete guide.',
    ogImg: 'https://disco.savebook.net/og-image.png',
  },
  subnautica2: {
    name: 'Subnautica 2 Wiki',
    domain: 'subnautica2.savebook.net',
    canonical: 'https://subnautica2.savebook.net',
    desc: 'Subnautica 2 complete guide, cheats, and walkthrough.',
    ogImg: 'https://subnautica2.savebook.net/og-image.png',
  },
};

/* ============================================
   Helper Functions
   ============================================ */

function log(msg, type = 'info') {
  const icons = { info: '📦', success: '✅', error: '❌', warn: '⚠️' };
  console.log(`${icons[type] || ''} ${msg}`);
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

/* ----------
   HTML Processing
   ---------- */
function injectMeta(html, site) {
  const d = SITES[site];
  if (!d) return html;

  let out = html;
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

function getDepthFromHtmlPath(html, siteName) {
  // For hub site with guides folder, we need to calculate depth based on actual file location
  const match = html.match(/data-original-path="([^"]+)"/);
  if (match) {
    const filePath = match[1];
    const destSiteDir = path.join(DIST, siteName);
    const rel = path.relative(destSiteDir, path.dirname(filePath));
    const parts = rel.split(path.sep).filter(p => p && p !== '');
    return Math.max(0, parts.length);
  }
  return 0;
}

// No path adjustment needed - header uses absolute paths starting with /

/* ----------
   Shared Code Injection
   ---------- */
function injectSharedLinks(html, filePath, siteName) {
  const depth = getDepth(filePath, siteName);
  const prefix = depth > 0 ? '../'.repeat(depth) : './';

  const sharedCssBase = `${prefix}shared/css/base.css`;
  const sharedCssLayout = `${prefix}shared/css/layout.css`;
  const sharedCssComponents = `${prefix}shared/css/components.css`;
  const sharedJs = `${prefix}shared/js/shared.js`;

  let out = html;

  // Build shared CSS tags
  const sharedCssTags = `  <link rel="stylesheet" href="${sharedCssBase}">
  <link rel="stylesheet" href="${sharedCssLayout}">
  <link rel="stylesheet" href="${sharedCssComponents}">`;

  if (!out.includes('shared/css/base.css')) {
    // Insert shared CSS BEFORE site stylesheet so site CSS can override shared defaults
    const siteStylesheetRegex = /<link[^>]*href="[^"]*css\/[^"]*\.css[^"]*"[^>]*>/i;
    const match = out.match(siteStylesheetRegex);
    if (match) {
      // Insert shared CSS BEFORE site stylesheet
      out = out.replace(match[0], sharedCssTags + '\n  ' + match[0]);
    } else {
      // If no site stylesheet found, inject before </head>
      out = out.replace(/<\/head>/, sharedCssTags + '\n</head>');
    }
  }

  // Add shared JS before </body>
  if (!out.includes('shared/js/shared.js')) {
    out = out.replace(/<\/body>/, `  <script src="${sharedJs}"></script>\n</body>`);
  }

  return out;
}

/* ----------
   Include Injection (Header/Footer)
   ---------- */
function injectIncludes(html, siteName, filePath) {
  const includesDir = path.join(SRC, siteName, '_includes');
  const depth = getDepth(filePath, siteName);
  const prefix = depth > 0 ? '../'.repeat(depth) : './';

  if (!fs.existsSync(includesDir)) return html;

  let out = html;

  // Read header and footer templates
  const headerPath = path.join(includesDir, 'header.html');
  const footerPath = path.join(includesDir, 'footer.html');

  // Replace header - remove existing <header>...</header> and inject include content
  if (fs.existsSync(headerPath)) {
    const headerContent = fs.readFileSync(headerPath, 'utf8');
    let adjustedHeader = adjustLinks(headerContent, prefix);

    // Remove existing header block
    out = out.replace(/<header[\s\S]*?<\/header>\s*/i, '');
    // Remove mobile nav that follows header
    out = out.replace(/<nav class="nav-mobile"[\s\S]*?<\/nav>\s*/i, '');

    // Insert after <body> tag
    out = out.replace(/<body[^>]*>/i, `$&\n${adjustedHeader.trim()}`);
  }

  // Replace footer - remove existing <footer>...</footer> and inject include content
  if (fs.existsSync(footerPath)) {
    const footerContent = fs.readFileSync(footerPath, 'utf8');
    let adjustedFooter = adjustLinks(footerContent, prefix);

    // Remove existing footer block
    out = out.replace(/<footer[\s\S]*?<\/footer>\s*/i, '');

    // Insert before </body>
    out = out.replace(/<\/body>/i, `\n${adjustedFooter.trim()}\n</body>`);
  }

  return out;
}

function adjustLinks(content, prefix) {
  // DON'T modify links here - fixPaths will handle it properly based on actual file depth
  return content;
}

/* ----------
   Normalize Footer
   ---------- */
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
    // File is in pages/ (e.g., /fh6guide/pages/about.html)
    aboutPrivacyPrefix = '';
    termsHref = '../terms.html';  // points to root
  } else if (depth === 2) {
    // File is in pages/legal/ or similar (e.g., /subnautica2/pages/legal/about.html)
    aboutPrivacyPrefix = './';
    termsHref = './terms.html';  // same directory
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

      // Track original path for depth calculation
      html = html.replace(/<html/i, `<html data-original-path="${filePath}"`);

      // Don't modify relative paths - they are already correct in source
      // Only inject meta, shared links, and includes

      html = injectMeta(html, siteName);
      html = injectSharedLinks(html, filePath, siteName);
      html = injectIncludes(html, siteName, filePath);
      html = normalizeFooter(html, filePath, siteName);

      fs.writeFileSync(filePath, html, 'utf8');
    }

    if (filename === 'sitemap.xml') {
      const d = SITES[siteName];
      if (d) {
        let xml = fs.readFileSync(filePath, 'utf8');
        // More precise replacement - only replace domain-specific patterns
        const escapedDomain = d.domain.replace('.', '\\.');
        xml = xml.replace(new RegExp(`https?://[^/]+${escapedDomain}/[^/]+/`, 'g'), `${d.canonical}/`);
        fs.writeFileSync(filePath, xml, 'utf8');
      }
    }
  } catch (err) {
    log(`Error processing ${filePath}: ${err.message}`, 'error');
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

/* ----------
   Shared Code Copying
   ---------- */
function copyShared(targetDir) {
  const sharedDest = path.join(targetDir, 'shared');
  if (fs.existsSync(SHARED)) {
    copyDir(SHARED, sharedDest);
  }
}

/* ----------
   Build Single Site
   ---------- */
function buildSite(siteName, siteInfo) {
  const srcDir = path.join(SRC, siteName);
  const destDir = path.join(DIST, siteName);

  if (!fs.existsSync(srcDir)) {
    log(`Source directory not found: ${srcDir}`, 'warn');
    return false;
  }

  log(`${siteName} → ${siteInfo.domain}`);

  // Copy site files
  copyDir(srcDir, destDir, ['.git', 'node_modules']);

  // Copy shared code
  copyShared(destDir);

  // Process all files
  walkDir(destDir, f => processFile(f, siteName));

  return true;
}

/* ============================================
   Main Build
   ============================================ */

async function build() {
  console.log('\n🛠️  Building savebook monorepo...\n');

  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;

  // Clean dist directory
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST, { recursive: true });

  // Build all sites in parallel
  const promises = Object.entries(SITES).map(async ([siteName, siteInfo]) => {
    try {
      const success = buildSite(siteName, siteInfo);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    } catch (err) {
      log(`Failed to build ${siteName}: ${err.message}`, 'error');
      errorCount++;
    }
  });

  await Promise.all(promises);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ Built ${successCount} site(s) in ${duration}s`);

  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} site(s) failed`);
  }

  console.log('\n📁 Output:');
  for (const [name, info] of Object.entries(SITES)) {
    console.log(`   dist/${name}/ → ${info.domain}`);
  }
  console.log('');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});