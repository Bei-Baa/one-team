import { chromium } from 'playwright';

async function verifyResponsiveAndPWA() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const viewports = [
    { name: '320x568_iPhoneSE1', width: 320, height: 568 },
    { name: '375x667_iPhoneSE2', width: 375, height: 667 },
    { name: '390x844_iPhone13', width: 390, height: 844 },
    { name: '430x932_iPhone15ProMax', width: 430, height: 932 },
    { name: '768x1024_iPad', width: 768, height: 1024 },
    { name: '1280x800_Desktop', width: 1280, height: 800 },
  ];

  console.log('Testing viewports and zero horizontal overflow...');

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Check horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    if (overflow) {
      console.error(`FAILED: Horizontal overflow detected on ${vp.name} (${vp.width}px)`);
      process.exit(1);
    } else {
      console.log(`PASSED: No horizontal overflow on ${vp.name} (${vp.width}px)`);
    }

    // Capture screenshot
    await page.screenshot({ path: `screenshots/${vp.name}.png`, fullPage: false });
  }

  // Verify mobile navigation and module interactions
  console.log('\nTesting mobile navigation & modules on 390x844...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // 1. Dashboard screenshot
  await page.screenshot({ path: 'screenshots/mobile_dashboard.png' });

  // 2. Click "Задачи" (Workspace)
  await page.click('button:has-text("Задачи")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/mobile_tasks.png' });

  // 3. Click "Проекты" (Projects)
  await page.click('button:has-text("Проекты")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/mobile_projects.png' });

  // 4. Click "Финансы" (Finance)
  await page.click('button:has-text("Финансы")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/mobile_finance.png' });

  // 5. Click "Ещё" to open mobile drawer
  await page.click('button:has-text("Ещё")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/mobile_drawer.png' });

  // 6. Navigate to Strategy from drawer
  await page.click('button:has-text("Стратегия")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/mobile_strategy.png' });

  // 7. Test PWA manifest in head
  const manifestHref = await page.evaluate(() => {
    const el = document.querySelector('link[rel="manifest"]');
    return el ? el.getAttribute('href') : null;
  });
  console.log('PWA Manifest link found:', manifestHref);

  await browser.close();
  console.log('All responsive visual tests and checks passed successfully!');
}

verifyResponsiveAndPWA().catch((err) => {
  console.error(err);
  process.exit(1);
});
