/* ============================================================
   HOME — featured products + changelog
   Depends on: shared/firebase.js (window.iepDB)
   ============================================================ */

(function () {
  'use strict';

  // ------------------------------------------------------------
  // Config
  // ------------------------------------------------------------
  const FEATURED_LIMIT = 3;       // how many products to show on home
  const CHANGELOG_LIMIT = 5;      // how many changelog entries
  const CACHE_KEY_PRODUCTS = 'iep:products:cache';
  const CACHE_KEY_CHANGELOG = 'iep:changelog:cache';

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
      case 'live':   return { cls: 'live',   label: 'Live'   };
      case 'beta':   return { cls: 'beta',   label: 'Beta'   };
      case 'soon':
      case 'coming': return { cls: 'soon',   label: 'Soon'   };
      default:       return { cls: 'live',   label: 'Live'   };
    }
  }

  // ------------------------------------------------------------
  // Products
  // ------------------------------------------------------------
  async function fetchProducts() {
    // Try Firestore
    if (window.iepDB) {
      try {
        const snap = await window.iepDB
          .collection('products')
          .limit(FEATURED_LIMIT)
          .get();

        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (items.length) {
          localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(items));
          return items;
        }
      } catch (err) {
        console.warn('Firestore products failed, trying cache:', err.message);
      }
    }

    // Fallback: cache
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY_PRODUCTS) || '[]');
      if (cached.length) return cached.slice(0, FEATURED_LIMIT);
    } catch { /* ignore */ }

    return [];
  }

  function renderProducts(container, products) {
    if (!container) return;

    if (!products.length) {
      container.innerHTML = `
        <div class="state">
          <i class="fas fa-box-open"></i>
          <h3>No products yet</h3>
          <p>Check back soon — we're shipping.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(p => {
      const meta = statusMeta(p.status);
      const url = normalizeUrl(p.url);
      const hasUrl = !!url;

      const linkHtml = hasUrl
        ? `<a class="product-card__link" href="${escapeHtml(url)}" target="_blank" rel="noopener">
             Open <i class="fas fa-arrow-right"></i>
           </a>`
        : `<span class="product-card__link product-card__link--disabled">
             Coming soon
           </span>`;

      return `
        <article class="product-card">
          <div class="product-card__top">
            <span class="product-card__status product-card__status--${meta.cls}">
              ${meta.label}
            </span>
            <span class="product-card__free">Free</span>
          </div>
          <h3 class="product-card__title">${escapeHtml(p.title || 'Untitled product')}</h3>
          <p class="product-card__desc">${escapeHtml(p.description || '')}</p>
          ${linkHtml}
        </article>
      `;
    }).join('');
  }

  // ------------------------------------------------------------
  // Changelog
  // ------------------------------------------------------------
  async function fetchChangelog() {
    if (window.iepDB) {
      try {
        const snap = await window.iepDB
          .collection('changelog')
          .orderBy('date', 'desc')
          .limit(CHANGELOG_LIMIT)
          .get();

        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (items.length) {
          localStorage.setItem(CACHE_KEY_CHANGELOG, JSON.stringify(items));
          return items;
        }
      } catch (err) {
        console.warn('Firestore changelog failed, trying cache:', err.message);
      }
    }

    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY_CHANGELOG) || '[]');
      if (cached.length) return cached.slice(0, CHANGELOG_LIMIT);
    } catch { /* ignore */ }

    return [];
  }

  function renderChangelog(container, items) {
    if (!container) return;

    if (!items.length) {
      container.innerHTML = `
        <li class="state">
          <i class="fas fa-clock"></i>
          <h3>No updates yet</h3>
          <p>Our first release notes will land here.</p>
        </li>
      `;
      return;
    }

    container.innerHTML = items.map(item => {
      const date = formatDate(item.date) || 'Recently';
      return `
        <li>
          <span class="changelog__date">${escapeHtml(date)}</span>
          <h3 class="changelog__title">${escapeHtml(item.title || 'Update')}</h3>
          <p class="changelog__desc">${escapeHtml(item.description || '')}</p>
        </li>
      `;
    }).join('');
  }

  // ------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------
  async function boot() {
    const productsEl = document.getElementById('featured-products');
    const changelogEl = document.getElementById('changelog');

    // If Firebase hasn't loaded yet, wait briefly, then render with cache
    const loadData = async () => {
      const [products, changelog] = await Promise.all([
        fetchProducts(),
        fetchChangelog(),
      ]);
      renderProducts(productsEl, products);
      renderChangelog(changelogEl, changelog);
    };

    if (window.iepDB) {
      loadData();
    } else {
      // Wait for firebase-ready event or timeout
      let done = false;
      const onReady = () => { if (!done) { done = true; loadData(); } };
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