/* =====================================================================
   MD·PRESS — donation
   「请作者喝杯咖啡」footer entry → dialog → Alipay / WeChat tabs →
   QR drawn in-browser from the raw payment payload: no static QR
   images, no third-party QR API. The QR library is lazy-loaded the
   first time the dialog opens, so first paint carries zero extra cost.
   Phones: Alipay opens the official https collection link (never a
   custom scheme) with the QR staying visible as the fallback; WeChat
   always shows the QR — wxp:// is a payload, never a navigation target.
   ===================================================================== */
(function (global) {
  'use strict';

  var MD = global.MD = global.MD || {};

  /* Single source of truth for payment targets. */
  var DONATION_CONFIG = {
    alipay: { qrContent: 'https://qr.alipay.com/fkx16432isyyhmx9ttwpi79' },
    wechat: { qrContent: 'wxp://f2f1fJpOcJc7F-MSeLMxALhc6tWu-oohtxueHRbCe98bMy2AmDunimuOJFv-8bjobLBM' }
  };

  var QR_LIB_URL = 'vendor/qrcode-generator.js';
  var QR_DISPLAY_SIZE = 220;
  var QR_ECC = 'M';
  var QR_QUIET_MODULES = 4;

  var overlay, tabAlipay, tabWechat, canvas, hintEl, entryBtn;
  var currentChannel = 'alipay';
  var qrLibPromise = null;
  var attemptedOpen = false;   /* one Alipay hand-off attempt per dialog session */
  var lastFocused = null;

  function t(key) { return MD.i18n.t(key); }

  function isMobileUA() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(global.navigator.userAgent);
  }

  function isOpen() {
    return overlay && !overlay.hidden;
  }

  function updateHint() {
    /* after a mobile Alipay hand-off attempt, the fallback hint takes over;
       every other case shows the plain scan instruction */
    if (currentChannel === 'alipay' && isMobileUA()) {
      hintEl.textContent = t('donateFallbackHint');
    } else {
      hintEl.textContent = t(currentChannel === 'alipay' ? 'donateScanAlipay' : 'donateScanWechat');
    }
  }

  /* ---- QR code (generated on demand, never stored) --------------------- */

  function loadQrLib() {
    if (global.qrcode) return global.Promise.resolve();
    if (!qrLibPromise) {
      qrLibPromise = new global.Promise(function (resolve, reject) {
        var script = global.document.createElement('script');
        script.src = QR_LIB_URL;
        script.onload = function () { resolve(); };
        script.onerror = function () {
          qrLibPromise = null;
          reject(new Error('QR library failed to load'));
        };
        global.document.head.appendChild(script);
      });
    }
    return qrLibPromise;
  }

  function drawQrCode(channel) {
    loadQrLib().then(function () {
      var qr = global.qrcode(0, QR_ECC);   /* typeNumber 0 = auto-pick version */
      qr.addData(DONATION_CONFIG[channel].qrContent);
      qr.make();

      var modules = qr.getModuleCount();
      var total = modules + QR_QUIET_MODULES * 2;
      /* integer module scaling keeps edges sharp; canvas ends up ≤ display size */
      var px = Math.max(1, Math.floor(QR_DISPLAY_SIZE / total));
      var canvasSize = px * total;
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      var ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) return;   /* canvas-less environments keep the hint usable */

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      ctx.fillStyle = '#111111';
      for (var row = 0; row < modules; row++) {
        for (var col = 0; col < modules; col++) {
          if (qr.isDark(row, col)) {
            ctx.fillRect((col + QR_QUIET_MODULES) * px, (row + QR_QUIET_MODULES) * px, px, px);
          }
        }
      }
    }).catch(function () {
      hintEl.textContent = t('donateQrError');
    });
  }

  /* ---- dialog ------------------------------------------------------------ */

  function renderTabs() {
    tabAlipay.classList.toggle('active', currentChannel === 'alipay');
    tabAlipay.setAttribute('aria-pressed', String(currentChannel === 'alipay'));
    tabWechat.classList.toggle('active', currentChannel === 'wechat');
    tabWechat.setAttribute('aria-pressed', String(currentChannel === 'wechat'));
  }

  function openDialog(channel) {
    currentChannel = channel || 'alipay';
    attemptedOpen = false;
    lastFocused = global.document.activeElement;
    overlay.hidden = false;
    renderTabs();
    updateHint();
    drawQrCode(currentChannel);
    if (currentChannel === 'alipay') attemptAlipayOpen();
    (currentChannel === 'alipay' ? tabAlipay : tabWechat).focus();
  }

  function closeDialog() {
    overlay.hidden = true;
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function switchChannel(channel) {
    if (currentChannel === channel) return;
    currentChannel = channel;
    renderTabs();
    updateHint();
    drawQrCode(channel);
    if (channel === 'alipay') attemptAlipayOpen();
    (currentChannel === 'alipay' ? tabAlipay : tabWechat).focus();
  }

  /* Alipay on phones: open the official https collection page and let it
     handle App hand-off; never fabricate a URL scheme. The QR stays on
     screen, so a blocked pop-up still leaves the user a way out. */
  function attemptAlipayOpen() {
    if (attemptedOpen || !isMobileUA()) return;
    attemptedOpen = true;
    global.open(DONATION_CONFIG.alipay.qrContent, '_blank', 'noopener');
  }

  /* ---- init ---------------------------------------------------------------- */

  function bind() {
    overlay = global.document.getElementById('donation-dialog');
    tabAlipay = global.document.getElementById('donation-tab-alipay');
    tabWechat = global.document.getElementById('donation-tab-wechat');
    canvas = global.document.getElementById('donation-qr');
    hintEl = global.document.getElementById('donation-hint');
    entryBtn = global.document.getElementById('donate-entry');
    if (!overlay || !entryBtn) return;

    entryBtn.addEventListener('click', function () { openDialog('alipay'); });
    tabAlipay.addEventListener('click', function () { switchChannel('alipay'); });
    tabWechat.addEventListener('click', function () { switchChannel('wechat'); });
    global.document.getElementById('donation-close').addEventListener('click', closeDialog);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeDialog();
    });
    global.document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) closeDialog();
    });
    MD.i18n.onChange(function () {
      if (isOpen()) updateHint();   /* static labels ride on data-i18n */
    });
  }

  bind();

  MD.donation = {
    isOpen: isOpen,
    open: openDialog,
    close: closeDialog,
    config: DONATION_CONFIG
  };
}(typeof window !== 'undefined' ? window : globalThis));
