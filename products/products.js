/* ============================================================
   PRODUCTS — full listing, filterable by status
   Content source: Decap CMS markdown files in /products/data/
   (managed exclusively through the Admin page — no hardcoded
   or placeholder products).
   ============================================================ */

(function () {
  'use strict';

  // ------------------------------------------------------------
  // Config
  // ------------------------------------------------------------
  const CACHE_KEY = 'iep:products:cache';
  const CACHE_TTL = 5 * 60 * 1000;            // 5 minutes

  // ------------------------------------------------------------
  // State
  // ------------------------------------------------------------
  let allProducts = [];
  let activeFilter = 'all';

  // ------------------------------------------------------------
  // Utilities
  // ------------------------------------------------------------
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeUrl(url) {
    if (!url) return '';
    let u = String(url).trim().replace(/^["']|["']$/g, '');
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    return u;
  }

  function formatDate(value) {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  }

  function statusMeta(status) {
    const s = String(status || 'live').toLowerCase();
    switch (s) {
      case 'live':   return { cls: 'live',   label: 'Live'  };
      case 'beta':   return { cls: 'beta',   label: 'Beta'  };
      case 'soon':
      case 'coming': return { cls: 'soon',   label: 'Soon'  };
      default:       return { cls: 'live',   label: 'Live'  };
    }
  }

  function pickIcon(product) {
    // Accept an "icon" field like "fa-rocket" or "rocket"
    const raw = String(product.icon || 'fa-cube').trim();
    const cls = raw.startsWith('fa-') ? raw : `fa-${raw}`;
    return `fas ${cls}`;
  }

  // ------------------------------------------------------------
  // Minimal front-matter parser (YAML subset used by Decap CMS)
  // ------------------------------------------------------------
  function parseFrontMatter(text) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return {};
    const data = {};
    let currentListKey = null;

    const lines = match[1].split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.replace(/\t/g, '  ');
      if (!line.trim() || line.trim().startsWith('#')) continue;

      // List item under a previous key ("  - value")
      const listItem = line.match(/^\s+-\s+(.*)$/);
      if (listItem && currentListKey) {
        data[currentListKey].push(stripQuotes(listItem[1]));
        continue;
      }

      const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
      if (!kv) continue;
      const key = kv[1];
      const val = kv[2].trim();

      if (val === '') {
        // Could be start of a list, or empty value
        currentListKey = key;
        data[key] = [];
      } else if (val.startsWith('[') && val.endsWith(']')) {
        // Inline list: [a, b, c]
        data[key] = val
          .slice(1, -1)
          .split(',')
          .map((s) => stripQuotes(s.trim()))
          .filter(Boolean);
        currentListKey = null;
      } else {
        data[key] = stripQuotes(val);
        currentListKey = null;
      }
    }

    // Empty keys that never received list items become ''
    for (const k of Object.keys(data)) {
      if (Array.isArray(data[k]) && data[k].length === 0) delete data[k];
    }
    return data;
  }

  function stripQuotes(str) {
    return String(str).replace(/^["']|["']$/g, '').trim();
  }

  // ------------------------------------------------------------
  // Data fetching — manifest.json written by Decap CMS,
  // with a directory-scrape fallback for safety
  // ------------------------------------------------------------
  function siteRoot() {
    // Works on /products and /products/ (and when nav.js injects a <base>)
    var base = document.querySelector('base');
    if (base && base.href) return base.href.replace(/\/$/, '') + '/';
    var p = window.location.pathname;
    if (/^\/products(\/.*)?$/.test(p)) return '/';
    var depth = p.replace(/^\/|\/$/g, '').split('/').length - 1;
    return depth > 0 ? '../' : './';
  }

  function dataDir() { return siteRoot() + 'products/data/'; }

  async function fetchWithCache(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
    return res.text();
  }

  async function getFileList() {
    const dir = dataDir();
    // 1) Try the CMS-generated manifest
    try {
      const txt = await fetchWithCache(dir + 'manifest.json');
      const json = JSON.parse(txt);
      const files = Array.isArray(json.files) ? json.files : [];
      const cleaned = files
        .map((f) => String(f).trim())
        .filter((f) => f.endsWith('.md') || /\.md\//.test(f))
        .map((f) => f.replace(/\.md\/$/, '.md'));
      if (cleaned.length) return cleaned;
    } catch {
      /* fall through to scrape */
    }

    // 2) Fallback: scrape the GitHub Pages directory listing
    //    (works when Jekyll renders /products/data/ as an index page)
    try {
      const html = await fetchWithCache(dir);
      const re = /href="([^"?#]+\.md)"/gi;
      const found = new Set();
      let m;
      while ((m = re.exec(html)) !== null) found.add(m[1]);
      if (found.size) return Array.from(found);
    } catch {
      /* ignore */
    }

    return [];
  }

  async function fetchProducts() {
    const dir = dataDir();
    const files = await getFileList();
    const items = [];

    for (const file of files) {
      try {
        const text = await fetchWithCache(dir + encodeURIComponent(file));
        const fm = parseFrontMatter(text);
        if (fm.title) items.push(fm);
      } catch (err) {
        console.warn('Skipping product file:', file, err.message);
      }
    }

    // Sort: explicit order first, then title
    items.sort((a, b) => {
      const ao = Number(a.order ?? 999);
      const bo = Number(b.order ?? 999);
      if (ao !== bo) return ao - bo;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });

    if (items.length) {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items })); } catch {}
      return { items, source: 'cms' };
    }

    // Fallback: recent cache (so the grid isn't blank on a transient network error)
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Array.isArray(cached.items) && cached.items.length &&
          Date.now() - (cached.at || 0) < CACHE_TTL) {
        return { items: cached.items, source: 'cache' };
      }
    } catch { /* ignore */ }

    return { items: [], source: 'empty' };
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  function renderGrid(items) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (!items.length) {
      const emptyMsg = allProducts.length
        ? 'No products match this filter.'
        : 'No products have been published yet. Add one in the Admin panel and it will appear here instantly.';

      grid.innerHTML = `
        <div class="state">
          <i class="fas fa-box-open"></i>
          <h3>No products yet</h3>
          <p>${escapeHtml(emptyMsg)}</p>
          ${allProducts.length ? '' : `
            <a class="btn btn--secondary" href="/admin/" style="margin-top:var(--s-4)">
              <i class="fas fa-pencil-alt"></i> Open Admin
            </a>`}
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map(p => {
      const meta = statusMeta(p.status);
      const url = normalizeUrl(p.url);
      const hasUrl = !!url;
      const icon = pickIcon(p);
      const dateStr = formatDate(p.updatedAt || p.createdAt);

      const tags = Array.isArray(p.tags) ? p.tags.slice(0, 4) : [];
      const tagsHtml = tags.length
        ? `<div class="product-card__tags">
             ${tags.map(t => `<span class="product-card__tag">${escapeHtml(t)}</span>`).join('')}
           </div>`
        : '';

      const linkLabel = meta.cls === 'beta' ? 'Try beta' : 'Open';
      const linkHtml = hasUrl
        ? `<a class="product-card__link" href="${escapeHtml(url)}" target="_blank" rel="noopener">
             ${linkLabel} <i class="fas fa-arrow-right"></i>
           </a>`
        : `<span class="product-card__link product-card__link--disabled">
             Coming soon
           </span>`;

      const metaHtml = dateStr
        ? `<span class="product-card__meta">${escapeHtml(dateStr)}</span>`
        : `<span class="product-card__meta">Free</span>`;

      return `
        <article class="product-card">
          <div class="product-card__top">
            <span class="product-card__status product-card__status--${meta.cls}">
              ${meta.label}
            </span>
            <span class="product-card__free">Free</span>
          </div>

          <div class="product-card__icon">
            <i class="${escapeHtml(icon)}"></i>
          </div>

          <h3 class="product-card__title">${escapeHtml(p.title || 'Untitled product')}</h3>
          <p class="product-card__desc">${escapeHtml(p.description || '')}</p>

          ${tagsHtml}

          <div class="product-card__footer">
            ${metaHtml}
            ${linkHtml}
          </div>
        </article>
      `;
    }).join('');
  }

  function updateCounts() {
    const counts = { all: allProducts.length, live: 0, beta: 0, soon: 0 };
    allProducts.forEach(p => {
      const meta = statusMeta(p.status);
      if (counts[meta.cls] != null) counts[meta.cls]++;
    });
    document.querySelectorAll('[data-count]').forEach(el => {
      const key = el.dataset.count;
      el.textContent = counts[key] ?? 0;
    });
  }

  function applyFilter(filter) {
    activeFilter = filter;
    const filtered = filter === 'all'
      ? allProducts
      : allProducts.filter(p => statusMeta(p.status).cls === filter);
    renderGrid(filtered);
  }

  function showRetry(show) {
    const el = document.getElementById('retry-wrap');
    if (el) el.hidden = !show;
  }

  // ------------------------------------------------------------
  // Wire
  // ------------------------------------------------------------
  function wireTabs() {
    const tabs = document.querySelectorAll('#product-tabs .tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('tab--active'));
        tab.classList.add('tab--active');
        applyFilter(tab.dataset.filter || 'all');
      });
    });
  }

  function wireRetry() {
    const btn = document.getElementById('retry-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      showRetry(false);
      const grid = document.getElementById('products-grid');
      grid.innerHTML = `
        <div class="state">
          <div class="spinner"></div>
          <p>Loading products…</p>
        </div>
      `;
      await load();
    });
  }

  // ------------------------------------------------------------
  // Load
  // ------------------------------------------------------------
  async function load() {
    const grid = document.getElementById('products-grid');
    const { items, source } = await fetchProducts();

    allProducts = items;

    if (!items.length && source === 'empty') {
      // Either genuinely nothing published yet, or the network failed.
      // Show the "no products" state with an Admin link (handled in renderGrid)
      // plus retry in case it was a transient fetch error.
      showRetry(true);
    } else {
      showRetry(false);
    }

    updateCounts();
    applyFilter(activeFilter);
  }

  // ------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------
  function boot() {
    wireTabs();
    wireRetry();
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
