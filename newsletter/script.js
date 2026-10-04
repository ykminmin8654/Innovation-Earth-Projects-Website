/* ============================================================
   NEWSLETTER — list page
   ============================================================ */

(function () {
  'use strict';

  var ALL_POSTS = [];
  var activeFilter = 'all';
  var activeSearch = '';
  var featuredPostEl = null;
  var postsGridEl = null;

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
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return dateStr; }
  }

  function categoryLabel(cat) {
    if (cat === 'research') return 'Research';
    if (cat === 'product')  return 'Product';
    if (cat === 'studio')   return 'Studio';
    return 'Post';
  }

  function postUrl(post) {
    if (post.pdf) return post.pdf;
    if (post.txt) return post.txt;
    return './post.html?id=' + encodeURIComponent(post.id || '');
  }

  function isExternalFile(post) {
    return !!(post.pdf || post.txt);
  }

  function renderByline(post, prefix) {
    var name = post.author || 'Unknown';
    var initial = name.charAt(0).toUpperCase();
    var avatar;
    if (post.authorImage) {
      avatar = '<img src="' + escapeHtml(post.authorImage) + '" alt="" class="' + prefix + '-avatar">';
    } else {
      avatar = '<span class="' + prefix + '-avatar ' + prefix + '-avatar--placeholder">' +
               escapeHtml(initial) + '</span>';
    }

    var license = '';
    if (post.licenseLabel) {
      if (post.licenseUrl) {
        license = '<a href="' + escapeHtml(post.licenseUrl) + '" target="_blank" rel="noopener" class="' + prefix + '-license">' +
                  escapeHtml(post.licenseLabel) + '</a>';
      } else {
        license = '<span class="' + prefix + '-license">' + escapeHtml(post.licenseLabel) + '</span>';
      }
    }

    return (
      '<div class="' + prefix + '-byline">' +
        avatar +
        '<div class="' + prefix + '-byline-text">' +
          '<span class="' + prefix + '-author">' + escapeHtml(name) + '</span>' +
          license +
        '</div>' +
      '</div>'
    );
  }

  function loadPosts() {
    return fetch('./posts.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      });
  }

  function getVisiblePosts() {
    var list = ALL_POSTS.slice();
    if (activeFilter !== 'all') {
      list = list.filter(function (p) { return p.category === activeFilter; });
    }
    if (activeSearch) {
      var q = activeSearch.toLowerCase();
      list = list.filter(function (p) {
        return [p.title || '', p.excerpt || '', p.category || '', p.author || '']
          .join(' ').toLowerCase().indexOf(q) !== -1;
      });
    }
    return list;
  }

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
    if (!featured) { featuredPostEl.innerHTML = ''; return; }

    var cat = featured.category || 'studio';
    var icon = featured.icon || 'fa-star';
    var dateStr = formatDate(featured.date);
    var url = postUrl(featured);
    var external = isExternalFile(featured);
    var linkAttrs = external
      ? ' href="' + escapeHtml(url) + '" target="_blank" rel="noopener"'
      : ' href="' + escapeHtml(url) + '"';

    featuredPostEl.innerHTML =
      '<a class="featured"' + linkAttrs + '>' +
        '<div class="featured-visual">' +
          '<i class="fas ' + escapeHtml(icon) + '"></i>' +
        '</div>' +
        '<div class="featured-body">' +
          '<div class="featured-meta">' +
            '<span class="badge badge--' + escapeHtml(cat) + '">' +
              '<span class="dot dot--' + escapeHtml(cat) + '"></span>' +
              categoryLabel(cat) +
            '</span>' +
            '<span class="featured-date">' + escapeHtml(dateStr) + '</span>' +
          '</div>' +
          '<h2 class="featured-title">' + escapeHtml(featured.title) + '</h2>' +
          '<p class="featured-excerpt">' + escapeHtml(featured.excerpt) + '</p>' +
          renderByline(featured, 'featured') +
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
          '<h3>' + (isEmpty ? 'No posts yet' : activeSearch ? 'No results' : 'No posts here') + '</h3>' +
          '<p>' + (isEmpty ? 'Check back soon.' : activeSearch
            ? 'Nothing matches "' + escapeHtml(activeSearch) + '".'
            : 'Try a different filter.') + '</p>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var cat = p.category || 'studio';
      var dateStr = formatDate(p.date);
      var url = postUrl(p);
      var external = isExternalFile(p);
      var linkAttrs = external
        ? ' href="' + escapeHtml(url) + '" target="_blank" rel="noopener"'
        : ' href="' + escapeHtml(url) + '"';

      var fileLabel = p.pdf ? '<i class="fas fa-file-pdf"></i> PDF'
                    : p.txt ? '<i class="fas fa-file-alt"></i> Text'
                    : 'Read';

      html +=
        '<a class="card"' + linkAttrs + '>' +
          '<div class="card-top">' +
            '<span class="badge badge--' + escapeHtml(cat) + '">' +
              '<span class="dot dot--' + escapeHtml(cat) + '"></span>' +
              categoryLabel(cat) +
            '</span>' +
            '<span class="card-date">' + escapeHtml(dateStr) + '</span>' +
          '</div>' +
          '<h3 class="card-title">' + escapeHtml(p.title) + '</h3>' +
          '<p class="card-excerpt">' + escapeHtml(p.excerpt) + '</p>' +
          renderByline(p, 'card') +
          '<div class="card-footer">' +
            '<span class="card-read">' + fileLabel + '</span>' +
            '<span class="card-arrow"><i class="fas fa-arrow-right"></i></span>' +
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

  function wireTabs() {
    var tabs = document.querySelectorAll('#newsletter-tabs .tab');
    for (var i = 0; i < tabs.length; i++) {
      (function (tab) {
        tab.addEventListener('click', function () {
          for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('tab--active');
          tab.classList.add('tab--active');
          activeFilter = tab.getAttribute('data-filter') || 'all';
          refresh();
        });
      })(tabs[i]);
    }
  }

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
  }

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

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

      try {
        var res = await fetch('https://iep-turnstile.ykminmin8654.workers.dev', {
          method: 'POST',
          body: new FormData(form)
        });
        if (!res.ok) throw new Error('Verification failed');

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

  function boot() {
    featuredPostEl = document.getElementById('featured-post');
    postsGridEl = document.getElementById('posts-grid');
    if (!postsGridEl) return;

    wireTabs();
    wireSearch();
    wireSubscribe();

    loadPosts()
      .then(function (posts) {
        ALL_POSTS = Array.isArray(posts) ? posts : [];
        updateCounts();
        renderFeatured();
        renderPosts();
        console.log('✅ Newsletter ready — ' + ALL_POSTS.length + ' posts');
      })
      .catch(function (err) {
        console.error('Failed to load posts:', err);
        postsGridEl.innerHTML = '<div class="newsletter-empty"><i class="fas fa-exclamation-triangle"></i><h3>Couldn\'t load posts</h3><p>Refresh the page and try again.</p></div>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('shim:content-loaded', boot);
})();