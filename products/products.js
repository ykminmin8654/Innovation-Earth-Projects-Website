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
  // Data fetching
  //
  // IMPORTANT: Jekyll (GitHub Pages default build) EXCLUDES .md
  // files from the published site, so /products/data/*.md returns
  // 404 on innovationearthprojects.org and a directory listing is
  // never generated. Decap CMS commits product files straight to
  // the repo, so we read them via the public GitHub Contents API
  // instead. manifest.json / directory scraping are kept as cheap
  // fallbacks in case the site is ever served with real files.
  // ------------------------------------------------------------
  const SITE_HOSTS = ['innovationearthprojects.org', 'www.innovationearthprojects.org'];
  const GH_API_DIR = 'https://api.github.com/repos/ykminmin8654/Innovation-Earth-Projects-Website/contents/products/data';
  const GH_RAW_BASE = 'https://raw.githubusercontent.com/ykminmin8654/Innovation-Earth-Projects-Website/main/products/data/';

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

  // List *.md filenames via the GitHub Contents API (public repo, no auth needed)
  async function getFileListFromApi() {
    try {
      const txt = await fetchWithCache(GH_API_DIR);
      const entries = JSON.parse(txt);
      if (!Array.isArray(entries)) return [];
      return entries
        .filter((e) => e && e.type === 'file' && /\.md$/i.test(e.name))
        .map((e) => e.name);
    } catch {
      return [];
    }
  }

  // Fetch one product file: prefer raw.githubusercontent.com (fast),
  // fall back to the Contents API entry's base64 content.
  async function fetchProductFile(file) {
    try {
      const text = await fetchWithCache(GH_RAW_BASE + encodeURIComponent(file));
      return parseFrontMatter(text);
    } catch {
      try {
        const txt = await fetchWithCache(GH_API_DIR + '/' + encodeURIComponent(file));
        const json = JSON.parse(txt);
        if (json && typeof json.content === 'string') {
          const decoded = atob(json.content.replace(/\n/g, ''));
          return parseFrontMatter(decoded);
        }
      } catch { /* ignore */ }
      return null;
    }
  }

  async function getFileList() {
    const dir = dataDir();

    // 0) On the custom domain, static .md files are stripped by Jekyll —
    //    go straight to the GitHub API. Off-domain (local dev / preview),
    //    try local files first.
    const onCustomDomain = SITE_HOSTS.indexOf(window.location.hostname) !== -1;

    if (!onCustomDomain) {
      // 1) Try a locally-served manifest
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
        /* fall through */
      }

      // 2) Fallback: scrape a directory listing (works with a plain static server)
      try {
        const html = await fetchWithCache(dir);
        const re = /href="([^"?#]+\.md)"/gi;
        const found = new Set();
        let m;
        while ((m = re.exec(html)) !== null) found.add(m[1]);
        if (found.size) return Array.from(found);
      } catch {
        /* fall through to API */
      }
    }

    // 3) GitHub Contents API — the reliable source on GitHub Pages
    return getFileListFromApi();
  }

  async function fetchProducts() {
    const dir = dataDir();
    const files = await getFileList();
    const onCustomDomain = SITE_HOSTS.indexOf(window.location.hostname) !== -1;
    const items = [];

    for (const file of files) {
      let fm = null;

      if (!onCustomDomain) {
        // Local / preview: try the statically-served copy first
        try {
          const text = await fetchWithCache(dir + encodeURIComponent(file));
          fm = parseFrontMatter(text);
        } catch {
          fm = null;
        }
      }

      if (!fm || !fm.title) {
        fm = await fetchProductFile(file);
      }

      if (fm && fm.title) items.push(fm);
      else console.warn('Skipping product file:', file);
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
        : 'No products have been published yet. Check back soon — new tools ship every week.';

      grid.innerHTML = `
        <div class="state">
          <i class="fas fa-box-open"></i>
          <h3>No products yet</h3>
          <p>${escapeHtml(emptyMsg)}</p>
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
      // Show the "no products" state (handled in renderGrid) plus retry
      // in case it was a transient fetch error.
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
