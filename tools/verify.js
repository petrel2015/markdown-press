/* Machine-verified acceptance checks for the research-report skin.
   Measures computed styles in a real browser — no eyeballing. */
const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:8418/';
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

  // 1. ET Book actually loaded (all 3 faces used)
  const fonts = await page.evaluate(() => ({
    loaded: document.fonts.check('17px et-book'),
    loadedBold: document.fonts.check('700 17px et-book'),
    loadedItalic: document.fonts.check('italic 400 17px et-book'),
    body: getComputedStyle(document.body).fontFamily.slice(0, 60),
  }));
  ok('ET Book regular 加载', fonts.loaded);
  ok('ET Book bold 加载', fonts.loadedBold);
  ok('ET Book italic 加载', fonts.loadedItalic);
  ok('body 衬线栈正确', fonts.body.includes('et-book'), fonts.body);

  // 2. tokens resolve (no var() leaks → would show as garbage)
  const ink = await page.evaluate(() => getComputedStyle(document.body).color);
  ok('墨色生效', ink === 'rgb(5, 28, 44)', ink);

  // 3. chips
  const chip = await page.evaluate(() => {
    const b = document.getElementById('btn-new');
    const s = getComputedStyle(b);
    return { border: s.borderColor, radius: s.borderRadius, ff: s.fontFamily.slice(0, 20), fw: s.fontWeight };
  });
  ok('按钮=chips(墨描边)', chip.border === 'rgb(5, 28, 44)', chip.border);
  ok('按钮圆角', chip.radius === '6px', chip.radius);
  ok('按钮衬线粗体', chip.ff.includes('et-book') && chip.fw === '700');

  const primary = await page.evaluate(() => {
    const b = document.getElementById('btn-export');
    return getComputedStyle(b).backgroundColor;
  });
  ok('主按钮实心电光蓝', primary === 'rgb(34, 81, 255)', primary);

  // 4. preview doc: measure 692, serif, 17px
  const doc = await page.evaluate(() => {
    const d = document.querySelector('.md-doc');
    const s = getComputedStyle(d);
    const bq = getComputedStyle(document.querySelector('.md-doc blockquote'));
    return {
      w: d.getBoundingClientRect().width, ff: s.fontFamily.slice(0, 20),
      fs: s.fontSize, bqL: bq.borderLeftWidth, bqT: bq.borderTopWidth,
    };
  });
  ok('预览阅读栏 692px', Math.round(doc.w) === 692, String(Math.round(doc.w)));
  ok('预览衬线正文', doc.ff.includes('et-book'));
  ok('预览 17px 正文', doc.fs === '17px', doc.fs);
  ok('引用块无左边条', doc.bqL === '0px', doc.bqL);
  ok('引用块有上发丝线', doc.bqT === '1px', doc.bqT);

  // 5. statusbar mono + tabular
  const sb = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector('.statusbar'));
    return { ff: s.fontFamily.slice(0, 10), tv: s.fontVariantNumeric };
  });
  ok('状态栏等宽', sb.ff.includes('Menlo'), sb.ff);
  ok('状态栏 tabular-nums', sb.tv.includes('tabular-nums'), sb.tv);

  // 6. red is gone from chrome accents (only --neg consumers allowed)
  const reds = await page.evaluate(() => {
    let n = 0;
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
      for (const r of rules) {
        if (r.style) {
          for (const p of ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderBottomColor']) {
            const v = r.style.getPropertyValue(p);
            if (/rgb\(213, 43, 30\)|rgb\(194, 47, 78\)|#d52b1e|#c22f4e/i.test(v)) n++;
          }
        }
      }
    }
    return n;
  });
  ok('红色仅剩 --neg 语义处(≤2)', reds <= 2, String(reds) + ' 处');

  // 7. footer: exists, below the fold, bilingual switches
  const foot = await page.evaluate(() => {
    const f = document.querySelector('.rr-footer');
    if (!f) return null;
    const r = f.getBoundingClientRect();
    return { top: r.top, h: r.height, kicker: f.querySelector('.rr-kicker').textContent };
  });
  ok('方法论页脚存在', !!foot);
  ok('页脚在首屏之下', foot && foot.top >= 1000, foot && 'top=' + Math.round(foot.top));
  ok('页脚 kicker', foot && /methodology/i.test(foot.kicker), foot && foot.kicker);

  await page.evaluate(() => localStorage.setItem('mdpress-lang', 'zh'));
  await page.reload({ waitUntil: 'networkidle' });
  const zh = await page.evaluate(() => {
    const k = document.querySelector('.rr-kicker');
    const t = document.querySelector('.rr-title');
    const p = document.querySelector('.md-doc p');
    return { kicker: k && k.textContent, title: t && t.textContent, prevFF: p ? getComputedStyle(p).fontFamily : '' };
  });
  ok('页脚中文 kicker', zh.kicker === '方法论与说明', zh.kicker);
  ok('页脚中文标题', zh.title === '本页工作方式', zh.title);
  ok('中文正文衬线栈', /Noto Serif SC|Songti SC|SimSun/.test(zh.prevFF), zh.prevFF.slice(0, 80));

  // 8. donation dialog themed
  await page.click('#donate-entry');
  await page.waitForTimeout(900);
  const don = await page.evaluate(() => {
    const t = document.getElementById('donation-tab-alipay');
    const d = document.querySelector('.donation-dialog');
    return { active: getComputedStyle(t).backgroundColor, border: getComputedStyle(d).borderColor, shadow: getComputedStyle(d).boxShadow !== 'none' };
  });
  ok('捐赠 tab 激活=实心蓝', don.active === 'rgb(34, 81, 255)', don.active);
  ok('捐赠弹窗发丝线描边', don.border === 'rgb(219, 226, 234)', don.border);
  await page.click('#donation-close');

  // 9. tool still fills viewport exactly; page scrolls for footer
  const geom = await page.evaluate(() => ({
    appH: document.querySelector('.app').getBoundingClientRect().height,
    vh: window.innerHeight,
    scrollH: document.documentElement.scrollHeight,
  }));
  ok('工具仍占满一屏', Math.abs(geom.appH - geom.vh) < 2, geom.appH + '/' + geom.vh);
  ok('页面可滚出页脚', geom.scrollH > geom.vh + 300, 'scroll=' + geom.scrollH);

  // 10. no horizontal overflow on phone
  const mp = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mp.goto(BASE, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(300);
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok('手机端无横向溢出', overflow <= 0, 'Δ=' + overflow + 'px');

  await browser.close();
  console.log('\n结果: ' + (fails ? fails + ' 项不通过' : '全部通过'));
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
