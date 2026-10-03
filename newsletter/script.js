(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ... Your existing POSTS array and render functions ... */

    /* ------------------------------------------------------------
       SUBSCRIBE FORM HANDLER (WITH TURNSTILE)
       ------------------------------------------------------------ */
    function wireSubscribe() {
        var form = document.getElementById('subscribe-form');
        var input = document.getElementById('subscribe-email');
        var note = document.getElementById('subscribe-note');
        if (!form || !input || !note) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            var email = input.value.trim();

            // Reset UI state
            input.classList.remove('is-error');
            note.classList.remove('is-success', 'is-error');
            note.textContent = '';

            // 1. Basic Email Validation
            var validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (!validEmail) {
                input.classList.add('is-error');
                note.classList.add('is-error');
                note.textContent = 'Please enter a valid email address.';
                input.focus();
                return;
            }

            // 2. Check for Turnstile Token
            var tokenField = form.querySelector('[name="cf-turnstile-response"]');
            var turnstileToken = tokenField ? tokenField.value : '';

            if (!turnstileToken) {
                note.classList.add('is-error');
                note.textContent = 'Verification is still processing. Please wait a moment and try again.';
                return;
            }

            // 3. Send to Backend Worker for Verification & Processing
            note.textContent = 'Verifying...';
            var formData = new FormData(form);

            try {
                // REPLACE with your actual Cloudflare Worker URL
                var response = await fetch('https://YOUR_WORKER_NAME.YOUR_SUBDOMAIN.workers.dev', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Verification failed');
                }

                // 4. Success - Save locally (Firebase will replace this later)
                try {
                    var list = JSON.parse(localStorage.getItem('iep:newsletter') || '[]');
                    if (list.indexOf(email) === -1) list.push(email);
                    localStorage.setItem('iep:newsletter', JSON.stringify(list));
                } catch (err) { /* ignore storage errors */ }

                note.classList.add('is-success');
                note.textContent = "Thanks — you're on the list.";
                input.value = '';
                form.reset();

            } catch (error) {
                note.classList.add('is-error');
                note.textContent = 'Verification failed. Please try again.';
                console.error('Submission error:', error);
                
                // Optional: Reset Turnstile widget if available
                if (typeof turnstile !== 'undefined') {
                    var widget = form.querySelector('.cf-turnstile');
                    if (widget && widget.id) turnstile.reset(widget.id);
                }
            }
        });

        // Clear errors on new input
        input.addEventListener('input', function () {
            input.classList.remove('is-error');
            note.classList.remove('is-error');
            note.textContent = '';
        });
    }

    /* ... Your existing initReveals and boot functions ... */

    function boot() {
        // ... Your existing render calls ...
        wireSubscribe();
        console.log('✅ Newsletter ready');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();