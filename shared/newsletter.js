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
   ============================================================ */

(function () {
  'use strict';

  var ENDPOINT = 'https://decap-proxy.ykminmin8654.workers.dev/newsletter';
  var SITE_KEY = '0x4AAAAAAFMinCrsCsyi7S6X';
  var DONE_KEY = 'iep_newsletter_done'; // remember success across pages

  function getStored(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setStored(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

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
    document.head.appendChild(s);
    tsLoaded = true;
  }
  window.iepNlTsOnload = function () { renderWidgets(); };

  function renderWidgets() {
    if (!window.turnstile) return;
    var nodes = document.querySelectorAll('.cf-turnstile.nl-turnstile');
    Array.prototype.forEach.call(nodes, function (node) {
      if (node.dataset.rendered === '1') return;
      node.dataset.rendered = '1';
      try {
        window.turnstile.render(node, {
          sitekey: SITE_KEY,
          theme: 'light',
          size: 'flexible',
          action: 'newsletter',
          callback: window.iepNlTurnstileCb,
          'expired-callback': window.iepNlTurnstileExpired,
          'error-callback': function () {
            node.dataset.rendered = '0';
            node.removeAttribute('data-rendered');
          }
        });
      } catch (e) { node.dataset.rendered = '0'; }
    });
  }

  /* ---- Form wiring ---- */
  function showSuccess(form, msg) {
    form.innerHTML =
      '<div class="nl-success" role="status">' +
        '<span class="nl-success__icon"><i class="fas fa-envelope-circle-check"></i></span>' +
        '<strong>You\'re on the list!</strong>' +
        '<span>' + (msg || 'Check your inbox for a confirmation email.') + '</span>' +
      '</div>';
  }

  function wire(form) {
    var input = form.querySelector('.nl-input');
    var hp = form.querySelector('.nl-hp');
    var tokenEl = form.querySelector('#iep-nl-token');
    var msg = form.querySelector('.nl-msg');
    var btn = form.querySelector('.nl-submit');
    if (!input || !btn) return;

    // Already subscribed from another page? Show the thank-you state.
    if (getStored(DONE_KEY)) { showSuccess(form); return; }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      msg.textContent = '';
      msg.className = 'nl-msg';

      var email = String(input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        msg.textContent = 'Please enter a valid email address.';
        msg.classList.add('is-error');
        input.focus();
        return;
      }

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
        body: JSON.stringify(body)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (data) {
          if (data && data.ok) {
            setStored(DONE_KEY, '1');
            showSuccess(form);
            return;
          }
          throw new Error((data && data.error) || 'Something went wrong. Please try again.');
        })
        .catch(function (err) {
          msg.textContent = err && err.message ? err.message : 'Something went wrong. Please try again.';
          msg.classList.add('is-error');
        })
        .finally(function () {
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
  // The SPA router re-injects the footer on navigation; re-wire then too.
  window.addEventListener('shim:content-loaded', init);
})();
