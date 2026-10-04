/* ============================================================
   POST DETAIL — loads one post by ?id=<slug>
   Shows title, excerpt, author, license, download buttons, body.
   ============================================================ */

(function () {
  'use strict';

  var articleEl = null;

  /* ---------- Utilities ---------- */
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
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (e) { return dateStr; }
  }

  function categoryLabel(cat) {
    if (cat === 'research') return 'Research';
    if (cat === 'product')  return 'Product';
    if (cat === 'studio')   return 'Studio';
    return 'Post';
  }

  /* ---------- Markdown ---------- */
  function renderMarkdown(md) {
    if (!md) return '';

    if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
      try {
        marked.setOptions({
          gfm: true, breaks: false, headerIds: false, mangle: false
        });
        var rawHtml = marked.parse(md);
        if (typeof DOMPurify !== 'undefined') {
          return DOMPurify.sanitize(rawHtml, {
            ALLOWED_TAGS: [
              'h1','h2','h3','h4','h5','h6',
              'p','br','hr',
              'strong','em','del','code','pre','blockquote',
              'ul','ol','li',
              'a','img',
              'table','thead','tbody','tr','th','td',
              'span','div'
            ],
            ALLOWED_ATTR: ['href','title','target','rel','src','alt','class']
          });
        }
        return rawHtml;
      } catch (err) {
        console.error('marked failed:', err);
      }
    }
    return fallbackMarkdown(md);
  }

  function fallbackMarkdown(md) {
    var html = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/```([\s\S]*?)```/g, function (m, code) {
      return '<pre><code>' + code.trim() + '</code></pre>';
    });
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    html = html.replace(/^\s*[-*] (.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, function (m) {
      return '<ul>' + m + '</ul>';
    });
    var blocks = html.split(/\n{2,}/);
    html = blocks.map(function (block) {
      var trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|ul|ol|pre|blockquote|hr|li)/.test(trimmed)) return trimmed;
      if (/<\/?(ul|ol|li)>/.test(trimmed)) return trimmed;
      return '<p>' + trimmed.replace(/\n/g, ' ') + '</p>';
    }).join('\n');
    return html.replace(/<p>\s*<\/p>/g, '');
  }

  /* ---------- Load ---------- */
  function getPostId() {
    return new URLSearchParams(window.location.search).get('id') || '';
  }

  function loadPost(id) {
    return fetch('/newsletter/posts.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (posts) {
        if (!Array.isArray(posts)) return null;
        for (var i = 0; i < posts.length; i++) {
          if (posts[i].id === id) return posts[i];
        }
        return null;
      });
  }

  /* ---------- Render ---------- */
  function bylineHtml(post) {
    var name = post.author || 'Unknown';
    var initial = name.charAt(0).toUpperCase();

    var avatarHtml = post.authorImage
      ? '<img src="' + escapeHtml(post.authorImage) + '" alt="" class="post-header__avatar">'
      : '<span class="post-header__avatar post-header__avatar--placeholder">' +
          escapeHtml(initial) + '</span>';

    var licenseHtml = '';
    if (post.licenseLabel) {
      if (post.licenseUrl) {
        licenseHtml = '<a href="' + escapeHtml(post.licenseUrl) +
          '" target="_blank" rel="noopener" class="post-header__license">' +
          escapeHtml(post.licenseLabel) + '</a>';
      } else {
        licenseHtml = '<span class="post-header__license">' +
          escapeHtml(post.licenseLabel) + '</span>';
      }
    }

    return (
      '<div class="post-header__byline">' +
        avatarHtml +
        '<div class="post-header__byline-info">' +
          '<span class="post-header__author-name">' + escapeHtml(name) + '</span>' +
          licenseHtml +
        '</div>' +
      '</div>'
    );
  }

  function downloadsHtml(post) {
    if (!post.pdf && !post.txt) return '';

    var buttons = '';
    if (post.pdf) {
      buttons +=
        '<a href="' + escapeHtml(post.pdf) + '" target="_blank" rel="noopener" class="btn btn--primary btn--glow">' +
          '<i class="fas fa-file-pdf"></i> Download PDF' +
        '</a>';
    }
    if (post.txt) {
      buttons +=
        '<a href="' + escapeHtml(post.txt) + '" target="_blank" rel="noopener" class="btn btn--secondary">' +
          '<i class="fas fa-file-alt"></i> Download Text' +
        '</a>';
    }

    return '<div class="post-downloads">' + buttons + '</div>';
  }

  function renderPost(post) {
    if (!articleEl) return;

    if (!post) {
      articleEl.innerHTML =
        '<div class="post-error">' +
          '<i class="fas fa-file-alt"></i>' +
          '<h2>Post not found</h2>' +
          '<p>We couldn\'t find that post.</p>' +
          '<p><a href="/newsletter">Back to all posts</a></p>' +
        '</div>';
      return;
    }

    document.title = (post.title || 'Post') + ' — Innovation Earth Projects';

    var cat = post.category || 'studio';
    var dateStr = formatDate(post.date);
    var bodyHtml = post.body ? renderMarkdown(post.body) : '';

    articleEl.innerHTML =
      '<header class="post-header">' +
        '<div class="post-header__meta">' +
          '<span class="post-header__badge post-header__badge--' + escapeHtml(cat) + '">' +
            '<span class="dot dot--' + escapeHtml(cat) + '"></span>' +
            categoryLabel(cat) +
          '</span>' +
          '<span>' + escapeHtml(dateStr) + '</span>' +
        '</div>' +
        '<h1 class="post-header__title">' + escapeHtml(post.title || 'Untitled') + '</h1>' +
        (post.excerpt ? '<p class="post-header__excerpt">' + escapeHtml(post.excerpt) + '</p>' : '') +
        bylineHtml(post) +
      '</header>' +
      downloadsHtml(post) +
      (bodyHtml ? '<div class="post-body">' + bodyHtml + '</div>' : '');
  }

  function renderError(message) {
    if (!articleEl) return;
    articleEl.innerHTML =
      '<div class="post-error">' +
        '<i class="fas fa-exclamation-triangle"></i>' +
        '<h2>Couldn\'t load post</h2>' +
        '<p>' + escapeHtml(message) + '</p>' +
        '<p><a href="/newsletter">Back to all posts</a></p>' +
      '</div>';
  }

  /* ---------- Boot ---------- */
  function boot() {
    articleEl = document.getElementById('post-article');
    if (!articleEl) return;

    var id = getPostId();
    if (!id) {
      renderError('No post was specified.');
      return;
    }

    loadPost(id)
      .then(renderPost)
      .catch(function (err) {
        console.error('Failed to load post:', err);
        renderError('Something went wrong while loading the post.');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('shim:content-loaded', boot);

})();