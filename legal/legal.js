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
    if (push) {
      history.replaceState(null, '', '#' + doc);
    }
  }

  function wire() {
    var tabs = document.querySelectorAll('.legal-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        activate(this.getAttribute('data-doc'), true);
      });
    }

    // Deep link support: /legal#tos opens the Terms tab.
    var hash = (location.hash || '').replace('#', '');
    if (hash === 'tos' || hash === 'privacy') activate(hash, false);

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
