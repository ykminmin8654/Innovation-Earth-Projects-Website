/* ============================================================
   PRODUCTS — full listing, filterable by status
   Depends on: shared/firebase.js (window.iepDB)
   ============================================================ */

(function () {
  'use strict';

  // ------------------------------------------------------------
  // Config
  // ------------------------------------------------------------
  const CACHE_KEY = 'iep:products:cache';
  const COLLECTION = 'products';

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
      const d = value.seconds
        ? new Date(value.seconds * 1000)
        : new Date(value);
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
  // Data fetching
  // ------------------------------------------------------------
  async function fetchProducts() {
    // Try Firestore
    if (window.iepDB) {
      try {
        const snap = await window.iepDB.collection(COLLECTION).get();
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort: explicit order first, then title
        items.sort((a, b) => {
          const ao = Number(a.order ?? 999);
          const bo = Number(b.order ?? 999);
          if (ao !== bo) return ao - bo;
          return String(a.title || '').localeCompare(String(b.title || ''));
        });

        if (items.length) {
          localStorage.setItem(CACHE_KEY, JSON.stringify(items));
          return { items, source: 'firestore' };
        }
      } catch (err) {
        console.warn('Firestore failed:', err.message);
      }
    }

    // Fallback: cache
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
      if (cached.length) return { items: cached, source: 'cache' };
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
        : 'Nothing here yet. Check back soon — we\'re shipping.';

      grid.innerHTML = `
        <div class="state">
          <i class="fas fa-box-open"></i>
          <h3>No products</h3>
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

      const linkHtml = hasUrl
        ? `<a class="product-card__link" href="${escapeHtml(url)}" target="_blank" rel="noopener">
             Open <i class="fas fa-arrow-right"></i>
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

    if (!items.length && source !== 'firestore' && source !== 'cache') {
      // Nothing anywhere — show error + retry
      grid.innerHTML = `
        <div class="state">
          <i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i>
          <h3>Couldn't load products</h3>
          <p>Please check your connection and try again.</p>
        </div>
      `;
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

    if (window.iepDB) {
      load();
    } else {
      let done = false;
      const onReady = () => { if (!done) { done = true; load(); } };
      window.addEventListener('iep:db-ready', onReady, { once: true });
      window.addEventListener('iep:db-failed', onReady, { once: true });
      setTimeout(onReady, 1500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();