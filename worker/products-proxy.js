/* ============================================================================
 * IEP Worker — products feed + admin gate + GitHub API proxy + contact form
 * ----------------------------------------------------------------------------
 * Deploy at: https://decap-proxy.ykminmin8654.workers.dev
 *
 * Routes:
 *   GET  /products            -> JSON array of product cards (cached)
 *   POST /gate                -> admin key check, returns signed session ticket
 *   ANY  /api/v1/github/*     -> GitHub API proxy for the custom admin page
 *                                (reads public; writes need /gate ticket +
 *                                 WRITE_TOKEN secret). Decap CMS/OAuth REMOVED.
 *   POST /contact             -> forwards a contact message to your Gmail
 *                                inbox via Formspree (no Cloudflare email
 *                                binding required)
 *   OPTIONS *                 -> CORS preflight
 *
 * Required environment variables (Worker Settings -> Variables and Secrets):
 *   ADMIN_KEY              Your admin password (Secret text). Log in at
 *                          https://innovationearthprojects.org/admin/ with it.
 *   WRITE_TOKEN            Fine-grained PAT, Contents: Read & Write scoped to
 *                          ykminmin8654/Innovation-Earth-Projects-Website ONLY.
 *                          Used server-side for saves; never sent to browsers.
 *   FORMSPREE_ENDPOINT     e.g.
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
  // PUT + DELETE are required: the admin page saves (PUT) and removes
  // products (DELETE) through this Worker. Without them listed here, the
  // browser blocks those requests at the CORS preflight stage with a
  // network-level "Failed to fetch" before they ever reach the server.
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
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

const BUILD_ID = '2026-10-07.34';

// ---------------------------------------------------------------------------
// ADMIN GATE — password check endpoint (Decap removed; admin page is custom).
// The admin page POSTs the typed key to /gate; we compare it against the
// ADMIN_KEY secret in Cloudflare and return a short-lived HMAC-signed ticket.
// The key itself never appears in code or the browser beyond that ticket.
// Changing the password = just update ADMIN_KEY + Deploy.
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
  if (!env.ADMIN_KEY) {
    return json({ error: 'Admin gate not configured yet: add ADMIN_KEY in Workers → Settings → Variables & Secrets, then Deploy.' }, 501);
  }
  let key = '';
  try { key = String((await request.json()).key || ''); } catch (e) { /* fallthrough */ }
  // Constant-time-ish comparison via HMAC of both values.
  const okA = await hmacHex(env.ADMIN_KEY, 'verify:' + key);
  const okB = await hmacHex(env.ADMIN_KEY, 'verify:' + String(env.ADMIN_KEY));
  if (!safeEqual(okA, okB)) return json({ error: 'Wrong admin key.' }, 401);
  const ticket = await makeTicket(env, 'iep-admin');
  return json({ ok: true, ticket, expires_in_ms: TICKET_TTL_MS });
}

// ---------------------------------------------------------------------------
// GitHub API proxy — /api/v1/github/*  (the ONLY way the admin page writes).
// Decap CMS has been removed from this project: there is no OAuth login flow
// anymore at all. The custom admin page authenticates with the /gate ticket
// and sends it as "Authorization: Bearer <ticket>". We verify the ticket and
// then attach the repo's WRITE_TOKEN secret before forwarding to GitHub, so
// the token never leaves Cloudflare. Reads without a ticket still work (they
// fall back to GITHUB_TOKEN / unauthenticated), which keeps the transparent
// proxy usable for any future read-only features.
// ---------------------------------------------------------------------------
// The admin page only writes product files, so writes are restricted to
// products/data/*.md — nothing else (no images/, no other paths). The old
// implementation compared a single rigid, case-sensitive regex against
// url.pathname, which broke whenever the browser sent a differently-cased
// owner ("YkMinMin8654"), an encoded space, or a trailing slash — GitHub's
// API itself is case-insensitive for owners/repos, so those saves were valid
// but got blocked. Now we parse the path segment-by-segment: normalize each
// decoded segment, compare owner/repo case-insensitively, and require the
// file to be a plain "<slug>.md" directly inside products/data/.
function writePathAllowed(rawPath) {
  const segs = String(rawPath || '').split('/').map(function (s) {
    try { return decodeURIComponent(s).trim(); } catch (e) { return s.trim(); }
  }).filter(Boolean);
  // Expected: repos / <owner> / <repo> / contents / products / data / <name>.md
  if (segs.length !== 7) return false;
  if (segs[0].toLowerCase() !== 'repos') return false;
  if (segs[1].toLowerCase() !== 'ykminmin8654') return false;
  if (segs[2].toLowerCase() !== 'innovation-earth-projects-website') return false;
  if (segs[3].toLowerCase() !== 'contents') return false;
  if (segs[4].toLowerCase() !== 'products') return false;
  if (segs[5].toLowerCase() !== 'data') return false;
  return /^[a-z0-9][a-z0-9._-]*\.md$/i.test(segs[6]);
}

