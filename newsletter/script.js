/* ============================================================
   NEWSLETTER — posts loaded from posts.json (built from Markdown)
   Post cards link to ./post.html?id=<slug>
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1. STATE
     ============================================================ */
  var ALL_POSTS = [];
  var activeFilter = 'all';
  var activeSearch = '';
  var featuredPostEl = null;
  var postsGridEl = null;

  /* ============================================================
     2. UTILITIES
     ============================================================ */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(dateStr) {
    try {
      var d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  function categoryLabel(cat) {
    if (cat === 'research') return 'Research';
    if (cat === 'product')  return 'Product';
    if (cat === 'studio')   return 'Studio';
    return 'Post';
  }

  function postUrl(post) {
    return './post.html?id=' + encodeURIComponent(post.id || '');
  }

  /* ============================================================
     3. LOAD POSTS
     ============================================================ */
  function loadPosts() {
    return fetch('./posts.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      });
  }

  /* ============================================================
     4. FILTERING
     ============================================================ */
  function getVisiblePosts() {
    var list = ALL_POSTS.slice();

    if (activeFilter !== 'all') {
      list = list.filter(function (p) { return p.category === activeFilter; });
    }

    if (activeSearch) {
      var q = activeSearch.toLowerCase();
      list = list.filter(function (p) {
        var haystack = [
          p.title || '',
          p.excerpt || '',
          p.category || ''
        ].join(' ').toLowerCase();
        return haystack.indexOf(q) !== -1;
      });
    }

    return list;
  }

  /* ============================================================
     5. RENDER
     ============================================================ */
  function renderFeatured() {
    if (!featuredPostEl) return;

    if (activeFilter !== 'all' || activeSearch) {
      featuredPostEl.innerHTML = '';
      return;
    }

    var featured = null;
    for (var i = 0; i < ALL_POSTS.length; i++) {
      if (ALL_POSTS[i].featured) { featured = ALL_POSTS[i]; break; }
    }
    if (!featured) {
      featuredPostEl.innerHTML = '';
      return;
    }

    var cat = featured.category;
    var icon = featured.icon || 'fa-star';
    var dateStr = formatDate(featured.date);

    featuredPostEl.innerHTML =
      '<a class="featured__card" href="' + postUrl(featured) + '">' +
        '<div class="featured__visual">' +
          '<i class="fas ' + escapeHtml(icon) + '"></i>' +
        '</div>' +
        '<div class="featured__body">' +
          '<div class="featured__meta">' +
            '<span class="featured__badge featured__badge--' + escapeHtml(cat) + '">' +
              '<span class="dot dot--' + escapeHtml(cat) + '"></span>' +
              categoryLabel(cat) +
            '</span>' +
            '<span>' + escapeHtml(dateStr) + '</span>' +
            '<span>·</span>' +
            '<span>' + escapeHtml(featured.readTime || '') + '</span>' +
          '</div>' +
          '<h2 class="featured__title">' + escapeHtml(featured.title) + '</h2>' +
          '<p class="featured__excerpt">' + escapeHtml(featured.excerpt) + '</p>' +
          '<span class="featured__cta">Read post <i class="fas fa-arrow-right"></i></span>' +
        '</div>' +
      '</a>';
  }

  function renderPosts() {
    if (!postsGridEl) return;

    var list = getVisiblePosts();

    if (activeFilter === 'all' && !activeSearch) {
      list = list.filter(function (p) { return !p.featured; });
    }

    if (!list.length) {
      var isEmpty = ALL_POSTS.length === 0;
      postsGridEl.innerHTML =
        '<div class="newsletter-empty">' +
          '<i class="fas fa-' + (isEmpty ? 'inbox' : 'search') + '"></i>' +
          '<h3>' + (isEmpty ? 'No posts yet' :
            activeSearch ? 'No results' : 'No posts here') + '</h3>' +
          '<p>' + (isEmpty
            ? 'Check back soon — we\'re working on our first post.'
            : activeSearch
              ? 'Nothing matches "' + escapeHtml(activeSearch) + '". Try a different search.'
              : 'Try a different filter.') + '</p>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var cat = p.category;
      var dateStr = formatDate(p.date);

      html +=
        '<a class="post" href="' + postUrl(p) + '">' +
          '<div class="post__meta">' +
            '<span class="post__badge post__badge--' + escapeHtml(cat) + '">' +
              '<span class="dot dot--' + escapeHtml(cat) + '"></span>' +
              categoryLabel(cat) +
            '</span>' +
            '<span>' + escapeHtml(dateStr) + '</span>' +
          '</div>' +
          '<h3 class="post__title">' + escapeHtml(p.title) + '</h3>' +
          '<p class="post__excerpt">' + escapeHtml(p.excerpt) + '</p>' +
          '<div class="post__footer">' +
            '<span class="post__read">' + escapeHtml(p.readTime || '') + '</span>' +
            '<span class="post__arrow"><i class="fas fa-arrow-right"></i></span>' +
          '</div>' +
        '</a>';
    }
    postsGridEl.innerHTML = html;
  }

  function updateCounts() {
    var counts = { all: 0, research: 0, product: 0, studio: 0 };
    for (var i = 0; i < ALL_POSTS.length; i++) {
      var c = ALL_POSTS[i].category;
      counts.all++;
      if (counts[c] != null) counts[c]++;
    }
    var els = document.querySelectorAll('[data-count]');
    for (var j = 0; j < els.length; j++) {
      var key = els[j].getAttribute('data-count');
      els[j].textContent = counts[key] != null ? counts[key] : 0;
    }
  }

  function refresh() {
    renderFeatured();
    renderPosts();
  }

  /* ============================================================
     6. TABS
     ============================================================ */
  function wireTabs() {
    var tabs = document.querySelectorAll('#newsletter-tabs .tab');
    for (var i = 0; i < tabs.length; i++) {
      (function (tab) {
        tab.addEventListener('click', function () {
          for (var j = 0; j < tabs.length; j++) {
            tabs[j].classList.remove('tab--active');
          }
          tab.classList.add('tab--active');
          activeFilter = tab.getAttribute('data-filter') || 'all';
          refresh();
        });
      })(tabs[i]);
    }
  }

  /* ============================================================
     7. SEARCH
     ============================================================ */
  function wireSearch() {
    var input = document.getElementById('newsletter-search');
    var clearBtn = document.getElementById('newsletter-search-clear');
    if (!input) return;

    var debounceTimer;

    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        activeSearch = input.value.trim();
        if (clearBtn) clearBtn.hidden = !activeSearch;
        refresh();
      }, 120);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        input.value = '';
        activeSearch = '';
        clearBtn.hidden = true;
        refresh();
        input.focus();
      });
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && input.value) {
        input.value = '';
        activeSearch = '';
        if (clearBtn) clearBtn.hidden = true;
        refresh();
      }
    });
  }

  /* ============================================================
     8. SUBSCRIBE + TURNSTILE
     ============================================================ */
  function wireSubscribe() {
    var form = document.getElementById('subscribe-form');
    var input = document.getElementById('subscribe-email');
    var note = document.getElementById('subscribe-note');
    if (!form || !input || !note) return;

    function resetTurnstile() {
      if (typeof turnstile !== 'undefined') {
        try { turnstile.reset(); } catch (e) { /* ignore */ }
      }
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var email = input.value.trim();

      input.classList.remove('is-error');
      note.classList.remove('is-success', 'is-error');
      note.textContent = '';

      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) {
        input.classList.add('is-error');
        note.classList.add('is-error');
        note.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }

      var tokenField = form.querySelector('[name="cf-turnstile-response"]');
      var token = tokenField ? tokenField.value : '';
      if (!token) {
        note.classList.add('is-error');
        note.textContent = 'Verification is still processing. Please wait a moment and try again.';
        return;
      }

      note.textContent = 'Verifying…';
      var formData = new FormData(form);

      try {
        var res = await fetch('https://iep-turnstile.ykminmin8654.workers.dev', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          throw new Error('Verification failed with status ' + res.status);
        }

        try {
          var list = JSON.parse(localStorage.getItem('iep:newsletter') || '[]');
          if (list.indexOf(email) === -1) list.push(email);
          localStorage.setItem('iep:newsletter', JSON.stringify(list));
        } catch (err) { /* ignore */ }

        note.classList.add('is-success');
        note.textContent = "Thanks — you're on the list.";
        input.value = '';
        form.reset();
        resetTurnstile();

      } catch (err) {
        console.error('Subscribe error:', err);
        note.classList.add('is-error');
        note.textContent = 'Verification failed. Please try again.';
        resetTurnstile();
      }
    });

    input.addEventListener('input', function () {
      input.classList.remove('is-error');
      note.classList.remove('is-error');
      note.textContent = '';
    });
  }

  /* ============================================================
     9. REVEAL ON SCROLL
     ============================================================ */
  function initReveals() {
    if (!('IntersectionObserver' in window)) return;

    var els = document.querySelectorAll('.post, .featured__card, .subscribe');
    if (!els.length) return;

    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.style.opacity = '1';
          entries[i].target.style.transform = 'translateY(0)';
          observer.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    for (var i = 0; i < els.length; i++) {
      els[i].style.opacity = '0';
      els[i].style.transform = 'translateY(20px)';
      els[i].style.transition = 'opacity 0.6s cubic-bezier(.2,.7,.2,1), transform 0.6s cubic-bezier(.2,.7,.2,1)';
      observer.observe(els[i]);
    }
  }

  /* ============================================================
     10. BOOT
     ============================================================ */
  function boot() {
    featuredPostEl = document.getElementById('featured-post');
    postsGridEl = document.getElementById('posts-grid');

    wireTabs();
    wireSearch();
    wireSubscribe();

    loadPosts()
      .then(function (posts) {
        ALL_POSTS = Array.isArray(posts) ? posts : [];
        updateCounts();
        renderFeatured();
        renderPosts();
        initReveals();
        console.log('✅ Newsletter ready — ' + ALL_POSTS.length + ' posts loaded');
      })
      .catch(function (err) {
        console.error('Failed to load posts:', err);
        postsGridEl.innerHTML =
          '<div class="newsletter-empty">' +
            '<i class="fas fa-exclamation-triangle"></i>' +
            '<h3>Couldn\'t load posts</h3>' +
            '<p>Please refresh the page and try again.</p>' +
          '</div>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();