/* ============================================================
   NEWSLETTER PAGE — local script (/newsletter/)
   The form itself is wired by shared/newsletter.js (loaded by
   shared/nav.js). This file only adds page-level polish:
     • re-runs the shared reveal/stagger engine after SPA nav
     • a tiny burst of teal "confetti" when signup succeeds
     • smooth-scrolls the final CTA back to the form
   Plain ES5, respects prefers-reduced-motion.
   ============================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Reveal / stagger on boot and after SPA navigation ---------- */
  function runMotion() {
    if (window.IEPmotion) {
      if (window.IEPmotion.reveals) window.IEPmotion.reveals();
      if (window.IEPmotion.stagger) window.IEPmotion.stagger();
    }
  }

  /* ---------- Success confetti ----------
     Watches the form for .nl-success (injected by newsletter.js) and
     fires one short particle burst from its centre. */
  function burst(x, y) {
    if (reduceMotion) return;
    var colors = ['#008080', '#00CED1', '#32CD32', '#1E90FF'];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 18; i++) {
      var p = document.createElement('span');
      p.className = 'nl-confetti';
      var angle = Math.random() * Math.PI * 2;
      var dist = 60 + Math.random() * 90;
      p.style.setProperty('--nx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--ny', (Math.sin(angle) * dist - 40) + 'px');
      p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      p.style.background = colors[i % colors.length];
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.animationDelay = (Math.random() * 90) + 'ms';
      frag.appendChild(p);
    }
    document.body.appendChild(frag);
    setTimeout(function () {
      var nodes = document.querySelectorAll('.nl-confetti');
      Array.prototype.forEach.call(nodes, function (n) { n.remove(); });
    }, 1400);
  }

  function watchForSuccess() {
    var form = document.querySelector('form[data-nl-form]');
    if (!form || form.dataset.nlPageWatched === '1') return;
    form.dataset.nlPageWatched = '1';

    var mo = new MutationObserver(function () {
      var ok = form.querySelector('.nl-success');
      if (!ok || form.dataset.nlBurst === '1') return;
      form.dataset.nlBurst = '1';
      var r = ok.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
    });
    mo.observe(form, { childList: true, subtree: true });
  }

  /* ---------- Inject confetti keyframes once ---------- */
  function injectConfettiCss() {
    if (document.getElementById('nl-confetti-css')) return;
    var s = document.createElement('style');
    s.id = 'nl-confetti-css';
    s.textContent =
      '.nl-confetti{position:fixed;width:8px;height:8px;border-radius:2px;' +
      'pointer-events:none;z-index:9999;transform:translate(-50%,-50%);' +
      'animation:nlConfetti 1.1s cubic-bezier(.2,.7,.2,1) both}' +
      '@keyframes nlConfetti{from{opacity:1;transform:translate(-50%,-50%) rotate(0)}' +
      'to{opacity:0;transform:translate(calc(-50% + var(--nx)),calc(-50% + var(--ny))) rotate(var(--rot))}}';
    document.head.appendChild(s);
  }

  /* ---------- Boot ---------- */
  function boot() {
    // Fresh DOM after an SPA navigation → reset the per-form burst flag.
    var form = document.querySelector('form[data-nl-form]');
    if (form) delete form.dataset.nlBurst;
    injectConfettiCss();
    watchForSuccess();
    runMotion();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('shim:content-loaded', boot);
})();
