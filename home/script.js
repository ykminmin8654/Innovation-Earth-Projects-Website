/* ============================================================
   HOME — all behavior + animations in one file
   No Firebase. No external dependencies.
   ============================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;

  /* ============================================================
     SECTION 1 — CORE BEHAVIOR
     ============================================================ */

  /* ------------------------------------------------------------
     Scroll reveals — .reveal elements fade in as they enter view
     ------------------------------------------------------------ */
  function initScrollReveals() {
    var reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    if (!('IntersectionObserver' in window)) {
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

  /* ------------------------------------------------------------
     Smooth scroll for same-page anchors (#how-it-works)
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
        var navHeight = 64;
        var top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    }
  }

  /* ------------------------------------------------------------
     Featured products — loaded from the CMS-published content
     (Decap CMS markdown files in /products/data/). No hardcoded
     or placeholder products.

     IMPORTANT: Jekyll (GitHub Pages default build) EXCLUDES .md
     files from the published site, so fetching /products/data/*.md
     returns a 404 page on innovationearthprojects.org. The product
     files are read from the repo via the public GitHub Contents
     API instead (raw.githubusercontent.com for the file bodies).
     ------------------------------------------------------------ */
  var SITE_HOSTS = ['innovationearthprojects.org', 'www.innovationearthprojects.org'];
  // Cloudflare Worker feed (cached, CORS-enabled). Preferred source.
  var WORKER_PRODUCTS_URL = 'https://decap-proxy.ykminmin8654.workers.dev/products';
  var GH_API_DIR = 'https://api.github.com/repos/ykminmin8654/Innovation-Earth-Projects-Website/contents/products/data';
  var GH_RAW_BASE = 'https://raw.githubusercontent.com/ykminmin8654/Innovation-Earth-Projects-Website/main/products/data/';

  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Minimal YAML front-matter parser (the subset Decap CMS writes).
  // Works on the RAW file text — never rely on response.json().
  function parseFrontMatter(text) {
    var match = String(text).match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return {};
    var data = {};
    var currentListKey = null;
    match[1].split(/\r?\n/).forEach(function (rawLine) {
      var line = rawLine.replace(/\t/g, '  ');
      if (!line.trim() || line.trim().charAt(0) === '#') return;
      var listItem = line.match(/^\s+-\s+(.*)$/);
      if (listItem && currentListKey) {
        data[currentListKey].push(listItem[1].replace(/^["']|["']$/g, '').trim());
        return;
      }
      var kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
      if (!kv) return;
      var key = kv[1], val = kv[2].trim();
      if (val === '') { currentListKey = key; data[key] = []; }
      else if (val.charAt(0) === '[' && val.charAt(val.length - 1) === ']') {
        data[key] = val.slice(1, -1).split(',')
          .map(function (s) { return s.replace(/^["']|["']$/g, '').trim(); })
          .filter(Boolean);
        currentListKey = null;
      } else {
        data[key] = val.replace(/^["']|["']$/g, '').trim();
        currentListKey = null;
      }
    });
    return data;
  }

  function looksLikeProduct(fm) {
    return !!(fm && typeof fm.title === 'string' && fm.title.trim());
  }

  function fetchText(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }

  // List *.md filenames via the GitHub Contents API (public repo, no auth needed)
  function listProductFilesFromApi(cb) {
    fetchText(GH_API_DIR)
      .then(function (txt) { return JSON.parse(txt); })
      .then(function (entries) {
        if (!Array.isArray(entries)) return cb([]);
        cb(entries
          .filter(function (e) { return e && e.type === 'file' && /\.md$/i.test(e.name); })
          .map(function (e) { return e.name; }));
      })
      .catch(function () { cb([]); });
  }

  // Fetch one product file body and parse its front matter (null on failure)
  function fetchProductFile(file, cb) {
    fetchText(GH_RAW_BASE + encodeURIComponent(file))
      .then(function (text) {
        var fm = parseFrontMatter(text);
        cb(looksLikeProduct(fm) ? fm : null);
      })
      .catch(function () { cb(null); });
  }

  function loadProductsData(cb) {
    // Preferred: Cloudflare Worker feed — one cached JSON request.
    fetch(WORKER_PRODUCTS_URL, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        if (!Array.isArray(json)) throw new Error('bad payload');
        var items = json.filter(function (p) {
          return p && typeof p.title === 'string' && p.title.trim();
        });
        cb(items);
      })
      .catch(function () { loadProductsFallback(cb); });
  }

  function loadProductsFallback(cb) {
    var onCustomDomain = SITE_HOSTS.indexOf(window.location.hostname) !== -1;

    // On the live domain the static copies don't exist (Jekyll strips
    // .md), so use the API directly. Off-domain (local dev / preview)
    // try locally-served files first, then fall back to the API.
    if (onCustomDomain) {
      listProductFilesFromApi(function (files) { gather(files, true, cb); });
      return;
    }

    var localDir = 'products/data/';
    fetchText(localDir + 'manifest.json')
      .then(function (txt) {
        var json = JSON.parse(txt);
        return (json.files || [])
          .map(function (f) { return String(f).trim().replace(/\.md\/$/, '.md'); })
          .filter(function (f) { return /\.md$/i.test(f); });
      })
      .then(function (files) {
        if (files.length) { gather(files, false, cb); }
        else scrapeAndFallback(localDir, cb);
      })
      .catch(function () { scrapeAndFallback(localDir, cb); });
  }

  function scrapeAndFallback(localDir, cb) {
    fetchText(localDir)
      .then(function (html) {
        var re = /href="([^"?#]+\.md)"/gi, found = {}, m;
        while ((m = re.exec(html)) !== null) found[m[1]] = true;
        var files = Object.keys(found);
        if (files.length) gather(files, false, cb);
        else listProductFilesFromApi(function (apiFiles) { gather(apiFiles, true, cb); });
      })
      .catch(function () { listProductFilesFromApi(function (apiFiles) { gather(apiFiles, true, cb); }); });
  }

  function gather(files, fromApi, cb) {
    if (!files.length) { cb([]); return; }
    var results = [], remaining = files.length;
    files.forEach(function (f) {
      var done = function (item) {
        if (item) results.push(item);
        if (--remaining === 0) cb(results);
      };
      if (fromApi) {
        fetchProductFile(f, done);
      } else {
        fetchText('products/data/' + encodeURIComponent(f))
          .then(function (text) {
            var fm = parseFrontMatter(text);
            if (looksLikeProduct(fm)) { done(fm); }
            else { fetchProductFile(f, done); }   // fall back to API copy
          })
          .catch(function () { fetchProductFile(f, done); });
      }
    });
  }

  function initFeaturedProducts() {
    var mount = document.getElementById('featured-products');
    if (!mount) return;

    loadProductsData(function (items) {
      items.sort(function (a, b) {
        var ao = Number(a.order != null ? a.order : 999);
        var bo = Number(b.order != null ? b.order : 999);
        return ao - bo;
      });
      var featured = items.slice(0, 3);

      if (!featured.length) {
        mount.innerHTML =
          '<div class="featured-empty">' +
            '<i class="fas fa-toolbox"></i>' +
            '<h3>No tools published yet</h3>' +
            '<p>Everything on this page comes straight from our content ' +
            'manager. The first published product will appear here.</p>' +
          '</div>';
        return;
      }

      mount.innerHTML = featured.map(function (p, i) {
        var status = String(p.status || 'live').toLowerCase();
        var statusCls = (status === 'beta') ? 'beta' : (status.indexOf('soon') === 0 || status.indexOf('coming') === 0) ? 'soon' : 'live';
        var statusLabel = statusCls === 'beta' ? 'Beta' : statusCls === 'soon' ? 'Coming soon' : 'Live';
        var iconRaw = String(p.icon || 'fa-cube').trim();
        var icon = iconRaw.indexOf('fa-') === 0 ? iconRaw : 'fa-' + iconRaw;
        var url = p.url ? String(p.url).trim() : '';
        if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
        var tags = Array.isArray(p.tags) ? p.tags.slice(0, 3) : [];
        var tagsHtml = tags.length
          ? '<div class="product-card__tags">' + tags.map(function (t) {
              return '<span class="product-card__tag">' + esc(t) + '</span>';
            }).join('') + '</div>'
          : '';
        var linkHtml = url
          ? '<a class="product-card__link" href="' + esc(url) + '" target="_blank" rel="noopener">Open <i class="fas fa-arrow-right"></i></a>'
          : '<span class="product-card__link product-card__link--disabled">Coming soon</span>';

        return '' +
          '<article class="product-card reveal" data-delay="' + ((i + 1) * 100) + '">' +
            '<div class="product-card__top">' +
              '<span class="product-card__status product-card__status--' + statusCls + '">' + statusLabel + '</span>' +
              '<span class="product-card__free">Free</span>' +
            '</div>' +
            '<div class="product-card__icon"><i class="fas ' + esc(icon) + '"></i></div>' +
            '<h3 class="product-card__title">' + esc(p.title) + '</h3>' +
            '<p class="product-card__desc">' + esc(p.description || '') + '</p>' +
            tagsHtml +
            '<div class="product-card__footer">' +
              '<span class="product-card__meta">Free</span>' +
              linkHtml +
            '</div>' +
          '</article>';
      }).join('');

      // Re-run reveals + tilt for the newly injected cards
      initScrollReveals();
      initCardTilt();
    });
  }

  /* ------------------------------------------------------------
     Card tilt — subtle 3D rotation on product cards
     ------------------------------------------------------------ */
  function initCardTilt() {
    if (reduceMotion || isTouch) return;
    var cards = document.querySelectorAll('.product-card');
    if (!cards.length) return;

    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener('mousemove', function (e) {
          var rect = card.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;
          var cx = rect.width / 2;
          var cy = rect.height / 2;
          var rx = ((y - cy) / cy) * -3;
          var ry = ((x - cx) / cx) * 3;
          card.style.transform =
            'translateY(-4px) perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        });
        card.addEventListener('mouseleave', function () {
          card.style.transform = '';
        });
      })(cards[i]);
    }
  }

  /* ------------------------------------------------------------
     FAQ accordion — one open at a time
     ------------------------------------------------------------ */
  function initFaqAccordion() {
    var items = document.querySelectorAll('.faq__item');
    if (!items.length) return;

    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener('toggle', function () {
        if (!this.open) return;
        for (var j = 0; j < items.length; j++) {
          if (items[j] !== this && items[j].open) items[j].open = false;
        }
      });
    }
  }

  /* ------------------------------------------------------------
     Trust bar marquee — duplicate logos for seamless loop
     ------------------------------------------------------------ */
  function initTrustBarMarquee() {
    if (reduceMotion) return;
    var logos = document.querySelector('.trust-bar__logos');
    if (!logos) return;
    var original = logos.innerHTML;
    logos.innerHTML = original + original;
  }

  /* ------------------------------------------------------------
     Scroll progress bar — thin bar at top of viewport
     ------------------------------------------------------------ */
  function initScrollProgress() {
    if (reduceMotion) return;

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
     Back-to-top button
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

  /* ------------------------------------------------------------
     Button ripple on primary buttons
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
            'pointer-events:none;transform:scale(0);' +
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

    if (!document.getElementById('ripple-keyframes')) {
      var style = document.createElement('style');
      style.id = 'ripple-keyframes';
      style.textContent = '@keyframes rippleAnim{to{transform:scale(2.5);opacity:0;}}';
      document.head.appendChild(style);
    }
  }

  /* ============================================================
     SECTION 2 — EXTRA ANIMATIONS
     ============================================================ */

  /* ------------------------------------------------------------
     Text scramble on hero accent
     ------------------------------------------------------------ */
  function initTextScramble() {
    if (reduceMotion) return;
    var targets = document.querySelectorAll('.hero__title .accent');
    if (!targets.length) return;

    var chars = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    targets.forEach(function (el) {
      var finalText = el.textContent.trim();
      var queue = [];
      var frame = 0;
      var frameRequest = null;

      for (var i = 0; i < finalText.length; i++) {
        var start = Math.floor(Math.random() * 30);
        var end = start + Math.floor(Math.random() * 30);
        queue.push({
          to: finalText[i],
          start: start,
          end: end,
          char: null
        });
      }

      function update() {
        var output = '';
        var complete = 0;

        for (var i = 0; i < queue.length; i++) {
          var item = queue[i];
          if (frame >= item.end) {
            complete++;
            output += item.to;
          } else if (frame >= item.start) {
            if (!item.char || Math.random() < 0.28) {
              item.char = chars[Math.floor(Math.random() * chars.length)];
            }
            output += '<span style="opacity:0.7">' + item.char + '</span>';
          } else {
            output += '&nbsp;';
          }
        }

        el.innerHTML = output;

        if (complete === queue.length) {
          if (frameRequest) cancelAnimationFrame(frameRequest);
          return;
        }
        frame++;
        frameRequest = requestAnimationFrame(update);
      }

      setTimeout(update, 400);
    });
  }

  /* ------------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------------ */
  function initMagneticButtons() {
    if (reduceMotion || isTouch) return;
    var buttons = document.querySelectorAll('.btn--primary, .btn--glow');
    var strength = 0.25;

    buttons.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform =
          'translate(' + (x * strength) + 'px, ' + (y * strength) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------
     Cursor glow
     ------------------------------------------------------------ */
  function initCursorGlow() {
    if (reduceMotion || isTouch) return;

    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.style.cssText =
      'position:fixed;width:400px;height:400px;border-radius:50%;' +
      'pointer-events:none;z-index:1;' +
      'background:radial-gradient(circle,rgba(0,206,209,0.12) 0%,transparent 60%);' +
      'transform:translate(-50%,-50%);' +
      'transition:opacity 0.3s ease;opacity:0;will-change:transform;';
    document.body.appendChild(glow);

    var mouseX = 0, mouseY = 0, glowX = 0, glowY = 0, shown = false;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!shown) {
        glow.style.opacity = '1';
        shown = true;
        glowX = mouseX;
        glowY = mouseY;
      }
    });
    document.addEventListener('mouseleave', function () {
      glow.style.opacity = '0';
      shown = false;
    });

    function animate() {
      glowX += (mouseX - glowX) * 0.15;
      glowY += (mouseY - glowY) * 0.15;
      glow.style.left = glowX + 'px';
      glow.style.top = glowY + 'px';
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ------------------------------------------------------------
     Section stagger — children of each section cascade in
     ------------------------------------------------------------ */
  function initSectionStagger() {
    if (reduceMotion) return;
    if (!('IntersectionObserver' in window)) return;

    var sections = document.querySelectorAll('main .section');
    sections.forEach(function (section) {
      var targets = section.querySelectorAll(
        '.section__head, .product-card, .reason, .step, ' +
        '.changelog__item, .resource-card, .faq__item, .cta, .chips'
      );
      if (!targets.length) return;

      targets.forEach(function (el, i) {
        el.style.setProperty('--stagger-delay', (i * 60) + 'ms');
      });

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            targets.forEach(function (el) { el.classList.add('stagger-in'); });
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      observer.observe(section);
    });
  }

  /* ------------------------------------------------------------
     Parallax product cards
     ------------------------------------------------------------ */
  function initParallaxCards() {
    if (reduceMotion) return;
    var cards = document.querySelectorAll('.product-card');
    if (!cards.length) return;

    var ticking = false;
    function update() {
      var viewportH = window.innerHeight;
      cards.forEach(function (card, i) {
        var rect = card.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > viewportH + 100) return;
        var progress = (viewportH - rect.top) / (viewportH + rect.height);
        progress = Math.max(0, Math.min(1, progress));
        var offset = (progress - 0.5) * (10 + i * 4);
        card.style.setProperty('--parallax-offset', offset + 'px');
        card.style.transform = 'translateY(var(--parallax-offset))';
      });
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
     Particles — slow upward drift
     ------------------------------------------------------------ */
  function initParticles() {
    if (reduceMotion) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'particle-canvas';
    canvas.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.5;';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var particles = [];
    var count = 40;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var colors = ['rgba(0,206,209,', 'rgba(0,128,128,', 'rgba(50,205,50,'];

    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        vy: -(Math.random() * 0.3 + 0.1),
        vx: (Math.random() - 0.5) * 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.4 + 0.2
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ------------------------------------------------------------
     Chip shimmer
     ------------------------------------------------------------ */
  function initChipShimmer() {
    if (reduceMotion) return;
    var chips = document.querySelectorAll('.chip');
    if (!chips.length) return;

    chips.forEach(function (chip, i) {
      if (getComputedStyle(chip).position === 'static') {
        chip.style.position = 'relative';
      }
      chip.style.overflow = 'hidden';

      var sweep = document.createElement('span');
      sweep.className = 'chip-sweep';
      sweep.style.cssText =
        'position:absolute;top:0;left:-100%;width:100%;height:100%;' +
        'background:linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent);' +
        'pointer-events:none;';
      chip.appendChild(sweep);

      setInterval(function () {
        sweep.style.transition = 'left 0.8s ease';
        sweep.style.left = '100%';
        setTimeout(function () {
          sweep.style.transition = 'none';
          sweep.style.left = '-100%';
        }, 800);
      }, 4000 + i * 200 + Math.random() * 2000);
    });
  }

  /* ------------------------------------------------------------
     Changelog type-on effect for dates
     ------------------------------------------------------------ */
  function initChangelogType() {
    if (reduceMotion) return;
    if (!('IntersectionObserver' in window)) return;

    var dates = document.querySelectorAll('.changelog__date');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var text = el.textContent;
        el.textContent = '';
        el.style.opacity = '1';
        var i = 0;
        var timer = setInterval(function () {
          el.textContent += text[i];
          i++;
          if (i >= text.length) clearInterval(timer);
        }, 40);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    dates.forEach(function (d) {
      d.style.opacity = '0';
      observer.observe(d);
    });
  }

  /* ------------------------------------------------------------
     Step number flip
     ------------------------------------------------------------ */
  function initStepFlip() {
    if (reduceMotion) return;
    if (!('IntersectionObserver' in window)) return;

    var nums = document.querySelectorAll('.step__num');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('flip-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    nums.forEach(function (n) { observer.observe(n); });
  }

  /* ------------------------------------------------------------
     Footer icon drift
     ------------------------------------------------------------ */
  function initFooterIconDrift() {
    if (reduceMotion) return;
    var links = document.querySelectorAll('.footer__col a');
    links.forEach(function (link) {
      var icon = link.querySelector('i');
      if (!icon) return;
      link.addEventListener('mouseenter', function () {
        icon.style.transition = 'transform 0.4s cubic-bezier(.2,.7,.2,1)';
        icon.style.transform = 'translateX(3px) rotate(-8deg)';
      });
      link.addEventListener('mouseleave', function () {
        icon.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------
     Accent shimmer — gradient text animation
     ------------------------------------------------------------ */
  function initAccentShimmer() {
    if (reduceMotion) return;
    var accents = document.querySelectorAll('h2 .accent, h1 .accent');
    accents.forEach(function (a) {
      if (a.dataset.shimmered) return;
      a.dataset.shimmered = '1';
      a.classList.add('accent-shimmer');
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    // Core behavior
    initScrollReveals();
    initSmoothAnchors();
    initFeaturedProducts();
    initCardTilt();
    initFaqAccordion();
    initTrustBarMarquee();
    initScrollProgress();
    initBackToTop();
    initButtonRipple();

    // Extra animations
    initTextScramble();
    initMagneticButtons();
    initCursorGlow();
    initSectionStagger();
    initParallaxCards();
    initParticles();
    initChipShimmer();
    initChangelogType();
    initStepFlip();
    initFooterIconDrift();
    initAccentShimmer();

    console.log('✅ Home page ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();