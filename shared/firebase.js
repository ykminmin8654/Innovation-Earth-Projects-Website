/* ============================================================
   FIREBASE — DISABLED
   Firebase is temporarily unavailable while the site is being
   rebuilt with hardcoded content. This file exists so that
   pages referencing it don't throw 404s. It sets a stub
   window.iepDB = null and fires a "failed" event so any
   listener knows to fall back.

   Re-enable later by uncommenting the init block below.
   ============================================================ */

(function () {
  'use strict';

  // Public handle — null means "no Firebase available"
  window.iepDB = null;

  // Let any listener know we're not using Firebase right now
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', notify);
  } else {
    notify();
  }

  function notify() {
    window.dispatchEvent(new Event('iep:db-failed'));
    console.log('ℹ️ Firebase disabled — using hardcoded content');
  }

  /* ----------------------------------------------------------
     TO RE-ENABLE LATER:
     Uncomment this block, and remove/comment the notify() calls
     above.

  var config = {
    apiKey: "AIzaSyCgV39r2JAR68jXqt2tSLMoW_2vKtJEFV0",
    authDomain: "innovation-earth-projects.firebaseapp.com",
    projectId: "innovation-earth-projects",
    storageBucket: "innovation-earth-projects.firebasestorage.app",
    messagingSenderId: "1061525102040",
    appId: "1:1061525102040:web:737c648bc2a548e90ce6ad",
    measurementId: "G-GBZCTX7LBL"
  };

  function init() {
    if (typeof firebase === 'undefined') {
      console.warn('⚠️ Firebase SDK not loaded');
      window.dispatchEvent(new Event('iep:db-failed'));
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(config);
      window.iepDB = firebase.firestore();
      console.log('✅ Firebase connected');
      window.dispatchEvent(new Event('iep:db-ready'));
    } catch (err) {
      console.error('❌ Firebase init failed:', err);
      window.dispatchEvent(new Event('iep:db-failed'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  ---------------------------------------------------------- */
})();