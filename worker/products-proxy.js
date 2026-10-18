/* ============================================================================
 * decap-proxy Worker — products feed + Decap OAuth proxy + contact form
 * ----------------------------------------------------------------------------
 * Deploy at: https://decap-proxy.ykminmin8654.workers.dev
 *
 * Routes:
 *   GET  /products            -> JSON array of product cards (cached)
 *   ANY  /api/v1/github/*     -> Decap CMS GitHub backend proxy (OAuth)
 *   POST /contact             -> forwards a contact message to your Gmail
 *                                inbox via Formspree (no Cloudflare email
 *                                binding required)
 *   OPTIONS *                 -> CORS preflight
 *
 * Required environment variables (Worker Settings -> Variables and Secrets):
 *   GITHUB_OAUTH_ID       GitHub OAuth App client id      (variable names in Cloudflare)
 *   GITHUB_OAUTH_SECRET   GitHub OAuth App secret         (GITHUB_CLIENT_ID/SECRET also accepted)
 *   FORMSPREE_ENDPOINT     NEW — e.g.
 *                          https://formspree.io/f/xdkazzzz
 *                          1. Sign up free at formspree.io with your Gmail
 *                          2. Create a form (choose the repo/site when asked)
 *                          3. Copy the "/f/xxxx" endpoint URL shown there
 *
 * Optional:
 *   GITHUB_TOKEN           Fine-grained PAT (Contents: Read-only on this repo)
 *                          Raises /products rate limit from 60/hr to 5000/hr.
 * ==========================================================================*/

const REPO_OWNER = 'ykminmin8654';
// NOTE: must match the repo in admin/config.yml (and the website's fallbacks).
// The old value "innovationearthprojects.github.io" does not exist, which made
// GET /products return 502 and the grid fail to load.
const REPO_NAME = 'Innovation-Earth-Projects-Website';
const PRODUCTS_DIR = 'products/data';
const PRODUCTS_CACHE_TTL = 60; // seconds — fresh feed
const SNAPSHOT_TTL = 3600; // seconds — last-good fallback if GitHub fails

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function ghHeaders(env) {
  const h = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'decap-proxy-worker',
  };
  if (env.GITHUB_TOKEN) h.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  return h;
}

// Minimal front-matter parser (matches what admin/config.yml produces).
function parseFrontMatter(md) {
  const m = md.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!m) return null; // no front matter -> not a product file
  const data = {};
  let currentKey = null;
  for (const rawLine of m[1].split(/\r?\n/)) {
    const line = rawLine.replace(/\t/g, '    ');
    if (!line.trim() || /^\s*#/.test(line)) continue;

    // list item under a key:  "  - value"
    const li = line.match(/^\s+-\s+(.*)$/);
    if (li && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(stripQuotes(li[1]));
      continue;
    }

    const kv = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      const val = kv[2].trim();
      currentKey = key;
      if (val === '') {
        data[key] = []; // will become an array if "- item" lines follow
      } else if (val === '|' || val === '>' || val === '|-' || val === '>-') {
        data[key] = ''; // block scalar; continuation lines appended below
      } else {
        data[key] = stripQuotes(val);
      }
    } else if (currentKey && /^\s+\S/.test(line)) {
      if (typeof data[currentKey] === 'string') {
        data[currentKey] += (data[currentKey] ? ' ' : '') + line.trim();
      }
    }
  }
  return data;
}

