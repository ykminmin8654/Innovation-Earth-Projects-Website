/* ============================================================
   NAV — nav + footer + clean-URL routing
   Binds click interception IMMEDIATELY so no clicks are missed.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1. CONFIG
     ============================================================ */

  /* Site logo — transparent-background PNG from /images/logo.png
     (removebg version of the screenshot in images/). */
  var LOGO_IMG = '<img src="/images/logo.png" alt="" width="32" height="32" class="nav__logo-img" loading="lazy" />';

  /* NOTE: the Admin panel (/admin/) is intentionally NOT linked here.
     It must only be reachable by typing the URL directly. */
  var NAV_LINKS = [
    { href: '/about',      label: 'About',      key: 'about' },
    { href: '/products',   label: 'Products',   key: 'products' },
    { href: '/newsletter', label: 'Newsletter', key: 'newsletter' },
    { href: '/contact',    label: 'Contact',    key: 'contact' }
  ];

  var FOOTER_SITE_LINKS = [
    { href: '/home',       label: 'Home'       },
    { href: '/about',      label: 'About'      },
    { href: '/products',   label: 'Products'   },
    { href: '/contact',    label: 'Contact'    }
  ];

  /* NOTE: the footer intentionally contains NO newsletter content any more.
     The sign-up experience lives entirely on its own page at /newsletter/,
     reachable from the top navigation only. */

  var SECTIONS = {
    'home':       '/home/index.html',
    'about':      '/about/index.html',
    'products':   '/products/index.html',
    'contact':    '/contact/index.html',
    'newsletter': '/newsletter/index.html',
    'legal':      '/legal/index.html'
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
          '<span class="nav__mark">' + LOGO_IMG + '</span>' +
          '<span class="nav__wordmark">Innovation&nbsp;Earth</span>' +
        '</a>' +
        '<nav class="nav__links" id="primary-nav" aria-label="Primary">' +
          buildNavLinks() +
        '</nav>' +
        '<a href="/products" class="btn btn--ghost nav__cta shine">' +
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
            '<span class="nav__mark">' + LOGO_IMG + '</span>' +
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
        '<span class="footer__legal">' +
          '<a href="/legal/privacy">Privacy Policy</a>' +
          '<span aria-hidden="true"> &middot; </span>' +
          '<a href="/legal/tos">Terms of Service</a>' +
        '</span>' +
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

  function loadNewsletterScript() {
    // Wire up the sign-up form + Turnstile widget. Skipped inside /admin/.
    // The footer no longer contains any newsletter markup — shared/newsletter.js
    // is loaded ONLY on the /newsletter/ page itself, and EXACTLY ONCE per
    // document lifetime. IMPORTANT: this must never run again after the SPA
    // router has replaced the body (the router wipes all injected <script>
    // nodes when it swaps pages; re-appending a fresh tag would re-download
    // AND re-execute the file on every navigation, which is what previously
    // stacked Turnstile widgets and froze the tab). The one-time flag lives
    // on `window` (which survives body replacement), and shared/newsletter.js
    // self-wires to future shim:content-loaded events by itself.
    if (/^\/admin/i.test(window.location.pathname)) return;
    var onNlPage = /^\/newsletter(\/|$)/i.test(window.location.pathname) ||
                   document.body.getAttribute('data-page') === 'newsletter';
    if (!onNlPage) return;
    if (window.__iepNlScriptDone) return;   // already loaded once this session
    if (document.getElementById('iep-newsletter-script')) return;
    window.__iepNlScriptDone = true;        // set BEFORE append: never re-load
    var s = document.createElement('script');
    s.id = 'iep-newsletter-script';
    s.src = '/shared/newsletter.js?v=20261020a';
    document.body.appendChild(s);
  }

  function injectCookieBanner() {
    // Load shared/cookies.js once per page; it self-injects and handles
    // SPA re-navigation on its own. Skipped automatically inside /admin/.
    if (/^\/admin/i.test(window.location.pathname)) return;
    var existing = document.getElementById('iep-cookies-script');
    if (existing && existing.dataset.loaded === '1') return;
    if (!existing) {
      var s = document.createElement('script');
      s.id = 'iep-cookies-script';
      s.src = '/shared/cookies.js?v=20261019p';
      s.onload = function () { s.dataset.loaded = '1'; };
      document.body.appendChild(s);
    }
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

    // /legal/privacy and /legal/tos → the legal page with a ?doc= param so
    // the address bar keeps the clean URL and legal.js opens the right tab.
    if (section === 'legal' && segments.length === 2) {
      var docSeg = segments[1].toLowerCase().replace(/\.html?$/, '');
      if (/^privacy/.test(docSeg)) return '/legal/index.html?doc=privacy';
      if (docSeg === 'tos' || /^terms/.test(docSeg)) return '/legal/index.html?doc=tos';
    }

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
            .replace(/\/index\.html(?=\?|$)/i, '')
            .replace(/\/\?/, '?')   // "/legal/?doc=x" → "/?doc=x" handled below
            .replace(/\/$/, '');
          // /legal/index.html?doc=privacy|tos keeps the pretty path:
          // /legal/privacy or /legal/tos (no hash, no query in the address bar).
          var docMatch = url.match(/\/legal\/index\.html\?doc=(privacy|tos)$/i);
          if (docMatch) displayUrl = '/legal/' + docMatch[1].toLowerCase();
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

    // Hash deep-links (e.g. /legal/tos, /legal/privacy): let the browser do
    // a normal full navigation instead of SPA injection. The shim's loadPage
    // pushes the URL WITHOUT the hash and never fires hashchange, so both
    // footer legal links would render the identical default tab. A real page
    // load lets legal.js read location.hash and open the right document.
    var hashIdx = href.indexOf('#');
    if (hashIdx !== -1) {
      var wantHash = href.slice(hashIdx);
      var here = window.location.pathname + window.location.search;
      var targetPath = href.slice(0, hashIdx).replace(/\/index\.html$/i, '').replace(/\/$/, '') || '/home';
      if (here === targetPath || ('/' + here.replace(/^\/+/, '')) === ('/' + targetPath.replace(/^\/+/, ''))) {
        // Same page already loaded — just switch tabs via the hash.
        if (location.hash !== wantHash) {
          history.pushState(null, '', targetPath + wantHash);
          window.dispatchEvent(new Event('hashchange'));
        }
        e.preventDefault();
        return;
      }
      // Different page: full navigation (no preventDefault) so the hash
      // arrives with the fresh document and the 404 shim hard-redirects it.
      return;
    }

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
    loadNewsletterScript();
    injectCookieBanner();
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