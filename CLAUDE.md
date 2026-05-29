# Savebook.net Testing Requirements

## Overview
All changes to this project must include appropriate tests. This document defines the testing standards and coverage requirements.

---

## Testing Setup

### Test Files
| File | Purpose | Run Command |
|------|---------|-------------|
| `tests/site.test.js` | Playwright full test suite | `npx playwright test tests/site.test.js` |
| `tests/quick-test.js` | HTTP basic tests | `node tests/quick-test.js` |

### Prerequisites
```bash
npm install --save-dev playwright @playwright/test
npx playwright install chromium
```

---

## Required Test Coverage

### 1. CSS Variables & Theme Tests
Each site must maintain its distinct visual identity:
- **Hub**: `--accent: #ff2d78` (pink/magenta)
- **FH6Guide**: `--accent: #e63946` (red)
- **Dead As Disco**: `--accent: #ff2d78` (pink/magenta)
- **Subnautica2**: `--accent: #00d4aa` (teal)

**Test must verify:**
```javascript
test('site accent color matches design', async ({ page }) => {
  const accent = await page.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  });
  // verify accent matches expected value for site
});
```

### 2. Layout & Structure Tests
- Header must have `position: sticky`
- Footer must have `border-top`
- Container must have `max-width` (≥1200px)
- Main content area must render correctly

**Test must verify:**
```javascript
test('header position is sticky', async ({ page }) => {
  const headerPos = await page.evaluate(() =>
    window.getComputedStyle(document.querySelector('.header')).position
  );
  expect(headerPos).toBe('sticky');
});
```

### 3. Typography Tests
- Headings must use appropriate font-family (Orbitron/Space Grotesk)
- h1 font-size must be larger than h2
- Links must have accent color

### 4. Visual Elements Tests
- Buttons must have padding (not 0)
- Images must have `max-width: 100%`
- Carousel (if present) must have visible slides

### 5. Responsive Design Tests
- Desktop (>768px): hamburger hidden, nav-desktop visible as flex
- Mobile (<768px): hamburger visible

```javascript
test('responsive hamburger visibility', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  // desktop: hamburger hidden
  await page.setViewportSize({ width: 375, height: 667 });
  // mobile: hamburger visible
});
```

### 6. Cross-site Consistency Tests
All sites MUST have:
- Footer with exact format: `© 2026 savebook.net — Unofficial Fan Site`
- Footer legal links: About, Privacy, Terms
- Shared CSS loaded (`/shared/css/`)

### 7. Functional Tests
- Page loads with HTTP 200
- No console errors (Error level)
- Images load successfully (no 404)
- Carousel navigation works (if present)

---

## Running Tests

### Before submitting changes:
```bash
# 1. Run HTTP tests (no browser needed)
node tests/quick-test.js

# 2. Run full Playwright tests
npx playwright test tests/site.test.js
```

### During development with dev server:
```bash
npm run dev  # Start dev server on localhost:3000
# In another terminal:
npx playwright test tests/site.test.js --project=chromium
```

---

## Sites Reference

| Site | URL | Accent Color | Test Path |
|------|-----|--------------|-----------|
| hub | http://localhost:3000/ | #ff2d78 | / |
| fh6guide | http://localhost:3000/fh6guide/ | #e63946 | /fh6guide/ |
| dead-as-disco | http://localhost:3000/dead-as-disco/ | #ff2d78 | /dead-as-disco/ |
| subnautica2 | http://localhost:3000/subnautica2/ | #00d4aa | /subnautica2/ |

---

## CI/CD Notes
- All tests should pass before deploying
- HTTP tests (`quick-test.js`) can run in any environment
- Playwright tests require browser installation (`npx playwright install chromium`)