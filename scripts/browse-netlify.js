import { chromium } from '@playwright/test';

// Launch with a fixed remote debugging port so netlify-actions.js
// can connect via CDP and share the same session/cookies.
const browser = await chromium.launch({
  headless: false,
  args: ['--remote-debugging-port=9222']
});

const context = await browser.newContext();
const page = await context.newPage();

await page.goto('https://app.netlify.com');
await page.waitForLoadState('domcontentloaded');

console.log('Browser open at http://localhost:9222');
console.log('Please log in to Netlify, then run: node scripts/netlify-actions.js');
console.log('Press CTRL+C to close the browser.');

await new Promise(resolve => process.on('SIGINT', resolve));
await browser.close();
process.exit(0);
