/* 3-skin contact sheet: Swiss (main) / Classic-blue / Tongcheng purple-yellow. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const SHOTS = path.join(__dirname, 'shots');
const OUT = path.join(SHOTS, 'compare-skins.png');

(async () => {
  const img = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(SHOTS, f)).toString('base64');
  const row = (cap, color, file) => `
    <figure style="margin:0">
      <figcaption style="font:11px Menlo,monospace;letter-spacing:.18em;color:${color};padding:4px 2px 8px">${cap}</figcaption>
      <img src="${img(file)}" style="width:100%;display:block;border:1px solid #e3e0eb">
    </figure>`;
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#f0eef5">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;padding:14px">
      ${row('1 · MAIN 瑞士红（改造前）', '#57516b', 'before-en.png')}
      ${row('2 · CLASSIC BLUE 经典蓝', '#1233b8', 'blue-after-en.png')}
      ${row('3 · 同程紫黄（本次）', '#56338a', 'tc-after-en.png')}
      ${row('中文 · 改造前', '#57516b', 'before-zh.png')}
      ${row('中文 · 经典蓝', '#1233b8', 'blue-after-zh.png')}
      ${row('中文 · 同程紫黄（本次）', '#56338a', 'tc-after-zh.png')}
    </div></body>`;

  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1200 } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: OUT, fullPage: true });
  await browser.close();
  console.log('wrote', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
