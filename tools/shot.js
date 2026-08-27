/* Screenshot harness for the MD·PRESS restyle work.
   Run `python3 -m http.server 8418` from repo root, then:
     PW_CHROMIUM=<headless-shell> node shot.js <before|after> <en|zh> [--donation] [--footer]

   Output names come ONLY from the hardcoded tables below — CLI args are
   used solely as lookup keys / flags, so no external input can reach a
   filesystem path. */
const path = require('path');
const { chromium } = require('playwright');

const OUT = path.join(__dirname, 'shots');
const BASE = 'http://127.0.0.1:8418/';

const LABELS = { before: 'before', after: 'after' };
const LANGS = { en: 'en', zh: 'zh' };
const NAMES = {
  'en': 'en', 'zh': 'zh',
  'en-donation': 'en-donation', 'zh-donation': 'zh-donation',
  'en-footer': 'en-footer', 'zh-footer': 'zh-footer',
};

(async () => {
  const args = process.argv.slice(2);
  const label = LABELS[args[0]] || 'after';
  const lang = LANGS[args[1]] || 'en';
  const wantDonation = args.includes('--donation');
  const wantFooter = args.includes('--footer');

  const browser = await chromium.launch(
    process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((l) => localStorage.setItem('mdpress-lang', l), lang);
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600); // mermaid + CodeMirror settle

  await page.screenshot({ path: path.join(OUT, `${label}-${NAMES[lang]}.png`), fullPage: true });

  if (wantDonation) {
    await page.click('#donate-entry');
    await page.waitForTimeout(1200); // QR draw
    await page.screenshot({ path: path.join(OUT, `${label}-${NAMES[lang + '-donation']}.png`), fullPage: true });
    await page.click('#donation-close').catch(() => {});
  }

  if (wantFooter) {
    await page.evaluate(() => {
      const f = document.querySelector('.rr-footer');
      if (f) f.scrollIntoView();
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `${label}-${NAMES[lang + '-footer']}.png`), fullPage: true });
  }

  await browser.close();
  console.log('saved to', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
