/* ============================================================
   CONTACT FORM
   Client-side validation + submission.

   Delivery: messages are POSTed to your Cloudflare Worker
   (ENDPOINTS.worker below). The Worker sends them straight to
   the Gmail inbox using its built-in Email binding — no third
   party, no API keys, and Decap CMS is untouched.

   Setup (one time, in the Cloudflare dashboard):
     Workers → decap-proxy → Settings → Bindings →
     Add "Send Email" binding, variable name EMAIL,
     destination address InnovationEarthProjects@gmail.com → Deploy

   If the Worker is unreachable, the form shows a simple error asking
   the visitor to try again.
   ============================================================ */

(function () {
  'use strict';

  /* ---------------- CONFIG ---------------- */

  var ENDPOINTS = {
    worker: 'https://decap-proxy.ykminmin8654.workers.dev/contact',   // your Cloudflare Worker (POST /contact)
    form: ''      // unused — kept in case you ever switch to Formspree
  };

  var DELIVERY_MODE = 'auto';           // 'auto' | 'none' ('none' skips the Worker and always errors)

  /* ------------------------------------------------------- */

  var form, statusBox, submitBtn;
  var fields = {};

  function init() {
    form = document.getElementById('contact-form');
    statusBox = document.getElementById('form-status');
    submitBtn = document.getElementById('cf-submit');
    if (!form || !statusBox || !submitBtn) return;

    fields = {
      name:    document.getElementById('cf-name'),
      email:   document.getElementById('cf-email'),
      subject: document.getElementById('cf-subject'),
      message: document.getElementById('cf-message')
    };

    form.addEventListener('submit', onSubmit);

    // Clear invalid state as the user fixes a field
    ['name', 'email', 'message'].forEach(function (key) {
      if (fields[key]) {
        fields[key].addEventListener('input', function () {
          fields[key].classList.remove('is-invalid');
        });
      }
    });
  }

  /* ---------------- Validation ---------------- */

  function validate() {
    var errors = [];

    if (!fields.name.value.trim()) {
      errors.push(['name', 'Please tell us your name.']);
    }

    var email = fields.email.value.trim();
    if (!email) {
      errors.push(['email', 'We need an email so we can reply.']);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      errors.push(['email', 'That email address doesn\u2019t look quite right.']);
    }

    if (fields.message.value.trim().length < 10) {
      errors.push(['message', 'Your message should be at least 10 characters.']);
    }

    return errors;
  }

  function showErrors(errors) {
    // reset
    Object.keys(fields).forEach(function (k) {
      if (fields[k] && fields[k].classList) fields[k].classList.remove('is-invalid');
    });
    if (!errors.length) return;
    errors.forEach(function (pair) {
      var el = fields[pair[0]];
      if (el && el.classList) el.classList.add('is-invalid');
    });
    setStatus('error', errors[0][1]);
    var first = fields[errors[0][0]];
    if (first && first.focus) first.focus();
  }

  /* ---------------- Status box ---------------- */

  function setStatus(kind, html) {
    statusBox.className = 'form-status is-visible is-' + kind;
    statusBox.innerHTML = html;
  }

  function clearStatus() {
    statusBox.className = 'form-status';
    statusBox.innerHTML = '';
  }

  /* ---------------- Submit flow ---------------- */

  function collectPayload() {
    var hp = document.getElementById('cf-company');
    return {
      name:    fields.name.value.trim(),
      email:   fields.email.value.trim(),
      subject: fields.subject ? fields.subject.value : 'General',
      message: fields.message.value.trim(),
      company: hp ? hp.value : '',        // honeypot — bots fill this in
      url:     window.location.href,
      time:    new Date().toISOString()
    };
  }

  function activeEndpoint() {
    if (DELIVERY_MODE === 'none') return null;
    if (ENDPOINTS.worker) return { url: ENDPOINTS.worker, style: 'json' };
    if (ENDPOINTS.form)   return { url: ENDPOINTS.form,   style: 'html' };
    return null;
  }

  function onSubmit(e) {
    e.preventDefault();
    clearStatus();

    var errors = validate();
    if (errors.length) { showErrors(errors); return; }

    var payload = collectPayload();
    var endpoint = activeEndpoint();

    if (!endpoint) {
      setStatus('error',
        '<i class="fas fa-triangle-exclamation"></i> Email delivery isn\u2019t set up yet. ' +
        'Please try again in a moment.');
      return;
    }

    setBusy(true);

    var opts = endpoint.style === 'json'
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      : { method: 'POST', headers: { Accept: 'application/json' }, body: JSON.stringify(payload) };

    fetch(endpoint.url, opts)
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (!res.ok) {
            var err = new Error((body && body.error) ? body.error : 'HTTP ' + res.status);
            if (body && body.configured === false) err.notConfigured = true;
            throw err;
          }
          return body;
        });
      })
      .then(function () {
        setBusy(false);
        form.reset();
        setStatus('success',
          '<i class="fas fa-circle-check"></i> Thanks! Your message is on its way \u2014 we\u2019ll reply within 1\u20133 business days.');
      })
      .catch(function (err) {
        console.error('Contact submit failed:', err);
        setBusy(false);
        // Surface the real reason instead of a generic guess: 501 means the
        // server's email delivery isn't configured, 429 means rate limited.
        if (err.notConfigured) {
          setStatus('error',
            '<i class="fas fa-triangle-exclamation"></i> Email delivery isn\u2019t set up on ' +
            'the server yet \u2014 this needs a one-time Cloudflare Worker configuration. ' +
            'Meanwhile you can reach us directly at InnovationEarthProjects@gmail.com.');
        } else if (/Too many/i.test(err.message)) {
          setStatus('error',
            '<i class="fas fa-triangle-exclamation"></i> Too many messages from your ' +
            'network \u2014 please wait about ten minutes and try again.');
        } else {
          setStatus('error',
            '<i class="fas fa-triangle-exclamation"></i> Couldn\u2019t send your message (' +
            err.message + '). Please try again in a moment, or email us at ' +
            'InnovationEarthProjects@gmail.com.');
        }
      });
  }

  /* ---------------- UI helpers ---------------- */

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.innerHTML = busy
      ? '<i class="fas fa-spinner fa-spin"></i> Sending\u2026'
      : '<i class="fas fa-paper-plane"></i> Send message';
  }

  /* ---------------- Boot ---------------- */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // SPA router re-injects page scripts on navigation
  window.addEventListener('shim:content-loaded', function () {
    setTimeout(init, 0);
  });
})();
