# Deployment Guide — Innovation Earth Projects

This document tells you exactly what to do after the latest round of fixes:

1. **Products were failing to load** → the Cloudflare Worker pointed at a repo name that doesn't exist, and a JavaScript bug crashed the product grid. Both are fixed in this branch; you just need to paste the new Worker code and push the site.
2. **Pricing field added to Admin** → default is "Free". Nothing extra to configure.

Estimated time: ~10 minutes. No coding required beyond copy/paste.

---

## Part 1 — Update the Cloudflare Worker (fixes product loading)

### Step 1.1 — Open the Worker editor
1. Go to <https://dash.cloudflare.com> and log in.
2. Left sidebar → **Workers & Pages**.
3. Click the worker named **`decap-proxy`**.
4. Click **Edit Code** (opens the browser-based code editor).

### Step 1.2 — Replace the code
1. In the editor, select **everything** in the `worker.js` / main file pane (`Ctrl+A` / `Cmd+A`) and **delete it**.
2. Open the file **`worker/products-proxy.js`** from this repository (it's in the repo root under `worker/`), select all of it, and copy.
3. Paste into the Cloudflare editor.
4. Click **Save and Deploy** (top-right button).

> What changed in the code: `REPO_NAME` was `innovationearthprojects.github.io` (a repo that does not exist → the `/products` endpoint returned 502). It is now `Innovation-Earth-Projects-Website`, matching `admin/config.yml`. The contact form also now delivers via Formspree instead of a Cloudflare email binding.

### Step 1.3 — Verify the feed works
Open this URL in your browser (or run it in a terminal):

```
https://decap-proxy.ykminmin8654.workers.dev/products
```

You should see a JSON array like:

```json
[
  { "title": "Test", "slug": "test", "status": "beta", ... },
  ...
]
```

If you still see **"Could not load product list from GitHub"**, double-check you clicked *Save and Deploy* (not just Save), then add `?refresh=1` to the URL once to purge the cache:

```
https://decap-proxy.ykminmin8654.workers.dev/products?refresh=1
```

---

## Part 2 — Environment variables (Worker Settings)

Still on the **decap-proxy** worker page → **Settings** tab → **Variables and Secrets** → **Edit variables**.

| Variable | Required? | Value | Notes |
|---|---|---|---|
| `GITHUB_CLIENT_ID` | Yes (Admin login) | *(already set)* | From your GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | Yes (Admin login) | *(already set, type = Secret)* | From the same OAuth App |
| `FORMSPREE_ENDPOINT` | Only for the contact form | `https://formspree.io/f/XXXXXXX` | See Part 3 |
| `GITHUB_TOKEN` | Optional | Fine-grained PAT | Raises `/products` rate limit from 60/hr to 5000/hr. Create at <https://github.com/settings/personal-access-tokens/new>: public repo `Innovation-Earth-Projects-Website`, permission **Contents: Read-only**. Add as a **Secret** (not plain variable). |

Click **Save and Deploy** after adding anything.

> If `FORMSPREE_ENDPOINT` is missing, the contact form shows a friendly error but everything else (products, admin) keeps working normally.

---

## Part 3 — Contact form via Formspree (one-time, 3 minutes)

1. Sign up free at <https://formspree.io> using **InnovationEarthProjects@gmail.com**.
2. **New Form** → give it a name (e.g. "Website contact") → choose the Gmail address above as the destination.
3. Copy the endpoint URL shown on the form's page — it looks like `https://formspree.io/f/xdkazzzz`.
4. Paste it into the Worker variable `FORMSPREE_ENDPOINT` (Part 2) and deploy.
5. Submit a test message from `innovationearthprojects.org/contact` — it should arrive in Gmail within seconds. (The first submission may require clicking a one-time confirmation link in an email from Formspree.)

Messages arrive with the visitor's email as **Reply-To**, so replying in Gmail answers them directly. Automated replies can later be done with Gmail filters — no code needed.

---

## Part 4 — Push the website changes (GitHub Pages)

The site-side fixes (product-grid crash, pricing badges, About page, animations, contact page, removed Admin links) live in this branch. To publish:

```bash
git push origin HEAD:main        # or open a Pull Request and merge it
```

GitHub Pages will redeploy automatically (watch the Actions tab; usually 1–2 minutes).

Then hard-refresh the Products page with **Ctrl+Shift+R** (Cmd+Shift+R on Mac) to clear the 5-minute client-side cache. Your products saved in Admin should now appear both on `/products` and in the Home featured section.

---

## Part 5 — Using the Pricing field in Admin

1. Open the Admin panel directly by typing the URL (there are intentionally **no links** to it on the public site):
   `https://innovationearthprojects.org/admin/`
2. Sign in with GitHub.
3. **Products → New product** (or edit an existing one).
4. Fill in **Title**, etc. The new **Pricing** field defaults to `Free`. You can type any label: `$5/mo`, `One-time $20`, `Freemium`, `Contact us`…
5. **Save → Publish**. Within ~1 minute (Worker cache) + the Pages redeploy, the badge on the product card updates. Anything other than "Free" renders with the amber "paid" badge style automatically.

---

## Troubleshooting quick table

| Symptom | Cause | Fix |
|---|---|---|
| `/products` page says nothing loads, Worker returns 502 | Old Worker code still deployed | Redo Part 1 (paste + **Save and Deploy**) |
| Products load locally but not on the live site | GitHub Pages hasn't rebuilt yet, or browser cached old JS | Wait for the Actions build, then Ctrl+Shift+R |
| Contact form says "Something went wrong sending that" | `FORMSPREE_ENDPOINT` missing/typo, or Worker not redeployed after pasting new code | Part 2 + Part 3 |
| Admin login opens but errors | OAuth callback URL mismatch | GitHub OAuth App's callback must be exactly `https://decap-proxy.ykminmin8654.workers.dev/api/v1/github/callback` |
| Feed seems stale after publishing | Caches | `…/products?refresh=1` once, then hard-refresh the site |
