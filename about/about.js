/* ============================================================
   ABOUT — scroll-reveal animations only
   (nav/footer/routing all come from shared/nav.js)
   ============================================================ */

(function () {
  'use strict';

  function initScrollReveals() {
    var reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      for (var i = 0; i < reveals.length; i++) reveals[i].classList.add('is-visible');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    for (var i = 0; i < reveals.length; i++) observer.observe(reveals[i]);
  }

  /* Run on first load and again after SPA navigation injects this page */
  function boot() { initScrollReveals(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.addEventListener('shim:content-loaded', boot);
})();
