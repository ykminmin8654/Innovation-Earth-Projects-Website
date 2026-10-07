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
const BUILD_ID = '2026-10-07.8';

async function handleGithubProxy(request, env, url) {
  // Strip either prefix; Decap's github backend appends "/github/..." to
  // base_url, so both /api/v1/github/* and /github/* must work.
  const path = url.pathname.replace(/^\/(api\/v1)?\/github\/?/, ''); // oauth | callback | token | <api path>

  // OAuth endpoints need the GitHub App credentials. The transparent API
  // proxy (path 4) works without them when the admin sends its own token,
  // so only fail for auth-specific routes.
  // Accept either naming style; Cloudflare vars are GITHUB_OAUTH_ID / GITHUB_OAUTH_SECRET.
  const clientId = env.GITHUB_OAUTH_ID || env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_OAUTH_SECRET || env.GITHUB_CLIENT_SECRET;

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
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    // Use the actual incoming base path so both /api/v1/github/* and /github/* aliases work.
    const basePath = url.pathname.replace(/\/oauth$/, '');
    authUrl.searchParams.set('redirect_uri', `${url.origin}${basePath}/callback`);
    authUrl.searchParams.set('scope', 'repo,read:user,user:email');
    authUrl.searchParams.set('state', url.searchParams.get('state') || '');
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
    let accessToken = '';
    let tokenError = '';
    if (code && clientId && clientSecret) {
      try {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: `${origin}${basePath}/callback`,
          }),
        });
        const data = await tokenRes.json().catch(() => ({}));
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
    const html =
      '<!doctype html><html><head><meta charset="utf-8"><title>Authenticating\u2026</title></head>' +
      '<body style="font-family:sans-serif;padding:2rem">' +
      '<p id="msg">Completing sign-in\u2026 you can close this tab once the admin page loads.</p>' +
      (accessToken ? '' : `<p style="color:#b00;font-size:.9rem">Token exchange failed: ${errText}</p>`) +
      '<scr' + 'ipt>(function(){' +
      'var ok=' + (accessToken ? 'true' : 'false') + ';' +
      'var payload="' + safePayload + '";' +
      'if(!window.opener){document.getElementById("msg").textContent="Please return to the admin tab and try Log in again.";return;}' +
      'var got=false;' +
      'function succeed(){try{window.opener.postMessage("authorization:github:success:"+payload,"*");}catch(e){}}' +
      'window.addEventListener("message",function(ev){' +
      'if(ev.data==="authorizing:github"){' +
      'got=true;' +
      'if(!ok){try{window.opener.postMessage("authorization:github:error:"+JSON.stringify({message:"Token exchange failed \u2014 check Worker variables"}),"*");}catch(e){}return;}' +
      'succeed();var t=0;' +
      'var iv=setInterval(function(){if(t++>24){clearInterval(iv);document.getElementById("msg").textContent="Login finished \u2014 refresh the admin tab if it did not load automatically.";return;}if(ok)succeed();},400);' +
      'try{window.close();}catch(e){}' +
      '}' +
      '});' +
      'function ping(){if(got)return;try{window.opener.postMessage("authorizing:github","*");}catch(e){}setTimeout(ping,500);}' +
      'ping();' +
      '})();</scr' + 'ipt></body></html>';
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS },
    });
  }

  // 3) Admin exchanges code for token (kept for compatibility; normally the
  // callback above already did the exchange and the admin never calls this).
  if (path === 'token') {
    const body = await request.json().catch(() => ({}));
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: body.code || '',
        redirect_uri: `${url.origin}${url.pathname.replace(/\/token$/, '')}/callback`,
      }),
    });
    const data = await tokenRes.json().catch(() => ({}));
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
        routes: ['/products', '/contact (POST)', '/api/v1/github/*', '/github/*'],
        oauth_configured: Boolean((env.GITHUB_OAUTH_ID || env.GITHUB_CLIENT_ID) && (env.GITHUB_OAUTH_SECRET || env.GITHUB_CLIENT_SECRET)),
        client_id_present: Boolean(env.GITHUB_OAUTH_ID || env.GITHUB_CLIENT_ID),
        client_secret_present: Boolean(env.GITHUB_OAUTH_SECRET || env.GITHUB_CLIENT_SECRET),
        github_token_present: Boolean(env.GITHUB_TOKEN),
        formspree_configured: Boolean(env.FORMSPREE_ENDPOINT),
      });
    }

    return json({ error: 'Not found' }, 404);
  },
};
