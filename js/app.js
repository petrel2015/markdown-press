/* =====================================================================
   MD·PRESS — application wiring
   Boots i18n, editor, layout, exporter; debounced render + autosave;
   status bar; export menu; sample document on first run.
   ===================================================================== */
(function (global) {
  'use strict';

  var MD = global.MD = global.MD || {};

  var DOC_KEY = 'mdpress-doc';
  var NAME_KEY = 'mdpress-name';

  var els = {};
  var docName = 'document';
  var renderTimer = null;
  var saveTimer = null;
  var notifyTimer = null;
  var notifyText = null;   /* non-null while a transient notice is shown */
  var savedLabel = '';

  function $(id) { return global.document.getElementById(id); }

  /* ---- document state --------------------------------------------------- */

  function loadDoc() {
    try {
      var saved = global.localStorage && global.localStorage.getItem(DOC_KEY);
      if (saved != null) {
        docName = (global.localStorage.getItem(NAME_KEY) || 'document');
        return saved;
      }
    } catch (e) { /* storage unavailable */ }
    return MD.i18n.t('sampleDoc');
  }

  function persistDoc() {
    try {
      global.localStorage.setItem(DOC_KEY, MD.editor.getValue());
      global.localStorage.setItem(NAME_KEY, docName);
    } catch (e) { /* storage unavailable */ }
  }

  /* ---- status bar ---------------------------------------------------------- */

  function timeNow() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function updateSavedLabel(state, time) {
    if (state === 'saving') savedLabel = MD.i18n.t('stSaving');
    else savedLabel = MD.i18n.t('stSaved', { time: time || timeNow() });
    paintSave();
  }

  function paintSave() {
    if (!els.stSave) return;
    if (notifyText != null) {
      els.stSave.textContent = notifyText;
      els.stSave.className = 'st-save st-notice';
      return;
    }
    els.stSave.textContent = savedLabel || '—';
    els.stSave.className = 'st-save';
  }

  function notify(text) {
    notifyText = text;
    paintSave();
    if (notifyTimer) global.clearTimeout(notifyTimer);
    notifyTimer = global.setTimeout(function () {
      notifyText = null;
      paintSave();
    }, 4000);
  }

  function updateStats() {
    var src = MD.editor.getValue();
    var pos = MD.editor.getCursor();
    if (els.stPos) els.stPos.textContent = MD.i18n.t('stPos', { ln: pos.line, col: pos.ch });
    if (els.stWords) els.stWords.textContent = MD.i18n.t('stWords', { n: MD.markdown.countWords(src) });
    if (els.stChars) els.stChars.textContent = MD.i18n.t('stChars', { n: src.length });
    if (els.stLines) els.stLines.textContent = MD.i18n.t('stLines', { n: MD.editor.lineCount() });
    if (els.stName) els.stName.textContent = docName + '.md';
  }

  /* ---- render / save pipeline ------------------------------------------------ */

  function renderNow() {
    els.preview.innerHTML = MD.markdown.render(MD.editor.getValue());
    MD.markdown.renderDiagrams(els.preview);
  }

  function saveNow() {
    updateSavedLabel('saving');
    persistDoc();
    global.setTimeout(function () { updateSavedLabel('saved'); }, 150);
  }

  function onSourceChange() {
    if (renderTimer) global.clearTimeout(renderTimer);
    renderTimer = global.setTimeout(function () {
      renderNow();
      updateStats();
    }, 300);
    if (saveTimer) global.clearTimeout(saveTimer);
    saveTimer = global.setTimeout(saveNow, 400);
  }

  function replaceDocument(text, name) {
    docName = MD.exporter.sanitizeBase(name || 'document');
    MD.editor.setValue(text);
    renderNow();
    updateStats();
    saveNow();
  }

  /* ---- export menu ------------------------------------------------------------- */

  function initExportMenu() {
    var menu = els.exportMenu;
    var btn = els.btnExport;
    if (!menu || !btn) return;

    function close() {
      menu.querySelector('.menu').hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
    function toggle() {
      var box = menu.querySelector('.menu');
      var open = box.hidden;
      close();
      if (open) {
        box.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
      }
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    menu.querySelectorAll('.menu-item').forEach(function (item) {
      item.addEventListener('click', close);
    });
    global.document.addEventListener('click', function (e) {
      if (!menu.contains(e.target)) close();
    });
    global.document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ---- language switch ------------------------------------------------------------ */

  function initLangSwitch() {
    function refresh() {
      ['en', 'zh'].forEach(function (code) {
        var b = $('lang-' + code);
        if (b) b.setAttribute('aria-pressed', String(MD.i18n.current() === code));
      });
    }
    ['en', 'zh'].forEach(function (code) {
      var b = $('lang-' + code);
      if (b) b.addEventListener('click', function () { MD.i18n.setLang(code); refresh(); });
    });
    MD.i18n.onChange(function () {
      refresh();
      updateStats();
      paintSave();
    });
    refresh();
  }

  /* ---- boot ------------------------------------------------------------------------ */

  function boot() {
    var rootClass = global.document.documentElement;
    rootClass.className = (' ' + rootClass.className + ' ')
      .replace(' md-booting ', ' ').trim();

    els.preview = $('preview');
    els.stPos = $('st-pos');
    els.stWords = $('st-words');
    els.stChars = $('st-chars');
    els.stLines = $('st-lines');
    els.stName = $('st-name');
    els.stSave = $('st-save');
    els.exportMenu = $('export-menu');
    els.btnExport = $('btn-export');

    /* Boot in fault-isolated stages: a broken optional piece must not
       kill the controls. */
    try {
      MD.i18n.apply();
      MD.markdown.initMermaid();
      MD.editor.init($('editor-source'));
      MD.editor.setValue(loadDoc());
    } catch (e) { recordBootError(e); }

    try {
      MD.layout.init();
    } catch (e) { recordBootError(e); }

    try {
      MD.exporter.init({
        getSource: function () { return MD.editor.getValue(); },
        getFilename: function () { return docName; },
        notify: notify,
        onFileOpen: replaceDocument
      });

      MD.editor.onChange(onSourceChange);
      MD.editor.onCursor(updateStats);

      /* formatting toolbar */
      [['fmt-bold', 'bold'], ['fmt-italic', 'italic'], ['fmt-code', 'code'],
       ['fmt-link', 'link'], ['fmt-list', 'list'], ['fmt-mermaid', 'mermaid']]
        .forEach(function (pair) {
          var b = $(pair[0]);
          if (b) b.addEventListener('click', function () { MD.editor.format(pair[1]); });
        });

      /* new document */
      var btnNew = $('btn-new');
      if (btnNew) {
        btnNew.addEventListener('click', function () {
          if (global.confirm(MD.i18n.t('confirmNew'))) replaceDocument('', 'document');
        });
      }
    } catch (e) { recordBootError(e); }

    /* CodeMirror measures wrong while a pane is display:none —
       refresh it whenever the layout re-exposes the editor. */
    MD.layout.onModeChange(function () {
      global.setTimeout(MD.editor.refresh, 0);
    });
    var divider = $('divider');
    if (divider) {
      divider.addEventListener('pointerup', function () {
        global.setTimeout(MD.editor.refresh, 0);
      });
    }

    try {
      initExportMenu();
      initLangSwitch();
    } catch (e) { recordBootError(e); }

    renderNow();
    updateStats();
    savedLabel = MD.i18n.t('stSaved', { time: timeNow() });
    paintSave();
    persistDoc(); /* first run: sample doc becomes the stored doc */

    flushBootQueue(global.MD_BOOT_QUEUE);
    global.MD_BOOT_QUEUE = null;

    global.addEventListener('beforeunload', function () { persistDoc(); });
    global.addEventListener('resize', function () {
      global.setTimeout(MD.editor.refresh, 50);
    });
  }

  function recordBootError(e) {
    if (global.console) global.console.error('MD·PRESS boot:', e);
    bootFailed = true;
    try {
      els.stSave.textContent = MD.i18n.t('bootError');
      els.stSave.className = 'st-save st-notice';
    } catch (err) { /* status bar unavailable */ }
  }

  /* Clicks that landed before listeners existed are replayed once —
     only the most recent target, within a short grace window. */
  function flushBootQueue(queue) {
    try {
      if (!queue || !queue.length || bootFailed) return;
      var last = queue[queue.length - 1];
      if (Date.now() - last.t > 15000) return;
      var btn = global.document.getElementById(last.id);
      if (btn) btn.click();
    } catch (e) { /* replay is best-effort */ }
  }

  var bootFailed = false;

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}(typeof window !== 'undefined' ? window : globalThis));
