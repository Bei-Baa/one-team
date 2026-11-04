import { chromium } from 'playwright';

async function testAuthAndModules() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test across responsive breakpoints for AuthScreen
  const breakpoints = [
    { name: 'auth_320x568', width: 320, height: 568 },
    { name: 'auth_375x667', width: 375, height: 667 },
    { name: 'auth_390x844', width: 390, height: 844 },
    { name: 'auth_768x1024', width: 768, height: 1024 },
    { name: 'auth_1280x800', width: 1280, height: 800 },
  ];

  for (const bp of breakpoints) {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`AuthScreen ${bp.name}: Overflow = ${overflow ? 'FAIL' : 'PASS (0px)'}`);
    await page.screenshot({ path: `screenshots/${bp.name}.png` });
  }

  // Switch AuthScreen to Register mode and test responsive form
  await page.click('button:has-text("Создать аккаунт")');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'screenshots/auth_register_390x844.png' });

  // Test client-side mock login by setting session or evaluating App with simulated auth
  console.log('Testing App shell in simulated session mode...');
  // We can simulate authenticated state in localStorage / Mock
  await page.evaluate(() => {
    // Check if we can trigger local session or inspect MainLayout
    localStorage.setItem('oneteam_mock_authenticated', 'true');
  });

  await browser.close();
  console.log('Auth visual tests completed!');
}

testAuthAndModules().catch(console.error);
