/* ============================================================
   HOME — animations, scroll reveals, counters, tilt, parallax
   No Firebase. No external dependencies.
   ============================================================ */

(function () {
  'use strict';

  /* ------------------------------------------------------------
     1. SCROLL REVEALS
     Adds .is-visible to elements with .reveal as they enter view
     ------------------------------------------------------------ */
  function initScrollReveals() {
    var reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    // Fallback for old browsers
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < reveals.length; i++) {
        reveals[i].classList.add('is-visible');
      }
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -60px 0px'
    });

    for (var i = 0; i < reveals.length; i++) {
      observer.observe(reveals[i]);
    }
  }

  /* ------------------------------------------------------------
     2. STAT COUNTERS
     Animates numbers in .stat__num[data-count] when scrolled into view
     ------------------------------------------------------------ */
  function initStatCounters() {
    var nums = document.querySelectorAll('.stat__num[data-count]');
    if (!nums.length) return;

    function animate(el) {
      var target = Number(el.dataset.count);
      if (isNaN(target) || target <= 0) {
        el.textContent = el.dataset.count;
        return;
      }

      var duration = 1600;
      var start = performance.now();

      function tick(now) {
        var progress = Math.min((now - start) / duration, 1);
        // easeOutCubic
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = target;
        }
      }
      requestAnimationFrame(tick);
    }

    // Fallback
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < nums.length; i++) animate(nums[i]);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    for (var i = 0; i < nums.length; i++) {
      observer.observe(nums[i]);
    }
  }

  /* ------------------------------------------------------------
     3. SMOOTH SCROLL FOR SAME-PAGE ANCHOR LINKS
     e.g. <a href="#how-it-works">
     ------------------------------------------------------------ */
  function initSmoothAnchors() {
    var anchors = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < anchors.length; i++) {
      anchors[i].addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (!href || href === '#') return;

        var id = href.slice(1);
        var target = document.getElementById(id);
        if (!target) return;

        e.preventDefault();
        var navHeight = 64; // matches --nav-h
        var top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;

        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    }
  }

  /* ------------------------------------------------------------
     4. CARD TILT ON HOVER
     Subtle 3D rotation following the cursor on product cards
     ------------------------------------------------------------ */
  function initCardTilt() {
    var cards = document.querySelectorAll('.product-card');
    if (!cards.length) return;

    // Skip on reduced-motion or touch devices
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;

    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener('mousemove', function (e) {
          var rect = card.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;
          var centerX = rect.width / 2;
          var centerY = rect.height / 2;
          var rotateX = ((y - centerY) / centerY) * -3;
          var rotateY = ((x - centerX) / centerX) * 3;
          card.style.transform =
            'translateY(-4px) perspective(800px) rotateX(' +
            rotateX + 'deg) rotateY(' + rotateY + 'deg)';
        });

        card.addEventListener('mouseleave', function () {
          card.style.transform = '';
        });
      })(cards[i]);
    }
  }

  /* ------------------------------------------------------------
     5. PARALLAX BACKGROUND ORBS
     Orbs drift slowly relative to scroll for depth
     ------------------------------------------------------------ */
  function initOrbParallax() {
    var orbs = document.querySelectorAll('.bg-orbs .orb');
    if (!orbs.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ticking = false;

    function update() {
      var y = window.pageYOffset;
      for (var i = 0; i < orbs.length; i++) {
        var speed = (i + 1) * 0.05;
        orbs[i].style.transform = 'translateY(' + (y * speed) + 'px)';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
  }

  /* ------------------------------------------------------------
     6. HERO PARALLAX
     Subtle rise of the mockup frame as you scroll past the hero
     ------------------------------------------------------------ */
  function initHeroParallax() {
    var frame = document.querySelector('.hero__frame');
    if (!frame) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ticking = false;

    function update() {
      var y = window.pageYOffset;
      // Only apply while hero is still visible
      if (y < 800) {
        frame.style.transform = 'translateY(' + (y * -0.05) + 'px)';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
  }

  /* ------------------------------------------------------------
     7. FAQ — close others when one opens (accordion behavior)
     ------------------------------------------------------------ */
  function initFaqAccordion() {
    var items = document.querySelectorAll('.faq__item');
    if (!items.length) return;

    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener('toggle', function () {
        if (!this.open) return;
        // Close all other open items
        for (var j = 0; j < items.length; j++) {
          if (items[j] !== this && items[j].open) {
            items[j].open = false;
          }
        }
      });
    }
  }

  /* ------------------------------------------------------------
     8. TRUST BAR MARQUEE
     Duplicate logos so the marquee wraps seamlessly
     ------------------------------------------------------------ */
  function initTrustBarMarquee() {
    var logos = document.querySelector('.trust-bar__logos');
    if (!logos) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Duplicate the child elements once so the animation loops smoothly
    var original = logos.innerHTML;
    logos.innerHTML = original + original;
  }

  /* ------------------------------------------------------------
     9. SCROLL PROGRESS BAR
     Injects a thin progress bar at the top of the viewport
     ------------------------------------------------------------ */
  function initScrollProgress() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.style.cssText =
      'position:fixed;top:0;left:0;height:3px;width:0;' +
      'background:linear-gradient(90deg,#008080,#00CED1,#32CD32);' +
      'z-index:9999;pointer-events:none;' +
      'transition:width 0.1s ease-out;';
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      var scrollTop = window.pageYOffset;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    update();
  }

  /* ------------------------------------------------------------
     10. BACK TO TOP BUTTON
     Appears after scrolling past 600px
     ------------------------------------------------------------ */
  function initBackToTop() {
    var btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    btn.style.cssText =
      'position:fixed;bottom:24px;right:24px;' +
      'width:48px;height:48px;border-radius:50%;' +
      'background:#008080;color:#fff;border:none;' +
      'font-size:1rem;cursor:pointer;' +
      'box-shadow:0 8px 24px -8px rgba(0,128,128,0.5);' +
      'opacity:0;visibility:hidden;' +
      'transition:opacity 0.25s ease,visibility 0.25s ease,transform 0.25s ease;' +
      'transform:translateY(12px);z-index:999;';
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    var ticking = false;
    function update() {
      var show = window.pageYOffset > 600;
      if (show) {
        btn.style.opacity = '1';
        btn.style.visibility = 'visible';
        btn.style.transform = 'translateY(0)';
      } else {
        btn.style.opacity = '0';
        btn.style.visibility = 'hidden';
        btn.style.transform = 'translateY(12px)';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
  }

  /* ------------------------------------------------------------
     11. BUTTON RIPPLE
     Material-style click ripple on .btn--primary
     ------------------------------------------------------------ */
  function initButtonRipple() {
    var buttons = document.querySelectorAll('.btn--primary');
    for (var i = 0; i < buttons.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function (e) {
          var rect = btn.getBoundingClientRect();
          var size = Math.max(rect.width, rect.height);
          var x = e.clientX - rect.left - size / 2;
          var y = e.clientY - rect.top - size / 2;

          var ripple = document.createElement('span');
          ripple.style.cssText =
            'position:absolute;border-radius:50%;' +
            'background:rgba(255,255,255,0.5);' +
            'pointer-events:none;' +
            'transform:scale(0);' +
            'animation:rippleAnim 0.6s ease-out;' +
            'width:' + size + 'px;height:' + size + 'px;' +
            'left:' + x + 'px;top:' + y + 'px;';

          btn.appendChild(ripple);
          setTimeout(function () {
            if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
          }, 600);
        });
      })(buttons[i]);
    }

    // Inject ripple keyframes once
    if (!document.getElementById('ripple-keyframes')) {
      var style = document.createElement('style');
      style.id = 'ripple-keyframes';
      style.textContent =
        '@keyframes rippleAnim{' +
          'to{transform:scale(2.5);opacity:0;}' +
        '}';
      document.head.appendChild(style);
    }
  }

  /* ------------------------------------------------------------
     12. EYEBROW DOT ANIMATION RESET
     Restarts the pulse animation every 4s so it stays noticeable
     ------------------------------------------------------------ */
  function initEyebrowPulse() {
    var dot = document.querySelector('.eyebrow__dot');
    if (!dot) return;
    setInterval(function () {
      dot.style.animation = 'none';
      // Force reflow
      void dot.offsetWidth;
      dot.style.animation = '';
    }, 4000);
  }

  /* ------------------------------------------------------------
     BOOT
     ------------------------------------------------------------ */
  function boot() {
    initScrollReveals();
    initStatCounters();
    initSmoothAnchors();
    initCardTilt();
    initOrbParallax();
    initHeroParallax();
    initFaqAccordion();
    initTrustBarMarquee();
    initScrollProgress();
    initBackToTop();
    initButtonRipple();
    initEyebrowPulse();

    console.log('✅ Home page ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();