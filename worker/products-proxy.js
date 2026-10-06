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
 *   GITHUB_CLIENT_ID       GitHub OAuth App client id      (already set)
 *   GITHUB_CLIENT_SECRET   GitHub OAuth App secret         (already set)
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
const REPO_NAME = 'innovationearthprojects.github.io';
const PRODUCTS_DIR = 'products/data';
const PRODUCTS_CACHE_TTL = 60; // seconds

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
          return { slug: f.name.replace(/\.md$/, ''), ...fm };
        } catch {
          return null;
        }
      })
    );

    items = results.filter(Boolean);
    items.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
  } catch (err) {
    console.error('products error:', err);
    return json({ error: 'Could not load products.' }, 502);
  }

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

async function handleGithubProxy(request, env, url) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return json({ error: 'GitHub OAuth is not configured on this Worker.' }, 500);
  }

  const path = url.pathname.replace(/^\/api\/v1\/github\/?/, ''); // oauth | callback | token | <api path>

  // 1) Start login: send browser to GitHub's authorize page
  if (path === 'oauth') {
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', `${url.origin}/api/v1/github/callback`);
    authUrl.searchParams.set('scope', 'repo,read:user,user:email');
    authUrl.searchParams.set('state', url.searchParams.get('state') || '');
    return Response.redirect(authUrl.toString(), 302);
  }

  // 2) GitHub redirects back here with ?code&state -> hand it to the admin tab
  if (path === 'callback') {
    const params = url.search.slice(1) || '';
    const html =
      '<!doctype html><html><head><meta charset="utf-8"><title>Authenticating…</title></head>' +
      '<body style="font-family:sans-serif;padding:2rem"><p>You can close this tab once the admin page loads.</p>' +
      '<script>window.opener && window.opener.postMessage("github:true?' +
      params.replace(/"/g, '%22') +
      '", "*");setTimeout(function(){window.close();},500);</script></body></html>';
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS },
    });
  }

  // 3) Admin exchanges code for token (client secret stays server-side)
  if (path === 'token') {
    const body = await request.json().catch(() => ({}));
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: body.code || '',
      }),
    });
    const data = await tokenRes.json();
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

  if (company !== '') return json({ ok: true }); // bot: pretend success, drop it
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
    if (url.pathname.startsWith('/api/v1/github')) return handleGithubProxy(request, env, url);
    if (url.pathname === '/contact' && request.method === 'POST') return handleContact(request, env);

    if (url.pathname === '/') {
      return json({
        service: 'decap-proxy',
        routes: ['/products', '/contact (POST)', '/api/v1/github/*'],
      });
    }

    return json({ error: 'Not found' }, 404);
  },
};
