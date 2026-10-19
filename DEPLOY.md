# Deployment guide — Innovation Earth Projects

Everything is pushed to GitHub (`main`). Two things need a manual step:
1. **Cloudflare Worker** (can only be updated from the Cloudflare dashboard).
2. Nothing else — the website deploys automatically via GitHub Pages.

---

## What changed (Oct 19): Decap CMS fully removed

The admin panel at `https://innovationearthprojects.org/admin/` is now a
**custom, self-contained page**. No more Decap bundle, no more GitHub OAuth
login, no more popup handshakes or "Completing sign-in…" hangs.

New flow:

1. Open `/admin/` → enter your **admin key** (a password stored as a secret in
   Cloudflare — never in any code file).
2. The Worker verifies the key and returns a signed session ticket (30 min).
3. You get a product list with Edit / + New product / Delete buttons. Saves
   commit directly to `products/data/*.md` in this repo through the Worker's
   GitHub proxy. The public Products page reads those files within ~1 minute.

There is **no redirect to github.com at any point**, so none of the previous
404 / loop failure modes can occur.

---

## Step 1 — Cloudflare Worker setup (once)

Workers & Pages → **decap-proxy** → Settings → **Variables and secrets**:

| Name | Type | Value |
|---|---|---|
| `ADMIN_KEY` | Secret text | Pick any strong password. This IS your admin login. Change it anytime by editing this value + Deploy. |
| `WRITE_TOKEN` | Secret text | A GitHub fine-grained PAT (see below) used server-side for saves. Never sent to browsers. |
| `TURNSTILE_SECRET_KEY` | Secret text | Your Turnstile widget's **secret** key (dash.cloudflare.com → Turnstile → your widget → copy Secret Key). Enables real bot-blocking on the admin gate + contact form. Without it, the checkbox shows but is NOT verified server-side. |
| `FORMSPREE_ENDPOINT` | Variable | Your Formspree form URL (contact form → Gmail). Keep as-is if already set. |
| `GITHUB_TOKEN` | Variable (optional) | Read-only PAT; raises the products-feed rate limit. Keep if already set. |

You may **delete** `GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET` — they are unused
now. The GitHub OAuth App itself can also be deleted at
github.com/settings/developers once everything works.

### Creating WRITE_TOKEN
GitHub → Settings → Developer settings → Fine-grained personal access tokens →
Generate new:
- Repository access: **Only select repositories → ykminmin8654/Innovation-Earth-Projects-Website**
- Permissions → Repository permissions → **Contents: Read and write**
- Copy the token into `WRITE_TOKEN` in Cloudflare.

## Step 2 — Deploy the Worker code

Code tab → select all → delete → paste the contents of
`worker/products-proxy.js` from this repo (raw link):
`https://raw.githubusercontent.com/ykminmin8654/Innovation-Earth-Projects-Website/main/worker/products-proxy.js`
→ **Deploy**.

Verify: open `https://decap-proxy.ykminmin8654.workers.dev/` — it must show
`"build": "2026-10-07.30"` with `"admin_gate_configured": true` and
`"write_token_present": true`. If the build id is older, the deploy didn't take.

## Step 3 — Use the admin

Open `https://innovationearthprojects.org/admin/`, enter the key from step 1.
- **+ New product** / **Edit** / **Delete** work exactly like the old CMS fields
  (title, description, status, url, pricing, tags, order, icon).
- Pricing defaults to `Free`; type anything else ("$5/mo", "Freemium") and the
  card shows an amber price badge.
- Session lasts 30 minutes, then re-enter the key.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Admin gate not configured yet" | `ADMIN_KEY` secret missing — add it (step 1), Deploy. |
| "Wrong admin key." | Typo or you changed ADMIN_KEY — use the current value. |
| Save fails: "Worker cannot write" | `WRITE_TOKEN` missing/expired/scoped wrong — redo step 1. |
| Save fails: "Write blocked" | Shouldn't happen from the UI; the proxy only allows `products/data/*` and `images/*` in your repo. |
| Product saved but not on site | Wait ~1 min for GitHub Pages rebuild + 60 s Worker cache; hard-refresh (Ctrl+Shift+R). |
| Status endpoint shows old build | Paste failed — reopen Code tab, replace ALL content, Deploy again. |


## Newsletter (added 2026-10-19, updated 2026-10-20)
- Public page at /newsletter/ (linked from the top nav; NOT in the footer). Protection: Turnstile + honeypot + per-IP rate limit.
- It POSTs to the Worker route /newsletter. To activate: paste worker/products-proxy.js (build 2026-10-20.41) into Cloudflare -> decap-proxy -> Deploy.
- Verify: curl https://decap-proxy.ykminmin8654.workers.dev/ should report build 2026-10-20.41.
- WHERE THE EMAILS GO — pick ONE by setting the `NEWSLETTER_PROVIDER` secret:
  1. **Email straight to your Gmail (simplest)**: set `NEWSLETTER_PROVIDER=email`.
     Each signup is forwarded through the existing `FORMSPREE_ENDPOINT` (the same
     Formspree form that already delivers contact messages to your Gmail), with
     subject "Newsletter signup: <email>". No new accounts needed. Tip: create a
     second free Formspree form for newsletter-only traffic and point
     FORMSPREE_ENDPOINT at it if you don't want signups mixed with contacts.
  2. **Buttondown** (free up to 1,000 subscribers, has its own send-newsletter UI):
     set `NEWSLETTER_PROVIDER=buttondown` + `BUTTONDOWN_API_KEY` (secret, from
     buttondown.com → Settings → API).
  3. **Beehiiv**: set `NEWSLETTER_PROVIDER=beehiiv` + `BEEHIIV_API_KEY` +
     `BEEHIIV_PUBLICATION_ID` (secrets, from beehiiv dashboard → Settings → API).
  - If `NEWSLETTER_PROVIDER` is unset, signups are accepted but stored ONLY in
    Workers live logs (dash.cloudflare.com → Workers & Pages → decap-proxy →
    Logs → Start live logs, then submit a test signup on /newsletter/ and look
    for `NEWSLETTER_SIGNUP`). They do NOT email you until you configure a provider.
- After changing secrets: click Deploy once so they take effect.
