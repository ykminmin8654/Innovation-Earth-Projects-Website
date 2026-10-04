/* ============================================================
   POST DETAIL — loads one post by ?id=<slug>
   Uses `marked` for Markdown rendering, `DOMPurify` for safety.
   Falls back to a minimal parser if either CDN fails.
   ============================================================ */

(function () {
  'use strict';

  var articleEl = null;

  /* ============================================================
     1. UTILITIES
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
        month: 'long',
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
     2. MARKDOWN RENDERING
     ============================================================ */
  function renderMarkdown(md) {
    if (!md) return '';

    // Prefer `marked` if available
    if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
      try {
        marked.setOptions({
          gfm: true,         // GitHub-flavored: tables, strikethrough, task lists
          breaks: false,     // Don't turn every \n into <br>
          headerIds: false,  // Don't add id="" to headings
          mangle: false      // Don't mangle email links
        });

        var rawHtml = marked.parse(md);

        // Sanitize if DOMPurify is available
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
            ALLOWED_ATTR: [
              'href','title','target','rel','src','alt','class'
            ]
          });
        }

        return rawHtml;
      } catch (err) {
        console.error('marked failed, using fallback:', err);
      }
    }

    // Fallback parser
    return fallbackMarkdown(md);
  }

  /* ------------------------------------------------------------
     Minimal fallback parser (if `marked` fails to load)
     ------------------------------------------------------------ */
  function fallbackMarkdown(md) {
    var html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Fenced code blocks
    html = html.replace(/```([\s\S]*?)```/g, function (m, code) {
      return '<pre><code>' + code.trim() + '</code></pre>';
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings
    html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

    // Bold + italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Links + images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1">');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Horizontal rule
    html = html.replace(/^---+$/gm, '<hr>');

    // Blockquotes
    html = html.replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>');

    // Lists
    html = html.replace(/^\s*[-*] (.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, function (m) {
      return '<ul>' + m + '</ul>';
    });

    // Paragraphs
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

  /* ============================================================
     3. URL PARSING
     ============================================================ */
  function getPostId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id') || '';
  }

  /* ============================================================
     4. LOAD POST DATA
     ============================================================ */
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

  /* ============================================================
     5. RENDER
     ============================================================ */
  function renderPost(post) {
    if (!articleEl) return;

    if (!post) {
      articleEl.innerHTML =
        '<div class="post-error">' +
          '<i class="fas fa-file-alt"></i>' +
          '<h2>Post not found</h2>' +
          '<p>We couldn\'t find that post. It may have been removed or the link is broken.</p>' +
          '<p><a href="/newsletter">Back to all posts</a></p>' +
        '</div>';
      return;
    }

    document.title = (post.title || 'Post') + ' — Innovation Earth Projects';

    var cat = post.category || 'studio';
    var dateStr = formatDate(post.date);
    var bodyHtml = renderMarkdown(post.body || '');

    articleEl.innerHTML =
      '<header class="post-header">' +
        '<div class="post-header__meta">' +
          '<span class="post-header__badge post-header__badge--' + escapeHtml(cat) + '">' +
            '<span class="dot dot--' + escapeHtml(cat) + '"></span>' +
            categoryLabel(cat) +
          '</span>' +
          '<span>' + escapeHtml(dateStr) + '</span>' +
          (post.readTime ? '<span>·</span><span>' + escapeHtml(post.readTime) + '</span>' : '') +
        '</div>' +
        '<h1 class="post-header__title">' + escapeHtml(post.title || 'Untitled') + '</h1>' +
        (post.excerpt ? '<p class="post-header__excerpt">' + escapeHtml(post.excerpt) + '</p>' : '') +
      '</header>' +
      '<div class="post-body">' + bodyHtml + '</div>';
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

  /* ============================================================
     6. BOOT
     ============================================================ */
  function boot() {
    articleEl = document.getElementById('post-article');
    if (!articleEl) return;

    var id = getPostId();
    if (!id) {
      renderError('No post was specified in the URL.');
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

  // Re-run when the 404 shim loads this page
  window.addEventListener('shim:content-loaded', boot);

})();