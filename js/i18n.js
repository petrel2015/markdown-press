/* =====================================================================
   MD·PRESS — i18n
   English / 简体中文. Detection: saved choice > browser language.
   Static markup uses data-i18n / data-i18n-placeholder /
   data-i18n-aria-label attributes; dynamic strings call MD.i18n.t(key, params).
   ===================================================================== */
(function (global) {
  'use strict';

  var MD = global.MD = global.MD || {};
  var STORE_KEY = 'mdpress-lang';

  var DICT = {
    en: {
      title: 'MD·PRESS — Markdown Editor',
      brand: 'MD·PRESS',
      langAria: 'Language',

      modeAria: 'View mode',
      modeEdit: 'Edit',
      modeSplit: 'Split',
      modePreview: 'Preview',

      btnNew: 'New',
      btnOpen: 'Open .md',
      btnSaveMd: 'Download .md',
      btnExport: 'Export',
      expPdf: 'A4 · PDF (print)',
      expPhone: 'Phone image · PNG',
      expA4: 'A4 image · PNG',

      paneEditor: '01 — Editor',
      panePreview: '02 — Preview',
      paneEditorAria: 'Markdown editor',
      panePreviewAria: 'Rendered preview',
      srcAria: 'Markdown source',
      prevAria: 'Rendered document',
      dividerAria: 'Resize panes. Double-click to reset.',

      fmtAria: 'Formatting',
      fmtBold: 'Bold',
      fmtItalic: 'Italic',
      fmtCode: 'Code',
      fmtLink: 'Link',
      fmtList: 'List',
      fmtDiagram: 'Diagram',
      syncScroll: 'Sync scroll',

      linkPrompt: 'Link URL:',
      confirmNew: 'Clear the current document? This cannot be undone.',

      stLines: '{n} lines',
      stChars: '{n} chars',
      stWords: '{n} words',
      stPos: 'Ln {ln}, Col {col}',
      stSaved: 'Saved {time}',
      stSaving: 'Saving…',
      stUnsaved: 'Unsaved',

      expBusy: 'Rendering image…',
      expDone: 'Exported',
      expFail: 'Export failed — see console.',
      openFail: 'Only .md, .markdown or .txt files are supported.',
      readFail: 'Could not read that file.',
      mermaidError: 'Diagram syntax error',
      bootError: 'Some parts failed to start — reload the page.',

      sampleDoc: [
        '# MD·PRESS',
        '',
        'A quiet place to write Markdown — edit on the left, read on the right, export when it is done.',
        '',
        '## Typography',
        '',
        'Text can be **bold**, *italic*, `inline code`, or a [link](https://example.com).',
        'A block quote, for the things other people said better:',
        '',
        '> Writing is thinking on paper. — William Zinsser',
        '',
        '## Lists',
        '',
        '1. Write',
        '2. Preview',
        '3. Export — A4 PDF or a phone-sized image',
        '',
        '- [x] Mermaid diagrams',
        '- [x] Chinese / English interface',
        '- [ ] Whatever you are planning next',
        '',
        '## Table',
        '',
        '| Export | Target | Format |',
        '|--------|--------|--------|',
        '| Print  | A4     | PDF    |',
        '| Long image | Phone | PNG |',
        '',
        '## Code',
        '',
        '```javascript',
        'function greet(name) {',
        '  return `Hello, ${name}!`;',
        '}',
        '```',
        '',
        '## Diagram',
        '',
        '```mermaid',
        'flowchart LR',
        '  A[Write] --> B[Preview]',
        '  B --> C{Good?}',
        '  C -- no --> A',
        '  C -- yes --> D[Export]',
        '```',
        '',
        '---',
        '',
        'Everything runs locally in your browser. Nothing is sent anywhere.'
      ].join('\n')
    },

    zh: {
      title: 'MD·PRESS — Markdown 编辑器',
      brand: 'MD·PRESS',
      langAria: '语言',

      modeAria: '视图模式',
      modeEdit: '编辑',
      modeSplit: '分屏',
      modePreview: '预览',

      btnNew: '新建',
      btnOpen: '打开 .md',
      btnSaveMd: '下载 .md',
      btnExport: '导出',
      expPdf: 'A4 · PDF（打印）',
      expPhone: '手机长图 · PNG',
      expA4: 'A4 图片 · PNG',

      paneEditor: '01 — 编辑',
      panePreview: '02 — 预览',
      paneEditorAria: 'Markdown 编辑器',
      panePreviewAria: '渲染预览',
      srcAria: 'Markdown 源文本',
      prevAria: '渲染后的文档',
      dividerAria: '调整窗格宽度，双击复位。',

      fmtAria: '格式化',
      fmtBold: '加粗',
      fmtItalic: '斜体',
      fmtCode: '代码',
      fmtLink: '链接',
      fmtList: '列表',
      fmtDiagram: '图表',
      syncScroll: '滚动同步',

      linkPrompt: '链接地址：',
      confirmNew: '清空当前文档？此操作不可撤销。',

      stLines: '{n} 行',
      stChars: '{n} 字符',
      stWords: '{n} 词',
      stPos: '{ln} 行 {col} 列',
      stSaved: '已保存 {time}',
      stSaving: '保存中…',
      stUnsaved: '未保存',

      expBusy: '正在生成图片…',
      expDone: '已导出',
      expFail: '导出失败——详情见控制台。',
      openFail: '仅支持 .md、.markdown 或 .txt 文件。',
      readFail: '无法读取该文件。',
      mermaidError: '图表语法错误',
      bootError: '部分功能启动失败——请刷新页面重试。',

      sampleDoc: [
        '# MD·PRESS',
        '',
        '一个安静的 Markdown 写作之处——左侧编辑，右侧阅读，完成之后导出。',
        '',
        '## 排版',
        '',
        '文字可以**加粗**、*倾斜*、`行内代码`，或者是一个[链接](https://example.com)。',
        '引用块，用来放别人说得更好的话：',
        '',
        '> 写作就是把思考落在纸上。',
        '',
        '## 列表',
        '',
        '1. 书写',
        '2. 预览',
        '3. 导出——A4 PDF 或适合手机查看的长图',
        '',
        '- [x] Mermaid 图表',
        '- [x] 中英文界面',
        '- [ ] 你接下来计划的事',
        '',
        '## 表格',
        '',
        '| 导出 | 目标 | 格式 |',
        '|------|------|------|',
        '| 打印 | A4   | PDF  |',
        '| 长图 | 手机 | PNG  |',
        '',
        '## 代码',
        '',
        '```javascript',
        'function greet(name) {',
        '  return `你好，${name}！`;',
        '}',
        '```',
        '',
        '## 图表',
        '',
        '```mermaid',
        'flowchart LR',
        '  A[书写] --> B[预览]',
        '  B --> C{满意?}',
        '  C -- 否 --> A',
        '  C -- 是 --> D[导出]',
        '```',
        '',
        '---',
        '',
        '一切都在浏览器本地完成，不向任何地方发送数据。'
      ].join('\n')
    }
  };

  var listeners = [];
  var lang = detect();

  function detect() {
    try {
      var saved = global.localStorage && global.localStorage.getItem(STORE_KEY);
      if (saved && DICT[saved]) return saved;
    } catch (e) { /* storage unavailable */ }
    var nav = global.navigator;
    var langs = nav && nav.languages && nav.languages.length ? nav.languages : [nav && nav.language || 'en'];
    for (var i = 0; i < langs.length; i++) {
      var tag = String(langs[i] || '').toLowerCase();
      if (tag.indexOf('zh') === 0) return 'zh';
      if (tag.indexOf('en') === 0) return 'en';
    }
    return 'en';
  }

  function t(key, params) {
    var table = DICT[lang] || DICT.en;
    var s = table[key] != null ? table[key] : (DICT.en[key] != null ? DICT.en[key] : key);
    if (params) {
      Object.keys(params).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(params[k]));
      });
    }
    return s;
  }

  function apply() {
    var root = global.document;
    if (!root) return;
    root.querySelectorAll('[data-i18n]').forEach(function (elm) {
      elm.textContent = t(elm.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-aria-label]').forEach(function (elm) {
      elm.setAttribute('aria-label', t(elm.getAttribute('data-i18n-aria-label')));
    });
    var titleEl = root.querySelector('title');
    if (titleEl) titleEl.textContent = t('title');
    root.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
  }

  function setLang(next) {
    if (!DICT[next]) return;
    lang = next;
    try {
      global.localStorage && global.localStorage.setItem(STORE_KEY, next);
    } catch (e) { /* storage unavailable */ }
    apply();
    listeners.forEach(function (fn) { fn(lang); });
  }

  MD.i18n = {
    t: t,
    apply: apply,
    setLang: setLang,
    current: function () { return lang; },
    onChange: function (fn) { listeners.push(fn); },
    DICT: DICT
  };
}(typeof window !== 'undefined' ? window : globalThis));
