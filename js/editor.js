/* =====================================================================
   MD·PRESS — editor
   CodeMirror 5 wrapper + typographic formatting commands.
   Falls back to a plain-textarea shim when CodeMirror is absent
   (Node/jsdom tests).
   ===================================================================== */
(function (global) {
  'use strict';

  var MD = global.MD = global.MD || {};

  var cm = null;
  var changeListeners = [];
  var cursorListeners = [];

  function init(textarea) {
    if (global.CodeMirror) {
      cm = global.CodeMirror.fromTextArea(textarea, {
        mode: 'markdown',
        lineNumbers: true,
        lineWrapping: true,
        styleActiveLine: true,
        addModeClass: true,
        extraKeys: {
          'Enter': 'newlineAndIndentContinueMarkdownList',
          'Cmd-B': function () { format('bold'); },
          'Ctrl-B': function () { format('bold'); },
          'Cmd-I': function () { format('italic'); },
          'Ctrl-I': function () { format('italic'); },
          'Cmd-K': function () { format('link'); },
          'Ctrl-K': function () { format('link'); }
        }
      });
      cm.on('change', function () {
        changeListeners.forEach(function (fn) { fn(); });
      });
      cm.on('cursorActivity', function () {
        cursorListeners.forEach(function (fn) { fn(); });
      });
    } else {
      /* test shim */
      cm = {
        _ta: textarea,
        getValue: function () { return textarea.value; },
        setValue: function (v) { textarea.value = v; },
        focus: function () {},
        getCursor: function () { return { line: 0, ch: 0 }; },
        lineCount: function () { return textarea.value.split('\n').length; },
        replaceRange: function () {},
        getSelection: function () { return ''; },
        setSelection: function () {},
        on: function () {}
      };
    }
    return cm;
  }

  function getValue() { return cm ? cm.getValue() : ''; }
  function getScrollerElement() { return cm && cm.getScrollerElement ? cm.getScrollerElement() : null; }
  function getScrollInfo() { return cm && cm.getScrollInfo ? cm.getScrollInfo() : { top: 0, height: 0, clientHeight: 0 }; }
  function scrollTo(x, y) { if (cm && cm.scrollTo) cm.scrollTo(x, y); }
  function setValue(v) { if (cm) { var s = cm.getCursor(); cm.setValue(v); try { cm.setCursor(s); } catch (e) {} } }
  function focus() { if (cm) cm.focus(); }
  function refresh() { if (cm && cm.refresh) cm.refresh(); }
  function onChange(fn) { changeListeners.push(fn); }
  function onCursor(fn) { cursorListeners.push(fn); }

  function getCursor() {
    if (!cm) return { line: 1, ch: 1 };
    var c = cm.getCursor();
    return { line: c.line + 1, ch: c.ch + 1 };
  }

  function lineCount() {
    if (cm && cm.lineCount) return cm.lineCount();
    return getValue().split('\n').length;
  }

  /* ---- formatting commands ------------------------------------------- */

  function replaceSelection(text, cursorOffset) {
    cm.replaceSelection(text);
    if (typeof cursorOffset === 'number') {
      var c = cm.getCursor();
      cm.setCursor({ line: c.line, ch: c.ch + cursorOffset });
    }
    cm.focus();
  }

  function wrapInline(before, after, placeholder) {
    var sel = cm.getSelection() || placeholder || '';
    var cur = cm.getCursor();
    var toCursor = cm.getRange({ line: cur.line, ch: 0 }, cur);
    var fromCursor = cm.getRange(cur, { line: cur.line, ch: 1e6 });
    /* toggle off when the markers already surround the caret or selection */
    if (sel && sel.length > before.length + after.length &&
        sel.indexOf(before) === 0 && sel.lastIndexOf(after) === sel.length - after.length) {
      cm.replaceSelection(sel.slice(before.length, sel.length - after.length), 'around');
    } else if (toCursor.endsWith(before) && fromCursor.startsWith(after)) {
      cm.replaceRange('', { line: cur.line, ch: cur.ch - before.length }, cur);
      cm.replaceRange('', cur, { line: cur.line, ch: cur.ch + after.length });
    } else {
      cm.replaceSelection(before + sel + after, 'around');
      if (!sel) cm.setCursor({ line: cur.line, ch: cur.ch + before.length });
    }
    cm.focus();
  }

  function linePrefix(prefix) {
    var from = cm.getCursor('from');
    var to = cm.getCursor('to');
    for (var line = from.line; line <= to.line; line++) {
      var text = cm.getLine(line) || '';
      var stripped = text.replace(/^(\s*)/, '$1');
      var indent = text.slice(0, text.length - stripped.length);
      if (stripped.indexOf(prefix) === 0) {
        cm.replaceRange(indent, { line: line, ch: 0 }, { line: line, ch: indent.length + prefix.length });
      } else {
        cm.replaceRange(indent + prefix, { line: line, ch: 0 }, { line: line, ch: indent.length });
      }
    }
    cm.focus();
  }

  function insertLink() {
    var url = '';
    if (global.prompt) url = global.prompt(MD.i18n ? MD.i18n.t('linkPrompt') : 'Link URL:', 'https://') || '';
    var sel = cm.getSelection();
    if (sel) {
      cm.replaceSelection('[' + sel + '](' + url + ')', 'around');
    } else {
      cm.replaceSelection('[' + url + '](' + url + ')', 'around');
    }
    cm.focus();
  }

  var MERMAID_SNIPPET = '\n```mermaid\nflowchart LR\n  A --> B\n```\n';

  function format(kind) {
    if (!cm) return;
    switch (kind) {
      case 'bold': wrapInline('**', '**', 'bold'); break;
      case 'italic': wrapInline('*', '*', 'text'); break;
      case 'code': wrapInline('`', '`', 'code'); break;
      case 'link': insertLink(); break;
      case 'list': linePrefix('- '); break;
      case 'mermaid': replaceSelection(MERMAID_SNIPPET, -5); break;
    }
  }

  MD.editor = {
    init: init,
    getValue: getValue,
    setValue: setValue,
    focus: focus,
    refresh: refresh,
    onChange: onChange,
    onCursor: onCursor,
    getCursor: getCursor,
    getScrollerElement: getScrollerElement,
    getScrollInfo: getScrollInfo,
    scrollTo: scrollTo,
    lineCount: lineCount,
    format: format,
    MERMAID_SNIPPET: MERMAID_SNIPPET
  };
}(typeof window !== 'undefined' ? window : globalThis));