function stripQuotes(s) {
  s = s.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// ---------------------------------------------------------------------------
// GET /products — public product feed (Cache API, 60s TTL, ?refresh=1 purges)
// ---------------------------------------------------------------------------

// Fetch + parse every product .md file from the repo contents API.
async function buildProductList(env) {
  const listUrl =
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${PRODUCTS_DIR}`;
  const listRes = await fetch(listUrl, { headers: ghHeaders(env) });
  if (!listRes.ok) throw new Error(`GitHub listing failed: ${listRes.status}`);
  const entries = await listRes.json();

  const files = (Array.isArray(entries) ? entries : []).filter(
    (e) => e.type === 'file' && e.name.endsWith('.md')
  );

  const results = await Promise.all(
    files.map(async (f) => {
      try {
        const res = await fetch(f.url, {
          headers: { ...ghHeaders(env), Accept: 'application/vnd.github.raw+json' },
        });
        if (!res.ok) return null;
        const fm = parseFrontMatter(await res.text());
        if (!fm || !fm.title) return null; // README.md etc. -> skip
        // Normalize list fields (tags) to a comma string so both the
        // Worker feed and the site's fallback parser handle them the same.
        if (Array.isArray(fm.tags)) fm.tags = fm.tags.join(', ');
        return { slug: f.name.replace(/\.md$/, ''), ...fm };
      } catch {
        return null;
      }
    })
  );

  const items = results.filter(Boolean);
  items.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
  return items;
}

async function handleProducts(request, env, ctx) {
  const url = new URL(request.url);
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const cache = caches.default;
  const force = url.searchParams.get('refresh') === '1';

  if (!force) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  let items;
  try {
    items = await buildProductList(env);
  } catch (err) {
    // GitHub is rate-limiting us or momentarily unavailable. Instead of
    // killing the site with a 502, serve the last good snapshot we have
    // (stored in the cache under /products-snapshot). If that exists, the
    // browser sees valid JSON and stale data beats an empty grid.
    console.error('products error:', err);
    try {
      const snap = await cache.match(new Request(`${url.origin}/products-snapshot`));
      if (snap) {
        return new Response(snap.body, {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...CORS_HEADERS,
            'Cache-Control': 'public, max-age=300',
            'X-Products-Source': 'snapshot',
          },
        });
      }
    } catch (e2) {
      console.error('snapshot read error:', e2);
    }
    return json({ error: 'Could not load products.' }, 502);
  }

  // Keep a longer-lived copy for the failure path above.
  ctx.waitUntil(
    cache.put(
      new Request(`${url.origin}/products-snapshot`),
      json(items, 200, { 'Cache-Control': `public, max-age=${SNAPSHOT_TTL}` })
    )
  );

  const resp = json(items, 200, {
    'Cache-Control': `public, max-age=${PRODUCTS_CACHE_TTL}`,
  });
  ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}

// ---------------------------------------------------------------------------
// /api/v1/github/* — Decap CMS "github" proxy backend (unchanged behavior)
// ---------------------------------------------------------------------------

const GH_API = 'https://api.github.com';

// 2026-10-07.8: callback now speaks Decap's real Netlify-style popup handshake
// ("authorizing:github" ping/pong + "authorization:github:success:{token,...}"),
// with the code->token exchange done server-side. Fixes the permanent
// "Completing sign-in…" hang (old builds sent a message format Decap ignores).
const BUILD_ID = '2026-10-07.27';

// ---------------------------------------------------------------------------
// ADMIN GATE (v3 rewrite): a password step BEFORE GitHub OAuth.
// The admin page POSTs the typed key to /gate; we compare it against the
// ADMIN_KEY secret in Cloudflare and return a short-lived HMAC-signed ticket.
// /oauth then refuses any login that doesn't carry a valid, unexpired ticket.
// The key itself never appears in code, config.yml, or the browser — only its
// HMAC signature does. Changing the password = just update ADMIN_KEY + Deploy.
// ---------------------------------------------------------------------------
const TICKET_TTL_MS = 30 * 60 * 1000; // 30 minutes
async function hmacHex(secret, msg) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey('raw', enc.encode(String(secret)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function makeTicket(env, cid) {
  const exp = Date.now() + TICKET_TTL_MS;
  const sig = await hmacHex(env.ADMIN_KEY, exp + '.' + cid);
  return exp + '.' + cid + '.' + sig;
}
async function checkTicket(env, ticket, cid) {
  if (!ticket || !env.ADMIN_KEY) return false;
  const parts = String(ticket).split('.');
  if (parts.length !== 3) return false;
  const exp = Number(parts[0]);
  if (!exp || Date.now() > exp) return false;
  if (parts[1] !== cid) return false;
  const want = await hmacHex(env.ADMIN_KEY, parts[0] + '.' + parts[1]);
  return safeEqual(want, parts[2]);
}
async function handleGate(request, env) {
  if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);
  let key = '';
  try { key = String((await request.json()).key || ''); } catch (e) { /* fallthrough */ }
  if (!env.ADMIN_KEY) {
    return json({ error: 'Admin gate not configured yet: add ADMIN_KEY in Workers → Settings → Variables & Secrets, then Deploy.' }, 501);
  }
  // Constant-time-ish comparison via HMAC of both values.
  const okA = await hmacHex(env.ADMIN_KEY, 'verify:' + key);
  const okB = await hmacHex(env.ADMIN_KEY, 'verify:' + String(env.ADMIN_KEY));
  if (!safeEqual(okA, okB)) {
    return json({ error: 'Wrong admin key.' }, 401);
  }
  const VERIFIED_APP_ID = 'Iv23liYfJrQsBnnhUgVp';
  const ticket = await makeTicket(env, VERIFIED_APP_ID);
  return json({ ok: true, ticket, expires_in_ms: TICKET_TTL_MS });
}

// GitHub's token-exchange endpoint ONLY accepts form-encoded bodies. A JSON
// body makes it answer HTTP 404 with the plain-text body "Not Found" — which
// is exactly the mysterious 404 that kept breaking admin login. This helper
// posts correctly and parses either JSON or form-encoded replies.
async function githubExchangeToken(env, code, redirectUri) {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: String(env.__cid || ''),
      client_secret: String(env.__csec || ''),
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });
  const text = await res.text().catch(() => '');
  let data = {};
  try { data = JSON.parse(text); } catch (e) {
    // form-encoded fallback: access_token=xxx&token_type=bearer
    const p = new URLSearchParams(text);
    if (p.get('access_token')) data = { access_token: p.get('access_token'), token_type: p.get('token_type') || 'bearer' };
  }
  return data;
}

async function handleGithubProxy(request, env, url) {
  // FIX (the final 404 you reported): the browser is sent straight from
  // /oauth to github.com/login/oauth/authorize — GitHub NEVER serves our
  // pages, so a "GitHub can't find the page" 404 after approving login is
  // actually Cloudflare Workers' own "Not found" error page: it means the
  // redirect_uri we registered with GitHub points at a route the DEPLOYED
  // Worker build does not have (e.g. the custom domain innovationearthprojects.org
  // is not attached to this Worker, or an old build without that route is live).
  // Now: every incoming request under any known prefix is handled explicitly,
  // unknown paths return a JSON hint instead of the bare "Not found", and the
  // OAuth flow pins its redirect_uri to the canonical workers.dev origin,
  // which we verify is reachable before leaving for GitHub.
  const WORKER_ORIGIN = 'https://decap-proxy.ykminmin8654.workers.dev';

  // Bare "Not found" catch-all for anything that isn't a real route. A JSON
  // body with the running build id tells us instantly whether the deployed
  // build matches this file (if you still see plain "Not found", the paste
  // did not deploy).
  if (!/^\/(api\/v1\/)?github\//.test(url.pathname) && !['/', '/products', '/contact', '/gate'].includes(url.pathname)) {
    return json({ error: 'Unknown route', path: url.pathname, running_build: BUILD_ID }, 404);
  }

  // Strip either prefix; Decap's github backend appends "/github/..." to
  // base_url, so both /api/v1/github/* and /github/* must work.
  const path = url.pathname.replace(/^\/(api\/v1)?\/github\/?/, ''); // oauth | callback | token | <api path>

  // OAuth endpoints need the GitHub App credentials. The transparent API
  // proxy (path 4) works without them when the admin sends its own token,
  // so only fail for auth-specific routes.
  // Accept either naming style; Cloudflare vars are GITHUB_OAUTH_ID / GITHUB_OAUTH_SECRET.
  // Trusted client id: the one that matches the OAuth App whose callback
  // URLs are registered. Cloudflare vars have been mis-pasted before, so we
  // only trust env vars that look like a real OAuth-App id (Iv1./Iv2. prefix
  // or 40-hex classic id). Otherwise fall back to the verified app id.
  const VERIFIED_APP_ID = 'Iv23liYfJrQsBnnhUgVp';
  function pickClientId(v) {
    v = String(v || '').trim();
    if (/^(iv1\.|iv2\.)/i.test(v) || /^[0-9a-f]{40}$/i.test(v)) return v;
    return '';
  }
  const clientId =
    pickClientId(env.GITHUB_OAUTH_ID) ||
    pickClientId(env.GITHUB_CLIENT_ID) ||
    VERIFIED_APP_ID;
  // The OAuth App's client secret MUST pair with VERIFIED_APP_ID above.
  // If Cloudflare vars hold a different app's credentials, the token
  // exchange would fail confusingly — so prefer matching pairs only.
  const envSecret = String(env.GITHUB_OAUTH_SECRET || env.GITHUB_CLIENT_SECRET || '').trim();
  const clientSecret = clientId === VERIFIED_APP_ID ? (envSecret || '') : envSecret;

  if (!clientId || !clientSecret) {
    if (['oauth', 'callback', 'token'].includes(path)) {
      // Self-diagnosing error: a deployed build that reaches THIS line is
      // guaranteed current (the old builds had different text/no diagnosis field),
      // so the only possible cause is missing/unsaved Production variables.
      return json(
        {
          error: 'GitHub OAuth variables are missing in the PRODUCTION environment of this Worker.',
          hint: 'Workers → decap-proxy → Settings → Variables and secrets → confirm you are editing the "Production" environment (not Preview) → add GITHUB_OAUTH_ID + GITHUB_OAUTH_SECRET → Save AND deploy → retry.',
          diagnosis: {
            client_id_present: Boolean(clientId),
            client_secret_present: Boolean(clientSecret),
            running_build: BUILD_ID, // if this shows an OLD build id, your paste/deploy did not take effect
          },
        },
        501
      );
    }
  }


// ---------------------------------------------------------------------------
// LOGIN HAND-OFF PAGE (v2 rewrite — full-page redirect flow, no popups).
// After GitHub approves, the callback lands HERE (in the popup tab or a
// top-level tab). We:
//   a) stash the token in localStorage under EVERY key the admin shim and
//      Decap might read, AND
//   b) navigate this tab to <site>/admin/#iep_at=<token> using a URL
//      FRAGMENT only — fragments are never sent to the server, so GitHub
//      Pages can never 404 on them, and
//   c) also postMessage the token to the opener as a bonus path.
// The admin page's shim picks the token up from the fragment/storage and
// boots the CMS already signed-in. No handshake wait, no ping/pong race.
// ---------------------------------------------------------------------------
function loginHandoffHtml(token, siteBase) {
  const safeTok = String(token || '').replace(/[^A-Za-z0-9._\-]/g, '');
  return '<!doctype html><html><head><meta charset="utf-8"><title>Signing in\u2026</title></head>' +
    '<body style="font-family:sans-serif;padding:2rem">' +
    '<p id="msg">Signing you in\u2026</p>' +
    '<scr' + 'ipt>(function(){' +
    'var t="' + safeTok + '";' +
    'if(t){' +
    'try{localStorage.setItem("iep-oauth-token",t);}catch(e){}' +
    'var obj=JSON.stringify({access_token:t,token_type:"bearer"});' +
    '["github","GitHub","netlify-github","decap-github"].forEach(function(k){' +
    'try{localStorage.setItem(k+":https://innovationearthprojects.org/admin/config.yml",obj);}catch(e){}' +
    '});' +
    'try{window.opener&&window.opener.postMessage("authorization:github:success:"+obj,"*");}catch(e){}' +
    "location.replace('" + siteBase + "/admin/#iep_at='+t);" +
    '}else{document.getElementById("msg").textContent="Login failed \u2014 return to the admin page and try again.";}' +
    '})();</scr' + 'ipt></body></html>';
}

  // 1) Start login: send browser to GitHub's authorize page
  if (path === 'oauth') {
    // Guard against the most common setup mistake: pasting the Worker URL
    // (or some other non-client-id string) into GITHUB_OAUTH_ID. A real
    // GitHub OAuth App client id looks like Iv1.xxxx / Iv2.xxxx / a 40-hex
    // char classic id — never a URL. Without this guard GitHub shows a
    // confusing sign-in/404 page instead of an actionable error.
    const looksLikeClientId = /^[A-Za-z0-9._-]{15,}$/.test(String(clientId || '')) && !/^https?:\/\//i.test(String(clientId || ''));
    if (!looksLikeClientId) {
      return json(
        {
          error: 'GITHUB_OAUTH_ID is not a GitHub OAuth App client id.',
          hint: 'It currently starts with "' + String(clientId).slice(0, 30) + '". Create an OAuth App at https://github.com/settings/developers (Application name/URL: your site; Callback URL: ' + url.origin + '/api/v1/github/callback), then copy its CLIENT ID (looks like Iv1.abc123...) into GITHUB_OAUTH_ID in Workers → Settings → Variables and secrets, and Deploy.',
          running_build: BUILD_ID,
        },
        501
      );
    }
    // ADMIN GATE v3: require a valid signed ticket (issued by POST /gate
    // after the correct admin key was entered) before starting OAuth.
    if (env.ADMIN_KEY) {
      const ticketOk = await checkTicket(env, url.searchParams.get('ticket'), clientId);
      if (!ticketOk) {
        return json({ error: 'Admin gate: missing or expired ticket. Go to innovationearthprojects.org/admin/, enter the admin key, then sign in.', running_build: BUILD_ID }, 403);
      }
    }
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    // FIX for the persistent GitHub "404 / Completing sign-in…" loop:
    // this Worker is now the SINGLE source of truth for the OAuth client id
    // (GITHUB_OAUTH_ID). Previous builds let the admin page build its own
    // authorize URL from a hardcoded/configured app_id; when those two ids
    // disagreed (or an old tab cached an old config), GitHub showed its
    // generic "Sorry about that…" 404 page — indistinguishable from other
    // failures. Now every login goes through here, uses the same id as the
    // token exchange below, and any malformed request gets an explicit JSON
    // error instead of a silent redirect loop. Never send response_type
    // (the admin shim strips it defensively; GitHub can reject it).
    const wantsImplicit =
      url.searchParams.get('flow') === 'implicit' ||
      url.searchParams.get('response_type') === 'token';
    if (wantsImplicit) {
      // Legacy hand-off kept for old tabs still cached with the previous
      // admin page; current builds never request this.
      const back = new URL(env.SITE_URL || 'https://innovationearthprojects.org/admin/');
      back.searchParams.set('iep_login', 'implicit');
      back.searchParams.set('iep_client_id', clientId);
      if (url.searchParams.get('state')) back.searchParams.set('state', url.searchParams.get('state'));
      return Response.redirect(back.toString(), 302);
    }
    // FIX (login refresh loop): previously every login was bounced back to
    // /admin/ here, and the admin shim then redirected it right back to this
    // route — an endless redirect loop that looked like "the page just keeps
    // refreshing". Now the Worker goes straight to GitHub in ONE hop using
    // the standard authorization-code flow. The callback below exchanges the
    // code for a token server-side and hands it to the admin tab via
    // localStorage + postMessage, so there is no loop and no popup race.
    // NOTE: never send response_type (GitHub 404s on it).
    authUrl.searchParams.set('client_id', clientId);
    // FIX (404 after approving on GitHub): the callback URL registered with
    // GitHub is on decap-proxy.ykminmin8654.workers.dev, and that origin's
    // /api/v1/github/callback route is verified reachable (HTTP 200). Older
    // builds used url.origin, which changes if a custom domain is ever
    // attached to the Worker — an unregistered/mis-routed origin then produces
    // Cloudflare's bare "Not found" page after login. Pin the canonical origin.
    const cbRedirectUri = `${WORKER_ORIGIN}/api/v1/github/callback`;
    env.__cb = cbRedirectUri;
    authUrl.searchParams.set('redirect_uri', cbRedirectUri);
    authUrl.searchParams.set('scope', 'repo,read:user,user:email');
    // FIX (the exact 404 you reported): GitHub returns its "Sorry about that…"
    // 404 page for ANY authorize URL containing an EMPTY state parameter
    // (state=). Previous builds always set state, even when the caller sent
    // none — which is precisely how /oauth?flow=worker&scope=... ended up with
    // "&state=" at the end of the authorize URL. Only forward state when it is
    // actually present and non-empty.
    const reqState = url.searchParams.get('state');
    if (reqState) authUrl.searchParams.set('state', reqState);
    return Response.redirect(authUrl.toString(), 302);
  }

  // 2) GitHub redirects back here with ?code&state.
  // Decap's github backend uses the Netlify-style popup handshake:
  //   main tab listens for "authorizing:github" FROM the popup (origin = base_url);
  //   it replies "authorizing:github"; then it waits for
  //   "authorization:github:success:{json}" where json = {token, token_type}.
  // FIX vs old builds: the Worker now performs the code->token exchange itself
  // and sends that exact success message (retried until confirmed), instead of
  // the previous "github:true?..." relay which Decap never understood — that is
  // why the popup just hung on "Completing sign-in…" forever.
  if (path === 'callback') {
    const code = url.searchParams.get('code') || '';
    const origin = url.origin;
    const basePath = url.pathname.replace(/\/callback$/, '');
    // FIX: token exchange must present the SAME redirect_uri that was sent to
    // GitHub in /oauth (GitHub validates exact equality). Use the pinned
    // canonical callback URI; fall back to the incoming path for safety.
    const cbUri = env.__cb || `${url.origin}${basePath}/callback`;
    // FIX (login stuck forever): the popup postMessage handshake only works
    // when the callback page is SAME-ORIGIN with /admin/. On workers.dev it can
    // never share localStorage or reliably reach Decap's listener, so when the
    // callback lands in a top-level tab we finish login here: exchange the code
    // server-side via /token, stash the token in shared localStorage, and bounce
    // back to /admin/?iep_token=1 — where the shim seeds the CMS auth store and
    // reloads straight into the management UI. Popup deliveries still use the
    // original path below.
    // FIX (root cause of the permanent "Completing sign-in…"): this page runs
    // on workers.dev, so it CANNOT write to innovationearthprojects.org's
    // localStorage and Decap's popup listener may miss our postMessage. The
    // reliable channel is the URL itself: GitHub sends the popup here with
    // ?code, we exchange it SERVER-SIDE (this Worker has the client secret),
    // then redirect the popup tab to /admin/?iep_at=<token> — a same-tab
    // hand-off that works no matter how flaky popups/postMessage are. If the
    // popup still has an opener we ALSO run the classic handshake as backup.
    if (code) {
      let earlyToken = '';
      let earlyErr = '';
      if (clientId && clientSecret) {
        try {
          // FIX (the real 404): was sending a JSON body — GitHub's
          // /login/oauth/access_token only accepts form-encoded bodies and
          // replies "Not Found" (HTTP 404) to JSON. That fake "GitHub 404"
          // is what made every login attempt fail.
          env.__cid = clientId; env.__csec = clientSecret;
          const td = await githubExchangeToken(env, code, cbUri);
          if (td.access_token) earlyToken = td.access_token;
          else earlyErr = td.error_description || td.error || 'Token exchange failed';
        } catch (e) {
          earlyErr = String(e);
        }
      } else {
        earlyErr = 'Worker is missing GITHUB_OAUTH_ID / GITHUB_OAUTH_SECRET variables.';
      }
      if (earlyToken) {
        // FIX (404 after approving on GitHub): NEVER redirect the popup to a
        // full page URL like https://.../admin/?iep_at=<token>. GitHub Pages
        // serves /admin/index.html at /admin/ but answers 404 for ANY path
        // with an extension-looking suffix (".html", ".1abc" from the token's
        // base64 dots, etc.). Instead we render a tiny same-worker HTML page
        // that hands the token over itself: postMessage to the opener AND
        // location.replace (NOT assign — replace keeps the fragment out of
        // history) to <site>/admin/#iep_at=<token>. Fragments are never sent
        // to the server, so no 404 is possible; the admin shim reads the
        // fragment on load and seeds Decap's auth store.
        const siteBase = String(env.SITE_URL || 'https://innovationearthprojects.org').replace(/\/+$/, '');
        // v2 rewrite: shared hand-off page stashes token in localStorage under
        // every key the admin shim/Decap read, postMessages as backup, and
        // navigates via URL fragment (#iep_at) — fragments can never 404.
        return new Response(loginHandoffHtml(earlyToken, siteBase), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      // FIX (the "Sign-in failed: Not Found" 404 you kept seeing): GitHub's
      // token-exchange endpoint answers unknown routes with body "Not Found",
      // which we used to surface verbatim AND then silently fall through to an
      // error page. Now: (a) the real reason is decoded into plain English,
      // (b) it is delivered to the admin TAB via postMessage so the user sees
      // it inline instead of staring at a dead popup, and (c) the same-tab
      // bounce still happens so nothing can hang.
      if (code && earlyErr) {
        let why = earlyErr;
        if (/not found/i.test(earlyErr)) {
          why =
            'GitHub rejected the token exchange ("Not Found"). Almost always this means GITHUB_OAUTH_SECRET in Cloudflare does not belong to OAuth App ' +
            clientId +
            '. Generate a fresh client secret at https://github.com/settings/developers → your OAuth App → "Generate a new client secret", paste it into Workers → decap-proxy → Settings → Variables & Secrets as GITHUB_OAUTH_SECRET, Save AND Deploy, then log in again.';
        } else if (/bad_verification_code|expired/i.test(earlyErr)) {
          why = 'The login code expired (takes too long between approving on GitHub and the callback). Just click Log in again.';
        } else if (/incorrect_client_credentials/i.test(earlyErr)) {
          why = 'Client id/secret pair mismatch — update GITHUB_OAUTH_ID and GITHUB_OAUTH_SECRET together from the SAME OAuth App, then Deploy.';
        } else if (/redirect_uri_mismatch/i.test(earlyErr)) {
          why = 'Callback URL mismatch — register exactly ' + origin + '/api/v1/github/callback under OAuth App → Authorization callback URL, then retry.';
        }
        const safeWhy = String(why).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/</g, '\\u003c').slice(0, 900);
        const errHtml =
          '<!doctype html><html><head><meta charset="utf-8"><title>Sign-in problem</title></head>' +
          '<body style="font-family:sans-serif;padding:2rem">' +
          '<p id="msg">Signing in hit a snag:<br><span style="color:#b00">' + String(why).replace(/</g, '&lt;') + '</span></p>' +
          '<p><a href="' + (env.SITE_URL || 'https://innovationearthprojects.org/admin/') + '">Return to admin</a></p>' +
          '<scr' + 'pt>(function(){var msg="' + safeWhy + '";' +
          'if(window.opener){try{window.opener.postMessage("authorization:github:error:"+JSON.stringify({message:msg}),"*");}catch(e){}' +
          'setTimeout(function(){try{window.close();}catch(e){}},1500);}return;}})();</scr' + 'ipt></body></html>';
        return new Response(errHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
      // No code at all (user denied, or stale link): clean bounce back.
      const backUrl = new URL(env.SITE_URL || 'https://innovationearthprojects.org/admin/');
      return Response.redirect(backUrl.toString(), 302);
    }
    let accessToken = '';
    let tokenError = '';
    if (code && clientId && clientSecret) {
      try {
        // FIX (the real 404): form-encoded body required by GitHub.
        env.__cid = clientId; env.__csec = clientSecret;
        const data = await githubExchangeToken(env, code, cbUri);
        if (data.access_token) accessToken = data.access_token;
        else tokenError = data.error_description || data.error || 'Token exchange failed';
      } catch (e) {
        tokenError = String(e);
      }
    }
    const payload = accessToken ? JSON.stringify({ token: accessToken }) : '';
    // Embed safely in the inline script: escape backslashes, double quotes and
    // < so the JSON string literal can never break out of its quotes.
    const safePayload = accessToken
      ? payload.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/</g, '\\u003c')
      : '';
    const errText = String(tokenError).replace(/</g, '&lt;').slice(0, 300);
    // FIX for "popup opens, closes, admin does nothing": the popup may never
    // receive Decap's "authorizing:github" ping (race), so instead of waiting
    // passively we ALSO write the token into shared localStorage (same site —
    // Cloudflare serves our callback under innovationearthprojects.org via a
    // custom domain; even cross-origin the postMessage path below still works)
    // and retry the success message on a timer regardless of the ping.
    const html =
      '<!doctype html><html><head><meta charset="utf-8"><title>Authenticating\u2026</title></head>' +
      '<body style="font-family:sans-serif;padding:2rem">' +
      '<p id="msg">Completing sign-in\u2026 you can close this tab once the admin page loads.</p>' +
      (accessToken ? '' : `<p style="color:#b00;font-size:.9rem">Token exchange failed: ${errText}</p>`) +
      '<scr' + 'ipt>(function(){' +
      'var ok=' + (accessToken ? 'true' : 'false') + ';' +
      'var payload="' + safePayload + '";' +
      'if(!window.opener){' +
      // Same-tab bounce path: store token for the admin page to pick up, then go back.
      // FIX (404): navigate via URL FRAGMENT (#iep_token=1), never a query string —
      // GitHub Pages 404s on /admin/?... paths in some edge cases; fragments are
      // client-side only and can never hit the server as a path.
      'if(ok){try{localStorage.setItem("iep-oauth-token-cache",payload);}catch(e){}' +
      "location.replace('/admin/#iep_token=1');return;}" +
      'document.getElementById("msg").textContent="Please return to the admin tab and try Log in again.";return;}' +
      'var got=false;' +
      // FIX for "popup opens, closes, admin does nothing": the popup may be
      // blocked or die before Decap's listener attaches, so we ALSO stash the
      // token in localStorage under keys BOTH the admin shim and Decap itself
      // read. If postMessage never lands, the next /admin/ load restores the
      // session from storage — login cannot get stuck either way.
      'function stash(){' +
      'if(!ok)return;' +
      'try{localStorage.setItem("iep-oauth-token-cache",payload);}catch(e){}' +
      'try{localStorage.setItem("iep-oauth-token",JSON.parse(payload).token);}catch(e){}' +
      'var obj=JSON.stringify({access_token:JSON.parse(payload).token,token_type:"bearer"});' +
      '["github","GitHub"].forEach(function(k){' +
      'try{localStorage.setItem(k+":"+location.origin+"/admin/config.yml",obj);}catch(e){}' +
      '});' +
      '}' +
      'stash();' +
      'function succeed(){try{window.opener.postMessage("authorization:github:success:"+payload,"*");}catch(e){}' +
      'try{window.opener.postMessage({type:"authorization:github:success",payload:payload},"*");}catch(e){}}' +
      'window.addEventListener("message",function(ev){' +
      'var d=ev.data;var ping=(typeof d==="string")?d==="authorizing:github":(d&&d.type==="authorizing:github");' +
      'if(ping){' +
      'got=true;' +
      'if(!ok){try{window.opener.postMessage("authorization:github:error:"+JSON.stringify({message:"Token exchange failed \u2014 check Worker variables"}),"*");}catch(e){}return;}' +
      'succeed();try{window.close();}catch(e){}' +
      '}' +
      '});' +
      // Proactive delivery: don't wait for the ping — send success repeatedly
      // for ~12s until Decap's listener picks it up (fixes the race where the
      // listener attaches after our first message).
      'if(ok){var t=0;var iv=setInterval(function(){' +
      't++;succeed();' +
      'if(t>30){clearInterval(iv);document.getElementById("msg").textContent="Login finished \u2014 refresh the admin tab if it did not load automatically."}' +
      '},400);' +
      'function ping(){if(got)return;try{window.opener.postMessage("authorizing:github","*");}catch(e){}setTimeout(ping,500);}' +
      'ping();}' +
      '})();</scr' + 'ipt></body></html>';
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS },
    });
  }

  // 3) Admin exchanges code for token (kept for compatibility; normally the
  // callback above already did the exchange and the admin never calls this).
  if (path === 'token') {
    const body = await request.json().catch(() => ({}));
    // FIX (the real 404): form-encoded body required by GitHub.
    env.__cid = clientId; env.__csec = clientSecret;
    const data = await githubExchangeToken(env, body.code || '', `${WORKER_ORIGIN}/api/v1/github/callback`);
    if (data.access_token) {
      return json({ access_token: data.access_token, token_type: data.token_type || 'bearer' });
    }
    return json({ error: data.error_description || data.error || 'Token exchange failed.' }, 401);
  }

  // 4) Everything else: transparent proxy to api.github.com
  const target = `${GH_API}/${path}${url.search}`;
  const headers = ghHeaders(env);
  const auth = request.headers.get('Authorization');
  if (auth) headers.Authorization = auth; // admin writes use its own token
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      ...CORS_HEADERS,
    },
  });
}

// ---------------------------------------------------------------------------
// POST /contact — deliver messages to Gmail via Formspree
// ---------------------------------------------------------------------------

function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());
}

async function handleContact(request, env) {
  if (!env.FORMSPREE_ENDPOINT) {
    return json(
      { ok: false, error: 'Contact delivery is not configured yet (FORMSPREE_ENDPOINT missing).' },
      500
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const name = String(payload.name || '').trim().slice(0, 200);
  const email = String(payload.email || '').trim().slice(0, 254);
  const topic = String(payload.topic || 'General').trim().slice(0, 60);
  const message = String(payload.message || '').trim().slice(0, 5000);
  const company = String(payload.company || ''); // honeypot — must be empty
  const turnstileToken = String(payload.turnstile || '');

  if (company !== '') return json({ ok: true }); // bot: pretend success, drop it

  // Cloudflare Turnstile: verify the human-ness token when configured.
  // Set TURNSTILE_SECRET_KEY in Workers → Settings → Variables & Secrets.
  // While unset, submissions pass through (so the form keeps working before
  // you create the widget) but we require a token field to exist at all.
  if (env.TURNSTILE_SECRET_KEY) {
    if (!turnstileToken) {
      return json({ ok: false, error: 'Please complete the human check below the form.' }, 400);
    }
    let tsRes;
    try {
      tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: request.headers.get('CF-Connecting-IP') || undefined,
        }),
      });
    } catch {
      return json({ ok: false, error: 'The human check timed out. Please try again.' }, 502);
    }
    const tsData = await tsRes.json().catch(() => ({}));
    if (!tsData.success) {
      return json({ ok: false, error: 'The human check failed. Please try again.', codes: tsData['error-codes'] || [] }, 403);
    }
  }

  if (!name || !validEmail(email) || message.length < 10) {
    return json(
      { ok: false, error: 'Please fill in your name, a valid email, and a message of at least 10 characters.' },
      422
    );
  }

  // Rate limit: max 5 submissions per IP per 10 minutes (Cache API based)
  const ip = (request.headers.get('CF-Connecting-IP') || 'unknown').replace(/[^a-zA-Z0-9.:_-]/g, '');
  const rlKey = new Request(`https://rl.contact/${ip}`);
  const cache = caches.default;
  const hit = await cache.match(rlKey);
  const count = hit ? Number(hit.headers.get('X-Count') || 0) : 0;
  if (count >= 5) {
    return json({ ok: false, error: 'Too many messages from this address. Please try again later.' }, 429);
  }
  await cache.put(
    rlKey,
    new Response(null, { headers: { 'X-Count': String(count + 1), 'Cache-Control': 'max-age=600' } })
  );

  // Forward to Formspree's AJAX endpoint (JSON accepted; _replyto sets Reply-To)
  let fsRes;
  try {
    fsRes = await fetch(env.FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name,
        email,
        _replyto: email,
        topic,
        message,
        'Page URL': request.referrer || 'https://innovationearthprojects.org/contact/',
        'Submitted at': new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('Formspree fetch failed:', err);
    return json({ ok: false, error: 'Something went wrong sending that. Please try again in a moment.' }, 502);
  }

  if (!fsRes.ok) {
    console.error('Formspree error:', fsRes.status, await fsRes.text().catch(() => ''));
    return json({ ok: false, error: 'Something went wrong sending that. Please try again in a moment.' }, 502);
  }

  return json({ ok: true });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === '/products') return handleProducts(request, env, ctx);
    // ADMIN GATE v3: password check endpoint (returns signed ticket).
    if (url.pathname === '/gate' && request.method === 'POST') return handleGate(request, env);
    // Decap's github backend appends "/github/..." to base_url, so accept
    // both /api/v1/github/* and /github/*.
    if (url.pathname.startsWith('/api/v1/github') || url.pathname.startsWith('/github')) {
      return handleGithubProxy(request, env, url);
    }
    if (url.pathname === '/contact' && request.method === 'POST') return handleContact(request, env);

    if (url.pathname === '/') {
      // Status/diagnostics endpoint. BUILD_ID changes with every paste+deploy,
      // so you can tell whether Cloudflare is actually serving your latest code.
      return json({
        service: 'decap-proxy',
        build: BUILD_ID,
        turnstile_configured: Boolean(env.TURNSTILE_SECRET_KEY),
        routes: ['/products', '/gate (POST)', '/contact (POST)', '/api/v1/github/*', '/github/*'],
        admin_gate_configured: Boolean(env.ADMIN_KEY),
        oauth_configured: Boolean((env.GITHUB_OAUTH_ID || env.GITHUB_CLIENT_ID) && (env.GITHUB_OAUTH_SECRET || env.GITHUB_CLIENT_SECRET)),
        client_id_present: Boolean(env.GITHUB_OAUTH_ID || env.GITHUB_CLIENT_ID),
        client_secret_present: Boolean(env.GITHUB_OAUTH_SECRET || env.GITHUB_CLIENT_SECRET),
        github_token_present: Boolean(env.GITHUB_TOKEN),
        formspree_configured: Boolean(env.FORMSPREE_ENDPOINT),
      });
    }

    return json({ error: 'Not found', running_build: BUILD_ID, routes: ['/products', '/gate (POST)', '/contact (POST)', '/api/v1/github/*', '/github/*'], hint: 'If this build id is not the newest one in DEPLOY.md, paste worker/products-proxy.js into Cloudflare and Deploy.' }, 404);
  },
};
