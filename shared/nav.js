/* ============================================================
   NAV — injects nav + footer, handles mobile toggle
   No dependencies. Runs immediately when loaded.
   ============================================================ */

(function () {
  'use strict';

  // ---------------------------------------------
  // SVG logo (inline so no external asset needed)
  // ---------------------------------------------
  var LOGO_SVG =
    '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">' +
      '<circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M16 6 L16 26 M6 16 L26 16" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="16" cy="16" r="4" fill="currentColor"/>' +
    '</svg>';

  // ---------------------------------------------
  // Markup
  // ---------------------------------------------
  var NAV_HTML =
    '<header class="nav">' +
      '<div class="nav__inner">' +
        '<a href="../home/index.html" class="nav__brand" aria-label="Innovation Earth Projects — home">' +
          '<span class="nav__mark">' + LOGO_SVG + '</span>' +
          '<span class="nav__wordmark">Innovation&nbsp;Earth</span>' +
        '</a>' +
        '<nav class="nav__links" id="primary-nav" aria-label="Primary">' +
          '<a href="../products/index.html" data-nav="products">Products</a>' +
          '<a href="../resources/index.html" data-nav="resources">Resources</a>' +
          '<a href="../studio/index.html" data-nav="studio">Studio</a>' +
          '<a href="../aboutus/index.html" data-nav="aboutus">About</a>' +
          '<a href="../contact/index.html" data-nav="contact">Contact</a>' +
        '</nav>' +
        '<a href="../products/index.html" class="btn btn--ghost nav__cta">' +
          'Open tools <i class="fas fa-arrow-right"></i>' +
        '</a>' +
        '<button class="nav__toggle" id="nav-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="primary-nav">' +
          '<i class="fas fa-bars"></i>' +
        '</button>' +
      '</div>' +
    '</header>';

  var FOOTER_HTML =
    '<footer class="footer">' +
      '<div class="container footer__inner">' +
        '<div class="footer__col">' +
          '<div class="footer__brand">' +
            '<span class="nav__mark">' + LOGO_SVG + '</span>' +
            '<span>Innovation Earth Projects</span>' +
          '</div>' +
          '<p class="footer__tagline">Free tools for student builders. Built by students, for students.</p>' +
        '</div>' +
        '<div class="footer__col">' +
          '<h4>Site</h4>' +
          '<ul>' +
            '<li><a href="../products/index.html">Products</a></li>' +
            '<li><a href="../resources/index.html">Resources</a></li>' +
            '<li><a href="../studio/index.html">Studio</a></li>' +
            '<li><a href="../aboutus/index.html">About</a></li>' +
            '<li><a href="../contact/index.html">Contact</a></li>' +
          '</ul>' +
        '</div>' +
        '<div class="footer__col">' +
          '<h4>Follow</h4>' +
          '<ul>' +
            '<li><a href="https://www.instagram.com/innovationearthprojects/" target="_blank" rel="noopener"><i class="fab fa-instagram"></i> Instagram</a></li>' +
            '<li><a href="https://youtube.com/@innovationearthprojects" target="_blank" rel="noopener"><i class="fab fa-youtube"></i> YouTube</a></li>' +
            '<li><a href="https://www.tiktok.com/@innovationearthprojects" target="_blank" rel="noopener"><i class="fab fa-tiktok"></i> TikTok</a></li>' +
          '</ul>' +
        '</div>' +
        '<div class="footer__col">' +
          '<h4>Contact</h4>' +
          '<ul>' +
            '<li><a href="mailto:InnovationEarthProjects@gmail.com"><i class="fas fa-envelope"></i> Email us</a></li>' +
            '<li><a href="../contact/index.html"><i class="fas fa-paper-plane"></i> Contact form</a></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
      '<div class="container footer__bottom">' +
        '<span>&copy; <span id="footer-year"></span> Innovation Earth Projects LLC &middot; Utah, USA</span>' +
        '<span>Built by students.</span>' +
      '</div>' +
    '</footer>';

  // ---------------------------------------------
  // Injection
  // ---------------------------------------------
  function injectNav() {
    var mount = document.getElementById('nav-mount');
    if (!mount) return;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = NAV_HTML;
    mount.parentNode.replaceChild(wrapper.firstChild, mount);
  }

  function injectFooter() {
    var mount = document.getElementById('footer-mount');
    if (!mount) return;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = FOOTER_HTML;
    mount.parentNode.replaceChild(wrapper.firstChild, mount);
  }

  // ---------------------------------------------
  // Active nav highlight (based on <body data-page>)
  // ---------------------------------------------
  function setActiveLink() {
    var page = document.body.getAttribute('data-page');
    if (!page) return;
    var links = document.querySelectorAll('[data-nav]');
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute('data-nav') === page) {
        links[i].classList.add('is-active');
        links[i].setAttribute('aria-current', 'page');
      }
    }
  }

  // ---------------------------------------------
  // Footer year
  // ---------------------------------------------
  function setYear() {
    var el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // ---------------------------------------------
  // Mobile menu toggle
  // ---------------------------------------------
  function wireMobileToggle() {
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('primary-nav');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.innerHTML = isOpen
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-bars"></i>';
    });

    // Close on link click
    var anchors = links.querySelectorAll('a');
    for (var i = 0; i < anchors.length; i++) {
      anchors[i].addEventListener('click', function () {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
      });
    }

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('is-open')) {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        toggle.focus();
      }
    });
  }

  // ---------------------------------------------
  // Boot immediately (no dependency on other scripts)
  // ---------------------------------------------
  function boot() {
    injectNav();
    injectFooter();
    setActiveLink();
    setYear();
    wireMobileToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();