/* Compose the before/after contact sheet with the browser itself. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const SHOTS = path.join(__dirname, 'shots');
const OUT = path.join(SHOTS, 'compare.png');

(async () => {
  const img = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(SHOTS, f)).toString('base64');
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#eef1f6;font-family:Menlo,monospace">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:14px">
      ${['en', 'zh'].map((l) => `
        <figure style="margin:0">
          <figcaption style="font-size:11px;letter-spacing:.2em;color:#42566a;padding:4px 2px 8px">BEFORE · ${l.toUpperCase()}</figcaption>
          <img src="${img('before-' + l + '.png')}" style="width:100%;display:block;border:1px solid #dbe2ea">
        </figure>
        <figure style="margin:0">
          <figcaption style="font-size:11px;letter-spacing:.2em;color:#2251ff;padding:4px 2px 8px">AFTER · ${l.toUpperCase()} · RESEARCH REPORT SKIN</figcaption>
          <img src="${img('after-' + l + '.png')}" style="width:100%;display:block;border:1px solid #dbe2ea">
        </figure>`).join('')}
    </div></body>`;

  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const page = await browser.newPage({ viewport: { width: 1640, height: 1200 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: OUT, fullPage: true });
  await browser.close();
  console.log('wrote', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
