/* ============================================================
   COOKIE BANNER — lightweight, GDPR-style consent notice.
   Injected site-wide by shared/nav.js (no per-page changes).
   Choice is stored in localStorage under "iep_cookie_consent".
   "Reject" still allows strictly-necessary storage; it only
   records the preference. Nothing else on the site sets
   tracking cookies, so no further gating is required.
   ============================================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'iep_cookie_consent';

  var BANNER_HTML =
    '<div class="cookie-banner" id="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie notice">' +
      '<div class="cookie-banner__inner">' +
        '<div class="cookie-banner__icon" aria-hidden="true"><i class="fas fa-cookie-bite"></i></div>' +
        '<div class="cookie-banner__text">' +
          '<strong>We value your privacy.</strong> We use only essential storage to' +
          ' remember this choice and Cloudflare Turnstile to keep bots out of our forms.' +
          ' No tracking cookies. Read our' +
          ' <a href="/legal/privacy">Privacy Policy</a> and' +
          ' <a href="/legal/tos">Terms of Service</a>.' +
        '</div>' +
        '<div class="cookie-banner__actions">' +
          '<button class="btn btn--ghost cookie-banner__btn" data-consent="essential" type="button">Reject</button>' +
          '<button class="btn btn--primary cookie-banner__btn" data-consent="all" type="button">Accept</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setStored(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* private mode */ }
  }

  function removeBanner() {
    var el = document.getElementById('cookie-banner');
    if (el) el.remove();
  }

  function inject() {
    // Don't show inside the admin panel.
    if (/^\/admin/i.test(window.location.pathname)) return;
    if (getStored()) return;                 // already chose
    if (document.getElementById('cookie-banner')) return; // already shown

    var wrap = document.createElement('div');
    wrap.innerHTML = BANNER_HTML;
    document.body.appendChild(wrap.firstChild);

    var banner = document.getElementById('cookie-banner');
    var buttons = banner.querySelectorAll('[data-consent]');

    function close(choice) {
      setStored(choice === 'all' ? 'accepted' : 'rejected');
      banner.classList.add('is-hiding');
      setTimeout(removeBanner, 350);
    }

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        close(this.getAttribute('data-consent'));
      });
    }

    // Reveal after a short beat so it doesn't fight the page load animation.
    requestAnimationFrame(function () {
      banner.classList.add('is-visible');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  // The SPA router re-injects content on navigation; make sure the banner
  // survives (or reappears if the user never chose) after page swaps.
  window.addEventListener('shim:content-loaded', inject);
})();
