/* ============================================================
   NAV — nav + footer + clean-URL routing
   Binds click interception IMMEDIATELY so no clicks are missed.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1. CONFIG
     ============================================================ */

  var LOGO_SVG =
    '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">' +
      '<circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M16 6 L16 26 M6 16 L26 16" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="16" cy="16" r="4" fill="currentColor"/>' +
    '</svg>';

  /* NOTE: the Admin panel (/admin/) is intentionally NOT linked here.
     It must only be reachable by typing the URL directly. */
  var NAV_LINKS = [
    { href: '/products', label: 'Products', key: 'products' }
  ];

  var FOOTER_SITE_LINKS = [
    { href: '/home',     label: 'Home'     },
    { href: '/products', label: 'Products' }
  ];

  var SECTIONS = {
    'home':     '/home/index.html',
    'products': '/products/index.html'
  };

  /* ============================================================
     2. BUILD TEMPLATES
     ============================================================ */

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

  var NAV_HTML =
    '<header class="nav">' +
      '<div class="nav__inner">' +
        '<a href="/home" class="nav__brand" aria-label="Innovation Earth Projects — home">' +
          '<span class="nav__mark">' + LOGO_SVG + '</span>' +
          '<span class="nav__wordmark">Innovation&nbsp;Earth</span>' +
        '</a>' +
        '<nav class="nav__links" id="primary-nav" aria-label="Primary">' +
          buildNavLinks() +
        '</nav>' +
        '<a href="/products" class="btn btn--ghost nav__cta">' +
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

  /* ============================================================
     3. INJECTION
     ============================================================ */

  function injectNav() {
    var mount = document.getElementById('nav-mount');
    if (!mount) return;
    if (mount.nextElementSibling && mount.nextElementSibling.classList.contains('nav')) return;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = NAV_HTML;
    mount.parentNode.replaceChild(wrapper.firstChild, mount);
  }

  function injectFooter() {
    var mount = document.getElementById('footer-mount');
    if (!mount) return;
    if (mount.nextElementSibling && mount.nextElementSibling.classList.contains('footer')) return;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = FOOTER_HTML;
    mount.parentNode.replaceChild(wrapper.firstChild, mount);
  }

  /* ============================================================
     4. HELPERS
     ============================================================ */

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

  function setYear() {
    var el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  function wireMobileToggle() {
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('primary-nav');
    if (!toggle || !links) return;
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

  /* ============================================================
     5. CLEAN-URL ROUTING
     ============================================================ */

  function resolveCleanUrl(href) {
    if (!href || href.charAt(0) !== '/') return null;

    var clean = href.split('?')[0].split('#')[0];
    var segments = clean.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);

    if (segments.length === 0) return SECTIONS['home'];

    var section = segments[0].toLowerCase();
    if (!SECTIONS[section]) return null;

    var rest = segments.slice(1).join('/');
    if (rest && /\.\w+$/.test(rest)) {
      return '/' + section + '/' + rest;
    }

    return SECTIONS[section];
  }

  function loadPage(url, push) {
    return fetch(url, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');

        // <base> for relative assets
        var existingBase = document.head.querySelector('base[data-shim]');
        if (existingBase) existingBase.remove();
        var base = document.createElement('base');
        base.setAttribute('data-shim', '1');
        var folderMatch = url.match(/^(\/[^/]+\/)/);
        base.href = folderMatch ? folderMatch[1] : '/';
        document.head.appendChild(base);

        // Title
        if (doc.title) document.title = doc.title;

        // Styles
        document.head.querySelectorAll('[data-shim-style]').forEach(function (el) {
          el.remove();
        });
        doc.head.querySelectorAll('link[rel="stylesheet"], style').forEach(function (el) {
          var clone = el.cloneNode(true);
          clone.setAttribute('data-shim-style', '1');
          document.head.appendChild(clone);
        });

        // Body attrs
        Array.from(doc.body.attributes).forEach(function (attr) {
          document.body.setAttribute(attr.name, attr.value);
        });

        // Body content (without scripts)
        var newBody = doc.body.cloneNode(true);
        newBody.querySelectorAll('script').forEach(function (s) { s.remove(); });
        document.body.innerHTML = newBody.innerHTML;

        // Re-execute scripts
        doc.querySelectorAll('script').forEach(function (oldScript) {
          var newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach(function (attr) {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.textContent = oldScript.textContent;
          document.body.appendChild(newScript);
        });

        // URL bar — strip /index.html and trailing slash
        if (push) {
          var displayUrl = url
            .replace(/\/index\.html$/i, '')
            .replace(/\/$/, '');
          if (!displayUrl || displayUrl === '') displayUrl = '/home';
          history.pushState({ shim: true }, '', displayUrl);
        }

        window.dispatchEvent(new Event('shim:content-loaded'));
        window.scrollTo({ top: 0, behavior: 'instant' });
      })
      .catch(function (err) {
        console.error('Navigation failed:', err);
        window.location.href = url;
      });
  }

  /* ============================================================
     6. INTERCEPT CLICKS — bind IMMEDIATELY, not on DOMContentLoaded
     ============================================================ */

  document.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;

    var link = e.target.closest('a');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href) return;

    if (/^(#|mailto:|tel:|https?:)/i.test(href)) return;
    if (link.target === '_blank') return;
    if (href.indexOf('/admin') === 0) return;
    if (href.charAt(0) !== '/') return;

    // Skip any .html link unless it's an index.html — those we intercept
    if (/\.html?(?:\?|#|$)/i.test(href) && !/\/index\.html$/i.test(href)) {
      return;
    }

    var resolved = resolveCleanUrl(href);
    if (!resolved) return;

    e.preventDefault();
    console.log('🔗 Intercepting clean-URL navigation:', href, '→', resolved);
    loadPage(resolved, true);
  }, false);

  /* Back / forward */
  window.addEventListener('popstate', function () {
    var current = window.location.pathname + window.location.search;
    var resolved = resolveCleanUrl(current);
    if (resolved) {
      loadPage(resolved, false);
    } else if (current === '/' || current === '') {
      loadPage(SECTIONS['home'], false);
    }
  });

  /* ============================================================
     7. BOOT
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

  window.addEventListener('shim:content-loaded', boot);

})();