/* ============================================================
   NEWSLETTER PAGE — local script (/newsletter/)
   The form itself is wired by shared/newsletter.js (loaded by
   shared/nav.js). This file only adds page-level polish:
     • one-shot "rise-in" entrance for the hero copy/visual
       (pure CSS animation — can never leave content stuck hidden,
       unlike scroll-observer reveals)
     • a tiny burst of teal "confetti" when signup succeeds
   Plain ES5, respects prefers-reduced-motion.

   Robustness notes:
     • The SPA router re-executes this file on every visit to
       /newsletter/, so everything here is guarded to run at most
       once per document and tears down its own listeners.
     • No IntersectionObserver / MutationObserver loops are kept
       alive after boot — the old stacked observers were what made
       animations freeze up during navigation.
   ============================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- One-shot entrance (never depends on JS observing) ----------
     Adds .nl-enter to the hero halves on load; the CSS animation plays
     once with `both` fill and ends fully visible even if it is interrupted. */
  function playEntrance() {
    if (reduceMotion) return; // CSS shows everything statically in that case
    var targets = document.querySelectorAll('.nl-hero__copy, .nl-hero__visual');
    Array.prototype.forEach.call(targets, function (el, i) {
      el.style.setProperty('--nl-enter-delay', (i * 120) + 'ms');
      el.classList.add('nl-enter');
    });
  }

  /* ---------- Success confetti ----------
     Watches the current form for .nl-success (injected by newsletter.js)
     and fires ONE short particle burst. Re-attaches after each SPA
     navigation but always disconnects the previous observer first. */
  var burstObserver = null;
  var burstFired = false;
  var confettiTimer = null;

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
    clearTimeout(confettiTimer);
    confettiTimer = setTimeout(function () {
      var nodes = document.querySelectorAll('.nl-confetti');
      Array.prototype.forEach.call(nodes, function (n) { n.remove(); });
    }, 1400);
  }

  function watchForSuccess() {
    // Tear down any observer left over from a previous visit.
    if (burstObserver) { burstObserver.disconnect(); burstObserver = null; }

    var form = document.querySelector('form[data-nl-form]');
    if (!form) return;

    // Already showing success (e.g. returning visitor via localStorage)?
    if (form.querySelector('.nl-success')) return;

    burstObserver = new MutationObserver(function () {
      var ok = form.querySelector('.nl-success');
      if (!ok) return;
      if (burstObserver) { burstObserver.disconnect(); burstObserver = null; }
      if (burstFired) return;
      burstFired = true;
      var r = ok.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
    });
    burstObserver.observe(form, { childList: true, subtree: true });
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

  /* ---------- Final CTA smooth scroll (no shared magnetic engine) ---------- */
  function wireTopButton() {
    var btn = document.getElementById('nl-top-btn');
    if (!btn || btn.dataset.wired === '1') return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', function () {
      var formEl = document.getElementById('iep-newsletter');
      if (!formEl) return;
      try {
        formEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      } catch (e) {
        formEl.scrollIntoView();
      }
      var input = formEl.querySelector('.nl-input');
      if (input && !formEl.querySelector('.nl-success')) {
        setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) {} }, reduceMotion ? 0 : 500);
      }
    });
  }

  /* ---------- Boot ----------
     Runs on DOMContentLoaded AND on shim:content-loaded (SPA nav into
     /newsletter/), but the entrance animation only plays once per
     document to avoid restarting mid-transition. */
  var entranceDone = false;

  function boot() {
    if (!entranceDone) {
      entranceDone = true;
      playEntrance();
    }
    injectConfettiCss();
    watchForSuccess();
    wireTopButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('shim:content-loaded', boot);
})();
