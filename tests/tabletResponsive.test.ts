import { chromium, Browser, Page } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import assert from 'assert';

interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  isLandscape?: boolean;
}

const VIEWPORTS: ViewportConfig[] = [
  // Required Tablet Viewports
  { name: 'iPad Mini Portrait', width: 744, height: 1133 },
  { name: 'iPad Mini Landscape', width: 1133, height: 744, isLandscape: true },
  { name: 'iPad Air Portrait', width: 820, height: 1180 },
  { name: 'iPad Air Landscape', width: 1180, height: 820, isLandscape: true },
  { name: 'iPad Pro 11 Portrait', width: 834, height: 1194 },
  { name: 'iPad Pro 11 Landscape', width: 1194, height: 834, isLandscape: true },
  { name: 'iPad Pro 13 Portrait', width: 1032, height: 1376 },
  { name: 'iPad Pro 13 Landscape', width: 1376, height: 1032, isLandscape: true },
  { name: 'Android Tablet Portrait', width: 800, height: 1280 },
  { name: 'Android Tablet Landscape', width: 1280, height: 800, isLandscape: true },
  // Regression Checks
  { name: 'Smartphone Regression', width: 390, height: 844 },
  { name: 'Desktop Regression', width: 1440, height: 900, isLandscape: true },
];

async function waitForServer(url: string, timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function runTestSuite() {
  console.log('🚀 Starting ONE TEAM iPad & Tablet Viewport Responsive Test Suite...\n');

  // Launch Vite preview server
  const previewProcess: ChildProcess = spawn('npx', ['vite', 'preview', '--port', '4173', '--host', '127.0.0.1'], {
    stdio: 'ignore',
  });

  const url = 'http://127.0.0.1:4173';

  let browser: Browser | null = null;

  try {
    await waitForServer(url);
    console.log('✅ Vite preview server running at', url);

    browser = await chromium.launch({ headless: true });

    for (const vp of VIEWPORTS) {
      console.log(`\n📱 Testing Viewport: [${vp.name}] (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: vp.width < 744
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
          : vp.width >= 1440
          ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
          : 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      });

      const page = await context.newPage();

      // Ensure test mode renders MainLayout
      await page.addInitScript('window.__TEST_BYPASS_AUTH__ = true;');

      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      // 1. Verify clean loading without console errors
      assert.strictEqual(
        consoleErrors.length,
        0,
        `Console errors found on ${vp.name}: ${consoleErrors.join(', ')}`
      );

      // 2. Verify no horizontal document overflow
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      assert.strictEqual(
        overflow.hasOverflow,
        false,
        `Horizontal overflow detected on ${vp.name}: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`
      );

      // 3. Navigation checks according to breakpoint:
      // Width < 744px -> MobileNav visible, Sidebar hidden
      // Width >= 744px -> MobileNav hidden, Sidebar visible
      const isMobileNavVisible = await page.evaluate(() => {
        const nav = document.querySelector('nav.tablet-hidden');
        if (!nav) return false;
        const style = window.getComputedStyle(nav);
        return style.display !== 'none';
      });

      const isSidebarVisible = await page.evaluate(() => {
        const sidebar = document.querySelector('aside');
        if (!sidebar) return false;
        const style = window.getComputedStyle(sidebar);
        return style.display !== 'none';
      });

      if (vp.width < 744) {
        assert.strictEqual(isMobileNavVisible, true, `MobileNav must be visible on phone viewport ${vp.name}`);
        assert.strictEqual(isSidebarVisible, false, `Sidebar must NOT be visible on phone viewport ${vp.name}`);
      } else {
        assert.strictEqual(isMobileNavVisible, false, `MobileNav must NOT be visible on tablet/desktop viewport ${vp.name}`);
        assert.strictEqual(isSidebarVisible, true, `Sidebar must be visible on tablet/desktop viewport ${vp.name}`);
      }

      // Check Sidebar auto-collapse behavior:
      // For tablet portrait (744 <= width < 1024), default sidebar width should be compact (80px)
      if (vp.width >= 744 && vp.width < 1024) {
        const sidebarWidth = await page.evaluate(() => {
          const sidebar = document.querySelector('aside');
          return sidebar ? window.getComputedStyle(sidebar).width : '';
        });
        assert.strictEqual(
          sidebarWidth,
          '80px',
          `Sidebar must be in compact icon rail mode (80px) on tablet portrait (${vp.name})`
        );
      }

      // 4. Capture screenshot
      const filenameMap: Record<string, string> = {
        'iPad Mini Portrait': 'screenshots/ipad-mini-portrait.png',
        'iPad Mini Landscape': 'screenshots/ipad-mini-landscape.png',
        'iPad Air Portrait': 'screenshots/ipad-air-portrait.png',
        'iPad Air Landscape': 'screenshots/ipad-air-landscape.png',
        'iPad Pro 11 Portrait': 'screenshots/ipad-pro-11-portrait.png',
        'iPad Pro 11 Landscape': 'screenshots/ipad-pro-11-landscape.png',
        'iPad Pro 13 Portrait': 'screenshots/ipad-pro-13-portrait.png',
        'iPad Pro 13 Landscape': 'screenshots/ipad-pro-13-landscape.png',
        'Android Tablet Portrait': 'screenshots/android-tablet-portrait.png',
        'Android Tablet Landscape': 'screenshots/android-tablet-landscape.png',
        'Smartphone Regression': 'screenshots/smartphone-regression.png',
        'Desktop Regression': 'screenshots/desktop-regression.png',
      };

      const shotPath = filenameMap[vp.name];
      if (shotPath) {
        await page.screenshot({ path: shotPath, fullPage: false });
        console.log(`   📸 Captured screenshot -> ${shotPath}`);
      }

      // 5. Test Quick Create Modal interaction
      const quickCreateBtn = page.locator('header button:has-text("Создать")');
      if (await quickCreateBtn.isVisible()) {
        await quickCreateBtn.click();
        await page.waitForTimeout(200);
        const modalVisible = await page.locator('[role="dialog"]').isVisible();
        assert.strictEqual(modalVisible, true, `Quick create modal should open on ${vp.name}`);

        const closeBtn = page.locator('[role="dialog"] button[aria-label="Закрыть"]');
        await closeBtn.click();
        await page.waitForTimeout(200);
      }

      console.log(`   ✅ ${vp.name} verified successfully.`);
      await context.close();
    }

    console.log('\n🎉 ALL 12 VIEWPORTS (10 TABLETS + SMARTPHONE + DESKTOP) PASSED AUTOMATED RESPONSIVE TESTS!');
  } finally {
    if (browser) await browser.close();
    previewProcess.kill();
  }
}

runTestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
