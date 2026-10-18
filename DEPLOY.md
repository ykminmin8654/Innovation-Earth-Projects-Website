# Admin Login — Password Gate Setup (v3 rewrite)

The admin login was completely rewritten. There is no more popup handshake,
no more "Completing sign-in…" hang, and the GitHub 404 cannot recur because
the token now travels in a URL **fragment** (`#iep_at=…`), which browsers
never send to any server.

## How it works now
1. Visit `https://innovationearthprojects.org/admin/` → you see a password box.
2. Enter the **admin key** → it is POSTed to the Worker's `/gate` route, which
   compares it against the `ADMIN_KEY` secret stored ONLY in Cloudflare and
   returns a signed ticket valid for 30 minutes.
3. With a valid ticket the Worker starts GitHub OAuth (same-tab redirect, no
   popup). After you approve on GitHub, the Worker exchanges the code for a
   token server-side and hands it back to the admin page via the URL fragment.
4. Decap CMS boots already signed-in; you land straight on the management UI.

Wrong/expired keys show "Wrong admin key." directly on the page. Anyone who
skips the gate gets a clear JSON error from `/oauth` instead of a broken login.

## One-time setup (Cloudflare dashboard only — no coding)
1. Workers → **decap-proxy** → Settings → **Variables and secrets**:
   - Add a **Secret text** variable named `ADMIN_KEY` with your chosen
     password value (e.g. a long random phrase). This IS the admin password —
     change it anytime by editing this variable + redeploying.
   - Keep existing `GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET` as they are.
2. Code tab: select everything, delete it, paste the current file from:
   `https://raw.githubusercontent.com/ykminmin8654/Innovation-Earth-Projects-Website/main/worker/products-proxy.js`
   Click **Deploy**.
3. Verify: open `https://decap-proxy.ykminmin8654.workers.dev/` — it must show
   `"build":"2026-10-07.27"` and `"admin_gate_configured": true`.
   If it still shows `.26`, the deploy did not take effect.

## GitHub OAuth App (one check)
The Worker always sends GitHub this exact callback URL — it MUST be listed
under your OAuth App → **Authorization callback URLs**
(https://github.com/settings/developers → app `Iv23liYfJrQsBnnhUgVp`):

```
https://decap-proxy.ykminmin8654.workers.dev/api/v1/github/callback
```

Do NOT use `innovationearthprojects.org/...` as the callback — that domain is
served by GitHub Pages, which has no `/api/v1/github/callback` route and
answers "404 There aren't more pages here" after you approve login. That was
the exact 404 seen in the browser address bar on github.com: the registered
callback pointed at a page that doesn't exist on that host. Build `.27` pins
the workers.dev callback (verified reachable, HTTP 200) for every step of the
flow, so even if an old tab starts a login with a stale URL, the token
exchange still succeeds.

## Using the admin
- URL: `https://innovationearthprojects.org/admin/` (not linked anywhere on the site).
- Type the admin key → Unlock → sign in on GitHub (approve once) → manage products.
- The key stays valid for 30 min per browser tab session; afterwards just
  re-enter it.

## Troubleshooting
| Symptom | Fix |
|---|---|
| "Could not reach the server" | Worker not deployed at `.26` yet — redo step 2 above. |
| "Admin gate not configured yet" | `ADMIN_KEY` variable missing — add it (step 1) and Deploy. |
| "Wrong admin key." | Typo or trailing space; copy the value you set in Cloudflare. |
| GitHub asks to authorize twice | Normal if you cleared cookies; approve again. |
| Products don't appear after saving | Wait ~1 min for GitHub Pages rebuild, then hard-refresh (Ctrl+Shift+R). |
