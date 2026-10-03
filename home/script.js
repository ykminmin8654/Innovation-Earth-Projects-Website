/* ============================================================
   HOME — animations, scroll reveals, stat counters
   No Firebase dependency (all content is hardcoded in HTML)
   ============================================================ */

(function () {
  'use strict';

  // ------------------------------------------------------------
  // Scroll reveal via IntersectionObserver
  // ------------------------------------------------------------
  function initScrollReveals() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    // If IntersectionObserver isn't supported, show everything
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -60px 0px',
    });

    reveals.forEach(el => observer.observe(el));
  }

  // ------------------------------------------------------------
  // Stat counter animation
  // ------------------------------------------------------------
  function initStatCounters() {
    const nums = document.querySelectorAll('.stat__num[data-count]');
    if (!nums.length) return;

    const animate = (el) => {
      const target = Number(el.dataset.count);
      if (isNaN(target) || target <= 0) {
        el.textContent = el.dataset.count;
        return;
      }
      const duration = 1600;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = target;
        }
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) {
      nums.forEach(animate);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    nums.forEach(el => observer.observe(el));
  }

  // ------------------------------------------------------------
  // Smooth-scroll for same-page anchor links
  // ------------------------------------------------------------
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        if (!id) return;
        const el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // ------------------------------------------------------------
  // Card tilt on hover (subtle 3D)
  // ------------------------------------------------------------
  function initCardTilt() {
    const cards = document.querySelectorAll('.product-card');
    if (!cards.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return; // skip on touch

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -3;
        const rotateY = ((x - centerX) / centerX) * 3;
        card.style.transform = `translateY(-4px) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ------------------------------------------------------------
  // Parallax orbs on scroll
  // ------------------------------------------------------------
  function initOrbParallax() {
    const orbs = document.querySelectorAll('.bg-orbs .orb');
    if (!orbs.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        orbs.forEach((orb, i) => {
          const speed = (i + 1) * 0.05;
          orb.style.setProperty('--scroll-y', `${y * speed}px`);
          orb.style.translate = `0 ${y * speed}px`;
        });
        ticking = false;
      });
    }, { passive: true });
  }

  // ------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------
  function boot() {
    initScrollReveals();
    initStatCounters();
    initSmoothAnchors();
    initCardTilt();
    initOrbParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();