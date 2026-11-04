import { chromium } from 'playwright';

async function testMainAppModules() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test across responsive breakpoints for App shell
  const viewports = [
    { name: 'app_320x568', width: 320, height: 568 },
    { name: 'app_375x667', width: 375, height: 667 },
    { name: 'app_390x844', width: 390, height: 844 },
    { name: 'app_430x932', width: 430, height: 932 },
    { name: 'app_768x1024', width: 768, height: 1024 },
    { name: 'app_1280x800', width: 1280, height: 800 },
  ];

  // Bypass AuthScreen in test mode by setting mock user in authService/supabase or evaluating MainLayout
  await page.addInitScript(() => {
    // Intercept supabase auth
    const fakeSession = {
      access_token: 'fake-token',
      user: {
        id: 'f87a8b89-2996-41f2-9596-f94d306b7a24',
        email: 'alexey@oneteam.dev',
        user_metadata: { name: 'Алексей Смирнов' }
      }
    };
    window.localStorage.setItem('sb-dshlppccurayjfusbcqf-auth-token', JSON.stringify(fakeSession));
  });

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`Viewport ${vp.name}: Overflow = ${overflow ? 'FAIL' : 'PASS (0px)'}`);
    await page.screenshot({ path: `screenshots/${vp.name}.png` });
  }

  await browser.close();
  console.log('Main app responsive validation complete!');
}

testMainAppModules().catch(console.error);
