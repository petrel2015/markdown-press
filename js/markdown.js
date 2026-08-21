/* =====================================================================
   MD·PRESS — markdown pipeline
   marked (GFM) + highlight.js for fenced code, mermaid for diagrams.
   Mermaid fences become <div class="mermaid-block" data-src="…"> with a
   <pre> fallback; MD.markdown.renderDiagrams() swaps in the SVG.
   Optional deps are guarded so the module also loads in Node/jsdom tests.
   ===================================================================== */
(function (global) {
  'use strict';

  var MD = global.MD = global.MD || {};

  /* ---- pure helpers (unit-tested) ------------------------------------ */

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isMermaidFence(info) {
    return String(info || '').trim().toLowerCase() === 'mermaid';
  }

  function countWords(text) {
    var s = String(text || '');
    /* CJK characters count as one word each; Latin runs count as words. */
    var cjk = s.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g);
    var latin = s
      .replace(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g, ' ')
      .match(/[A-Za-z0-9'’_-]+/g);
    return (cjk ? cjk.length : 0) + (latin ? latin.length : 0);
  }

  /* ---- pipeline ------------------------------------------------------- */

  var seq = 0;
  var markedInstance = null;

  function ensureMarked() {
    if (markedInstance) return markedInstance;
    if (!global.marked) throw new Error('marked is not loaded');
    var instance = new global.marked.Marked();

    var renderer = {
      code: function (code, infostring) {
        /* marked ≥13 passes a token object; support both shapes. */
        if (code && typeof code === 'object') {
          infostring = code.lang || '';
          code = code.text || '';
        }
        var lang = String(infostring || '').trim().split(/\s+/)[0].toLowerCase();

        if (isMermaidFence(lang)) {
          return '<div class="mermaid-block" data-src="' +
            encodeURIComponent(code) + '">' +
            '<pre class="mermaid-raw">' + escapeHtml(code) + '</pre></div>';
        }

        var hl = null;
        if (global.hljs) {
          try {
            hl = lang && global.hljs.getLanguage(lang)
              ? global.hljs.highlight(code, { language: lang, ignoreIllegals: true })
              : global.hljs.highlightAuto(code);
          } catch (e) { hl = null; }
        }
        var cls = hl ? ' class="hljs language-' + (lang || hl.language || '') + '"'
                     : ' class="language-' + escapeHtml(lang) + '"';
        return '<pre><code' + cls + '>' +
          (hl ? hl.value : escapeHtml(code)) + '</code></pre>';
      }
    };

    instance.use({ renderer: renderer });
    markedInstance = instance;
    return instance;
  }

  function render(src) {
    return ensureMarked().parse(String(src == null ? '' : src));
  }

  /* Turn every .mermaid-block in `container` into an SVG diagram.
     Returns a promise for the number of diagrams rendered. */
  function renderDiagrams(container) {
    var blocks = container ? container.querySelectorAll('.mermaid-block:not([data-done])') : [];
    var list = Array.prototype.slice.call(blocks);
    if (!list.length) return Promise.resolve(0);
    if (!global.mermaid || !global.mermaid.render) return Promise.resolve(0);

    var i = 0;
    function next() {
      if (i >= list.length) return Promise.resolve(list.length);
      var block = list[i++];
      var code = decodeURIComponent(block.getAttribute('data-src') || '');
      var id = 'mdpress-mm-' + (seq++);
      return Promise.resolve()
        .then(function () { return global.mermaid.render(id, code); })
        .then(function (out) {
          block.innerHTML = out.svg;
          block.setAttribute('data-done', '1');
          var svg = block.querySelector('svg');
          if (svg) svg.removeAttribute('height');
        })
        .catch(function () {
          /* mermaid leaves a temp element behind on failure */
          var junk = global.document.getElementById('d' + id);
          if (junk && junk.parentNode) junk.parentNode.removeChild(junk);
          var label = MD.i18n ? MD.i18n.t('mermaidError') : 'Diagram syntax error';
          block.innerHTML = '<div class="mermaid-error"><span>' + escapeHtml(label) +
            '</span></div><pre class="mermaid-raw">' + escapeHtml(code) + '</pre>';
          block.setAttribute('data-done', 'error');
        })
        .then(next);
    }
    return next();
  }

  function initMermaid() {
    if (!global.mermaid || !global.mermaid.initialize) return;
    global.mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'strict',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      themeVariables: {
        background: '#ffffff',
        primaryColor: '#f4f4f4',
        primaryBorderColor: '#111111',
        primaryTextColor: '#111111',
        secondaryColor: '#ececec',
        secondaryBorderColor: '#111111',
        secondaryTextColor: '#111111',
        tertiaryColor: '#fafafa',
        tertiaryBorderColor: '#999999',
        tertiaryTextColor: '#111111',
        lineColor: '#444444',
        textColor: '#111111',
        mainBkg: '#f4f4f4',
        nodeBorder: '#111111',
        clusterBkg: '#fafafa',
        edgeLabelBackground: '#ffffff'
      },
      flowchart: { curve: 'basis', padding: 12 }
    });
  }

  MD.markdown = {
    render: render,
    renderDiagrams: renderDiagrams,
    initMermaid: initMermaid,
    isMermaidFence: isMermaidFence,
    escapeHtml: escapeHtml,
    countWords: countWords
  };
}(typeof window !== 'undefined' ? window : globalThis));
