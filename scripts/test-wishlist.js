/* eslint-disable @typescript-eslint/no-require-imports */
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(process.env.BASE_URL || 'http://localhost:3001', { waitUntil: 'networkidle2' });

  // Wait for product grid
  await page.waitForSelector('#products');

  // Find wishlist buttons
  const buttons = await page.$$('[aria-label^="Add to wishlist"], [aria-label^="Remove from wishlist"], button[aria-label*="wishlist"]');
  console.log('Found wishlist buttons:', buttons.length);
  if (buttons.length === 0) {
    console.log('No wishlist buttons found, exiting');
    await browser.close();
    process.exit(1);
  }

  // Click first product's wishlist button (add)
  await buttons[0].click();
  await page.waitForTimeout(500);
  let wishlist = await page.evaluate(() => JSON.parse(localStorage.getItem('wishlist') || '[]'));
  console.log('After first click, wishlist:', wishlist);

  // Click first product's wishlist button again (remove)
  await buttons[0].click();
  await page.waitForTimeout(500);
  wishlist = await page.evaluate(() => JSON.parse(localStorage.getItem('wishlist') || '[]'));
  console.log('After second click (remove), wishlist:', wishlist);

  // Click two different products add
  if (buttons.length > 1) {
    await buttons[0].click();
    await page.waitForTimeout(250);
    await buttons[1].click();
    await page.waitForTimeout(500);
    wishlist = await page.evaluate(() => JSON.parse(localStorage.getItem('wishlist') || '[]'));
    console.log('After adding two different products, wishlist:', wishlist);
  }

  await browser.close();
})();
