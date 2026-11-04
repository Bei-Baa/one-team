const { chromium } = require('playwright');
const fs = require('fs');

async function renderIcons() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const svgContent = fs.readFileSync('public/icons/icon.svg', 'utf8');
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head><style>html, body { margin:0; padding:0; overflow:hidden; background:transparent; }</style></head>
      <body>${svgContent}</body>
    </html>
  `);

  await page.setViewportSize({ width: 192, height: 192 });
  const el192 = await page.locator('svg');
  await el192.screenshot({ path: 'public/icons/icon-192.png' });

  await page.setViewportSize({ width: 512, height: 512 });
  const el512 = await page.locator('svg');
  await el512.screenshot({ path: 'public/icons/icon-512.png' });
  await el512.screenshot({ path: 'public/icons/icon-512-maskable.png' });

  await browser.close();
  console.log('Icons rendered successfully!');
}

renderIcons().catch((err) => {
  console.error(err);
  process.exit(1);
});
