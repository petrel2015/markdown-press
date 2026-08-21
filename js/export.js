/* =====================================================================
   MD·PRESS — export
   A4 PDF via the browser print dialog (vector text, native SVG),
   PNG long-image export via html-to-image at phone (390px) and
   A4 (794px) widths, plus .md download / open.
   ===================================================================== */
(function (global) {
  'use strict';

  var MD = global.MD = global.MD || {};

  var hooks = {
    getSource: function () { return ''; },
    getFilename: function () { return 'document'; },
    notify: function () {}
  };

  /* Phone: 390px logical width (iPhone-class), A4: 794px (96dpi). */
  var PNG_SPECS = {
    phone: { width: 390, padding: 20, pixelRatio: 2, suffix: 'phone' },
    a4: { width: 794, padding: 60, pixelRatio: 2, suffix: 'a4' }
  };

  /* ---- pure helpers (unit-tested) ------------------------------------- */

  function pngDimensions(kind) {
    var spec = PNG_SPECS[kind] || PNG_SPECS.phone;
    return {
      width: spec.width,
      padding: spec.padding,
      pixelRatio: spec.pixelRatio,
      outWidth: spec.width * spec.pixelRatio
    };
  }

  function validateFileName(name) {
    return /\.(md|markdown|txt)$/i.test(String(name || ''));
  }

  function ensureMdExt(name) {
    var n = String(name || '').trim() || 'document';
    return /\.(md|markdown)$/i.test(n) ? n : n + '.md';
  }

  function sanitizeBase(name) {
    var n = String(name || '').trim();
    n = n.replace(/\.(md|markdown|txt)$/i, '');
    n = n.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim();
    return n || 'document';
  }

  /* ---- file helpers ----------------------------------------------------- */

  function download(href, filename) {
    var a = global.document.createElement('a');
    a.href = href;
    a.download = filename;
    global.document.body.appendChild(a);
    a.click();
    global.document.removeChild(a);
  }

  function downloadMd() {
    var blob = new Blob([hooks.getSource()], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    download(url, ensureMdExt(sanitizeBase(hooks.getFilename()) + '.md'));
    global.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---- A4 PDF (print) ---------------------------------------------------- */

  function printA4() {
    var root = global.document.getElementById('print-root');
    var preview = global.document.getElementById('preview');
    if (!root || !preview) return;

    root.innerHTML = '';
    var article = global.document.createElement('article');
    article.className = 'md-doc md-print';
    article.innerHTML = preview.innerHTML;
    root.appendChild(article);

    var prevTitle = global.document.title;
    global.document.title = sanitizeBase(hooks.getFilename()) || 'document';
    var restore = function () {
      global.document.title = prevTitle;
      global.removeEventListener('afterprint', restore);
      root.innerHTML = '';
    };
    global.addEventListener('afterprint', restore);

    global.requestAnimationFrame(function () { global.print(); });
    /* safety net for browsers that never fire afterprint */
    global.setTimeout(function () {
      if (root.innerHTML && global.document.title === prevTitle) return;
      restore();
    }, 60000);
  }

  /* ---- PNG export ---------------------------------------------------------- */

  function waitForImages(node) {
    var imgs = node.querySelectorAll('img');
    return Promise.all(Array.prototype.map.call(imgs, function (img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function (resolve) {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
        global.setTimeout(resolve, 4000);
      });
    }));
  }

  function exportPng(kind) {
    var spec = PNG_SPECS[kind];
    var lib = global.htmlToImage;
    if (!spec || !lib || !lib.toPng) {
      hooks.notify(MD.i18n ? MD.i18n.t('expFail') : 'Export failed', 'error');
      return Promise.resolve(false);
    }

    hooks.notify(MD.i18n ? MD.i18n.t('expBusy') : 'Rendering…', 'busy');

    var root = global.document.getElementById('png-root');
    root.innerHTML = '';
    root.style.width = spec.width + 'px';

    var article = global.document.createElement('article');
    article.className = 'md-doc png-doc';
    article.style.padding = spec.padding + 'px';
    article.innerHTML = MD.markdown.render(hooks.getSource());
    root.appendChild(article);

    return MD.markdown.renderDiagrams(article)
      .then(function () { return waitForImages(article); })
      .then(function () {
        return lib.toPng(article, {
          pixelRatio: spec.pixelRatio,
          backgroundColor: '#ffffff',
          width: spec.width
        });
      })
      .then(function (dataUrl) {
        var name = sanitizeBase(hooks.getFilename()) + '-' + spec.suffix + '.png';
        download(dataUrl, name);
        root.innerHTML = '';
        hooks.notify(MD.i18n ? MD.i18n.t('expDone') : 'Exported', 'ok');
        return true;
      })
      .catch(function (err) {
        root.innerHTML = '';
        if (global.console) global.console.error(err);
        hooks.notify(MD.i18n ? MD.i18n.t('expFail') : 'Export failed', 'error');
        return false;
      });
  }

  /* ---- open .md --------------------------------------------------------------- */

  function openFile(file) {
    if (!file) return Promise.resolve(false);
    if (!validateFileName(file.name)) {
      hooks.notify(MD.i18n ? MD.i18n.t('openFail') : 'Unsupported file', 'error');
      return Promise.resolve(false);
    }
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () {
        hooks.onFileOpen && hooks.onFileOpen(String(reader.result), file.name);
        resolve(true);
      };
      reader.onerror = function () {
        hooks.notify(MD.i18n ? MD.i18n.t('readFail') : 'Read failed', 'error');
        resolve(false);
      };
      reader.readAsText(file);
    });
  }

  /* ---- init ------------------------------------------------------------------ */

  function init(opts) {
    Object.keys(opts || {}).forEach(function (k) { hooks[k] = opts[k]; });

    var on = function (id, fn) {
      var el = global.document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    on('btn-save-md', downloadMd);
    on('exp-pdf', printA4);
    on('exp-phone', function () { exportPng('phone'); });
    on('exp-a4', function () { exportPng('a4'); });

    var input = global.document.getElementById('file-open');
    var openBtn = global.document.getElementById('btn-open');
    if (input && openBtn) {
      openBtn.addEventListener('click', function () { input.click(); });
      input.addEventListener('change', function () {
        if (input.files && input.files[0]) openFile(input.files[0]);
        input.value = '';
      });
    }
  }

  MD.exporter = {
    init: init,
    printA4: printA4,
    exportPng: exportPng,
    downloadMd: downloadMd,
    openFile: openFile,
    pngDimensions: pngDimensions,
    validateFileName: validateFileName,
    ensureMdExt: ensureMdExt,
    sanitizeBase: sanitizeBase,
    PNG_SPECS: PNG_SPECS
  };
}(typeof window !== 'undefined' ? window : globalThis));
