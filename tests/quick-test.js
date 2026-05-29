// Simple test script without Playwright - uses HTTP requests
const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3000;

const pages = [
  { path: '/', name: 'Hub', expectTitle: 'GameHub' },
  { path: '/fh6guide/', name: 'FH6Guide', expectTitle: 'Forza' },
  { path: '/fh6guide/pages/guides/car-guide.html', name: 'FH6 Car Guide', expectTitle: 'Forza' },
  { path: '/dead-as-disco/', name: 'Dead As Disco', expectTitle: 'Disco' },
  { path: '/subnautica2/', name: 'Subnautica2', expectTitle: 'Subnautica' },
];

function fetchPage(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${BASE_URL}:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function checkFooter(body) {
  const hasFooter = body.includes('<footer class="footer">');
  const hasCopyright = body.includes('© 2026 savebook.net');
  const hasAboutLink = body.includes('About</a>') && body.includes('Privacy</a>') && body.includes('Terms</a>');
  return { hasFooter, hasCopyright, hasAboutLink };
}

function checkImages(body, path) {
  // Extract image sources from HTML
  const imgMatches = body.match(/src="([^"]*(?:jpg|png|gif|jpeg|webp)[^"]*)"/gi) || [];
  return imgMatches.map(m => {
    const src = m.match(/src="([^"]+)"/)[1];
    // Check if path is relative (starts with . or / or images/)
    return src;
  }).filter(src => src.startsWith('.') || src.startsWith('/images') || src.startsWith('images'));
}

async function runTests() {
  console.log('\n🧪 Savebook Site Tests\n');

  let passed = 0;
  let failed = 0;

  for (const page of pages) {
    try {
      console.log(`Testing: ${page.name} (${page.path})`);
      const { status, body } = await fetchPage(page.path);

      if (status !== 200) {
        console.log(`  ❌ HTTP ${status}`);
        failed++;
        continue;
      }

      // Check title
      const titleMatch = body.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'N/A';
      const titleOk = title.toLowerCase().includes(page.expectTitle.toLowerCase());

      // Check footer
      const footer = checkFooter(body);

      // Check images (just list them, don't verify existence)
      const images = checkImages(body, page.path);

      if (titleOk && footer.hasFooter && footer.hasCopyright) {
        console.log(`  ✅ Title: "${title}"`);
        console.log(`  ✅ Footer: copyright + links OK`);
        if (images.length > 0) {
          console.log(`  📷 ${images.length} images found`);
        }
        passed++;
      } else {
        console.log(`  ❌ Issues:`);
        if (!titleOk) console.log(`     - Title mismatch: "${title}"`);
        if (!footer.hasFooter) console.log(`     - No footer found`);
        if (!footer.hasCopyright) console.log(`     - Missing copyright`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('===================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('===================\n');
}

runTests().catch(console.error);