async function handleGithubProxy(request, env, url) {
  // Strip either prefix; accept /api/v1/github/* and /github/*.
  let path = url.pathname.replace(/^\/(api\/v1)?\/github\/?/, ''); // e.g. repos/.../contents/...
  // Normalize away trailing slashes so the write-path matcher never sees an
  // extra empty segment (e.g. ".../data/test.md/" from older admin pages).
  path = path.replace(/\/+$/, '');
  if (!path) {
    return json({ error: 'Missing GitHub API path after /github/. Example: /api/v1/github/repos/ykminmin8654/Innovation-Earth-Projects-Website/contents/products/data', running_build: BUILD_ID }, 404);
  }

  const authHeader = request.headers.get('Authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const wantsWrite = ['PUT', 'POST', 'PATCH', 'DELETE'].includes(request.method);

  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'decap-proxy-worker',
  };

  if (wantsWrite) {
    // Writes REQUIRE a valid admin-gate ticket and the WRITE_TOKEN secret.
    if (!env.ADMIN_KEY) {
      return json({ error: 'Admin gate not configured: add ADMIN_KEY secret, then log in at /admin/.', running_build: BUILD_ID }, 501);
    }
    const ticketOk = await checkTicket(env, bearer, 'iep-admin');
    if (!ticketOk) {
      return json({ error: 'Valid admin session required. Open innovationearthprojects.org/admin/, enter the admin key, then retry.', running_build: BUILD_ID }, 401);
    }
    if (!env.WRITE_TOKEN) {
      return json({ error: 'Worker cannot write: add the WRITE_TOKEN secret (fine-grained PAT with Contents: Read&Write on this repo) in Workers → Settings → Variables & Secrets, then Deploy.', running_build: BUILD_ID }, 501);
    }
    if (!writePathAllowed(path)) {
      // Include the exact path we received so a mismatch is immediately
      // obvious instead of a mystery "blocked" message.
      return json({ error: 'Write blocked: the admin may only modify product files (products/data/<name>.md) in your repo.', blocked_path: '/' + path, running_build: BUILD_ID }, 403);
    }
    headers.Authorization = `Bearer ${env.WRITE_TOKEN}`;
  } else {
    // Reads: prefer GITHUB_TOKEN (higher rate limit); allow caller's Bearer too.
    // Fallback chain: GITHUB_TOKEN -> WRITE_TOKEN -> caller PAT -> anonymous.
    // Anonymous reads share one Cloudflare egress IP and hit GitHub's 60/hr
    // limit fast; that used to surface as 403s, which the admin page wrongly
    // read as "session expired". Using WRITE_TOKEN for reads prevents that.
    if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
    else if (env.WRITE_TOKEN) headers.Authorization = `Bearer ${env.WRITE_TOKEN}`;
    else if (bearer && !bearer.includes('.')) headers.Authorization = `Bearer ${bearer}`; // raw PAT passthrough (legacy)
  }

  // Buffer the body so a failed upstream read can never surface as an opaque
  // network "Failed to fetch" in the browser, and so we can re-send it safely.
  let reqBody;
  if (!['GET', 'HEAD'].includes(request.method)) {
    reqBody = await request.arrayBuffer();
  }

  const target = `${GH_API}/${path}${url.search}`;
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: reqBody,
  });
  const buf = await upstream.arrayBuffer();
  // If GitHub rate-limited an (effectively anonymous) read, retry once with
  // any available token so the admin page never sees a raw 403 that it would
  // misread as "session expired".
  if (upstream.status === 403 && !headers.Authorization) {
    const tok = env.GITHUB_TOKEN || env.WRITE_TOKEN;
    if (tok) {
      headers.Authorization = `Bearer ${tok}`;
      const retry = await fetch(target, { method: request.method, headers, body: reqBody });
      return new Response(await retry.arrayBuffer(), {
        status: retry.status,
        headers: {
          'Content-Type': retry.headers.get('Content-Type') || 'application/json',
          ...CORS_HEADERS,
        },
      });
    }
  }
  return new Response(buf, {
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
        write_token_present: Boolean(env.WRITE_TOKEN),
        github_token_present: Boolean(env.GITHUB_TOKEN),
        formspree_configured: Boolean(env.FORMSPREE_ENDPOINT),
      });
    }

    return json({ error: 'Not found', running_build: BUILD_ID, routes: ['/products', '/gate (POST)', '/contact (POST)', '/api/v1/github/*', '/github/*'], hint: 'If this build id is not the newest one in DEPLOY.md, paste worker/products-proxy.js into Cloudflare and Deploy.' }, 404);
  },
};
