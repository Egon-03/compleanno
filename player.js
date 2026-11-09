/* =========================================================================
   player.js — il player finale (tema scuro)
   ========================================================================= */
(function () {
  'use strict';

  var C = window.CONFIG, P = C.player, songs = C.songs || [];
  var STORE = 'perLalla2026_player';
  var audio = document.getElementById('audio');
  var FALLBACK_RGB = [107, 30, 46]; // bordeaux

  var ICONS = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5v13a1 1 0 0 0 1.53.85L16 13.2V18a1 1 0 0 0 2 0V6a1 1 0 0 0-2 0v4.8L6.53 4.65A1 1 0 0 0 5 5.5z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5.5v13a1 1 0 0 1-1.53.85L8 13.2V18a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v4.8l9.47-6.15A1 1 0 0 1 19 5.5z"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20.5l-1.2-1.1C6 15.1 3 12.4 3 8.9 3 6.2 5.1 4 7.8 4c1.6 0 3.1.8 4.2 2 1.1-1.2 2.6-2 4.2-2C18.9 4 21 6.2 21 8.9c0 3.5-3 6.2-7.8 10.5L12 20.5z"/></svg>',
    heartOn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5l-1.2-1.1C6 15.1 3 12.4 3 8.9 3 6.2 5.1 4 7.8 4c1.6 0 3.1.8 4.2 2 1.1-1.2 2.6-2 4.2-2C18.9 4 21 6.2 21 8.9c0 3.5-3 6.2-7.8 10.5L12 20.5z"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    volume: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
  };

  /* ---------- stato persistente ---------- */
  var st;
  function loadState() {
    var s;
    try { s = JSON.parse(window.localStorage.getItem(STORE) || 'null'); } catch (e) { s = null; }
    s = s && typeof s === 'object' ? s : {};
    return {
      index: (s.index >= 0 && s.index < songs.length) ? s.index : 0,
      shuffle: !!s.shuffle,
      repeat: ['off', 'all', 'one'].indexOf(s.repeat) >= 0 ? s.repeat : 'off',
      liked: s.liked || {},
      playlistLiked: !!s.playlistLiked,
      volume: typeof s.volume === 'number' ? s.volume : 1
    };
  }
  st = loadState();
  function saveState() { try { window.localStorage.setItem(STORE, JSON.stringify(st)); } catch (e) { /* niente */ } }

  /* ---------- runtime ---------- */
  var loadedIndex = -1;
  var order = [];
  var durations = songs.map(function (s) { return parseDur(s.duration); });
  var coverUrls = [];         // url risolti per brano
  var playlistCover = null;
  var lyrics = [], lyricIdx = -1;
  var errorShownFor = -1;
  var wantPlay = false;       // l'utente ha chiesto di suonare (per mostrare l'errore solo allora)
  var R = null;               // riferimenti DOM quando montato
  var dragging = false;

  function parseDur(d) {
    if (typeof d === 'number') return d;
    if (typeof d === 'string' && /^\d+:\d{1,2}$/.test(d)) { var p = d.split(':'); return +p[0] * 60 + +p[1]; }
    return null;
  }
  function fmt(sec) {
    if (sec == null || !isFinite(sec)) return '-:--';
    sec = Math.max(0, Math.floor(sec));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }
  function totalText() {
    var known = durations.filter(function (d) { return d != null && isFinite(d); });
    if (!known.length) return '';
    var t = Math.round(known.reduce(function (a, b) { return a + b; }, 0));
    var m = Math.floor(t / 60), s = t % 60;
    return (known.length < songs.length ? 'circa ' : '') + (m ? m + ' min ' : '') + s + ' s';
  }

  function buildOrder() {
    var idx = songs.map(function (_, i) { return i; });
    if (st.shuffle && window.U) {
      var rest = U.shuffle(idx.filter(function (i) { return i !== st.index; }));
      order = [st.index].concat(rest);
    } else order = idx;
  }
  buildOrder();

  function coverFor(i) {
    var s = songs[i] || {};
    return U.resolveImage([s.cover, P.cover], 'Brano ' + (i + 1), { dark: true, w: 600, h: 600 });
  }

  /* ---------- colore dominante della cover ---------- */
  var colorCache = {};
  function dominant(url) {
    if (colorCache[url]) return colorCache[url];
    colorCache[url] = new Promise(function (resolve) {
      if (!url || url.indexOf('data:') === 0) return resolve(FALLBACK_RGB);
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = c.height = 32;
          var x = c.getContext('2d');
          x.drawImage(img, 0, 0, 32, 32);
          var d = x.getImageData(0, 0, 32, 32).data;
          var r = 0, g = 0, b = 0, w = 0;
          for (var i = 0; i < d.length; i += 4) {
            var R_ = d[i], G = d[i + 1], B = d[i + 2];
            var max = Math.max(R_, G, B), min = Math.min(R_, G, B);
            var sat = max - min, lum = (max + min) / 2;
            if (lum < 18 || lum > 240) continue;
            var wt = 1 + sat / 24;
            r += R_ * wt; g += G * wt; b += B * wt; w += wt;
          }
          if (!w) return resolve(FALLBACK_RGB);
          var rgb = [r / w, g / w, b / w];
          var m = Math.max.apply(null, rgb);
          var k = m > 150 ? 150 / m : 1;     // scurisce per tenere leggibile il testo bianco
          resolve(rgb.map(function (v) { return Math.round(v * k); }));
        } catch (e) { resolve(FALLBACK_RGB); }
      };
      img.onerror = function () { resolve(FALLBACK_RGB); };
      img.src = url;
    });
    return colorCache[url];
  }

  /* ---------- caricamento e riproduzione ---------- */
  function loadTrack(i) {
    if (!songs[i]) return;
    st.index = i; saveState();
    loadedIndex = i;
    errorShownFor = -1;
    audio.src = songs[i].src;
    try { audio.load(); } catch (e) { /* niente */ }
    lyrics = []; lyricIdx = -1;
    updateAll();
    updateMediaSession();
    loadLyrics(i);
  }

  function play(i) {
    if (i != null && i !== loadedIndex) loadTrack(i);
    else if (loadedIndex < 0) loadTrack(st.index);
    else if (audio.error) { try { audio.load(); } catch (e) { /* niente */ } }
    wantPlay = true;
    errorShownFor = -1;
    var p;
    try { p = audio.play(); } catch (e) { onError(); return; }
    if (p && p.catch) p.catch(function (err) {
      if (err && err.name === 'AbortError') return;     // cambio brano durante il caricamento
      if (err && err.name === 'NotAllowedError') return; // serve un tap: l'utente premerà play
      onError();
    });
  }
  function pause() { wantPlay = false; audio.pause(); }
  function toggle() { if (audio.paused || loadedIndex < 0) play(); else pause(); }

  function posInOrder() { var p = order.indexOf(st.index); return p < 0 ? 0 : p; }
  function nextIdx(user) {
    var p = posInOrder();
    if (p + 1 < order.length) return order[p + 1];
    if (st.repeat === 'all' || user) { if (st.shuffle) { buildOrderFresh(); return order[0]; } return order[0]; }
    return null;
  }
  function buildOrderFresh() {
    var idx = songs.map(function (_, i) { return i; });
    var sh = U.shuffle(idx);
    if (sh.length > 1 && sh[0] === st.index) sh.push(sh.shift());
    order = sh;
  }
  function next(user) {
    var n = nextIdx(user);
    if (n == null) return;
    play(n);
  }
  function prev() {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    var p = posInOrder();
    var n = p > 0 ? order[p - 1] : order[order.length - 1];
    play(n);
  }

  function onError() {
    if (loadedIndex < 0 || !audio.getAttribute('src')) return;
    if (!wantPlay || errorShownFor === loadedIndex) return;
    errorShownFor = loadedIndex;
    U.toast(P.errorMessage, 4200);
    updateAll();
  }

  audio.addEventListener('play', updateAll);
  audio.addEventListener('pause', updateAll);
  audio.addEventListener('playing', function () { errorShownFor = -1; updateAll(); });
  audio.addEventListener('error', onError);
  audio.addEventListener('loadedmetadata', function () {
    if (loadedIndex >= 0 && isFinite(audio.duration)) { durations[loadedIndex] = audio.duration; updateAll(); }
  });
  audio.addEventListener('timeupdate', updateTime);
  audio.addEventListener('ended', function () {
    if (st.repeat === 'one') { audio.currentTime = 0; play(); return; }
    var n = nextIdx(false);
    if (n == null) { // fine playlist: torna all'inizio, in pausa
      audio.currentTime = 0;
      if (order[0] !== loadedIndex) loadTrack(order[0]);
      updateAll();
      return;
    }
    play(n);
  });

  /* Durate per la tracklist: lettura dei soli metadati (nessuna riproduzione) */
  function probeDurations() {
    songs.forEach(function (s, i) {
      if (durations[i] != null) return;
      try {
        var a = new Audio();
        a.preload = 'metadata';
        a.addEventListener('loadedmetadata', function () {
          if (isFinite(a.duration)) { durations[i] = a.duration; updateAll(); }
          a.removeAttribute('src');
        });
        a.addEventListener('error', function () { /* file mancante: resta "-:--" */ });
        a.src = s.src;
      } catch (e) { /* niente */ }
    });
  }

  /* ---------- testi .lrc ---------- */
  function parseLRC(text) {
    var out = [];
    String(text).split(/\r?\n/).forEach(function (line) {
      var re = /\[(\d{1,3}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g, m, times = [], last = 0;
      while ((m = re.exec(line))) { times.push(+m[1] * 60 + parseFloat(m[2].replace(':', '.'))); last = re.lastIndex; }
      if (!times.length) return;
      var txt = line.slice(last).trim();
      times.forEach(function (t) { out.push({ t: t, text: txt }); });
    });
    return out.sort(function (a, b) { return a.t - b.t; });
  }
  function loadLyrics(i) {
    var src = songs[i] && songs[i].lyrics;
    renderLyrics();
    if (!src || !window.fetch) return;
    fetch(src, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (t) {
        if (loadedIndex !== i || !t) return;
        lyrics = parseLRC(t);
        lyricIdx = -1;
        renderLyrics();
        updateTime();
      })
      .catch(function () { /* nessun testo: non mostrare nulla */ });
  }
  function renderLyrics() {
    if (!R) return;
    R.lyricsList.innerHTML = '';
    R.lyrics.hidden = !lyrics.length;
    lyrics.forEach(function (l, i) {
      var p = U.el('p', { class: 'ly-line', text: l.text || '♪' });
      p.addEventListener('click', function () { if (isFinite(audio.duration)) audio.currentTime = l.t; });
      R.lyricsList.appendChild(p);
    });
  }
  function updateLyrics() {
    if (!R || !lyrics.length) return;
    var t = audio.currentTime + 0.25, idx = -1;
    for (var i = 0; i < lyrics.length; i++) { if (lyrics[i].t <= t) idx = i; else break; }
    if (idx === lyricIdx) return;
    lyricIdx = idx;
    var lines = R.lyricsList.children;
    for (var j = 0; j < lines.length; j++) {
      lines[j].classList.toggle('on', j === idx);
      lines[j].classList.toggle('past', j < idx);
    }
    if (idx >= 0 && lines[idx]) {
      var box = R.lyricsList, el = lines[idx];
      var top = el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2;
      try { box.scrollTo({ top: top, behavior: U.reducedMotion() ? 'auto' : 'smooth' }); } catch (e) { box.scrollTop = top; }
    }
  }

  /* ---------- Media Session (schermata di blocco) ---------- */
  function updateMediaSession() {
    if (!('mediaSession' in navigator) || loadedIndex < 0) return;
    var s = songs[loadedIndex];
    coverFor(loadedIndex).then(function (url) {
      try {
        var art = [];
        if (url && url.indexOf('data:') !== 0) {
          var abs = new URL(url, window.location.href).href;
          art = [96, 192, 256, 512].map(function (n) { return { src: abs, sizes: n + 'x' + n, type: 'image/jpeg' }; });
        }
        navigator.mediaSession.metadata = new MediaMetadata({ title: s.title, artist: s.artist, album: P.playlistTitle, artwork: art });
      } catch (e) { /* niente */ }
    });
  }
  (function initMediaSession() {
    if (!('mediaSession' in navigator)) return;
    var h = {
      play: function () { play(); },
      pause: function () { pause(); },
      previoustrack: function () { prev(); },
      nexttrack: function () { next(true); },
      seekto: function (d) { if (d && d.seekTime != null) audio.currentTime = d.seekTime; }
    };
    Object.keys(h).forEach(function (k) { try { navigator.mediaSession.setActionHandler(k, h[k]); } catch (e) { /* non supportato */ } });
  })();
  function updatePositionState() {
    try {
      if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && isFinite(audio.duration) && audio.duration > 0) {
        navigator.mediaSession.setPositionState({ duration: audio.duration, playbackRate: audio.playbackRate || 1, position: Math.min(audio.currentTime, audio.duration) });
      }
    } catch (e) { /* niente */ }
  }

  /* ---------- UI ---------- */
  function iconBtn(cls, icon, label) {
    return U.el('button', { type: 'button', class: 'ic ' + cls, html: icon, 'aria-label': label });
  }

  function mount(root) {
    var playlistImg = U.el('img', { class: 'pl-cover', alt: '' });
    var bigPlay = iconBtn('pl-bigplay', ICONS.play, 'Riproduci');
    var plHeart = iconBtn('pl-heart', ICONS.heart, 'Mi piace');
    var plShuffle = iconBtn('pl-shuffle', ICONS.shuffle, 'Riproduzione casuale');
    var info = U.el('p', { class: 'pl-info' });
    var tracks = U.el('ol', { class: 'pl-tracks' });

    var page = U.el('div', { class: 'pl' }, [
      U.el('div', { class: 'pl-bg' }),
      U.el('div', { class: 'pl-topbar' }, [U.el('span', { class: 'pl-app', text: P.appName })]),
      U.el('div', { class: 'pl-hero' }, [
        U.el('div', { class: 'pl-cover-wrap' }, [playlistImg]),
        U.el('div', { class: 'pl-meta' }, [
          U.el('span', { class: 'pl-kind', text: P.playlistKind }),
          U.el('h1', { class: 'pl-title', text: P.playlistTitle }),
          P.description ? U.el('p', { class: 'pl-desc', text: P.description }) : null,
          info
        ])
      ]),
      U.el('div', { class: 'pl-actions' }, [plHeart, plShuffle, U.el('span', { class: 'spacer' }), bigPlay]),
      U.el('div', { class: 'pl-thead' }, [
        U.el('span', { text: '#' }), U.el('span', { text: 'Titolo' }), U.el('span', { class: 'pl-thead-dur', html: ICONS.clock })
      ]),
      tracks,
      U.el('p', { class: 'pl-closing script', text: P.closingMessage })
    ]);

    /* mini-player */
    var miniImg = U.el('img', { alt: '' });
    var miniTitle = U.el('span', { class: 'mini-title' });
    var miniArtist = U.el('span', { class: 'mini-artist' });
    var miniPlay = iconBtn('mini-play', ICONS.play, 'Riproduci');
    var miniFill = U.el('i');
    var mini = U.el('div', { class: 'mini', role: 'button', tabindex: '0', 'aria-label': 'Apri il player' }, [
      miniImg,
      U.el('div', { class: 'mini-text' }, [miniTitle, miniArtist]),
      miniPlay,
      U.el('div', { class: 'mini-progress' }, [miniFill])
    ]);

    /* player a schermo intero */
    var npImg = U.el('img', { class: 'np-cover', alt: '' });
    var npTitle = U.el('h2', { class: 'np-title' });
    var npArtist = U.el('p', { class: 'np-artist' });
    var npHeart = iconBtn('np-heart', ICONS.heart, 'Mi piace');
    var seekFill = U.el('div', { class: 'seek-fill' });
    var seekThumb = U.el('div', { class: 'seek-thumb' });
    var seek = U.el('div', { class: 'seek', role: 'slider', tabindex: '0', 'aria-label': 'Avanzamento', 'aria-valuemin': '0', 'aria-valuemax': '100' }, [
      U.el('div', { class: 'seek-track' }, [seekFill, seekThumb])
    ]);
    var tCur = U.el('span', { text: '0:00' }), tTot = U.el('span', { text: '-:--' });
    var bShuffle = iconBtn('np-shuffle', ICONS.shuffle, 'Riproduzione casuale');
    var bPrev = iconBtn('np-prev', ICONS.prev, 'Precedente');
    var bPlay = iconBtn('np-play', ICONS.play, 'Riproduci');
    var bNext = iconBtn('np-next', ICONS.next, 'Successivo');
    var bRepeat = iconBtn('np-repeat', ICONS.repeat + '<em class="rep-one">1</em>', 'Ripeti');
    var vol = U.el('input', { type: 'range', min: '0', max: '1', step: '0.01', class: 'vol-range', 'aria-label': 'Volume' });
    var lyricsList = U.el('div', { class: 'ly-list' });
    var lyricsBox = U.el('div', { class: 'ly', hidden: true }, [U.el('h3', { text: P.lyricsTitle }), lyricsList]);
    var npClose = iconBtn('np-close', ICONS.down, 'Chiudi');

    var np = U.el('div', { class: 'np', 'aria-hidden': 'true', role: 'dialog', 'aria-label': 'Player' }, [
      U.el('div', { class: 'np-bg' }),
      U.el('div', { class: 'np-inner' }, [
        U.el('div', { class: 'np-top' }, [
          npClose,
          U.el('div', { class: 'np-from' }, [U.el('small', { text: P.playingFrom }), U.el('b', { text: P.playlistTitle })]),
          U.el('span', { class: 'ic-spacer' })
        ]),
        U.el('div', { class: 'np-cover-wrap' }, [npImg]),
        U.el('div', { class: 'np-row' }, [U.el('div', { class: 'np-text' }, [npTitle, npArtist]), npHeart]),
        seek,
        U.el('div', { class: 'np-times' }, [tCur, tTot]),
        U.el('div', { class: 'np-controls' }, [bShuffle, bPrev, bPlay, bNext, bRepeat]),
        U.el('div', { class: 'np-volume' }, [U.el('span', { html: ICONS.volume }), vol]),
        lyricsBox
      ])
    ]);

    root.appendChild(page);
    root.appendChild(mini);
    root.appendChild(np);

    R = {
      root: root, page: page, playlistImg: playlistImg, bigPlay: bigPlay, plHeart: plHeart, plShuffle: plShuffle,
      info: info, tracks: tracks, mini: mini, miniImg: miniImg, miniTitle: miniTitle, miniArtist: miniArtist,
      miniPlay: miniPlay, miniFill: miniFill, np: np, npImg: npImg, npTitle: npTitle, npArtist: npArtist,
      npHeart: npHeart, seek: seek, seekFill: seekFill, seekThumb: seekThumb, tCur: tCur, tTot: tTot,
      bShuffle: bShuffle, bPlay: bPlay, bRepeat: bRepeat, vol: vol, lyrics: lyricsBox, lyricsList: lyricsList
    };

    /* tracklist */
    songs.forEach(function (s, i) {
      var li = U.el('li', { class: 'tr', 'data-i': i, tabindex: '0', role: 'button' }, [
        U.el('span', { class: 'tr-num' }, [
          U.el('span', { class: 'tr-n', text: String(i + 1) }),
          U.el('span', { class: 'eq', 'aria-hidden': 'true' }, [U.el('i'), U.el('i'), U.el('i')])
        ]),
        U.el('span', { class: 'tr-main' }, [U.el('span', { class: 'tr-title', text: s.title }), U.el('span', { class: 'tr-artist', text: s.artist })]),
        U.el('span', { class: 'tr-dur' })
      ]);
      li.addEventListener('click', function () {
        if (i === loadedIndex) toggle(); else { if (st.shuffle) { st.index = i; buildOrder(); } play(i); }
      });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter') li.click(); });
      tracks.appendChild(li);
    });

    /* cover e colori */
    U.resolveImage([P.cover, songs[0] && songs[0].cover], P.playlistTitle, { dark: true, w: 600, h: 600 }).then(function (url) {
      playlistCover = url;
      playlistImg.src = url;
      dominant(url).then(function (rgb) { page.style.setProperty('--dom', rgb.join(',')); });
    });
    songs.forEach(function (_, i) { coverFor(i).then(function (u) { coverUrls[i] = u; updateAll(); }); });

    /* eventi */
    bigPlay.addEventListener('click', function () {
      if (loadedIndex < 0 && st.shuffle) { buildOrderFresh(); play(order[0]); return; }
      toggle();
    });
    plHeart.addEventListener('click', function () { st.playlistLiked = !st.playlistLiked; saveState(); pop(plHeart); updateAll(); });
    var toggleShuffle = function () { st.shuffle = !st.shuffle; buildOrder(); saveState(); updateAll(); };
    plShuffle.addEventListener('click', toggleShuffle);
    bShuffle.addEventListener('click', toggleShuffle);
    bRepeat.addEventListener('click', function () {
      st.repeat = st.repeat === 'off' ? 'all' : st.repeat === 'all' ? 'one' : 'off';
      saveState(); updateAll();
    });
    bPlay.addEventListener('click', toggle);
    bPrev.addEventListener('click', prev);
    bNext.addEventListener('click', function () { next(true); });
    npHeart.addEventListener('click', function () {
      var k = String(st.index);
      st.liked[k] = !st.liked[k]; saveState(); pop(npHeart); updateAll();
    });
    miniPlay.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    mini.addEventListener('click', openNP);
    mini.addEventListener('keydown', function (e) { if (e.key === 'Enter') openNP(); });
    npClose.addEventListener('click', closeNP);

    vol.value = st.volume;
    audio.volume = st.volume;
    vol.addEventListener('input', function () { audio.volume = +vol.value; st.volume = +vol.value; saveState(); });

    /* barra di avanzamento trascinabile (mouse + touch) */
    var seekRatio = 0;
    function ratioFrom(e) {
      var r = seek.getBoundingClientRect();
      return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    }
    seek.addEventListener('pointerdown', function (e) {
      if (!isFinite(audio.duration)) return;
      dragging = true;
      seek.classList.add('drag');
      try { seek.setPointerCapture(e.pointerId); } catch (err) { /* niente */ }
      seekRatio = ratioFrom(e); paintSeek(seekRatio, seekRatio * audio.duration);
      e.preventDefault();
    });
    seek.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      seekRatio = ratioFrom(e); paintSeek(seekRatio, seekRatio * audio.duration);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      seek.classList.remove('drag');
      if (isFinite(audio.duration)) audio.currentTime = seekRatio * audio.duration;
    }
    seek.addEventListener('pointerup', endDrag);
    seek.addEventListener('pointercancel', endDrag);
    seek.addEventListener('keydown', function (e) {
      if (!isFinite(audio.duration)) return;
      if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
      if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
    });

    /* tastiera: spazio = play/pausa, Esc chiude */
    function onKey(e) {
      if (e.target && /input|textarea|select/i.test(e.target.tagName) && e.target.type !== 'range') return;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) document.activeElement.blur();
        toggle();
      } else if (e.key === 'Escape') closeNP();
    }
    document.addEventListener('keydown', onKey);

    buildOrder();
    if (loadedIndex < 0) {
      // nessun brano ancora caricato (es. riapertura del sito): prepara l'ultimo ascoltato
      loadedIndex = st.index;
      audio.src = songs[st.index] ? songs[st.index].src : '';
      updateMediaSession();
      loadLyrics(st.index);
    } else {
      renderLyrics();
    }
    probeDurations();
    updateAll();

    return function () {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('np-open');
      audio.pause();
      R = null;
    };
  }

  function pop(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }

  function openNP() {
    if (!R) return;
    R.np.classList.add('open');
    R.np.setAttribute('aria-hidden', 'false');
    document.body.classList.add('np-open');
    lyricIdx = -1; updateLyrics();
  }
  function closeNP() {
    if (!R) return;
    R.np.classList.remove('open');
    R.np.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('np-open');
  }

  function paintSeek(ratio, cur) {
    if (!R) return;
    var pct = (ratio * 100).toFixed(2) + '%';
    R.seekFill.style.width = pct;
    R.seekThumb.style.left = pct;
    R.seek.setAttribute('aria-valuenow', Math.round(ratio * 100));
    R.tCur.textContent = fmt(cur);
  }

  function updateTime() {
    if (!R) return;
    var d = audio.duration, c = audio.currentTime;
    var ratio = isFinite(d) && d > 0 ? c / d : 0;
    R.miniFill.style.width = (ratio * 100) + '%';
    if (!dragging) paintSeek(ratio, c);
    R.tTot.textContent = fmt(isFinite(d) ? d : durations[st.index]);
    updateLyrics();
    updatePositionState();
  }

  function updateAll() {
    if (!R) return;
    var i = loadedIndex >= 0 ? loadedIndex : st.index;
    var s = songs[i] || {};
    var playing = !audio.paused && loadedIndex >= 0;
    var playIcon = playing ? ICONS.pause : ICONS.play;
    var playLabel = playing ? 'Pausa' : 'Riproduci';
    [R.bigPlay, R.miniPlay, R.bPlay].forEach(function (b) {
      if (b.getAttribute('data-state') !== String(playing)) {
        b.innerHTML = playIcon; b.setAttribute('aria-label', playLabel); b.setAttribute('data-state', String(playing));
      }
    });
    R.root.classList.toggle('is-playing', playing);

    var cov = coverUrls[i];
    if (cov) {
      if (R.miniImg.getAttribute('src') !== cov) R.miniImg.src = cov;
      if (R.npImg.getAttribute('src') !== cov) {
        R.npImg.src = cov;
        dominant(cov).then(function (rgb) { if (R) R.np.style.setProperty('--dom', rgb.join(',')); });
      }
    }
    R.miniTitle.textContent = s.title || '';
    R.miniArtist.textContent = s.artist || '';
    R.npTitle.textContent = s.title || '';
    R.npArtist.textContent = s.artist || '';

    var liked = !!st.liked[String(i)];
    R.npHeart.innerHTML = liked ? ICONS.heartOn : ICONS.heart;
    R.npHeart.classList.toggle('on', liked);
    R.npHeart.setAttribute('aria-pressed', String(liked));
    R.plHeart.innerHTML = st.playlistLiked ? ICONS.heartOn : ICONS.heart;
    R.plHeart.classList.toggle('on', st.playlistLiked);
    R.plHeart.setAttribute('aria-pressed', String(st.playlistLiked));

    [R.plShuffle, R.bShuffle].forEach(function (b) { b.classList.toggle('on', st.shuffle); b.setAttribute('aria-pressed', String(st.shuffle)); });
    R.bRepeat.classList.toggle('on', st.repeat !== 'off');
    R.bRepeat.classList.toggle('one', st.repeat === 'one');
    R.bRepeat.setAttribute('aria-label', st.repeat === 'off' ? 'Ripeti: no' : st.repeat === 'all' ? 'Ripeti: tutta la playlist' : 'Ripeti: un brano');

    var tt = totalText();
    R.info.innerHTML = '';
    R.info.appendChild(U.el('b', { text: P.owner }));
    R.info.appendChild(document.createTextNode(' • ' + songs.length + (songs.length === 1 ? ' brano' : ' brani') + (tt ? ' • ' + tt : '')));

    Array.prototype.forEach.call(R.tracks.children, function (li, k) {
      li.classList.toggle('current', k === loadedIndex);
      li.classList.toggle('playing', k === loadedIndex && playing);
      li.querySelector('.tr-dur').textContent = fmt(durations[k]);
    });
    R.root.classList.toggle('has-error', errorShownFor === loadedIndex && loadedIndex >= 0);
    updateTime();
  }

  /* chiamato dal tap "Premi play" della transizione: è il gesto che sblocca l'audio su iOS */
  function startFromGesture() {
    loadTrack(st.shuffle ? (buildOrderFresh(), order[0]) : 0);
    play();
  }

  function stop() {
    try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch (e) { /* niente */ }
    loadedIndex = -1;
    st = loadState();
    buildOrder();
  }

  window.Player = { mount: mount, startFromGesture: startFromGesture, stop: stop, parseLRC: parseLRC };
})();
