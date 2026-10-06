/* ============================================================
   MOTION — shared micro-interaction engine (all pages)
   Plain ES5, no dependencies. Loaded on every page BEFORE the
   page-specific script so window.IEPmotion is available.

   Exposes:
     IEPmotion.reveals(root)      — .reveal elements fade in on scroll
     IEPmotion.stagger(root)      — cascade children of grids/sections
     IEPmotion.countUp(root)      — [data-countup] numbers animate up
     IEPmotion.tilt(root)         — subtle 3D tilt on cards
     IEPmotion.magnetic(el)       — magnetic hover for buttons
     IEPmotion.shimmer(root)      — gradient shimmer on .accent text
     IEPmotion.progress()         — top scroll-progress bar
     IEPmotion.backToTop()        — floating back-to-top button
     IEPmotion.ripple(root)       — click ripple on primary buttons
     IEPmotion.bootAll()          — run everything (idempotent)
   All effects respect prefers-reduced-motion automatically.
   ============================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;

  function hasIO() { return 'IntersectionObserver' in window; }

  /* ---------------- Scroll reveals ---------------- */
  function initReveals(root) {
    var scope = root || document;
    var reveals = scope.querySelectorAll('.reveal:not(.is-visible)');
    if (!reveals.length) return;
    if (reduceMotion || !hasIO()) {
      Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-visible'); });
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
    Array.prototype.forEach.call(reveals, function (el) { observer.observe(el); });
  }

  /* ---------------- Stagger cascades ----------------
     Adds .stagger-in to children of common grid containers when
     the container scrolls into view. Idempotent per element. */
  var STAGGER_SELECTORS = [
    '.grid-products', '.values-grid', '.work-grid', '.resource-preview',
    '.reasons', '.steps', '.changelog', '.faq', '.chips', '.social-list',
    '.contact-side', '.story-grid', '.timeline', '.about-facts'
  ].join(', ');

  function initStagger(root) {
    if (reduceMotion || !hasIO()) return;
    var scope = root || document;
    var groups = scope.querySelectorAll(STAGGER_SELECTORS);
    Array.prototype.forEach.call(groups, function (group) {
      if (group.dataset.staggered === '1') return;
      var kids = [];
      for (var i = 0; i < group.children.length; i++) {
        var kid = group.children[i];
        if (kid.nodeType !== 1) continue;
        if (kid.hasAttribute('hidden')) continue;
        kids.push(kid);
      }
      if (!kids.length) return;
      group.dataset.staggered = '1';
      kids.forEach(function (el, idx) {
        el.style.setProperty('--stagger-delay', Math.min(idx * 70, 560) + 'ms');
      });
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          kids.forEach(function (el) { el.classList.add('stagger-in'); });
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.1 });
      observer.observe(group);
    });
  }

  /* ---------------- Count-up numbers ----------------
     Usage: <span data-countup="4" data-suffix="">0</span> */
  function initCountUp(root) {
    var scope = root || document;
    var els = scope.querySelectorAll('[data-countup]');
    if (!els.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-countup')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion || !hasIO()) {
        el.textContent = target + suffix;
        return;
      }
      var dur = 900, t0 = null;
      function frame(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if (!hasIO()) {
      Array.prototype.forEach.call(els, run);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    Array.prototype.forEach.call(els, function (el) { observer.observe(el); });
  }

  /* ---------------- Card tilt ---------------- */
  function initTilt(root) {
    if (reduceMotion || isTouch) return;
    var scope = root || document;
    var cards = scope.querySelectorAll('.product-card, .value-card, .work-card, .resource-card, .side-card, .about-card');
    Array.prototype.forEach.call(cards, function (card) {
      if (card.dataset.tilted === '1') return;
      card.dataset.tilted = '1';
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var cx = rect.width / 2, cy = rect.height / 2;
        var rx = ((e.clientY - rect.top - cy) / cy) * -2.5;
        var ry = ((e.clientX - rect.left - cx) / cx) * 2.5;
        card.style.transform =
          'translateY(-4px) perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------------- Magnetic buttons ---------------- */
  function initMagnetic(scopeRoot) {
    if (reduceMotion || isTouch) return;
    var scope = scopeRoot || document;
    var btns = scope.querySelectorAll('.btn--primary, .btn--glow');
    Array.prototype.forEach.call(btns, function (btn) {
      if (btn.dataset.magnetized === '1') return;
      btn.dataset.magnetized = '1';
      btn.style.position = btn.style.position || 'relative';
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.22) + 'px, ' + (y * 0.22) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* ---------------- Accent shimmer ---------------- */
  function initShimmer(root) {
    if (reduceMotion) return;
    var scope = root || document;
    var accents = scope.querySelectorAll('h1 .accent, h2 .accent');
    Array.prototype.forEach.call(accents, function (a) {
      if (a.dataset.shimmered === '1') return;
      a.dataset.shimmered = '1';
      a.classList.add('accent-shimmer');
    });
  }

  /* ---------------- Scroll progress bar ---------------- */
  var progressDone = false;
  function initProgress() {
    if (reduceMotion || progressDone) return;
    progressDone = true;
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.style.cssText =
      'position:fixed;top:0;left:0;height:3px;width:0;' +
      'background:linear-gradient(90deg,#008080,#00CED1,#32CD32);' +
      'z-index:9999;pointer-events:none;transition:width 0.1s ease-out;';
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var scrollTop = window.pageYOffset;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------------- Back to top ---------------- */
  var bttDone = false;
  function initBackToTop() {
    if (bttDone) return;
    bttDone = true;
    var btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    btn.style.cssText =
      'position:fixed;bottom:24px;right:24px;width:48px;height:48px;border-radius:50%;' +
      'background:#008080;color:#fff;border:none;font-size:1rem;cursor:pointer;' +
      'box-shadow:0 8px 24px -8px rgba(0,128,128,0.5);opacity:0;visibility:hidden;' +
      'transition:opacity 0.25s ease,visibility 0.25s ease,transform 0.25s ease;' +
      'transform:translateY(12px);z-index:999;';
    document.body.appendChild(btn);
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    var ticking = false;
    function update() {
      var show = window.pageYOffset > 600;
      btn.style.opacity = show ? '1' : '0';
      btn.style.visibility = show ? 'visible' : 'hidden';
      btn.style.transform = show ? 'translateY(0)' : 'translateY(12px)';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
  }

  /* ---------------- Button ripple ---------------- */
  function initRipple(root) {
    if (reduceMotion) return;
    var scope = root || document;
    var btns = scope.querySelectorAll('.btn--primary');
    Array.prototype.forEach.call(btns, function (btn) {
      if (btn.dataset.rippled === '1') return;
      btn.dataset.rippled = '1';
      btn.style.position = btn.style.position || 'relative';
      btn.style.overflow = 'hidden';
      btn.addEventListener('click', function (e) {
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        var ripple = document.createElement('span');
        ripple.style.cssText =
          'position:absolute;border-radius:50%;background:rgba(255,255,255,0.5);' +
          'pointer-events:none;transform:scale(0);animation:iepRipple 0.6s ease-out;' +
          'width:' + size + 'px;height:' + size + 'px;' +
          'left:' + (e.clientX - rect.left - size / 2) + 'px;' +
          'top:' + (e.clientY - rect.top - size / 2) + 'px;';
        btn.appendChild(ripple);
        setTimeout(function () {
          if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
        }, 600);
      });
    });
    if (!document.getElementById('iep-ripple-keyframes')) {
      var style = document.createElement('style');
      style.id = 'iep-ripple-keyframes';
      style.textContent = '@keyframes iepRipple{to{transform:scale(2.5);opacity:0;}}';
      document.head.appendChild(style);
    }
  }

  /* ---------------- Boot everything ---------------- */
  function bootAll(root) {
    initReveals(root);
    initStagger(root);
    initCountUp(root);
    initTilt(root);
    initMagnetic(root);
    initShimmer(root);
    initRipple(root);
    initProgress();
    initBackToTop();
  }

  window.IEPmotion = {
    reduceMotion: reduceMotion,
    reveals: initReveals,
    stagger: initStagger,
    countUp: initCountUp,
    tilt: initTilt,
    magnetic: initMagnetic,
    shimmer: initShimmer,
    ripple: initRipple,
    progress: initProgress,
    backToTop: initBackToTop,
    bootAll: bootAll
  };

  /* Auto-boot after DOM ready and after SPA navigation injects content */
  function autoBoot() { bootAll(document); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoBoot);
  } else {
    autoBoot();
  }
  window.addEventListener('shim:content-loaded', autoBoot);
})();
