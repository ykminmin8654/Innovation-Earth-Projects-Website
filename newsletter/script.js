/* ============================================================
   NEWSLETTER — posts list + filters + search + subscribe
   All posts hardcoded. No Firebase.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1. POSTS DATA
     Edit this array to add/remove posts. Newest at the top.
     ============================================================ */
  var POSTS = [
    {
      id: 'study-pal-v1-2',
      date: '2025-10-12',
      category: 'product',
      title: 'StudyPal v1.2 — community decks and faster sync',
      excerpt: 'You can now share decks with anyone by link, and sync is up to 3x faster on large collections.',
      readTime: '3 min read',
      featured: true,
      icon: 'fa-brain',
      url: '#'
    },
    {
      id: 'spaced-repetition',
      date: '2025-10-04',
      category: 'research',
      title: 'Why spaced repetition still beats everything else',
      excerpt: 'A short dive into the research behind why spacing out your study sessions works — and how to actually apply it.',
      readTime: '6 min read',
      icon: 'fa-flask',
      url: '#'
    },
    {
      id: 'calc-trainer-beta',
      date: '2025-09-28',
      category: 'product',
      title: 'Calc Trainer is now open for beta testers',
      excerpt: 'Early access to our adaptive math practice tool. Solve problems, get instant step-by-step solutions, track your progress.',
      readTime: '2 min read',
      icon: 'fa-calculator',
      url: '#'
    },
    {
      id: 'llc-registered',
      date: '2025-09-15',
      category: 'studio',
      title: 'We registered as a Utah LLC',
      excerpt: 'A quick note on why we formalized the studio, and what it changes (and what it doesn\'t).',
      readTime: '4 min read',
      icon: 'fa-building',
      url: '#'
    },
    {
      id: 'learning-in-public',
      date: '2025-08-22',
      category: 'research',
      title: 'The case for building in public as a student',
      excerpt: 'Why sharing your work-in-progress beats waiting until it\'s "ready" — with real examples from our own projects.',
      readTime: '5 min read',
      icon: 'fa-eye',
      url: '#'
    },
    {
      id: 'first-prototype',
      date: '2025-08-05',
      category: 'studio',
      title: 'How StudyPal started in a single weekend',
      excerpt: 'The story behind our first tool — what worked, what broke, and what we\'d do differently.',
      readTime: '4 min read',
      icon: 'fa-rocket',
      url: '#'
    },
    {
      id: 'flashcard-science',
      date: '2025-07-18',
      category: 'research',
      title: 'What the science says about flashcards',
      excerpt: 'Retrieval practice, active recall, and why the humble flashcard keeps showing up in learning research.',
      readTime: '7 min read',
      icon: 'fa-flask',
      url: '#'
    },
    {
      id: 'design-system',
      date: '2025-07-02',
      category: 'studio',
      title: 'Building our design system from scratch',
      excerpt: 'How we went from ad-hoc CSS to a real design token system — and the mistakes we made along the way.',
      readTime: '5 min read',
      icon: 'fa-palette',
      url: '#'
    }
  ];

  /* ============================================================
     2. STATE
     ============================================================ */
  var activeFilter = 'all';
  var activeSearch = '';
  var featuredPostEl = null;
  var postsGridEl = null;

  /* ============================================================
     3. UTILITIES
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

  /* ============================================================
     4. FILTERING
     ============================================================ */
  function getVisiblePosts() {
    var list = POSTS.slice();

    // Category filter (featured only shows in "all")
    if (activeFilter !== 'all') {
      list = list.filter(function (p) { return p.category === activeFilter; });
    }

    // Search filter
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

    // Hide featured if searching or filtering
    if (activeFilter !== 'all' || activeSearch) {
      featuredPostEl.innerHTML = '';
      return;
    }

    var featured = null;
    for (var i = 0; i < POSTS.length; i++) {
      if (POSTS[i].featured) { featured = POSTS[i]; break; }
    }
    if (!featured) {
      featuredPostEl.innerHTML = '';
      return;
    }

    var cat = featured.category;
    var icon = featured.icon || 'fa-star';
    var dateStr = formatDate(featured.date);

    featuredPostEl.innerHTML =
      '<a class="featured__card" href="' + escapeHtml(featured.url || '#') + '">' +
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

    // In "all" view without search, exclude the featured post from the grid
    if (activeFilter === 'all' && !activeSearch) {
      list = list.filter(function (p) { return !p.featured; });
    }

    if (!list.length) {
      postsGridEl.innerHTML =
        '<div class="newsletter-empty">' +
          '<i class="fas fa-' + (activeSearch ? 'search' : 'inbox') + '"></i>' +
          '<h3>' + (activeSearch ? 'No results' : 'No posts here yet') + '</h3>' +
          '<p>' + (activeSearch
            ? 'Nothing matches "' + escapeHtml(activeSearch) + '". Try a different search.'
            : 'Try a different filter, or check back soon.') + '</p>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var cat = p.category;
      var dateStr = formatDate(p.date);

      html +=
        '<a class="post" href="' + escapeHtml(p.url || '#') + '">' +
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
    for (var i = 0; i < POSTS.length; i++) {
      var c = POSTS[i].category;
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
     6. INTERACTIONS — tabs
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
     7. INTERACTIONS — search
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

    // Escape key clears search
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
     8. INTERACTIONS — subscribe form + Turnstile
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

      // Reset UI
      input.classList.remove('is-error');
      note.classList.remove('is-success', 'is-error');
      note.textContent = '';

      // 1. Validate email
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) {
        input.classList.add('is-error');
        note.classList.add('is-error');
        note.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }

      // 2. Get Turnstile token
      var tokenField = form.querySelector('[name="cf-turnstile-response"]');
      var token = tokenField ? tokenField.value : '';
      if (!token) {
        note.classList.add('is-error');
        note.textContent = 'Verification is still processing. Please wait a moment and try again.';
        return;
      }

      // 3. Send to Cloudflare Worker
      note.textContent = 'Verifying…';
      var formData = new FormData(form);

      try {
        var res = await fetch('https://iep-turnstile.ykminmin8654.workers.dev', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          throw new Error('Verification failed');
        }

        // 4. Save locally (temporary — swap for backend later)
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

    // Clear errors while typing
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

    // Sort posts by date desc
    POSTS.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    updateCounts();
    renderFeatured();
    renderPosts();
    wireTabs();
    wireSearch();
    wireSubscribe();
    initReveals();

    console.log('✅ Newsletter ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();