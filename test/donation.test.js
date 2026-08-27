/* jsdom 逻辑测试 — 赞赏功能（buy-me-coffee 规范）：
   交互流程、文案跟随、移动端支付宝跳转与兜底、合同断言（防回退）。
   脚本注入用内联 <script> 元素（runScripts: 'dangerously'），
   不使用 window.eval。 */

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const rootDir = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

const ALIPAY_URL = 'https://qr.alipay.com/fkx16432isyyhmx9ttwpi79';

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 每个场景一个全新 DOM，避免状态串扰；注入 i18n + donation 两个脚本 */
function makeDom() {
  const vc = new VirtualConsole();
  vc.forwardTo(console, { jsdomErrors: 'none' }); // jsdom canvas 未实现的提示与断言无关
  const dom = new JSDOM(html, {
    url: 'http://localhost:8418/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  const { window } = dom;
  const { document } = window;
  Object.defineProperty(window.navigator, 'languages', {
    value: ['zh-CN', 'zh', 'en'], configurable: true,
  });
  for (const file of ['js/i18n.js', 'js/donation.js']) {
    const s = document.createElement('script');
    s.textContent = fs.readFileSync(path.join(rootDir, file), 'utf8');
    document.body.appendChild(s);
  }
  window.MD.i18n.apply(); // 正常由 app.js boot 调用
  return { window, document };
}

function qrcodeLibScripts(document) {
  return document.querySelectorAll('script[src="vendor/qrcode-generator.js"]');
}

(async () => {

  console.log('T1 桌面端 · 打开 / 切换 / 关闭');
  {
    const { window, document } = makeDom();
    const $ = (sel) => document.querySelector(sel);
    const openCalls = [];
    window.open = (...args) => { openCalls.push(args); return null; };

    check('入口在 Footer 内', $('#st-save').nextElementSibling === $('#donate-entry'));
    check('入口文案（中文）', $('#donate-entry').textContent === '☕ 请作者喝杯咖啡');
    check('弹窗初始隐藏', $('#donation-dialog').hidden === true);
    check('打开前 QR 库脚本不在 DOM', qrcodeLibScripts(document).length === 0);

    // jsdom 的 click() 不迁移焦点（Safari 亦然），先模拟浏览器的点击聚焦
    $('#donate-entry').focus();
    $('#donate-entry').click();
    check('点击入口后弹窗打开', $('#donation-dialog').hidden === false);
    check('QR 库脚本仅在弹窗打开后注入', qrcodeLibScripts(document).length === 1);
    check('默认渠道为支付宝', $('#donation-tab-alipay').getAttribute('aria-pressed') === 'true' &&
      $('#donation-tab-alipay').classList.contains('active'));
    check('标题文案', $('#donation-dialog .donation-title').textContent === '请作者喝杯咖啡 ☕');
    check('副标题文案', $('#donation-dialog .donation-subtitle').textContent === '如果这个小工具帮到了你，可以请作者喝杯咖啡。');
    check('桌面支付宝扫码提示', $('#donation-hint').textContent === '打开支付宝扫一扫');
    check('打开后焦点移入弹窗', document.activeElement === $('#donation-tab-alipay'));
    check('桌面端不发生支付跳转', openCalls.length === 0);

    $('#donation-tab-wechat').click();
    check('切到微信后提示跟随', $('#donation-hint').textContent === '打开微信扫一扫');
    check('微信 tab 选中态', $('#donation-tab-wechat').getAttribute('aria-pressed') === 'true' &&
      $('#donation-tab-wechat').classList.contains('active') &&
      $('#donation-tab-alipay').getAttribute('aria-pressed') === 'false');

    $('#donation-tab-alipay').click();
    check('切回支付宝', $('#donation-hint').textContent === '打开支付宝扫一扫' &&
      $('#donation-tab-alipay').classList.contains('active'));

    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    check('ESC 关闭弹窗', $('#donation-dialog').hidden === true);
    check('关闭后焦点归还入口', document.activeElement === $('#donate-entry'));

    $('#donate-entry').click();
    $('#donation-dialog').click(); // 点遮罩（target 即 overlay 本身）
    check('点遮罩关闭弹窗', $('#donation-dialog').hidden === true);

    $('#donate-entry').click();
    $('#donation-close').click();
    check('关闭按钮关闭弹窗', $('#donation-dialog').hidden === true);
    check('全程无跳转', openCalls.length === 0);

    console.log('T2 弹窗打开时切换语言，文案跟随');
    $('#donate-entry').click();
    window.MD.i18n.setLang('en');
    check('入口文案（英文）', $('#donate-entry').textContent === '☕ Buy me a coffee');
    check('标题切英文', $('#donation-dialog .donation-title').textContent === 'Buy me a coffee ☕');
    check('副标题切英文', $('#donation-dialog .donation-subtitle').textContent === 'If this little tool helped you, you can buy the author a coffee.');
    check('渠道按钮切英文', $('#donation-tab-alipay').textContent === 'Alipay' &&
      $('#donation-tab-wechat').textContent === 'WeChat Pay');
    check('提示切英文', $('#donation-hint').textContent === 'Scan with Alipay');
    check('关闭按钮 aria 切英文', $('#donation-close').getAttribute('aria-label') === 'Close');
    window.MD.i18n.setLang('zh');

    console.log('T3 QR 库加载失败时的提示');
    qrcodeLibScripts(document)[0].onerror();
    await sleep(10);
    check('显示二维码生成失败提示', $('#donation-hint').textContent === '二维码生成失败——请检查网络后重试。');
  }

  console.log('T4 手机端 · 支付宝跳转一次 + 常驻二维码兜底');
  {
    const { window, document } = makeDom();
    const $ = (sel) => document.querySelector(sel);
    // jsdom 可能忽略构造选项里的 userAgent，直接覆盖并先断言生效
    Object.defineProperty(window.navigator, 'userAgent', {
      get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    });
    check('测试前置：UA 已为移动端', /Mobi|iPhone/.test(window.navigator.userAgent));
    const openCalls = [];
    window.open = (...args) => { openCalls.push(args); return {}; };

    $('#donate-entry').click();
    check('弹窗打开即尝试支付宝官方收款链接', openCalls.length === 1);
    check('跳转 URL 为官方 https 收款链接', openCalls[0] && openCalls[0][0] === ALIPAY_URL);
    check('新标签打开且 noopener', openCalls[0] && openCalls[0][1] === '_blank' && openCalls[0][2] === 'noopener');
    check('手机端提示改为扫码兜底', $('#donation-hint').textContent === '没有自动打开？请使用支付宝 / 微信扫码');

    $('#donation-tab-wechat').click();
    check('微信端不跳转，仅出码', openCalls.length === 1);
    check('微信扫码提示', $('#donation-hint').textContent === '打开微信扫一扫');

    $('#donation-tab-alipay').click();
    check('同一弹窗会话内不重复跳转', openCalls.length === 1);

    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    $('#donate-entry').click();
    check('重开弹窗进入新会话，可再次尝试跳转', openCalls.length === 2);
    check('新会话 URL 不变', openCalls[1][0] === ALIPAY_URL);
  }

  console.log('T5 合同断言（防回退）');
  {
    const donationSrc = fs.readFileSync(path.join(rootDir, 'js/donation.js'), 'utf8');
    const cssSrc = fs.readFileSync(path.join(rootDir, 'css/donation.css'), 'utf8');

    check('不含自定义支付宝 scheme（alipays://）',
      !donationSrc.includes('alipays://') && !html.includes('alipays://'));
    check('微信 payload 与规范逐字一致（仅作二维码内容，不作跳转目标）',
      donationSrc.includes("qrContent: 'wxp://f2f1fJpOcJc7F-MSeLMxALhc6tWu-oohtxueHRbCe98bMy2AmDunimuOJFv-8bjobLBM'"));
    check('页面跳转只有一处且目标是官方收款链接常量',
      (donationSrc.match(/\.open\(/g) || []).length === 1 &&
      /\.open\(DONATION_CONFIG\.alipay\.qrContent/.test(donationSrc));
    check('不做 location 跳转', !/\blocation\s*\.\s*(href|assign|replace)/.test(donationSrc));
    check('不引用任何二维码图片文件', !/\.(png|jpe?g|svg)\b/i.test(donationSrc));

    const dialogBlock = html.slice(html.indexOf('id="donation-dialog"'), html.indexOf('<script src="vendor/codemirror.js"'));
    check('弹窗标记内无 <img> / 静态二维码图', !/<img\b/.test(dialogBlock) && !/\.(png|jpe?g|svg)\b/i.test(dialogBlock));

    const ids = ['donation-dialog', 'donation-tab-alipay', 'donation-tab-wechat',
      'donation-qr', 'donation-hint', 'donation-close', 'donate-entry'];
    check('donation.js 引用的 id 都存在于页面',
      ids.every((id) => donationSrc.includes("getElementById('" + id + "')") && html.includes('id="' + id + '"')));

    const classes = ['donation-overlay', 'donation-dialog', 'donation-close', 'donation-title',
      'donation-subtitle', 'donation-tabs', 'donation-tab', 'donation-qr', 'donation-hint', 'donate-entry'];
    check('donation 类名与 CSS 对账', classes.every((c) => cssSrc.includes('.' + c)));

    // 中英文文案键集一致 + 入口文案逐字校验
    const { window } = makeDom();
    const dict = window.MD.i18n.DICT;
    const enKeys = Object.keys(dict.en).filter((k) => k.startsWith('donate')).sort();
    const zhKeys = Object.keys(dict.zh).filter((k) => k.startsWith('donate')).sort();
    check('donate* 键集中英一致', JSON.stringify(enKeys) === JSON.stringify(zhKeys) && enKeys.length >= 11);
    check('入口文案逐字符合规范', dict.zh.donateEntry === '☕ 请作者喝杯咖啡' &&
      dict.en.donateEntry === '☕ Buy me a coffee');
  }

  console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('测试执行异常:', e); process.exit(1); });
