/* =========================================================================
   app.js — schermate, stato, transizioni, utilità condivise
   ========================================================================= */
(function () {
  'use strict';

  var C = window.CONFIG;
  var STORE_KEY = 'perLalla2026';
  var SESSION_KEY = 'perLalla2026_unlocked';

  /* ---------------------------------------------------------------------
     Utilità condivise (usate anche da giochi e player)
     --------------------------------------------------------------------- */
  var U = (window.U = {});

  U.el = function (tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') e.className = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  };

  U.fmt = function (str, vars) {
    return String(str || '').replace(/\{(\w+)\}/g, function (m, k) {
      return vars && vars[k] != null ? vars[k] : m;
    });
  };

  U.reducedMotion = function () {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  };

  U.vibrate = function (ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* niente */ }
  };

  U.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  U.storage = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* niente */ }
    },
    remove: function (key) {
      try { window.localStorage.removeItem(key); } catch (e) { /* niente */ }
    }
  };

  function sessionGet(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
  function sessionSet(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* niente */ } }
  function sessionDel(k) { try { window.sessionStorage.removeItem(k); } catch (e) { /* niente */ } }

  /* Placeholder generato: gradiente nei colori del sito + cuoricino + etichetta */
  U.placeholder = function (label, opts) {
    opts = opts || {};
    var w = opts.w || 400, h = opts.h || 400;
    var c1 = opts.dark ? '#8a2f45' : '#f3dfe1';
    var c2 = opts.dark ? '#2b0f17' : '#c9848f';
    var s = w / 150;
    var safe = String(label || '').replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>' +
      '<radialGradient id="r" cx=".3" cy=".25" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#r)"/>' +
      '<rect x="' + (w * 0.06) + '" y="' + (h * 0.06) + '" width="' + (w * 0.88) + '" height="' + (h * 0.88) + '" rx="' + (w * 0.05) + '" fill="none" stroke="#e8d7a8" stroke-opacity=".7" stroke-width="' + Math.max(1, w / 160) + '"/>' +
      '<path transform="translate(' + (w / 2 - 12 * s) + ',' + (h / 2 - 17 * s) + ') scale(' + s + ')" ' +
      'd="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#fff" fill-opacity=".92"/>' +
      '<text x="50%" y="' + (h / 2 + 22 * s) + '" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-style="italic" font-size="' + Math.round(Math.min(w / 6.5, (w * 1.55) / Math.max(1, safe.length))) + '" fill="#fff">' + safe + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };

  /* <img> che, se il file manca, mostra il placeholder */
  U.img = function (src, label, opts) {
    var img = U.el('img', { alt: '', draggable: 'false', decoding: 'async' });
    var fallback = U.placeholder(label, opts);
    img.onerror = function () { img.onerror = null; img.src = fallback; };
    img.src = src || fallback;
    return img;
  };

  /* Prova una lista di immagini in ordine; restituisce la prima che si carica, altrimenti il placeholder */
  var imgCache = {};
  U.resolveImage = function (candidates, label, opts) {
    var list = (candidates || []).filter(Boolean);
    var key = list.join('|') + '#' + label;
    if (imgCache[key]) return imgCache[key];
    imgCache[key] = new Promise(function (resolve) {
      var i = 0;
      (function tryNext() {
        if (i >= list.length) return resolve(U.placeholder(label, opts));
        var src = list[i++];
        var probe = new Image();
        probe.onload = function () { resolve(src); };
        probe.onerror = tryNext;
        probe.src = src;
      })();
    });
    return imgCache[key];
  };

  U.toast = (function () {
    var timer;
    return function (msg, ms) {
      var t = document.getElementById('toast');
      if (!t) return;
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(function () { t.classList.remove('show'); }, ms || 3200);
    };
  })();

  /* Coriandoli leggeri su canvas */
  U.confetti = function () {
    if (U.reducedMotion()) return;
    var canvas = U.el('canvas', { class: 'confetti', 'aria-hidden': 'true' });
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth, H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    var colors = ['#c9848f', '#6b1e2e', '#d8b56a', '#f3dfe1', '#8fa98b', '#e7a9b4'];
    var parts = [];
    for (var i = 0; i < 140; i++) {
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * W * 0.3,
        y: H * 0.35,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 13 - 4,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
        r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        c: colors[i % colors.length], heart: Math.random() < 0.18
      });
    }
    var start = performance.now();
    function heart(x, y, s) {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.3);
      ctx.bezierCurveTo(x, y, x - s / 2, y, x - s / 2, y + s * 0.3);
      ctx.bezierCurveTo(x - s / 2, y + s * 0.6, x, y + s * 0.8, x, y + s);
      ctx.bezierCurveTo(x, y + s * 0.8, x + s / 2, y + s * 0.6, x + s / 2, y + s * 0.3);
      ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s * 0.3);
      ctx.fill();
    }
    (function frame(now) {
      var t = now - start;
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t / 3200);
        ctx.fillStyle = p.c;
        ctx.translate(p.x, p.y); ctx.rotate(p.r);
        if (p.heart) heart(0, -p.w / 2, p.w * 1.6);
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * 0.55);
        ctx.restore();
      });
      if (t < 3300) requestAnimationFrame(frame);
      else canvas.remove();
    })(start);
  };

  U.heartSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  /* Bottone che chiede una conferma leggera (secondo tap entro 4 s) */
  U.confirmButton = function (label, confirmLabel, onConfirm) {
    var armed = false, timer;
    var b = U.el('button', { class: 'btn btn-primary', type: 'button', text: label });
    b.addEventListener('click', function () {
      if (!armed) {
        armed = true;
        b.textContent = confirmLabel;
        b.classList.add('armed');
        timer = setTimeout(function () { armed = false; b.textContent = label; b.classList.remove('armed'); }, 4000);
        return;
      }
      clearTimeout(timer);
      b.disabled = true;
      onConfirm();
    });
    return b;
  };

  /* ---------------------------------------------------------------------
     Stato
     --------------------------------------------------------------------- */
  var ORDER = ['lock', 'message', 'wordle', 'riddle1', 'gift1', 'memory', 'riddle2', 'gift2',
               'numbers', 'riddle3', 'gift3', 'finale', 'player'];
  var MILESTONES = ['gift1', 'gift2', 'gift3', 'player'];

  function defaultState() { return { screen: 'message', completed: {}, games: {} }; }

  var state = U.storage.get(STORE_KEY, null);
  if (!state || typeof state !== 'object' || ORDER.indexOf(state.screen) < 0) state = defaultState();
  state.completed = state.completed || {};
  state.games = state.games || {};

  function save() { U.storage.set(STORE_KEY, state); }

  function resetAll() {
    U.storage.remove(STORE_KEY);
    U.storage.remove('perLalla2026_player');
    U.storage.remove('perLalla2026_best');
    sessionDel(SESSION_KEY);
    state = defaultState();
    if (window.Player && Player.stop) Player.stop();
  }

  /* ---------------------------------------------------------------------
     Navigazione e transizioni
     --------------------------------------------------------------------- */
  var app = document.getElementById('app');
  var currentName = null;
  var currentEl = null;
  var currentCleanup = null;

  var SCREENS = {
    lock: { render: renderLock, progress: false },
    message: { render: renderMessage, progress: true },
    wordle: { render: gameRenderer('wordle'), progress: true },
    riddle1: { render: riddleRenderer(1), progress: true },
    gift1: { render: giftRenderer(1), progress: true },
    memory: { render: gameRenderer('memory'), progress: true, wide: true },
    riddle2: { render: riddleRenderer(2), progress: true },
    gift2: { render: giftRenderer(2), progress: true },
    numbers: { render: gameRenderer('numbers'), progress: true, wide: true },
    riddle3: { render: riddleRenderer(3), progress: true },
    gift3: { render: giftRenderer(3), progress: true },
    finale: { render: renderFinale, progress: false, dark: true },
    player: { render: renderPlayer, progress: false, dark: true, player: true }
  };

  function goTo(name, opts) {
    opts = opts || {};
    if (!SCREENS[name]) name = 'lock';
    var def = SCREENS[name];

    if (name !== 'lock') { state.screen = name; save(); }

    var old = currentEl, oldCleanup = currentCleanup;
    var screen = U.el('section', { class: 'screen' + (def.wide ? ' screen-wide' : ''), 'data-screen': name });
    currentName = name;
    currentEl = screen;
    currentCleanup = null;

    function mountNew() {
      if (oldCleanup) { try { oldCleanup(); } catch (e) { /* niente */ } }
      if (old && old.parentNode) old.parentNode.removeChild(old);
      document.body.classList.toggle('dark', !!def.dark);
      document.body.classList.toggle('player-mode', !!def.player);
      setThemeColor(def.dark ? '#121212' : '#fbf6ef');
      renderProgress(name, def.progress);
      app.appendChild(screen);
      try {
        currentCleanup = def.render(screen) || null;
      } catch (err) {
        console.error(err);
      }
      window.scrollTo(0, 0);
      if (!opts.instant && !U.reducedMotion()) {
        screen.classList.add('entering');
        // forza il reflow prima di avviare la transizione
        void screen.offsetWidth;
        screen.classList.remove('entering');
      }
      updateDebug();
    }

    if (old && !opts.instant && !U.reducedMotion()) {
      old.classList.add('leaving');
      setTimeout(mountNew, 380);
    } else {
      mountNew();
    }
  }

  function next() {
    var i = ORDER.indexOf(currentName);
    goTo(ORDER[Math.min(i + 1, ORDER.length - 1)]);
  }

  function setThemeColor(c) {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', c);
  }

  /* ---------------------------------------------------------------------
     Barra di avanzamento: 4 cuori
     --------------------------------------------------------------------- */
  var progress = document.getElementById('progress');
  function renderProgress(name, show) {
    progress.hidden = !show;
    if (!show) return;
    var idx = ORDER.indexOf(name);
    var filled = MILESTONES.filter(function (m) { return ORDER.indexOf(m) < idx; }).length;
    progress.innerHTML = '';
    var labels = C.progressLabels || [];
    MILESTONES.forEach(function (m, i) {
      if (i > 0) progress.appendChild(U.el('span', { class: 'p-line' + (i <= filled ? ' on' : '') }));
      var cls = 'p-heart' + (i < filled ? ' on' : '') + (i === filled ? ' current' : '');
      progress.appendChild(U.el('span', { class: cls, html: U.heartSVG, title: labels[i] || '', 'aria-label': (labels[i] || '') + (i < filled ? ' ✓' : '') }));
    });
  }

  /* ---------------------------------------------------------------------
     Schermata 0: lucchetto
     --------------------------------------------------------------------- */
  function renderLock(root) {
    var L = C.lock;
    var lockSVG =
      '<svg viewBox="0 0 120 150" class="lock-svg" aria-hidden="true">' +
      '<defs><linearGradient id="lockBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3c37f"/><stop offset="1" stop-color="#b8924a"/></linearGradient>' +
      '<linearGradient id="lockShackle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a88446"/><stop offset=".5" stop-color="#ecd49c"/><stop offset="1" stop-color="#a88446"/></linearGradient></defs>' +
      '<g class="lock-shackle"><path d="M32 70 V45 a28 28 0 0 1 56 0 V70" fill="none" stroke="url(#lockShackle)" stroke-width="11" stroke-linecap="round"/></g>' +
      '<rect x="14" y="64" width="92" height="76" rx="16" fill="url(#lockBody)"/>' +
      '<rect x="20" y="70" width="80" height="64" rx="12" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>' +
      '<path transform="translate(45 84) scale(1.25)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#6b1e2e"/>' +
      '</svg>';

    var lockWrap = U.el('div', { class: 'lock-wrap', html: lockSVG });
    var input = U.el('input', {
      class: 'code-input', type: 'text', inputmode: 'numeric', autocomplete: 'off',
      autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: '10',
      placeholder: L.placeholder, 'aria-label': 'Codice'
    });
    var msg = U.el('p', { class: 'lock-msg', role: 'alert' });
    var btn = U.el('button', { class: 'btn btn-primary', type: 'submit', text: L.button });
    var form = U.el('form', { class: 'lock-form', novalidate: true }, [input, btn]);

    var opening = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (opening) return;
      var typed = input.value.replace(/[\s.\/\-_,]/g, '');
      var target = String(L.code).replace(/[\s.\/\-_,]/g, '');
      if (typed === target) {
        opening = true;
        input.blur();
        msg.textContent = L.successMessage;
        msg.className = 'lock-msg ok';
        lockWrap.classList.add('open');
        sessionSet(SESSION_KEY, '1');
        setTimeout(function () {
          var saved = state.screen;
          goTo(saved && saved !== 'lock' ? saved : 'message');
        }, U.reducedMotion() ? 300 : 1300);
      } else {
        msg.textContent = L.errorMessage;
        msg.className = 'lock-msg';
        lockWrap.classList.remove('shake');
        void lockWrap.offsetWidth;
        lockWrap.classList.add('shake');
        U.vibrate(80);
      }
    });

    root.appendChild(U.el('div', { class: 'card lock-card' }, [
      U.el('h1', { class: 'title', text: L.title }),
      U.el('p', { class: 'subtitle', text: L.subtitle }),
      lockWrap,
      form,
      U.el('p', { class: 'hint script', text: L.hint }),
      msg
    ]));
    // niente autofocus su mobile: aprirebbe subito la tastiera coprendo il lucchetto
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setTimeout(function () { input.focus(); }, 450);
    }
  }

  /* ---------------------------------------------------------------------
     Schermata 1: messaggio con effetto macchina da scrivere
     --------------------------------------------------------------------- */
  function renderMessage(root) {
    var M = C.message;
    var full = M.text;
    var textEl = U.el('div', { class: 'typed script' });
    var caret = U.el('span', { class: 'caret', 'aria-hidden': 'true' });
    var sig = U.el('p', { class: 'signature script', text: M.signature });
    var btn = U.el('button', { class: 'btn btn-primary', type: 'button', text: M.button });
    var btnWrap = U.el('div', { class: 'reveal-later' }, [btn]);
    var skip = U.el('p', { class: 'skip-hint', text: M.skipHint });
    var paper = U.el('div', { class: 'paper', role: 'button', tabindex: '0', 'aria-label': full }, [textEl, sig]);
    var timer = null, i = 0, finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      textEl.textContent = full;
      caret.remove();
      sig.classList.add('show');
      skip.classList.add('gone');
      setTimeout(function () { btnWrap.classList.add('show'); }, 450);
    }
    function step() {
      i++;
      textEl.textContent = full.slice(0, i);
      textEl.appendChild(caret);
      if (i >= full.length) return finish();
      var ch = full.charAt(i - 1);
      var delay = M.speed || 42;
      if (ch === '\n') delay *= 12; else if (/[.,…?!]/.test(ch)) delay *= 6;
      timer = setTimeout(step, delay);
    }
    paper.addEventListener('click', finish);
    paper.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(); } });
    btn.addEventListener('click', function () { btn.disabled = true; state.completed.message = true; next(); });

    root.appendChild(U.el('div', { class: 'message-wrap' }, [paper, skip, btnWrap]));
    if (U.reducedMotion()) finish(); else timer = setTimeout(step, 700);
    return function () { clearTimeout(timer); };
  }

  /* ---------------------------------------------------------------------
     Giochi
     --------------------------------------------------------------------- */
  function gameRenderer(name) {
    return function (root) {
      var game = window.Games && window.Games[name];
      if (!game) { root.textContent = '…'; return; }
      return game.mount(root, {
        load: function () { return state.games[name] || null; },
        save: function (data) { state.games[name] = data; save(); },
        finish: function () { state.completed[name] = true; save(); next(); }
      });
    };
  }

  /* ---------------------------------------------------------------------
     Indovinelli
     --------------------------------------------------------------------- */
  function riddleRenderer(n) {
    return function (root) {
      var btn = U.el('button', { class: 'btn btn-primary', type: 'button', text: C.riddleButton });
      btn.addEventListener('click', function () { btn.disabled = true; next(); });
      root.appendChild(U.el('div', { class: 'card riddle-card' }, [
        U.el('div', { class: 'riddle-badge', html: U.heartSVG }),
        U.el('h2', { class: 'title', text: C.riddleTitle }),
        U.el('div', { class: 'ornament', 'aria-hidden': 'true', text: '✦ ✦ ✦' }),
        U.el('p', { class: 'riddle-text script', text: '“' + C.riddles[n - 1] + '”' }),
        btn
      ]));
    };
  }

  /* ---------------------------------------------------------------------
     Schermata "Apri il pacco n°X"
     --------------------------------------------------------------------- */
  function giftRenderer(n) {
    return function (root) {
      var G = C.gift;
      var boxSVG =
        '<svg viewBox="0 0 200 210" class="gift-svg" aria-hidden="true">' +
        '<defs><linearGradient id="gBox" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5e3e5"/><stop offset="1" stop-color="#d9a3ac"/></linearGradient>' +
        '<linearGradient id="gLid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8e9eb"/><stop offset="1" stop-color="#e0b0b8"/></linearGradient>' +
        '<radialGradient id="gGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".95"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></radialGradient></defs>' +
        '<ellipse class="gift-glow" cx="100" cy="92" rx="90" ry="60" fill="url(#gGlow)"/>' +
        '<ellipse cx="100" cy="200" rx="78" ry="8" fill="#6b1e2e" opacity=".12"/>' +
        '<g class="gift-body">' +
        '<rect x="30" y="92" width="140" height="106" rx="8" fill="url(#gBox)"/>' +
        '<rect x="90" y="92" width="20" height="106" fill="#6b1e2e"/>' +
        '<text x="62" y="160" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-weight="700" font-size="44" fill="#6b1e2e">' + n + '</text>' +
        '<text x="138" y="160" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-weight="700" font-size="44" fill="#6b1e2e">' + n + '</text>' +
        '</g>' +
        '<g class="gift-lid">' +
        '<rect x="22" y="70" width="156" height="28" rx="7" fill="url(#gLid)"/>' +
        '<rect x="90" y="70" width="20" height="28" fill="#7d2537"/>' +
        '<path d="M100 70 C 78 38, 46 44, 58 64 C 66 74, 88 72, 100 70 Z" fill="#7d2537"/>' +
        '<path d="M100 70 C 122 38, 154 44, 142 64 C 134 74, 112 72, 100 70 Z" fill="#7d2537"/>' +
        '<path d="M100 70 C 84 48, 64 50, 66 62" fill="none" stroke="#a8455a" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M100 70 C 116 48, 136 50, 134 62" fill="none" stroke="#a8455a" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M96 72 L84 98 L92 96 L96 104 Z M104 72 L116 98 L108 96 L104 104 Z" fill="#6b1e2e"/>' +
        '<circle cx="100" cy="69" r="7" fill="#5a1726"/>' +
        '</g></svg>';

      var box = U.el('button', { class: 'gift-box', type: 'button', html: boxSVG, 'aria-label': U.fmt(G.tapHint) });
      var tap = U.el('p', { class: 'skip-hint pulse', text: G.tapHint });
      var after = U.el('p', { class: 'gift-after script', text: G.afterOpen });
      var btn = U.confirmButton(G.button, G.confirm, function () {
        state.completed['gift' + n] = true; save(); next();
      });
      var btnWrap = U.el('div', { class: 'reveal-later' }, [btn]);
      var opened = false, timers = [];

      function open() {
        if (opened) return;
        opened = true;
        tap.classList.add('gone');
        var rm = U.reducedMotion();
        box.classList.add('shaking');
        timers.push(setTimeout(function () {
          box.classList.remove('shaking');
          box.classList.add('opened');
          if (!rm) U.confetti();
        }, rm ? 0 : 900));
        timers.push(setTimeout(function () {
          after.classList.add('show');
          btnWrap.classList.add('show');
        }, rm ? 200 : 1700));
      }
      box.addEventListener('click', open);
      // il bottone compare comunque dopo un po', per non bloccare mai
      timers.push(setTimeout(function () { btnWrap.classList.add('show'); }, 9000));

      root.appendChild(U.el('div', { class: 'card gift-card' }, [
        U.el('h2', { class: 'title', text: U.fmt(G.title, { n: n }) }),
        box, tap, after, btnWrap
      ]));
      return function () { timers.forEach(clearTimeout); };
    };
  }

  /* ---------------------------------------------------------------------
     Transizione scura verso il finale
     --------------------------------------------------------------------- */
  function renderFinale(root) {
    var F = C.finale;
    var l1 = U.el('p', { class: 'finale-line', text: F.line1 });
    var l2 = U.el('p', { class: 'finale-line small', text: F.line2 });
    var btn = U.el('button', { class: 'btn btn-play', type: 'button' }, [
      U.el('span', { class: 'btn-play-icon', html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>' }),
      U.el('span', { text: F.button })
    ]);
    var btnWrap = U.el('div', { class: 'reveal-later' }, [btn]);
    var rm = U.reducedMotion();
    var timers = [
      setTimeout(function () { l1.classList.add('show'); }, rm ? 0 : 500),
      setTimeout(function () { l2.classList.add('show'); }, rm ? 0 : 2300),
      setTimeout(function () { btnWrap.classList.add('show'); }, rm ? 0 : 3600)
    ];
    btn.addEventListener('click', function () {
      btn.disabled = true;
      // Questo tap è il gesto dell'utente che sblocca l'audio su iOS
      if (window.Player) Player.startFromGesture();
      state.completed.finale = true;
      next();
    });
    root.appendChild(U.el('div', { class: 'finale-wrap' }, [l1, l2, btnWrap]));
    return function () { timers.forEach(clearTimeout); };
  }

  function renderPlayer(root) {
    if (!window.Player) return;
    return Player.mount(root);
  }

  /* ---------------------------------------------------------------------
     Petali/cuori che fluttuano sullo sfondo
     --------------------------------------------------------------------- */
  function initPetals() {
    var box = document.getElementById('petals');
    if (!box || U.reducedMotion()) return;
    for (var i = 0; i < 9; i++) {
      var isHeart = i % 3 === 0;
      var p = U.el('span', { class: isHeart ? 'petal heart' : 'petal', html: isHeart ? U.heartSVG : '' });
      p.style.left = (5 + Math.random() * 90) + '%';
      p.style.animationDuration = (16 + Math.random() * 14) + 's';
      p.style.animationDelay = (-Math.random() * 30) + 's';
      var size = 10 + Math.random() * 10;
      p.style.width = size + 'px'; p.style.height = size + 'px';
      p.style.setProperty('--drift', ((Math.random() - 0.5) * 120) + 'px');
      box.appendChild(p);
    }
  }

  /* ---------------------------------------------------------------------
     Footer + reset segreto (5 tap rapidi sul cuore)
     --------------------------------------------------------------------- */
  function initFooter() {
    document.getElementById('footer-before').textContent = (C.footer && C.footer.before) || '';
    document.getElementById('footer-after').textContent = (C.footer && C.footer.after) || '';
    var heart = document.getElementById('footer-heart');
    var taps = [];
    heart.addEventListener('click', function () {
      var now = Date.now();
      taps = taps.filter(function (t) { return now - t < 2000; });
      taps.push(now);
      heart.classList.remove('beat'); void heart.offsetWidth; heart.classList.add('beat');
      if (taps.length >= 5) {
        taps = [];
        resetAll();
        U.toast('Progresso azzerato ↺');
        goTo('lock');
      }
    });
  }

  /* ---------------------------------------------------------------------
     Modalità debug (?debug=1): menu per saltare a qualsiasi schermata
     --------------------------------------------------------------------- */
  var debugPanel = null;
  function initDebug() {
    var toggle = U.el('button', { class: 'debug-toggle', type: 'button', text: '🐞', 'aria-label': 'Debug' });
    var list = U.el('div', { class: 'debug-list' });
    ORDER.forEach(function (name) {
      list.appendChild(U.el('button', {
        type: 'button', 'data-name': name, text: name,
        onclick: function () { sessionSet(SESSION_KEY, '1'); goTo(name); }
      }));
    });
    list.appendChild(U.el('button', {
      type: 'button', class: 'debug-reset', text: 'reset',
      onclick: function () { resetAll(); goTo('lock'); }
    }));
    debugPanel = U.el('div', { class: 'debug' }, [toggle, list]);
    toggle.addEventListener('click', function () { debugPanel.classList.toggle('open'); });
    document.body.appendChild(debugPanel);
  }
  function updateDebug() {
    if (!debugPanel) return;
    Array.prototype.forEach.call(debugPanel.querySelectorAll('[data-name]'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-name') === currentName);
    });
  }

  /* ---------------------------------------------------------------------
     Avvio
     --------------------------------------------------------------------- */
  function boot() {
    document.title = C.pageTitle || document.title;
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { params = { get: function () { return null; } }; }

    if (params.get('reset') === '1') {
      resetAll();
      try {
        params.delete('reset');
        var qs = params.toString();
        history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
      } catch (e) { /* niente */ }
    }
    if (params.get('debug') === '1') initDebug();

    initPetals();
    initFooter();

    var unlocked = sessionGet(SESSION_KEY) === '1';
    if (unlocked && state.screen && state.screen !== 'lock') goTo(state.screen, { instant: true });
    else goTo('lock', { instant: true });
  }

  window.App = { goTo: goTo, next: next, reset: resetAll };
  boot();
})();
