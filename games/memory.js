/* =========================================================================
   Gioco 2 — Memory
   ========================================================================= */
(function () {
  'use strict';
  window.Games = window.Games || {};

  Games.memory = {
    mount: function (root, ctx) {
      var U = window.U, M = window.CONFIG.memory;
      var pairs = M.pairs || 8;
      var deck = [];
      for (var i = 0; i < pairs; i++) deck.push(i, i);
      deck = U.shuffle(deck);

      var moves = 0, found = 0, first = null, lock = false, alive = true, timers = [];
      var movesEl = U.el('b', { text: '0' });
      var pairsEl = U.el('b', { text: '0/' + pairs });
      var grid = U.el('div', { class: 'm-grid' });
      var endPanel = U.el('div', { class: 'end-panel' });

      deck.forEach(function (id) {
        var src = U.fmt(M.photoPath, { i: id + 1 });
        var front = U.el('div', { class: 'm-face m-front' }, [U.img(src, 'Foto ' + (id + 1))]);
        var back = U.el('div', { class: 'm-face m-back', html: U.heartSVG });
        var card = U.el('button', { type: 'button', class: 'm-card', 'data-id': id, 'aria-label': 'Carta coperta' }, [
          U.el('div', { class: 'm-inner' }, [back, front])
        ]);
        grid.appendChild(card);
      });

      root.appendChild(U.el('div', { class: 'game-head' }, [
        U.el('h2', { class: 'title', text: M.title }),
        U.el('p', { class: 'subtitle', text: M.subtitle })
      ]));
      root.appendChild(U.el('div', { class: 'card m-card-wrap' }, [
        U.el('div', { class: 'stats' }, [
          U.el('span', null, [M.movesLabel + ' ', movesEl]),
          U.el('span', null, [M.pairsLabel + ' ', pairsEl])
        ]),
        grid,
        endPanel
      ]));

      function later(fn, ms) { timers.push(setTimeout(function () { if (alive) fn(); }, ms)); }

      grid.addEventListener('click', function (e) {
        var card = e.target.closest('.m-card');
        if (!card || lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
        card.classList.add('flipped');
        card.setAttribute('aria-label', 'Carta scoperta');
        if (!first) { first = card; return; }

        moves++;
        movesEl.textContent = moves;
        var a = first, b = card;
        first = null;
        if (a.getAttribute('data-id') === b.getAttribute('data-id')) {
          later(function () {
            a.classList.add('matched'); b.classList.add('matched');
            found++;
            pairsEl.textContent = found + '/' + pairs;
            if (found === pairs) finish();
          }, 450);
        } else {
          lock = true;
          later(function () {
            a.classList.remove('flipped'); b.classList.remove('flipped');
            a.setAttribute('aria-label', 'Carta coperta'); b.setAttribute('aria-label', 'Carta coperta');
            lock = false;
          }, 1000);
        }
      });

      function finish() {
        var text = '';
        var list = M.endMessages || [];
        for (var i = 0; i < list.length; i++) {
          if (moves <= list[i].maxMoves) { text = U.fmt(list[i].text, { moves: moves }); break; }
        }
        U.confetti();
        endPanel.innerHTML = '';
        endPanel.appendChild(U.el('h3', { class: 'end-title', text: M.endTitle }));
        endPanel.appendChild(U.el('p', { class: 'end-text', text: text }));
        var btn = U.el('button', { class: 'btn btn-primary', type: 'button', text: M.continueButton });
        btn.addEventListener('click', function () { btn.disabled = true; ctx.finish(); });
        endPanel.appendChild(btn);
        later(function () {
          endPanel.classList.add('show');
          try { endPanel.scrollIntoView({ behavior: U.reducedMotion() ? 'auto' : 'smooth', block: 'center' }); } catch (e) { /* niente */ }
        }, 700);
      }

      return function () { alive = false; timers.forEach(clearTimeout); };
    }
  };
})();
