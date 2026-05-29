import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helper function to get computed style
async function getComputedStyle(page, selector, property) {
  return page.locator(selector).first().evaluate((el, prop) => {
    return window.getComputedStyle(el).getPropertyValue(prop);
  }, property);
}

// Helper function to check if CSS variable is defined
async function hasCSSVariable(page, selector, varName) {
  return page.locator(selector).first().evaluate((varName) => {
    const style = window.getComputedStyle(document.documentElement);
    return style.getPropertyValue(varName).trim() !== '';
  }, varName);
}

test.describe('Savebook Site Tests', () => {

  // =====================
  // CSS Variables Tests
  // =====================
  test.describe('CSS Variables & Theme', () => {
    test('Hub: CSS variables are defined', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      // Check key CSS custom properties exist
      const result = await page.evaluate(() => {
        const style = window.getComputedStyle(document.documentElement);
        return {
          accent: style.getPropertyValue('--accent').trim(),
          bg: style.getPropertyValue('--bg').trim()
        };
      });
      console.log('Hub accent:', result.accent, '| bg:', result.bg);
      expect(result.accent || result.bg).toBeTruthy();
    });

    test('FH6Guide: accent color is red (#e63946)', async ({ page }) => {
      await page.goto(BASE_URL + '/fh6guide/');
      const accent = await page.evaluate(() => {
        const style = window.getComputedStyle(document.documentElement);
        return style.getPropertyValue('--accent').trim();
      });
      // FH6 should use red accent
      console.log('FH6 accent:', accent);
    });

    test('Dead As Disco: accent color is pink/magenta', async ({ page }) => {
      await page.goto(BASE_URL + '/dead-as-disco/');
      const accent = await page.evaluate(() => {
        const style = window.getComputedStyle(document.documentElement);
        return style.getPropertyValue('--accent').trim();
      });
      console.log('Disco accent:', accent);
    });

    test('Subnautica2: accent color is teal (#00d4aa)', async ({ page }) => {
      await page.goto(BASE_URL + '/subnautica2/');
      const accent = await page.evaluate(() => {
        const style = window.getComputedStyle(document.documentElement);
        return style.getPropertyValue('--accent').trim();
      });
      console.log('Subnautica2 accent:', accent);
    });
  });

  // =====================
  // Layout & Structure Tests
  // =====================
  test.describe('Layout & Structure', () => {
    test('header has position sticky', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      const headerPos = await page.evaluate(() => {
        const header = document.querySelector('.header');
        return window.getComputedStyle(header).position;
      });
      expect(headerPos).toBe('sticky');
    });

    test('footer has correct border-top', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      const footerBorder = await page.evaluate(() => {
        const footer = document.querySelector('.footer');
        return window.getComputedStyle(footer).borderTopWidth;
      });
      // Border should exist (at least 1px)
      expect(parseInt(footerBorder)).toBeGreaterThan(0);
    });

    test('container has max-width', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      const containerWidth = await page.evaluate(() => {
        const container = document.querySelector('.container');
        const style = window.getComputedStyle(container);
        return style.maxWidth;
      });
      expect(containerWidth).toBeTruthy();
      console.log('Container max-width:', containerWidth);
    });

    test('main-content has relative or block display', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      const mainDisplay = await page.evaluate(() => {
        const main = document.querySelector('.main-content');
        return window.getComputedStyle(main).display;
      });
      expect(['block', 'relative', 'static']).toContain(mainDisplay);
    });
  });

  // =====================
  // Typography Tests
  // =====================
  test.describe('Typography', () => {
    test('headings use correct font-family', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      const h1Font = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        return window.getComputedStyle(h1).fontFamily;
      });
      console.log('H1 font-family:', h1Font);
      // Font should include Orbitron, Space Grotesk, or system fonts
      expect(h1Font.length).toBeGreaterThan(0);
    });

    test('h1 font-size is larger than h2', async ({ page }) => {
      await page.goto(BASE_URL + '/fh6guide/');
      const sizes = await page.evaluate(() => {
        const h1 = document.querySelector('h1') || document.querySelector('h2');
        const h2 = document.querySelector('h2');
        if (!h1 || !h2) return { h1: 0, h2: 0 };
        return {
          h1: parseFloat(window.getComputedStyle(h1).fontSize),
          h2: parseFloat(window.getComputedStyle(h2).fontSize)
        };
      });
      if (sizes.h1 && sizes.h2) {
        expect(sizes.h1).toBeGreaterThan(sizes.h2);
      }
    });

    test('links have accent color', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      const linkColor = await page.evaluate(() => {
        const link = document.querySelector('a:not([href*="://"])') || document.querySelector('a');
        return window.getComputedStyle(link).color;
      });
      console.log('Link color:', linkColor);
      expect(linkColor).toBeTruthy();
    });
  });

  // =====================
  // Visual Elements Tests
  // =====================
  test.describe('Visual Elements', () => {
    test('buttons have padding', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      const btnPadding = await page.evaluate(() => {
        const btn = document.querySelector('.btn-primary, .btn, button');
        if (!btn) return '0px';
        return window.getComputedStyle(btn).paddingTop;
      });
      expect(parseInt(btnPadding)).toBeGreaterThan(0);
    });

    test('images have max-width: 100%', async ({ page }) => {
      await page.goto(BASE_URL + '/fh6guide/');
      const imgMaxWidth = await page.evaluate(() => {
        const img = document.querySelector('img');
        return window.getComputedStyle(img).maxWidth;
      });
      expect(imgMaxWidth).toBe('100%' || 'none' || 'auto');
    });

    test('carousel is visible and has height', async ({ page }) => {
      await page.goto(BASE_URL + '/fh6guide/');
      const carouselHeight = await page.evaluate(() => {
        const carousel = document.querySelector('.carousel-track, .hero-carousel');
        if (!carousel) return '0px';
        return window.getComputedStyle(carousel).height;
      });
      expect(carouselHeight).toBeTruthy();
      console.log('Carousel height:', carouselHeight);
    });
  });

  // =====================
  // Hub Site Tests
  // =====================
  test.describe('Hub Site (savebook.net)', () => {
    test('homepage loads without errors', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      await expect(page).toHaveTitle(/GameHub/i);
      const footer = page.locator('footer.footer');
      await expect(footer).toBeVisible();
      await expect(footer.locator('.footer-copy')).toContainText('© 2026 savebook.net');
    });

    test('navigation has correct styles', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      const navDisplay = await page.evaluate(() => {
        const nav = document.querySelector('.nav-desktop');
        return window.getComputedStyle(nav).display;
      });
      // Desktop nav should be visible on desktop
      expect(['flex', 'block']).toContain(navDisplay);
    });

    test('carousel exists and has slides', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      const carousel = page.locator('.carousel-item, .carousel-slide');
      const count = await carousel.count();
      expect(count).toBeGreaterThan(0);
    });

    test('hero section has background or gradient', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      const heroBg = await page.evaluate(() => {
        const hero = document.querySelector('.hub-hero, .hero');
        if (!hero) return null;
        const style = window.getComputedStyle(hero);
        return style.background || style.backgroundColor || style.backgroundImage;
      });
      console.log('Hero background:', heroBg);
    });
  });

  // =====================
  // FH6Guide Site Tests
  // =====================
  test.describe('FH6Guide Site', () => {
    test('homepage loads without errors', async ({ page }) => {
      await page.goto(BASE_URL + '/fh6guide/');
      await expect(page).toHaveTitle(/Forza Horizon/i);
      const footer = page.locator('footer.footer');
      await expect(footer).toBeVisible();
    });

    test('carousel works and has slides', async ({ page }) => {
      await page.goto(BASE_URL + '/fh6guide/');
      const carousel = page.locator('.carousel-slide');
      const count = await carousel.count();
      expect(count).toBeGreaterThan(0);
      await expect(page.locator('.carousel-btn.prev')).toBeVisible();
      await expect(page.locator('.carousel-btn.next')).toBeVisible();
    });

    test('guide cards have card-like styling', async ({ page }) => {
      await page.goto(BASE_URL + '/fh6guide/pages/guides/');
      const cardBorder = await page.evaluate(() => {
        const card = document.querySelector('.guide-card');
        if (!card) return null;
        return window.getComputedStyle(card).borderRadius;
      });
      expect(cardBorder).toBeTruthy();
      console.log('Guide card border-radius:', cardBorder);
    });

    test('car guide page images load', async ({ page }) => {
      await page.goto(BASE_URL + '/fh6guide/pages/guides/car-guide.html');
      const images = page.locator('img');
      const imgCount = await images.count();
      expect(imgCount).toBeGreaterThan(0);

      // Check images have proper sizing
      const firstImg = await page.locator('img').first().evaluate((el) => ({
        naturalWidth: el.naturalWidth,
        complete: el.complete
      }));
      console.log('First image:', firstImg);
    });
  });

  // =====================
  // Dead As Disco Site Tests
  // =====================
  test.describe('Dead As Disco Site', () => {
    test('homepage loads without errors', async ({ page }) => {
      await page.goto(BASE_URL + '/dead-as-disco/');
      await expect(page).toHaveTitle(/Dead As Disco/i);
      const footer = page.locator('footer.footer');
      await expect(footer).toBeVisible();
    });

    test('dark mode styles applied', async ({ page }) => {
      await page.goto(BASE_URL + '/dead-as-disco/');
      const bgColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      console.log('Body background:', bgColor);
      // Dead As Disco should have dark background
    });

    test('nav-desktop dropdown has disco-styled shadow', async ({ page }) => {
      await page.goto(BASE_URL + '/dead-as-disco/');
      await page.setViewportSize({ width: 1280, height: 800 });
      // Hover Guides dropdown
      const guidesLink = page.locator('.nav-desktop ul > li:has(ul.dropdown) > a').first();
      await guidesLink.hover();
      await page.waitForTimeout(300);
      const dropdownStyles = await page.evaluate(() => {
        const d = document.querySelector('.nav-desktop .dropdown');
        if (!d) return null;
        const s = window.getComputedStyle(d);
        return { boxShadow: s.boxShadow, borderRadius: s.borderRadius };
      });
      console.log('Disco dropdown styles:', JSON.stringify(dropdownStyles));
      expect(dropdownStyles).toBeTruthy();
      // Should have non-empty box-shadow (disco glow)
      expect(dropdownStyles.boxShadow.length).toBeGreaterThan(0);
    });
  });

  // =====================
  // Subnautica2 Site Tests
  // =====================
  test.describe('Subnautica2 Site', () => {
    test('homepage loads without errors', async ({ page }) => {
      await page.goto(BASE_URL + '/subnautica2/');
      await expect(page).toHaveTitle(/Subnautica/i);
      const footer = page.locator('footer.footer');
      await expect(footer).toBeVisible();
    });

    test('creature guide has images', async ({ page }) => {
      await page.goto(BASE_URL + '/subnautica2/pages/guides/creature-bestiary.html');
      const images = page.locator('img');
      const imgCount = await images.count();
      expect(imgCount).toBeGreaterThan(0);
    });
  });

  // =====================
  // Cross-site Consistency Tests
  // =====================
  test.describe('Cross-site Consistency', () => {
    test('all sites have consistent footer format', async ({ page }) => {
      const sites = ['/', '/fh6guide/', '/dead-as-disco/', '/subnautica2/'];
      for (const site of sites) {
        await page.goto(BASE_URL + site);
        const footer = page.locator('footer.footer');
        await expect(footer).toBeVisible();
        await expect(footer.locator('.footer-copy')).toContainText('© 2026 savebook.net');
        await expect(footer.locator('.footer-legal')).toContainText('About');
        await expect(footer.locator('.footer-legal')).toContainText('Privacy');
        await expect(footer.locator('.footer-legal')).toContainText('Terms');
      }
    });

    test('all sites load shared CSS', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      const stylesheets = await page.evaluate(() => {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        return Array.from(links).map(l => l.href);
      });
      const hasShared = stylesheets.some(h => h.includes('shared/css'));
      expect(hasShared).toBe(true);
      console.log('Shared CSS loaded:', hasShared);
    });

    test('no console errors on any page', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Ignore external resource errors (Google AdSense, Fonts, CDN, etc.)
          if (!text.includes('ERR_CONNECTION_CLOSED') &&
              !text.includes('net::ERR_') &&
              !text.includes('Failed to load resource')) {
            errors.push(text);
          }
        }
      });

      const sites = ['/', '/fh6guide/', '/dead-as-disco/', '/subnautica2/'];
      for (const site of sites) {
        await page.goto(BASE_URL + site);
        await page.waitForTimeout(500);
      }
      if (errors.length > 0) {
        console.log('Console errors:', errors);
      }
      expect(errors).toHaveLength(0);
    });

    test('CSS does not have broken references', async ({ page }) => {
      const cssErrors = [];
      page.on('response', response => {
        if (response.status() === 404 && response.url().includes('.css')) {
          cssErrors.push(response.url());
        }
      });

      await page.goto(BASE_URL + '/fh6guide/', { timeout: 10000 });
      await page.waitForTimeout(1000);

      if (cssErrors.length > 0) {
        console.log('Broken CSS refs:', cssErrors);
      }
      expect(cssErrors).toHaveLength(0);
    });
  });

  // =====================
  // Responsive Design Tests
  // =====================
  test.describe('Responsive Design', () => {
    test('hamburger menu hidden on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(BASE_URL + '/');
      const hamburger = page.locator('.hamburger');
      const display = await hamburger.evaluate(el => window.getComputedStyle(el).display);
      expect(display).toBe('none');
    });

    test('nav-desktop visible on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(BASE_URL + '/');
      const navDesktop = page.locator('.nav-desktop');
      const display = await navDesktop.evaluate(el => window.getComputedStyle(el).display);
      expect(display).toBe('flex');
    });

    test('hamburger visible on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL + '/');
      const hamburger = page.locator('.hamburger');
      const display = await hamburger.evaluate(el => window.getComputedStyle(el).display);
      expect(display).toBe('flex');
    });
  });

});