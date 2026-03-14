import { chromium } from '@playwright/test';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const context = browser.contexts()[0];
const page = context.pages()[0];

console.log(`Attached. Current URL: ${page.url()}`);

// Navigate to the live site and take screenshots of key pages
const pages = [
  { url: 'https://mochamadness.io', name: 'landing' },
  { url: 'https://mochamadness.io/login', name: 'login' },
  { url: 'https://mochamadness.io/leaderboard', name: 'leaderboard' },
];

for (const p of pages) {
  await page.goto(p.url);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `scripts/screenshot-${p.name}.png`, fullPage: true });
  console.log(`Captured: ${p.name} (${page.url()})`);
}

// Mobile viewport screenshots
await page.setViewportSize({ width: 390, height: 844 });
for (const p of pages) {
  await page.goto(p.url);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `scripts/screenshot-${p.name}-mobile.png`, fullPage: true });
  console.log(`Captured mobile: ${p.name}`);
}

console.log('All screenshots saved to scripts/');
await browser.close();
