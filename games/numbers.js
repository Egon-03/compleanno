/* =========================================================================
   Gioco 3 — "Le caselle in ordine"
   ========================================================================= */
(function () {
  'use strict';
  window.Games = window.Games || {};

  function fmtTime(ms) {
    var tenths = Math.floor(ms / 100);
    var s = Math.floor(tenths / 10), m = Math.floor(s / 60);
    return (m > 0 ? m + ':' + String(s % 60).padStart(2, '0') : String(s)) + ',' + (tenths % 10);
  }
  function fmtLong(ms) {
    var s = ms / 1000;
    if (s < 60) return s.toFixed(1).replace('.', ',') + ' secondi';
    var m = Math.floor(s / 60), r = Math.round(s % 60);
    return m + (m === 1 ? ' minuto' : ' minuti') + ' e ' + r + ' secondi';
  }

  Games.numbers = {
    mount: function (root, ctx) {
      var U = window.U, N = window.CONFIG.numbers;
      var count = Math.max(4, N.count || 24);
      var nums = [];
      for (var i = 1; i <= count; i++) nums.push(i);
      nums = U.shuffle(nums);

      var expected = 1, started = false, startTime = 0, raf = 0, alive = true, timers = [];
      var timerEl = U.el('b', { class: 'n-timer', text: '0,0' });
      var nextEl = U.el('b', { text: '1' });
      var grid = U.el('div', { class: 'n-grid' });
      var endPanel = U.el('div', { class: 'end-panel' });

      nums.forEach(function (n) {
        var cell = U.el('button', { type: 'button', class: 'n-cell', 'data-n': n, 'aria-label': String(n) }, [
          U.el('span', { class: 'n-inside', html: U.heartSVG }),
          U.el('span', { class: 'n-door' }, [U.el('span', { class: 'n-num', text: String(n) }), U.el('i', { class: 'n-knob' })])
        ]);
        grid.appendChild(cell);
      });

      var startBtn = U.el('button', { class: 'btn btn-primary', type: 'button', text: N.startButton });
      var overlay = U.el('div', { class: 'n-overlay' }, [U.el('p', { text: N.startText }), startBtn]);

      root.appendChild(U.el('div', { class: 'game-head' }, [
        U.el('h2', { class: 'title', text: N.title }),
        U.el('p', { class: 'subtitle', text: U.fmt(N.subtitle, { n: count }) })
      ]));
      root.appendChild(U.el('div', { class: 'card n-card' }, [
        U.el('div', { class: 'stats' }, [
          U.el('span', null, ['⏱ ', timerEl]),
          U.el('span', null, [N.nextLabel + ' ', nextEl])
        ]),
        U.el('div', { class: 'n-stage' }, [grid, overlay]),
        endPanel
      ]));

      function tick() {
        timerEl.textContent = fmtTime(performance.now() - startTime);
        raf = requestAnimationFrame(tick);
      }

      startBtn.addEventListener('click', function () {
        overlay.classList.add('gone');
        started = true;
        startTime = performance.now();
        raf = requestAnimationFrame(tick);
      });

      grid.addEventListener('click', function (e) {
        var cell = e.target.closest('.n-cell');
        if (!cell || !started || cell.classList.contains('open')) return;
        var n = parseInt(cell.getAttribute('data-n'), 10);
        if (n === expected) {
          cell.classList.add('open');
          expected++;
          nextEl.textContent = expected <= count ? String(expected) : '✓';
          if (expected > count) finish();
        } else {
          cell.classList.remove('wrong'); void cell.offsetWidth; cell.classList.add('wrong');
          U.vibrate(60);
        }
      });

      function finish() {
        started = false;
        cancelAnimationFrame(raf);
        var total = performance.now() - startTime;
        timerEl.textContent = fmtTime(total);
        U.confetti();
        endPanel.innerHTML = '';
        endPanel.appendChild(U.el('h3', { class: 'end-title', text: N.endTitle }));
        endPanel.appendChild(U.el('p', { class: 'end-text', text: U.fmt(N.endMessage, { time: fmtLong(total) }) }));
        var btn = U.el('button', { class: 'btn btn-primary', type: 'button', text: N.continueButton });
        btn.addEventListener('click', function () { btn.disabled = true; ctx.finish(); });
        endPanel.appendChild(btn);
        timers.push(setTimeout(function () {
          if (!alive) return;
          endPanel.classList.add('show');
          try { endPanel.scrollIntoView({ behavior: U.reducedMotion() ? 'auto' : 'smooth', block: 'center' }); } catch (e) { /* niente */ }
        }, 700));
      }

      return function () { alive = false; cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
    }
  };
})();
