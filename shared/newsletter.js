/* ============================================================
   NEWSLETTER — sign-up form on the /newsletter/ page.
   Plain ES5, no dependencies. Posts to the Worker's POST
   /newsletter endpoint as JSON:
     { email, name, company (honeypot), turnstile }
   Turnstile widget markup lives inside the page form; this
   script loads challenges.cloudflare.com/turnstile/v0/api.js
   in "explicit" mode and renders it into .nl-turnstile so it
   never collides with the contact page's auto-render widget.
   All state changes are announced via the .nl-msg live region.

   Crash guards (this file is re-executed by the SPA router on
   every visit to /newsletter/ within one page session):
     • window.__iepNlInit — only ONE instance ever wires forms,
       loads the Turnstile api.js, or registers global callbacks.
     • Widgets are tracked per-node and removed from the registry
       when their form is replaced (e.g. success state) so a stale
       Turnstile callback can never touch a detached DOM node.
   ============================================================ */

(function () {
  'use strict';

  /* ---- Re-entry guard ----
     The shim router clones <script> tags on each SPA navigation, so
     this IIFE can run several times in one document. Only the first
     copy does any real work; later copies exit immediately. */
  if (window.__iepNlInit) return;
  window.__iepNlInit = true;

  var ENDPOINT = 'https://decap-proxy.ykminmin8654.workers.dev/newsletter';
  var SITE_KEY = '0x4AAAAAAFMinCrsCsyi7S6X';
  /* Multiple sign-ups are allowed by design: people can subscribe several
     addresses (personal + school), and returning visitors always see the
     live form instead of a one-time "success" screen that could never be
     reset. No localStorage gate any more. */
  var MAX_WAIT_MS = 12000;              // hard cap on a submit fetch

  function getStored(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setStored(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---- Live Turnstile widgets, keyed by container node ---- */
  var widgets = []; // [{ el, id }]

  function dropWidget(el) {
    for (var i = widgets.length - 1; i >= 0; i--) {
      if (widgets[i].el === el) {
        var w = widgets.splice(i, 1)[0];
        try { if (window.turnstile && window.turnstile.remove) window.turnstile.remove(w.id); } catch (e) {}
      }
    }
  }
  function dropDetachedWidgets() {
    for (var i = widgets.length - 1; i >= 0; i--) {
      if (!document.body.contains(widgets[i].el)) {
        var w = widgets.splice(i, 1)[0];
        try { if (window.turnstile && window.turnstile.remove) window.turnstile.remove(w.id); } catch (e) {}
      }
    }
  }

  /* ---- Turnstile: expose callbacks BEFORE the api.js load ---- */
  window.iepNlTurnstileCb = function (token) {
    var el = document.getElementById('iep-nl-token');
    if (el) el.value = token || '';
  };
  window.iepNlTurnstileExpired = function () {
    var el = document.getElementById('iep-nl-token');
    if (el) el.value = '';
  };

  var tsLoaded = false;
  function ensureTurnstileScript() {
    if (tsLoaded) return;
    if (document.getElementById('iep-turnstile-script')) { tsLoaded = true; return; }
    var s = document.createElement('script');
    s.id = 'iep-turnstile-script';
    // ?render=explicit → nothing auto-renders; we call turnstile.render().
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=iepNlTsOnload&render=explicit';
    s.async = true;
    s.defer = true;
    // If the CDN script fails to load, don't leave a dead stub behind —
    // remove it so a later init() can retry instead of hanging forever.
    s.onerror = function () {
      tsLoaded = false;
      if (s.parentNode) s.parentNode.removeChild(s);
    };
    document.head.appendChild(s);
    tsLoaded = true;
  }
  window.iepNlTsOnload = function () { renderWidgets(); };

  function renderWidgets() {
    if (!window.turnstile) return;
    dropDetachedWidgets();
    var nodes = document.querySelectorAll('.cf-turnstile.nl-turnstile');
    Array.prototype.forEach.call(nodes, function (node) {
      if (node.dataset.rendered === '1') return;
      node.dataset.rendered = '1';
      try {
        var id = window.turnstile.render(node, {
          sitekey: SITE_KEY,
          theme: 'light',
          size: 'flexible',
          action: 'newsletter',
          callback: window.iepNlTurnstileCb,
          'expired-callback': window.iepNlTurnstileExpired,
          'error-callback': function () {
            node.dataset.rendered = '0';
            node.removeAttribute('data-rendered');
            dropWidget(node);
          }
        });
        widgets.push({ el: node, id: id });
      } catch (e) {
        node.dataset.rendered = '0';
        node.removeAttribute('data-rendered');
      }
    });
  }

  /* ---- Form wiring ---- */
  function showSuccess(form, email) {
    // Tear down any Turnstile widget inside the form BEFORE replacing its
    // innerHTML, otherwise Cloudflare keeps ticking against a detached node.
    var ts = form.querySelector('.cf-turnstile');
    if (ts) dropWidget(ts);
    var shown = email ? ' <strong class="nl-success__email">' + String(email).replace(/[<>&"]/g, '') + '</strong>' : '';
    form.innerHTML =
      '<div class="nl-success" role="status">' +
        '<span class="nl-success__icon"><i class="fas fa-envelope-circle-check"></i></span>' +
        '<strong>You\'re on the list!</strong>' +
        '<span>Confirmation sent to' + shown + ' — check your inbox. Need another address? Just reload the page.</span>' +
      '</div>';
    var wrap = form.closest('.nl-form--page') || form.parentElement;
    if (wrap) wrap.classList.add('is-done');
  }

  function wire(form) {
    var input = form.querySelector('.nl-input');
    var hp = form.querySelector('.nl-hp');
    var tokenEl = form.querySelector('#iep-nl-token');
    var msg = form.querySelector('.nl-msg');
    var btn = form.querySelector('.nl-submit');
    if (!input || !btn) return;

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      // Ignore submits while a request is already in flight — prevents
      // double posts (and stacked pending fetches) on impatient clicks.
      if (form.dataset.nlBusy === '1') return;
      msg.textContent = '';
      msg.className = 'nl-msg';

      var email = String(input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        msg.textContent = 'Please enter a valid email address.';
        msg.classList.add('is-error');
        input.focus();
        return;
      }

      form.dataset.nlBusy = '1';
      btn.disabled = true;
      btn.classList.add('is-loading');
      var label = btn.querySelector('.nl-submit__label');
      var prevLabel = label ? label.textContent : '';
      if (label) label.textContent = 'Subscribing…';

      var body = {
        email: email,
        name: '',
        company: hp ? hp.value : '',       // honeypot — humans leave empty
        turnstile: tokenEl ? tokenEl.value : ''
      };

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        // Hard cap: if the Worker/CDN hangs, abort after MAX_WAIT_MS so the
        // button can never stay stuck in the loading state forever.
        signal: (typeof AbortSignal !== 'undefined' && AbortSignal.timeout)
          ? AbortSignal.timeout(MAX_WAIT_MS)
          : undefined
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (data) {
          if (data && data.ok) {
            showSuccess(form, email);
            return;
          }
          throw new Error((data && data.error) || 'Something went wrong. Please try again.');
        })
        .catch(function (err) {
          msg.textContent = err && err.message ? err.message : 'Something went wrong. Please try again.';
          msg.classList.add('is-error');
        })
        .finally(function () {
          delete form.dataset.nlBusy;
          btn.disabled = false;
          btn.classList.remove('is-loading');
          if (label) label.textContent = prevLabel;
          // Re-arm Turnstile so a failed attempt can be retried.
          if (window.turnstile && window.turnstile.reset) {
            try { window.turnstile.reset(); } catch (e) {}
          }
          if (tokenEl) tokenEl.value = '';
        });
    });
  }

  function init() {
    var forms = document.querySelectorAll('form[data-nl-form]');
    if (!forms.length) return;
    Array.prototype.forEach.call(forms, function (f) {
      if (f.dataset.nlWired === '1') return;
      f.dataset.nlWired = '1';
      wire(f);
    });
    ensureTurnstileScript();
    renderWidgets(); // in case turnstile api.js is already loaded
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // The SPA router re-injects the newsletter page on navigation; re-wire then too.
  window.addEventListener('shim:content-loaded', init);
})();
