/* ============================================================
   NAV — injects top nav + footer into every page
   - Runs on initial page load
   - Re-runs when the 404 shim injects a page (shim:content-loaded)
   No dependencies. Self-contained.
   ============================================================ */

(function () {
  'use strict';

  /* ------------------------------------------------------------
     Logo SVG
     ------------------------------------------------------------ */
  var LOGO_SVG =
    '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">' +
      '<circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M16 6 L16 26 M6 16 L26 16" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="16" cy="16" r="4" fill="currentColor"/>' +
    '</svg>';

  /* ------------------------------------------------------------
     Nav links — add pages here as you build them
     ------------------------------------------------------------ */
  var NAV_LINKS = [
    { href: '../products/index.html',   label: 'Products',   key: 'products'   },
    { href: '../newsletter/index.html', label: 'Newsletter', key: 'newsletter' }
    // future:
    // { href: '../studio/index.html',    label: 'Studio',     key: 'studio'   },
    // { href: '../aboutus/index.html',   label: 'About',      key: 'aboutus'  },
    // { href: '../contact/index.html',   label: 'Contact',    key: 'contact'  }
  ];

  /* ------------------------------------------------------------
     Footer site links
     ------------------------------------------------------------ */
  var FOOTER_SITE_LINKS = [
    { href: '../home/index.html',       label: 'Home'       },
    { href: '../products/index.html',   label: 'Products'   },
    { href: '../newsletter/index.html', label: 'Newsletter' }
    // future:
    // { href: '../studio/index.html',    label: 'Studio'   },
    // { href: '../aboutus/index.html',   label: 'About'    },
    // { href: '../contact/index.html',   label: 'Contact'  }
  ];

  /* ------------------------------------------------------------
     Build link markup
     ------------------------------------------------------------ */
  function buildNavLinks() {
    var out = '';
    for (var i = 0; i < NAV_LINKS.length; i++) {
      var l = NAV_LINKS[i];
      out += '<a href="' + l.href + '" data-nav="' + l.key + '">' + l.label + '</a>';
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

  /* ------------------------------------------------------------
     Templates
     ------------------------------------------------------------ */
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

        '<div class="footer__col">' +
          '<div class="footer__brand">' +
            '<span class="nav__mark">' + LOGO_SVG + '</span>' +
            '<span>Innovation Earth Projects</span>' +
          '</div>' +
          '<p class="footer__tagline">Tools for student builders. Built by students, for students.</p>' +
        '</div>' +

        '<div class="footer__col">' +
          '<h4>Site</h4>' +
          '<ul>' + buildFooterSiteLinks() + '</ul>' +
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
          '</ul>' +
        '</div>' +

      '</div>' +

      '<div class="container footer__bottom">' +
        '<span>&copy; <span id="footer-year"></span> Innovation Earth Projects LLC &middot; Utah, USA</span>' +
        '<span>Built by students.</span>' +
      '</div>' +
    '</footer>';

  /* ------------------------------------------------------------
     Injection
     ------------------------------------------------------------ */
  function injectNav() {
    var mount = document.getElementById('nav-mount');
    if (!mount) return;

    // If the nav is already injected, don't inject again
    if (mount.nextElementSibling && mount.nextElementSibling.classList.contains('nav')) return;

    var wrapper = document.createElement('div');
    wrapper.innerHTML = NAV_HTML;
    mount.parentNode.replaceChild(wrapper.firstChild, mount);
  }

  function injectFooter() {
    var mount = document.getElementById('footer-mount');
    if (!mount) return;

    // If the footer is already injected, don't inject again
    if (mount.nextElementSibling && mount.nextElementSibling.classList.contains('footer')) return;

    var wrapper = document.createElement('div');
    wrapper.innerHTML = FOOTER_HTML;
    mount.parentNode.replaceChild(wrapper.firstChild, mount);
  }

  /* ------------------------------------------------------------
     Active link — based on <body data-page="...">
     ------------------------------------------------------------ */
  function setActiveLink() {
    var page = document.body.getAttribute('data-page');
    if (!page) return;
    var links = document.querySelectorAll('[data-nav]');
    for (var i = 0; i < links.length; i++) {
      links[i].classList.remove('is-active');
      links[i].removeAttribute('aria-current');
      if (links[i].getAttribute('data-nav') === page) {
        links[i].classList.add('is-active');
        links[i].setAttribute('aria-current', 'page');
      }
    }
  }

  /* ------------------------------------------------------------
     Footer year
     ------------------------------------------------------------ */
  function setYear() {
    var el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------
     Mobile menu toggle
     ------------------------------------------------------------ */
  function wireMobileToggle() {
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('primary-nav');
    if (!toggle || !links) return;

    // Prevent double-binding if the nav was re-injected
    if (toggle.dataset.wired === '1') return;
    toggle.dataset.wired = '1';

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

    var anchors = links.querySelectorAll('a');
    for (var i = 0; i < anchors.length; i++) {
      anchors[i].addEventListener('click', close);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('is-open')) {
        close();
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!links.classList.contains('is-open')) return;
      if (links.contains(e.target) || toggle.contains(e.target)) return;
      close();
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.innerWidth > 860 && links.classList.contains('is-open')) close();
      }, 150);
    });
  }

  /* ------------------------------------------------------------
     Boot
     ------------------------------------------------------------ */
  function boot() {
    injectNav();
    injectFooter();
    setActiveLink();
    setYear();
    wireMobileToggle();
    console.log('✅ Nav + footer injected');
  }

  /* ------------------------------------------------------------
     Run on initial page load
     ------------------------------------------------------------ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ------------------------------------------------------------
     Re-run when the 404 shim injects a page
     ------------------------------------------------------------ */
  window.addEventListener('shim:content-loaded', boot);

})();