/* ============================================================
   NAV — injects top nav + footer into every page
   No dependencies. Runs immediately when loaded.
   Only links to pages that currently exist.
   ============================================================ */

(function () {
  'use strict';

  /* ------------------------------------------------------------
     Logo SVG (inline — no external asset needed)
     ------------------------------------------------------------ */
  var LOGO_SVG =
    '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">' +
      '<circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M16 6 L16 26 M6 16 L26 16" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="16" cy="16" r="4" fill="currentColor"/>' +
    '</svg>';

  /* ============================================================
     NAV LINKS
     Add/remove entries here as you build new pages.
     ============================================================ */
  var NAV_LINKS = [
    { href: '../products/index.html',   label: 'Products',   key: 'products'   },
    { href: '../newsletter/index.html', label: 'Newsletter', key: 'newsletter' }
    // add more here later:
    // { href: '../resources/index.html', label: 'Resources', key: 'resources' },
    // { href: '../studio/index.html',    label: 'Studio',    key: 'studio'    },
    // { href: '../aboutus/index.html',   label: 'About',     key: 'aboutus'   },
    // { href: '../contact/index.html',   label: 'Contact',   key: 'contact'   },
  ];

  /* ============================================================
     FOOTER LINKS
     Keep separate from nav so footer can group differently.
     ============================================================ */
  var FOOTER_SITE_LINKS = [
    { href: '../home/index.html',       label: 'Home'       },
    { href: '../products/index.html',   label: 'Products'   },
    { href: '../newsletter/index.html', label: 'Newsletter' }
    // add more here later:
    // { href: '../resources/index.html', label: 'Resources' },
    // { href: '../studio/index.html',    label: 'Studio'    },
    // { href: '../aboutus/index.html',   label: 'About'     },
    // { href: '../contact/index.html',   label: 'Contact'   },
  ];

  /* ============================================================
     BUILD MARKUP
     ============================================================ */
  function buildNavLinks() {
    var out = '';
    for (var i = 0; i < NAV_LINKS.length; i++) {
      var l = NAV_LINKS[i];
      out += '<a href="' + l.href + '" data-nav="' + l.key + '">' +
             l.label +
             '</a>';
    }
    return out;
  }

  function buildFooterSiteLinks() {
    var out = '';
    for (var i = 0; i < FOOTER_SITE_LINKS.length; i++) {
      var l = FOOTER_SITE_LINKS[i];
      out += '<li><a href="' + l.href + '">' + l.label + '</a></li>';
    }
    return out;
  }

  var NAV_HTML =
    '<header class="nav">' +
      '<div class="nav__inner">' +
        '<a href="../home/index.html" class="nav__brand" aria-label="Innovation Earth Projects — home">' +
          '<span class="nav__mark">' + LOGO_SVG + '</span>' +
          '<span class="nav__wordmark">Innovation&nbsp;Earth</span>' +
        '</a>' +
        '<nav class="nav__links" id="primary-nav" aria-label="Primary">' +
          buildNavLinks() +
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

        /* Brand column */
        '<div class="footer__col">' +
          '<div class="footer__brand">' +
            '<span class="nav__mark">' + LOGO_SVG + '</span>' +
            '<span>Innovation Earth Projects</span>' +
          '</div>' +
          '<p class="footer__tagline">Tools for student builders. Built by students, for students.</p>' +
        '</div>' +

        /* Site column */
        '<div class="footer__col">' +
          '<h4>Site</h4>' +
          '<ul>' + buildFooterSiteLinks() + '</ul>' +
        '</div>' +

        /* Follow column */
        '<div class="footer__col">' +
          '<h4>Follow</h4>' +
          '<ul>' +
            '<li><a href="https://www.instagram.com/innovationearthprojects/" target="_blank" rel="noopener"><i class="fab fa-instagram"></i> Instagram</a></li>' +
            '<li><a href="https://youtube.com/@innovationearthprojects" target="_blank" rel="noopener"><i class="fab fa-youtube"></i> YouTube</a></li>' +
            '<li><a href="https://www.tiktok.com/@innovationearthprojects" target="_blank" rel="noopener"><i class="fab fa-tiktok"></i> TikTok</a></li>' +
          '</ul>' +
        '</div>' +

        /* Contact column */
        '<div class="footer__col">' +
          '<h4>Contact</h4>' +
          '<ul>' +
            '<li><a href="mailto:InnovationEarthProjects@gmail.com"><i class="fas fa-envelope"></i> Email us</a></li>' +
          '</ul>' +
        '</div>' +

      '</div>' +

      '<div class="container footer__bottom">' +
        '<span>&copy; <span id="footer-year"></span> Innovation Earth Projects LLC &middot; Utah, USA</span>' +
        '<span>Built by students.</span>' +
      '</div>' +
    '</footer>';

  /* ============================================================
     INJECTION
     ============================================================ */
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

  /* ============================================================
     ACTIVE LINK (based on <body data-page="...">)
     ============================================================ */
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

  /* ============================================================
     FOOTER YEAR
     ============================================================ */
  function setYear() {
    var el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ============================================================
     MOBILE MENU
     ============================================================ */
  function wireMobileToggle() {
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('primary-nav');
    if (!toggle || !links) return;

    function close() {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<i class="fas fa-bars"></i>';
    }

    function open() {
      links.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.innerHTML = '<i class="fas fa-times"></i>';
    }

    toggle.addEventListener('click', function () {
      if (links.classList.contains('is-open')) close();
      else open();
    });

    // Close when a nav link is clicked
    var anchors = links.querySelectorAll('a');
    for (var i = 0; i < anchors.length; i++) {
      anchors[i].addEventListener('click', close);
    }

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('is-open')) {
        close();
        toggle.focus();
      }
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!links.classList.contains('is-open')) return;
      if (links.contains(e.target) || toggle.contains(e.target)) return;
      close();
    });

    // Close when resizing to desktop width
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.innerWidth > 860 && links.classList.contains('is-open')) {
          close();
        }
      }, 150);
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    injectNav();
    injectFooter();
    setActiveLink();
    setYear();
    wireMobileToggle();
    console.log('✅ Nav + footer injected');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();