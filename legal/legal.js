/* ============================================================
   LEGAL — tab switching between Privacy Policy and Terms of
   Service, plus deep links (#privacy / #tos).
   ============================================================ */

(function () {
  'use strict';

  function activate(doc, push) {
    var tabs = document.querySelectorAll('.legal-tab');
    var docs = document.querySelectorAll('.legal-doc');
    for (var i = 0; i < tabs.length; i++) {
      var isMatch = tabs[i].getAttribute('data-doc') === doc;
      tabs[i].classList.toggle('is-active', isMatch);
      tabs[i].setAttribute('aria-selected', isMatch ? 'true' : 'false');
    }
    for (var j = 0; j < docs.length; j++) {
      var show = docs[j].id === 'doc-' + doc;
      docs[j].classList.toggle('is-active', show);
      if (show) docs[j].removeAttribute('hidden');
      else docs[j].setAttribute('hidden', '');
    }
    // Clean-URL mode (/legal/privacy, /legal/tos): the nav shim owns the
    // address bar — never write a #hash into it.
    var cleanDoc = getCleanDoc();
    if (push && !cleanDoc) {
      history.replaceState(null, '', '#' + doc);
    }
  }

  // Pretty paths supported without hashes: /legal/privacy and /legal/tos.
  function getCleanDoc() {
    var seg = (location.pathname || '').split('/').filter(Boolean).pop() || '';
    if (/^privacy/i.test(seg)) return 'privacy';
    if (seg === 'tos' || /^terms/i.test(seg)) return 'tos';
    return null;
  }

  function wire() {
    var tabs = document.querySelectorAll('.legal-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        activate(this.getAttribute('data-doc'), true);
      });
    }

    // Deep link support, in priority order:
    //   1. ?doc=privacy|tos   (set by the 404 shim for /legal/privacy hits)
    //   2. /legal/privacy path (SPA navigation keeps the pretty URL)
    //   3. legacy #privacy / #tos bookmarks
    var qd = (new URLSearchParams(location.search).get('doc') || '').toLowerCase();
    if (qd === 'tos' || qd === 'privacy') {
      activate(qd, false);
      // Drop the query so future tab clicks don't keep re-selecting it.
      history.replaceState({ shim: true }, '', location.pathname);
    } else if (getCleanDoc()) {
      activate(getCleanDoc(), false);
    } else {
      var hash = (location.hash || '').replace('#', '');
      if (hash === 'tos' || hash === 'privacy') activate(hash, false);
    }

    window.addEventListener('hashchange', function () {
      var h = (location.hash || '').replace('#', '');
      if (h === 'tos' || h === 'privacy') activate(h, false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  // The site's SPA router re-injects page scripts on navigation.
  window.addEventListener('shim:content-loaded', wire);
})();
