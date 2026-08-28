/* =====================================================================
   MD·PRESS — layout
   View modes (edit / split / preview), draggable divider, phone
   coercion, proportional two-way scroll sync. Modes are expressed on
   <body data-mode>; CSS handles pane visibility per breakpoint.
   ===================================================================== */
(function (global) {
  'use strict';

  var MD = global.MD = global.MD || {};

  var PHONE_MAX = 767;              /* px, inclusive upper bound */
  var MIN_SPLIT = 25;               /* % */
  var MAX_SPLIT = 75;               /* % */

  var els = {};
  var mode = 'split';
  var splitPct = 50;
  var syncEnabled = true;
  var syncLock = false;
  var syncTimer = null;
  var modeListeners = [];
  var persistSplitTimer = null;

  /* ---- pure helpers (unit-tested) ------------------------------------ */

  function effectiveMode(requested, isPhone) {
    if (isPhone && requested === 'split') return 'edit';
    return requested === 'edit' || requested === 'preview' ? requested : 'split';
  }

  function clampSplit(pct) {
    pct = Number(pct);
    if (!isFinite(pct)) return 50;
    return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, Math.round(pct)));
  }

  function isPhoneViewport() {
    return global.matchMedia
      ? global.matchMedia('(max-width: ' + PHONE_MAX + 'px)').matches
      : false;
  }

  /* ---- state ---------------------------------------------------------- */

  function loadState() {
    try {
      var m = global.localStorage && global.localStorage.getItem('mdpress-mode');
      var s = global.localStorage && global.localStorage.getItem('mdpress-split');
      if (m) mode = m;
      if (s) splitPct = clampSplit(s);
    } catch (e) { /* storage unavailable */ }
  }

  function persist(key, val) {
    try { global.localStorage && global.localStorage.setItem(key, val); } catch (e) {}
  }

  function applyMode() {
    var eff = effectiveMode(mode, isPhoneViewport());
    global.document.body.setAttribute('data-mode', eff);
    ['edit', 'split', 'preview'].forEach(function (m) {
      var btn = els['mode-' + m];
      if (btn) btn.setAttribute('aria-pressed', String(eff === m));
    });
    modeListeners.forEach(function (fn) { fn(eff); });
  }

  function setMode(m) {
    if (m !== 'edit' && m !== 'split' && m !== 'preview') return;
    mode = m;
    persist('mdpress-mode', mode);
    applyMode();
  }

  function applySplit() {
    if (els.workspace) els.workspace.style.setProperty('--split', splitPct + '%');
  }

  function setSplit(pct) {
    splitPct = clampSplit(pct);
    applySplit();
    if (persistSplitTimer) global.clearTimeout(persistSplitTimer);
    persistSplitTimer = global.setTimeout(function () {
      persist('mdpress-split', splitPct);
    }, 300);
  }

  /* ---- divider --------------------------------------------------------- */

  function initDivider() {
    var el = els.divider;
    if (!el) return;

    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
      global.document.body.classList.add('col-resizing');
    });

    el.addEventListener('pointermove', function (e) {
      if (!el.classList.contains('dragging')) return;
      var rect = els.workspace.getBoundingClientRect();
      setSplit(((e.clientX - rect.left) / rect.width) * 100);
    });

    function endDrag(e) {
      if (!el.classList.contains('dragging')) return;
      el.classList.remove('dragging');
      global.document.body.classList.remove('col-resizing');
      if (el.releasePointerCapture && e && e.pointerId != null) {
        try { el.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    }
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);

    el.addEventListener('dblclick', function () { setSplit(50); });

    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { setSplit(splitPct - 2); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setSplit(splitPct + 2); e.preventDefault(); }
    });
  }

  /* ---- scroll sync ------------------------------------------------------ */

  function syncScroll(from) {
    if (!syncEnabled || syncLock) return;
    if (global.document.body.getAttribute('data-mode') !== 'split') return;

    var scroller = MD.editor && MD.editor.getScrollerElement ? MD.editor.getScrollerElement() : null;
    var preview = els.previewScroll;
    if (!scroller || !preview) return;

    var src, dst;
    if (from === 'editor') { src = scroller; dst = preview; }
    else { src = preview; dst = scroller; }

    var srcMax = src.scrollHeight - src.clientHeight;
    if (srcMax <= 0) return;
    var ratio = src.scrollTop / srcMax;

    syncLock = true;
    if (from === 'editor') {
      dst.scrollTop = ratio * (dst.scrollHeight - dst.clientHeight);
    } else if (MD.editor.scrollTo) {
      var info = MD.editor.getScrollInfo();
      MD.editor.scrollTo(null, ratio * (info.height - info.clientHeight));
    }
    if (syncTimer) global.clearTimeout(syncTimer);
    syncTimer = global.setTimeout(function () { syncLock = false; }, 120);
  }

  function initSync() {
    var scroller = MD.editor && MD.editor.getScrollerElement ? MD.editor.getScrollerElement() : null;
    if (scroller) {
      scroller.addEventListener('scroll', function () { syncScroll('editor'); });
    }
    if (els.previewScroll) {
      els.previewScroll.addEventListener('scroll', function () { syncScroll('preview'); });
    }
    if (els.btnSync) {
      els.btnSync.addEventListener('click', function () {
        syncEnabled = !syncEnabled;
        els.btnSync.setAttribute('aria-pressed', String(syncEnabled));
      });
    }
  }

  /* ---- focus mode --------------------------------------------------------
     Immersive editing / reading: hides the masthead, pane heads and the
     status bar; the browser fullscreen API is engaged when available.
     Escape or the floating exit pill always restores the chrome. State
     persists like mode/split, but fullscreen is never requested without a
     user gesture (i.e. not on page load). */

  var FOCUS_KEY = 'mdpress-focus';
  var focusOn = false;

  function applyFocus() {
    global.document.body.setAttribute('data-focus', focusOn ? 'on' : 'off');
    if (els.btnFocus) els.btnFocus.setAttribute('aria-pressed', String(focusOn));
  }

  function refreshEditorSoon() {
    /* hiding the chrome changes pane heights — CodeMirror must re-measure */
    global.setTimeout(function () {
      if (global.MD && MD.editor && MD.editor.refresh) MD.editor.refresh();
    }, 0);
  }

  function requestBrowserFullscreen(on) {
    var doc = global.document;
    var root = doc.documentElement;
    try {
      if (!doc.fullscreenEnabled) return; /* unsupported (jsdom) or blocked */
      if (on && !doc.fullscreenElement && root.requestFullscreen) {
        var p = root.requestFullscreen();
        if (p && p.catch) p.catch(function () { /* best-effort */ });
      } else if (!on && doc.fullscreenElement && doc.exitFullscreen) {
        var q = doc.exitFullscreen();
        if (q && q.catch) q.catch(function () { /* best-effort */ });
      }
    } catch (e) { /* fullscreen is best-effort */ }
  }

  function setFocus(on) {
    focusOn = !!on;
    persist(FOCUS_KEY, focusOn ? 'on' : 'off');
    applyFocus();
    requestBrowserFullscreen(focusOn);
    refreshEditorSoon();
  }

  function initFocus() {
    els.btnFocus = global.document.getElementById('btn-focus');
    els.btnFocusExit = global.document.getElementById('btn-focus-exit');

    if (els.btnFocus) {
      els.btnFocus.addEventListener('click', function () { setFocus(!focusOn); });
    }
    if (els.btnFocusExit) {
      els.btnFocusExit.addEventListener('click', function () { setFocus(false); });
    }
    global.document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && focusOn) setFocus(false);
    });
    global.document.addEventListener('fullscreenchange', function () {
      /* the browser left fullscreen on its own (e.g. its own Esc) — follow */
      if (!global.document.fullscreenElement && focusOn) setFocus(false);
    });

    try {
      focusOn = global.localStorage && global.localStorage.getItem(FOCUS_KEY) === 'on';
    } catch (e) { focusOn = false; }
    applyFocus();
  }

  /* ---- init ------------------------------------------------------------- */

  function init() {
    els.workspace = global.document.getElementById('workspace');
    els.divider = global.document.getElementById('divider');
    els.previewScroll = global.document.getElementById('preview-scroll');
    els.btnSync = global.document.getElementById('btn-sync');
    ['edit', 'split', 'preview'].forEach(function (m) {
      els['mode-' + m] = global.document.getElementById('mode-' + m);
    });

    loadState();

    ['edit', 'split', 'preview'].forEach(function (m) {
      var btn = els['mode-' + m];
      if (btn) btn.addEventListener('click', function () { setMode(m); });
    });

    initDivider();
    initSync();
    initFocus();
    applySplit();
    applyMode();

    if (global.matchMedia) {
      var mq = global.matchMedia('(max-width: ' + PHONE_MAX + 'px)');
      var onChange = function () { applyMode(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
    global.addEventListener('resize', applyMode);
    global.addEventListener('resize', applySplit);
  }

  function onModeChange(fn) { modeListeners.push(fn); }

  MD.layout = {
    init: init,
    setMode: setMode,
    getMode: function () { return global.document.body.getAttribute('data-mode') || mode; },
    onModeChange: onModeChange,
    setSplit: setSplit,
    effectiveMode: effectiveMode,
    clampSplit: clampSplit,
    isPhoneViewport: isPhoneViewport,
    setFocus: setFocus,
    getFocus: function () { return focusOn; }
  };
}(typeof window !== 'undefined' ? window : globalThis));
