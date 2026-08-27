/* jsdom 逻辑层端到端测试（非 GUI 测试）：
   在 Node 中加载真实页面与脚本，通过 DOM API 驱动交互，验证核心逻辑。
   CodeMirror / mermaid / highlight.js / html-to-image 缺省时走降级路径，
   纯函数与装配逻辑仍可完整验证。 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

const dom = new JSDOM(html, {
  url: 'http://localhost:8418/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});

const { window } = dom;
const { document } = window;

Object.defineProperty(window.navigator, 'languages', {
  value: ['zh-CN', 'zh', 'en'], configurable: true,
});
Object.defineProperty(window.navigator, 'language', {
  value: 'zh-CN', configurable: true,
});
window.print = () => {}; // jsdom 未实现

// 加载 vendor（仅 marked，其余库验证降级路径）与页面脚本
window.eval(fs.readFileSync(path.join(rootDir, 'vendor/marked.min.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(rootDir, 'js/i18n.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(rootDir, 'js/markdown.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(rootDir, 'js/editor.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(rootDir, 'js/layout.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(rootDir, 'js/export.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8'));

const $ = (sel) => document.querySelector(sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}

(async () => {
  // 测试环境禁止 mermaid 懒加载注入网络脚本（走缺库降级路径）
  window.MD_ALLOW_LAZY = false;

  // 脚本注入时 jsdom 仍处于 loading，boot 挂在 DOMContentLoaded 上 —— 先等它完成
  if (document.readyState === 'loading') {
    await new Promise((r) => document.addEventListener('DOMContentLoaded', r));
  }

  console.log('T0 初始状态 / 默认语言检测');
  check('默认语言为中文', window.MD.i18n.current() === 'zh');
  check('标题已应用中文', $('title').textContent.includes('Markdown 编辑器'));
  check('默认分屏模式', document.body.getAttribute('data-mode') === 'split');
  check('html lang 已设置', document.documentElement.getAttribute('lang') === 'zh-CN');
  check('预览已渲染示例文档', $('#preview').querySelector('h1') !== null);
  check('示例含 mermaid 占位块', $('#preview').querySelector('.mermaid-block') !== null);
  check('mermaid 原码回退可见', $('#preview').querySelector('.mermaid-block .mermaid-raw') !== null);
  check('示例含表格', $('#preview').querySelector('table') !== null);
  check('状态栏文档名', $('#st-name').textContent === 'document.md');
  check('示例文档已持久化', (window.localStorage.getItem('mdpress-doc') || '').includes('# MD·PRESS'));

  console.log('T1 Markdown 渲染管线');
  const out = window.MD.markdown.render('# Hi\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\n```js\nvar x = 1;\n```\n');
  check('标题渲染', out.includes('<h1'));
  check('mermaid 围栏转为占位块', out.includes('class="mermaid-block"'));
  check('mermaid 原码已编码存储', out.includes('data-src="flowchart'));
  check('普通代码块保留 pre/code', out.includes('<pre><code'));
  const html2 = '<b>&"</b>';
  check('行内 HTML 转义辅助器', window.MD.markdown.escapeHtml(html2) === '&lt;b&gt;&amp;&quot;&lt;/b&gt;');
  check('mermaid 围栏识别（大小写与空白）', window.MD.markdown.isMermaidFence('  Mermaid ') === true);
  check('非 mermaid 围栏', window.MD.markdown.isMermaidFence('js') === false);
  check('字数统计：中英混合', window.MD.markdown.countWords('hello 世界 foo') === 4);
  check('字数统计：纯中文', window.MD.markdown.countWords('你好世界') === 4);
  check('字数统计：空串', window.MD.markdown.countWords('') === 0);

  console.log('T2 视图模式');
  $('#mode-preview').click();
  check('切到预览态', document.body.getAttribute('data-mode') === 'preview');
  check('模式已持久化', window.localStorage.getItem('mdpress-mode') === 'preview');
  $('#mode-edit').click();
  check('切到编辑态', document.body.getAttribute('data-mode') === 'edit');
  $('#mode-split').click();
  check('切回分屏态', document.body.getAttribute('data-mode') === 'split');
  const em = window.MD.layout.effectiveMode;
  check('手机上分屏强制为编辑', em('split', true) === 'edit');
  check('手机上编辑保持编辑', em('edit', true) === 'edit');
  check('桌面预览保持预览', em('preview', false) === 'preview');
  check('非法模式回退分屏', em('bogus', false) === 'split');

  console.log('T3 分屏比例');
  check('clamp 下限', window.MD.layout.clampSplit(10) === 25);
  check('clamp 上限', window.MD.layout.clampSplit(90) === 75);
  window.MD.layout.setSplit(62);
  check('设置分屏比例', $('#workspace').style.getPropertyValue('--split') === '62%');

  console.log('T4 导出纯函数');
  const pd = window.MD.exporter.pngDimensions('phone');
  check('手机图 390px 宽', pd.width === 390 && pd.padding === 20);
  check('手机图 2x 输出 780px', pd.outWidth === 780 && pd.pixelRatio === 2);
  check('A4 图 794px 宽', window.MD.exporter.pngDimensions('a4').width === 794);
  check('A4 图 2x 输出 1588px', window.MD.exporter.pngDimensions('a4').outWidth === 1588);
  check('文件名校验 .md/.markdown/.txt', window.MD.exporter.validateFileName('a.md') &&
    window.MD.exporter.validateFileName('b.MARKDOWN') && !window.MD.exporter.validateFileName('c.exe'));
  check('下载名补 .md 后缀', window.MD.exporter.ensureMdExt('doc') === 'doc.md' &&
    window.MD.exporter.ensureMdExt('doc.md') === 'doc.md');
  check('文件名净化保留中文', window.MD.exporter.sanitizeBase('我的 文档.md') === '我的 文档');
  check('文件名净化替换非法字符', window.MD.exporter.sanitizeBase('a/b:c') === 'a_b_c');

  console.log('T5 打印导出（A4）');
  window.MD.exporter.printA4();
  check('打印容器已填充', $('#print-root').querySelector('.md-print') !== null);
  check('打印内容来自预览', $('#print-root').querySelector('.md-print').innerHTML === $('#preview').innerHTML);
  check('标题临时改为文档名', document.title === 'document');
  window.dispatchEvent(new window.Event('afterprint'));
  await sleep(10);
  check('afterprint 后恢复标题', document.title.includes('Markdown'));
  check('afterprint 后清空打印容器', $('#print-root').innerHTML === '');

  console.log('T6 语言切换');
  $('#lang-en').click();
  check('切换后语言为英文', window.MD.i18n.current() === 'en');
  check('静态文案已切换', $('#pane-editor .label').textContent === '01 — Editor');
  check('语言已持久化', window.localStorage.getItem('mdpress-lang') === 'en');
  check('英文示例文档可取', window.MD.i18n.t('sampleDoc').includes('A quiet place'));
  $('#lang-zh').click();
  check('切回中文', $('#pane-editor .label').textContent === '01 — 编辑');

  console.log('T7 打开 .md 文件');
  const file = new window.File(['# Imported\n\n你好'], 'note.md', { type: 'text/markdown' });
  const opened = await window.MD.exporter.openFile(file);
  check('打开成功', opened === true);
  check('编辑器载入内容', window.MD.editor.getValue() === '# Imported\n\n你好');
  check('预览同步渲染', $('#preview').querySelector('h1') !== null);
  check('文档名跟随文件', $('#st-name').textContent === 'note.md');
  await sleep(450);
  check('文档已自动保存', window.localStorage.getItem('mdpress-doc') === '# Imported\n\n你好');
  check('文档名已持久化', window.localStorage.getItem('mdpress-name') === 'note');
  const bad = new window.File(['x'], 'virus.exe', { type: 'application/octet-stream' });
  const openedBad = await window.MD.exporter.openFile(bad);
  check('拒绝非 Markdown 文件', openedBad === false && window.MD.editor.getValue() === '# Imported\n\n你好');

  console.log('T8 PNG 导出降级（html-to-image 缺省）');
  const okPng = await window.MD.exporter.exportPng('phone');
  check('缺库时返回失败', okPng === false);
  check('失败通知已显示', $('#st-save').textContent.includes('导出失败'));
  await sleep(4200);
  check('通知超时后回落保存状态', !$('#st-save').textContent.includes('导出失败'));

  console.log('T9 状态栏统计');
  check('行列位置显示', /1 行 1 列/.test($('#st-pos').textContent));
  check('词数显示', $('#st-words').textContent.includes('词'));
  check('字符数显示', $('#st-chars').textContent.includes('字符'));
  check('行数显示', $('#st-lines').textContent.includes('行'));

  console.log('T10 mermaid 降级渲染');
  const box = document.createElement('div');
  box.innerHTML = window.MD.markdown.render('```mermaid\nA-->B\n```');
  const count = await window.MD.markdown.renderDiagrams(box);
  check('无 mermaid 库时安全跳过', count === 0);
  check('原码回退保留', box.querySelector('.mermaid-raw') !== null);

  console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('测试执行异常:', e); process.exit(1); });
