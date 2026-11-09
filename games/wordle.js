/* =========================================================================
   Gioco 1 — "La parola nascosta"
   ========================================================================= */
(function () {
  'use strict';
  window.Games = window.Games || {};

  function clean(s) {
    return String(s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z]/g, '');
  }

  /* Valutazione con gestione corretta delle lettere doppie */
  function evaluate(guess, word) {
    var L = word.length, res = new Array(L), counts = {}, i;
    for (i = 0; i < L; i++) {
      if (guess[i] === word[i]) res[i] = 'correct';
      else { res[i] = 'absent'; counts[word[i]] = (counts[word[i]] || 0) + 1; }
    }
    for (i = 0; i < L; i++) {
      if (res[i] !== 'correct' && counts[guess[i]] > 0) { res[i] = 'present'; counts[guess[i]]--; }
    }
    return res;
  }

  var RANK = { absent: 1, present: 2, correct: 3 };

  Games.wordle = {
    evaluate: evaluate,
    mount: function (root, ctx) {
      var U = window.U, W = window.CONFIG.wordle;
      var word = clean(W.word), L = word.length, MAX = W.maxAttempts || 6;
      var data = ctx.load() || { guesses: [] };
      data.guesses = (data.guesses || []).filter(function (g) { return clean(g).length === L; }).slice(0, MAX);
      var current = '', busy = false, over = false, alive = true, timers = [];
      var keyEls = {}, keyState = {};
      var reduced = U.reducedMotion();

      /* --- costruzione interfaccia --- */
      var grid = U.el('div', { class: 'w-grid', style: '--cols:' + L, role: 'grid', 'aria-label': 'Griglia' });
      var rows = [];
      for (var r = 0; r < MAX; r++) {
        var row = U.el('div', { class: 'w-row', role: 'row' });
        var tiles = [];
        for (var c = 0; c < L; c++) {
          var t = U.el('div', { class: 'w-tile', role: 'gridcell' });
          row.appendChild(t); tiles.push(t);
        }
        grid.appendChild(row);
        rows.push({ el: row, tiles: tiles });
      }
      var hintBox = U.el('div', { class: 'w-hints', 'aria-live': 'polite' });
      var msg = U.el('p', { class: 'w-msg', 'aria-live': 'assertive' });
      var kb = U.el('div', { class: 'w-kb' });
      var layout = ['QWERTYUIOP', 'ASDFGHJKL', '>ZXCVBNM<'];
      layout.forEach(function (line) {
        var kr = U.el('div', { class: 'w-kb-row' });
        line.split('').forEach(function (k) {
          var label = k === '>' ? 'INVIO' : k === '<' ? '⌫' : k;
          var b = U.el('button', {
            type: 'button', class: 'w-key' + (k === '>' || k === '<' ? ' wide' : ''),
            'data-key': k, text: label, 'aria-label': k === '>' ? 'Invio' : k === '<' ? 'Cancella' : k
          });
          kr.appendChild(b);
          if (k !== '>' && k !== '<') keyEls[k] = b;
        });
        kb.appendChild(kr);
      });
      var endPanel = U.el('div', { class: 'end-panel' });

      root.appendChild(U.el('div', { class: 'game-head' }, [
        U.el('h2', { class: 'title', text: W.title }),
        U.el('p', { class: 'subtitle', text: U.fmt(W.subtitle, { len: L, max: MAX }) })
      ]));
      root.appendChild(U.el('div', { class: 'card w-card' }, [grid, msg, hintBox, kb, endPanel]));

      /* --- logica --- */
      function later(fn, ms) { timers.push(setTimeout(function () { if (alive) fn(); }, ms)); }

      function showMsg(text, ms) {
        msg.textContent = text;
        msg.classList.add('show');
        later(function () { msg.classList.remove('show'); }, ms || 1800);
      }

      function renderCurrent() {
        var row = rows[data.guesses.length];
        if (!row) return;
        row.tiles.forEach(function (t, i) {
          var ch = current[i] || '';
          if (t.textContent !== ch) {
            t.textContent = ch;
            t.classList.toggle('filled', !!ch);
            if (ch && !reduced) { t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); }
          }
        });
      }

      function paintKeys(guess, res) {
        for (var i = 0; i < L; i++) {
          var k = guess[i], s = res[i];
          if (!keyState[k] || RANK[s] > RANK[keyState[k]]) {
            keyState[k] = s;
            if (keyEls[k]) keyEls[k].setAttribute('data-state', s);
          }
        }
      }

      function updateHints() {
        var wrong = data.guesses.filter(function (g) { return g !== word; }).length;
        hintBox.innerHTML = '';
        (W.hints || []).forEach(function (h) {
          if (wrong >= h.after && !(data.guesses.indexOf(word) >= 0)) {
            hintBox.appendChild(U.el('p', { class: 'w-hint script', html: U.heartSVG + '<span></span>' }));
            hintBox.lastChild.querySelector('span').textContent = h.text;
          }
        });
      }

      function revealRow(rowIdx, guess, animate, done) {
        var res = evaluate(guess, word);
        var row = rows[rowIdx];
        var step = animate ? 300 : 0;
        row.tiles.forEach(function (t, i) {
          t.textContent = guess[i];
          t.classList.add('filled');
          if (!animate) { t.setAttribute('data-state', res[i]); return; }
          t.style.animationDelay = (i * step) + 'ms';
          t.classList.add('flip');
          later(function () { t.setAttribute('data-state', res[i]); }, i * step + 250);
        });
        var total = animate ? (L - 1) * step + 520 : 0;
        if (animate) later(function () { paintKeys(guess, res); done && done(res); }, total);
        else { paintKeys(guess, res); done && done(res); }
      }

      function checkEnd(animate) {
        var won = data.guesses.indexOf(word) >= 0;
        if (won) {
          over = true;
          if (animate) {
            var row = rows[data.guesses.indexOf(word)];
            row.tiles.forEach(function (t, i) { t.style.animationDelay = (i * 90) + 'ms'; t.classList.remove('flip'); t.classList.add('bounce'); });
            U.confetti();
          }
          showEnd(W.winTitle, W.winMessage);
        } else if (data.guesses.length >= MAX) {
          over = true;
          showEnd('', U.fmt(W.loseMessage, { word: word }));
        }
      }

      function showEnd(title, text) {
        kb.classList.add('done');
        endPanel.innerHTML = '';
        if (title) endPanel.appendChild(U.el('h3', { class: 'end-title', text: title }));
        endPanel.appendChild(U.el('p', { class: 'end-text', text: text }));
        var btn = U.el('button', { class: 'btn btn-primary', type: 'button', text: W.continueButton });
        btn.addEventListener('click', function () { btn.disabled = true; ctx.finish(); });
        endPanel.appendChild(btn);
        later(function () {
          endPanel.classList.add('show');
          try { endPanel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); } catch (e) { /* niente */ }
        }, 500);
      }

      function submit() {
        if (current.length < L) {
          showMsg(U.fmt(W.tooShort, { len: L }));
          var rowEl = rows[data.guesses.length].el;
          rowEl.classList.remove('shake'); void rowEl.offsetWidth; rowEl.classList.add('shake');
          U.vibrate(40);
          return;
        }
        busy = true;
        var guess = current, idx = data.guesses.length;
        data.guesses.push(guess);
        current = '';
        ctx.save(data);
        revealRow(idx, guess, !reduced, function () {
          busy = false;
          updateHints();
          checkEnd(true);
        });
      }

      function press(k) {
        if (busy || over) return;
        if (k === '>') return submit();
        if (k === '<') { current = current.slice(0, -1); return renderCurrent(); }
        if (/^[A-Z]$/.test(k) && current.length < L) { current += k; renderCurrent(); }
      }

      kb.addEventListener('click', function (e) {
        var b = e.target.closest('.w-key');
        if (b) press(b.getAttribute('data-key'));
      });
      function onKey(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.target && /input|textarea/i.test(e.target.tagName)) return;
        if (e.key === 'Enter') { e.preventDefault(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); press('>'); }
        else if (e.key === 'Backspace') { e.preventDefault(); press('<'); }
        else {
          var k = clean(e.key);
          if (k.length === 1 && e.key.length === 1) press(k);
        }
      }
      document.addEventListener('keydown', onKey);

      /* --- ripristino partita salvata --- */
      data.guesses.forEach(function (g, i) { revealRow(i, g, false); });
      updateHints();
      checkEnd(false);

      return function () {
        alive = false;
        timers.forEach(clearTimeout);
        document.removeEventListener('keydown', onKey);
      };
    }
  };
})();
