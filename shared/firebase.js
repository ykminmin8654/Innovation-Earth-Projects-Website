/* ============================================================
   FIREBASE — single shared init
   Exposes: window.iepDB (Firestore instance or null)
   Emits:   'iep:db-ready'  → Firebase is connected
            'iep:db-failed' → init failed, use fallback
   Depends on: firebase-app-compat.js + firebase-firestore-compat.js
   ============================================================ */

(function () {
  'use strict';

  const config = {
    apiKey: "AIzaSyCgV39r2JAR68jXqt2tSLMoW_2vKtJEFV0",
    authDomain: "innovation-earth-projects.firebaseapp.com",
    projectId: "innovation-earth-projects",
    storageBucket: "innovation-earth-projects.firebasestorage.app",
    messagingSenderId: "1061525102040",
    appId: "1:1061525102040:web:737c648bc2a548e90ce6ad",
    measurementId: "G-GBZCTX7LBL"
  };

  // Public handle — every page reads window.iepDB
  window.iepDB = null;

  function init() {
    // SDK must be loaded by the page <head>
    if (typeof firebase === 'undefined') {
      console.warn('⚠️ Firebase SDK not loaded — using local fallback');
      window.dispatchEvent(new Event('iep:db-failed'));
      return;
    }

    try {
      // Reuse existing app if a hot reload re-runs this script
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }

      window.iepDB = firebase.firestore();

      console.log('✅ Firebase connected');
      window.dispatchEvent(new Event('iep:db-ready'));

      // Optional: enable offline persistence (safe no-op if already enabled)
      window.iepDB
        .enablePersistence({ synchronizeTabs: true })
        .catch(err => {
          // Fails silently if multiple tabs are open — not fatal
          if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
            console.warn('Persistence not enabled:', err.code);
          }
        });

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
})();