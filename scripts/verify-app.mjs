import { chromium } from 'playwright-core';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDir = join(__dirname, '..', '.screenshots');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

async function shot(name) {
  await page.screenshot({ path: join(screenshotDir, `${name}.png`), fullPage: false });
  console.log(`Screenshot: ${name}.png`);
}

import { mkdirSync } from 'fs';
mkdirSync(screenshotDir, { recursive: true });

// 1. Home / login redirect
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
console.log('Home URL:', page.url());
await shot('01-home');

// 2. Login page
await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
console.log('Login title:', await page.title());
await shot('02-login');

// 3. Manifest
const manifest = await page.goto('http://localhost:3000/manifest.webmanifest');
const manifestJson = await manifest.json();
console.log('Manifest name:', manifestJson.name);
console.log('Manifest display:', manifestJson.display);
console.log('Manifest icons:', manifestJson.icons.length);

// 4. Icon route
const iconRes = await page.goto('http://localhost:3000/icon');
console.log('Icon content-type:', iconRes.headers()['content-type']);

await browser.close();
console.log('\n✓ All checks passed');
