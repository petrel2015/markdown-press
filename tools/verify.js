/* Machine-verified acceptance checks for the 同程紫黄 research-report skin.
   Measures computed styles in a real browser — no eyeballing.
   三色宪法逐条落成断言：紫=唯一彩色文字；黄=仅底色（作文字色必须 0 处）；
   红=仅警示。 */
const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:8418/';
const BRAND = 'rgb(86, 51, 138)';
const NEG = 'rgb(176, 36, 24)';
let fails = 0;
const ok = (name, cond, extra) => {
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (extra ? ' — ' + extra : ''));
  if (!cond) fails++;
};

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  // 1. fonts actually loaded (Spectral x3 + IBM Plex Mono x2)
  const fonts = await page.evaluate(() => ({
    serif: document.fonts.check('17px Spectral'),
    serifBold: document.fonts.check('700 17px Spectral'),
    serifItalic: document.fonts.check('italic 400 17px Spectral'),
    mono: document.fonts.check('12px "IBM Plex Mono"'),
    monoBold: document.fonts.check('700 12px "IBM Plex Mono"'),
    body: getComputedStyle(document.body).fontFamily.slice(0, 40),
  }));
  ok('Spectral regular/bold/italic 加载', fonts.serif && fonts.serifBold && fonts.serifItalic);
  ok('IBM Plex Mono regular/bold 加载', fonts.mono && fonts.monoBold);
  ok('body 衬线栈正确', fonts.body.includes('Spectral'), fonts.body);

  // 2. ink is purple-black
  const ink = await page.evaluate(() => getComputedStyle(document.body).color);
  ok('紫黑墨色生效', ink === 'rgb(36, 31, 53)', ink);

  // 3. pills: purple outline capsule
  const pill = await page.evaluate(() => {
    const s = getComputedStyle(document.getElementById('btn-new'));
    return { border: s.borderColor, radius: s.borderRadius, color: s.color };
  });
  ok('按钮=pill 紫描边', pill.border === BRAND && pill.color === BRAND, pill.border);
  ok('胶囊圆角 999px', pill.radius === '999px', pill.radius);

  const primary = await page.evaluate(() =>
    getComputedStyle(document.getElementById('btn-export')).backgroundColor);
  ok('主按钮实心紫', primary === BRAND, primary);

  // 4. section kicker: yellow square + purple mono + trailing hairline
  const label = await page.evaluate(() => {
    const el = document.querySelector('.pane-head .label');
    const s = getComputedStyle(el);
    const before = getComputedStyle(el, '::before');
    const after = getComputedStyle(el, '::after');
    return { color: s.color, sq: before.backgroundColor, sqW: before.width, line: after.height };
  });
  ok('题头文字紫等宽', label.color === BRAND, label.color);
  ok('题头黄方点', label.sq === 'rgb(246, 195, 67)' && label.sqW === '8px', label.sq);
  ok('题头尾随发丝线', label.line === '1px', label.line);

  // 5. preview doc: 700px measure, serif 17px, double-rule blockquote
  const doc = await page.evaluate(() => {
    const d = document.querySelector('.md-doc');
    const s = getComputedStyle(d);
    const bq = getComputedStyle(document.querySelector('.md-doc blockquote'));
    return {
      w: d.getBoundingClientRect().width, ff: s.fontFamily.slice(0, 10),
      fs: s.fontSize, bqL: bq.borderLeftWidth, bqTop: bq.borderTopWidth, bqTopC: bq.borderTopColor,
    };
  });
  ok('预览阅读栏 700px', Math.round(doc.w) === 700, String(Math.round(doc.w)));
  ok('预览 Spectral 衬线正文', doc.ff.includes('Spectral'));
  ok('预览 17px 正文', doc.fs === '17px', doc.fs);
  ok('引用块无左边条', doc.bqL === '0px', doc.bqL);
  ok('引用块双线规(3px紫顶线)', doc.bqTop === '3px' && doc.bqTopC === BRAND, doc.bqTop + ' ' + doc.bqTopC);

  // 6. highlighter: statusbar numbers carry yellow as background only
  const hl = await page.evaluate(() => {
    const el = document.querySelector('.st-stats > span');
    const s = getComputedStyle(el);
    const img = s.backgroundImage || '';
    return { has: /246,\s*195,\s*67|f6c343/i.test(img + s.backgroundColor), color: s.color };
  });
  ok('状态栏荧光笔压黄(底色)', hl.has);
  ok('荧光笔上文字非黄', hl.color !== 'rgb(246, 195, 67)', hl.color);

  // 7. ── 三色纪律：黄作文字色必须 0 处 ──
  const yellowText = await page.evaluate(() => {
    const Y = 'rgb(246, 195, 67)';
    let hits = [];
    document.querySelectorAll('*').forEach((el) => {
      const s = getComputedStyle(el);
      if (s.color === Y) hits.push(el.tagName + '.' + el.className);
      // yellow border on non-decorative text elements also violates (only markers/squares allowed as bg)
    });
    return hits;
  });
  ok('黄作文字色 = 0 处', yellowText.length === 0, yellowText.slice(0, 3).join(','));

  // purple is the only colored text on the page (besides ink scale & white)
  const coloredText = await page.evaluate(() => {
    const OK = new Set(['rgb(36, 31, 53)', 'rgb(87, 81, 107)', 'rgb(139, 134, 152)',
      'rgb(255, 255, 255)', 'rgb(86, 51, 138)', 'rgb(62, 36, 101)']);
    const seen = new Set();
    document.querySelectorAll('body *').forEach((el) => {
      const c = getComputedStyle(el).color;
      if (!OK.has(c)) seen.add(c);
    });
    return [...seen];
  });
  ok('紫是唯一彩色文字(无其它色相)', coloredText.length === 0, coloredText.join(' '));

  // 8. red only in warn contexts (mermaid error / hljs-deletion)
  const redRules = await page.evaluate(() => {
    let n = 0;
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
      for (const r of rules) {
        if (r.selectorText && /mermaid-error|data-done="error"|hljs-deletion/.test(r.selectorText)) {
          if ((r.style.color || '').includes('176, 36, 24') || (r.style.color || '') === 'var(--neg)') n++;
        }
      }
    }
    return n;
  });
  ok('红仅存在于警示选择器', redRules >= 2, String(redRules) + ' 处');

  // 9. footer is gone: the tool is the whole document, no extra scroll
  const noFooter = await page.evaluate(() => document.querySelector('.rr-footer') === null);
  ok('方法论页脚已移除', noFooter);

  await page.evaluate(() => localStorage.setItem('mdpress-lang', 'zh'));
  await page.reload({ waitUntil: 'networkidle' });
  const zh = await page.evaluate(() => {
    const p = document.querySelector('.md-doc p');
    return { ff: p ? getComputedStyle(p).fontFamily : '' };
  });
  ok('中文正文衬线栈(思源宋回退)', /Noto Serif SC|Songti SC|STSong/.test(zh.ff), zh.ff.slice(0, 70));

  // 10. donation dialog pills
  await page.click('#donate-entry');
  await page.waitForTimeout(900);
  const don = await page.evaluate(() => {
    const t = document.getElementById('donation-tab-alipay');
    return { active: getComputedStyle(t).backgroundColor, radius: getComputedStyle(t).borderRadius };
  });
  ok('捐赠 tab 激活=实心紫', don.active === BRAND, don.active);
  ok('捐赠 tab 胶囊', don.radius === '999px', don.radius);
  await page.click('#donation-close');

  // 11. geometry: the tool is the whole document — fills viewport, no extra scroll
  const geom = await page.evaluate(() => ({
    appBottom: document.querySelector('.app').getBoundingClientRect().bottom,
    vh: window.innerHeight,
    scrollH: document.documentElement.scrollHeight,
  }));
  ok('工具贴满视口(底边到达)', Math.abs(geom.appBottom - geom.vh) < 2, geom.appBottom + '/' + geom.vh);
  ok('页面无多余滚动(页脚已移除)', Math.abs(geom.scrollH - geom.vh) < 2, 'scroll=' + geom.scrollH);

  const mp = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mp.goto(BASE, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(300);
  const overflow = await mp.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok('手机端无横向溢出', overflow <= 0, 'Δ=' + overflow + 'px');

  await browser.close();
  console.log('\n结果: ' + (fails ? fails + ' 项不通过' : '全部通过'));
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
