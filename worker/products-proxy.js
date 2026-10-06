/**
 * Cloudflare Worker — Decap CMS GitHub Proxy + Products API
 *
 * Deploy this INSTEAD of (or alongside) the Turnstile worker at:
 *   decap-proxy.ykminmin8654.workers.dev
 *
 * It serves two purposes:
 *
 * 1. /api/v1/github/*  — OAuth proxy used by Decap CMS (admin panel).
 *    Required env vars (Settings → Variables):
 *      GITHUB_CLIENT_ID       GitHub OAuth App client ID
 *      GITHUB_CLIENT_SECRET   GitHub OAuth App client secret
 *    The GitHub OAuth App's callback URL must be exactly:
 *      https://decap-proxy.ykminmin8654.workers.dev/api/v1/github/oauth/callback
 *
 * 2. /products         — Public products feed for the website.
 *    Reads products/data/*.md straight from the repo via the GitHub
 *    Contents API, parses the front matter, and returns JSON.
 *    Responses are cached with Cloudflare Cache API (default 60 s) so
 *    visitors never burn the unauthenticated 60 req/hour GitHub limit.
 *    Optional env var:
 *      GITHUB_TOKEN  — a fine-grained PAT (contents: read only, public
 *                      repo). Raises the rate limit to 5000 req/hour.
 *
 * CORS is open (*) on all responses so any subdomain can call it.
 */

const REPO_OWNER = "ykminmin8654";
const REPO_NAME = "Innovation-Earth-Projects-Website";
const PRODUCTS_DIR = "products/data";
const PRODUCTS_CACHE_TTL = 60; // seconds

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function cors(headers = {}) {
  return { ...CORS_HEADERS, ...headers };
}

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: cors({ "Content-Type": "application/json; charset=utf-8", ...headers }),
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ----- CORS preflight -----
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors() });
    }

    // ----- Products feed for the public website -----
    if (url.pathname === "/products") {
      return handleProducts(request, env, ctx, url);
    }

    // ----- Decap CMS OAuth proxy (all GitHub API passthrough) -----
    if (url.pathname.startsWith("/api/v1/github/")) {
      return handleGithubProxy(request, env, url);
    }

    // ----- Contact form endpoint (public, rate-limited) -----
    // POST /contact  { name, email, subject, message }
    // If CONTACT_TO + RESEND_API_KEY are set, emails the team inbox;
    // otherwise just acknowledges (messages still logged in Workers).
    if (request.method === "POST" && url.pathname === "/contact") {
      return handleContact(request, env, ctx);
    }

    // ----- Legacy routes from the previous Turnstile worker -----
    // Keep them working so existing forms don't break while you migrate.
    // (Only if TURNSTILE_SECRET_KEY is still set on this worker.)
    if (request.method === "POST" && env.TURNSTILE_SECRET_KEY) {
      return handleLegacyTurnstile(request, env);
    }

    return jsonResponse(
      { ok: true, service: "iep-decap-proxy", endpoints: ["/products", "/contact", "/api/v1/github/*"] },
      200
    );
  },
};

/* ------------------------------------------------------------
   POST /contact — receive website contact-form messages.

   NO extra services or env vars are required. Delivery uses the
   Cloudflare Workers EmailService binding (built into Workers,
   free, and Gmail accepts the messages directly):

     - In the dashboard, open the Worker → Settings → Bindings →
       add an "Send Email" binding named EMAIL with destination
       address: InnovationEarthProjects@gmail.com
     - That's it. Deploy and the form works.

   The visitor's address is set as Reply-To, so hitting "Reply" in
   Gmail answers them directly. Automated replies can be handled
   later with Gmail filters — no code changes needed here.

   Optional env var:
     CONTACT_TO — override the inbox (must match the EMAIL binding's
                  destination address; defaults to the Gmail below).

   Rate limit: 5 submissions per IP per 10 minutes (Cache API).
------------------------------------------------------------ */
const CONTACT_DEFAULT_TO = "InnovationEarthProjects@gmail.com";

async function handleContact(request, env, ctx) {
  let data;
  try {
    const ct = request.headers.get("Content-Type") || "";
    if (ct.includes("application/json")) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }
  } catch {
    return jsonResponse({ ok: false, error: "Invalid payload" }, 400);
  }

  const name    = String(data.name || "").slice(0, 100).trim();
  const email   = String(data.email || "").slice(0, 150).trim();
  const subject = String(data.subject || "General").slice(0, 60).trim();
  const message = String(data.message || "").slice(0, 5000).trim();

  // ----- Spam trap: humans never fill the hidden field -----
  if (String(data.company || "").trim()) {
    return jsonResponse({ ok: true }, 200); // pretend success, drop silently
  }

  // ----- Server-side validation (never trust the client) -----
  if (!name || !message || message.length < 10) {
    return jsonResponse({ ok: false, error: "Missing required fields" }, 422);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return jsonResponse({ ok: false, error: "Invalid email address" }, 422);
  }

  // ----- Simple per-IP rate limit via Cache API -----
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  try {
    const cache = caches.default;
    const rlKey = new Request("https://rl.contact/" + encodeURIComponent(ip), {
      method: "GET",
      headers: { "Rate-Limit": "1" },
    });
    const hit = await cache.match(rlKey);
    if (hit) {
      return jsonResponse({ ok: false, error: "Too many messages, try again in a few minutes" }, 429);
    }
    ctx.waitUntil(
      cache.put(rlKey, new Response("ok", { headers: { "Cache-Control": "max-age=600" } }))
    );
  } catch (e) {
    console.warn("Rate-limit check failed (continuing):", e);
  }

  // ----- Deliver via the EmailMessage binding (no third party) -----
  if (!env.EMAIL) {
    console.error("No EMAIL binding on this worker — message logged only:",
      JSON.stringify({ name, email, subject, message }));
    return jsonResponse(
      { ok: false, error: "Email delivery not configured on the server" }, 500
    );
  }

  const to = env.CONTACT_TO || CONTACT_DEFAULT_TO;

  const msg = new EmailMessage(to, `${name} via website <noreply@innovationearthprojects.org>`, buildContactEmail(subject, name, email, message));
  msg.headers = { "Reply-To": email };

  try {
    await msg.send();
  } catch (e) {
    console.error("Email send failed:", e);
    return jsonResponse({ ok: false, error: "Delivery failed" }, 502);
  }

  return jsonResponse({ ok: true }, 200);
}

/* Plain-text email body (Gmail-friendly, no HTML needed). */
function buildContactEmail(subject, name, email, message) {
  return (
    `New contact-form message — topic: ${subject}\n` +
    `-------------------------------------------\n\n` +
    `Name:  ${name}\n` +
    `Email: ${email}\n` +
    `When:  ${new Date().toISOString()}\n\n` +
    `Message:\n${message}\n\n` +
    `— sent from innovationearthprojects.org/contact`
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Legacy Turnstile verification (was the entire old worker). */
async function handleLegacyTurnstile(request, env) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return jsonResponse({ error: "TURNSTILE_SECRET_KEY not set on this worker" }, 500);
  }
  let form;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: "Invalid form data" }, 400);
  }
  const token = form.get("cf-turnstile-response");
  const email = form.get("email");
  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (typeof token !== "string" || !token.length || token.length > 2048) {
    return jsonResponse({ error: "Missing or invalid token" }, 403);
  }
  const verifyData = new FormData();
  verifyData.append("secret", env.TURNSTILE_SECRET_KEY);
  verifyData.append("response", token);
  verifyData.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: verifyData,
    });
    const outcome = await res.json();
    if (!outcome.success) {
      return jsonResponse({ error: "Verification failed", codes: outcome["error-codes"] || [] }, 403);
    }
    if (email) console.log(`Verified submission from: ${email}`);
    return jsonResponse({ success: true, message: "Verified and accepted" });
  } catch (err) {
    console.error("Siteverify request failed:", err);
    return jsonResponse({ error: "Verification service unavailable" }, 502);
  }
}

/* ============================================================
 * 1. Decap CMS GitHub OAuth proxy
 *    Forwards /api/v1/github/{token,oauth,commit,user,...}
 *    to https://api.github.com/, injecting client_id/secret or
 *    the stored access_token as needed.
 * ============================================================ */

async function handleGithubProxy(request, env, url) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return jsonResponse(
      { error: "Worker misconfigured: set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET" },
      500
    );
  }

  const path = url.pathname.replace("/api/v1/github/", ""); // e.g. "token", "user", "repos/.../contents/..."
  const upstream = new URL("https://api.github.com/" + path);

  // Copy query params except our own credentials handling
  for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cookie");
  headers.delete("authorization");

  const method = request.method;

  if (path === "token") {
    // OAuth code exchange: Decap POSTs {code, ...}. Add client id/secret.
    const body = await request.json();
    body.client_id = env.GITHUB_CLIENT_ID;
    body.client_secret = env.GITHUB_CLIENT_SECRET;
    headers.set("content-type", "application/json");
    return forward(await fetch(upstream, { method: "POST", headers, body: JSON.stringify(body) }));
  }

  if (path === "oauth") {
    // Redirect user to GitHub's authorize page.
    const redirect = new URL("https://github.com/login/oauth/authorize");
    redirect.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    redirect.searchParams.set("scope", "public_repo");
    redirect.searchParams.set("allow_signup", "false");
    const state = url.searchParams.get("state") || "";
    if (state) redirect.searchParams.set("state", state);
    redirect.searchParams.set(
      "redirect_uri",
      url.origin + "/api/v1/github/callback?redirect_uri=" +
        encodeURIComponent(url.searchParams.get("redirect_uri") || "")
    );
    return Response.redirect(redirect.toString(), 302);
  }

  if (path === "callback") {
    // GitHub lands here with ?code&state; hand them back to the admin page.
    // Decap reads code/state from the URL hash/query of its own page.
    let adminUrl = url.searchParams.get("redirect_uri") || "";
    if (!/^https?:\/\//.test(adminUrl)) {
      adminUrl = "https://innovationearthprojects.org/admin/index.html";
    }
    const target = new URL(adminUrl);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const err = url.searchParams.get("error");
    if (code) target.searchParams.set("code", code);
    if (state) target.searchParams.set("state", state);
    if (err) target.searchParams.set("error", err);
    return Response.redirect(target.toString(), 302);
  }

  // All other calls (commit, user, repos/...) need an Authorization header.
  // Decap sends it as `Authorization: Bearer <token>` in the original request.
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  const res = await fetch(upstream.toString(), {
    method,
    headers,
    body: ["POST", "PUT", "PATCH", "DELETE"].includes(method) ? request.body : undefined,
  });
  return forward(res);
}

// Strip hop-by-hop bits, add CORS, pass through status/body.
async function forward(res) {
  const out = new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: cors({ "Content-Type": res.headers.get("content-type") || "application/json" }),
  });
  return out;
}

/* ============================================================
 * 2. Public products feed: GET /products
 *    Returns: [{ slug, title, description, image, link, tags,
 *                status, date, ... }, ...]
 * ============================================================ */

async function handleProducts(request, env, ctx, url) {
  const cache = caches.default;
  const cacheKey = new Request(url.origin + "/products", { method: "GET" });
  const force = url.searchParams.get("refresh") === "1";

  if (!force) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  let files;
  try {
    files = await listProductFiles(env);
  } catch (err) {
    console.error("GitHub contents listing failed:", err);
    return jsonResponse({ error: "Could not load product list from GitHub" }, 502);
  }

  const products = [];
  await Promise.all(
    files.map(async (f) => {
      try {
        const raw = await fetchFileContent(f, env);
        const parsed = parseFrontMatter(raw);
        // README.md / files without front matter are skipped automatically
        if (Object.keys(parsed.data).length === 0) return;
        products.push({ slug: f.name.replace(/\.md$/i, ""), ...parsed.data });
      } catch (err) {
        console.error("Failed to parse", f.name, err);
      }
    })
  );

  products.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const etag = '"' + products.map((p) => p.slug).join(",") + '"';
  if (request.headers.get("if-none-match") === etag && products.length) {
    return new Response(null, { status: 304, headers: cors({ ETag: etag }) });
  }

  const response = jsonResponse(products, 200, {
    "Cache-Control": `public, max-age=${PRODUCTS_CACHE_TTL}`,
    ETag: etag,
  });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

async function listProductFiles(env) {
  const api = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${PRODUCTS_DIR}`;
  const res = await fetch(api, { headers: ghHeaders(env) });
  if (!res.ok) throw new Error(`GitHub contents API ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json)) throw new Error("Unexpected contents API response");
  return json.filter((f) => /\.md$/i.test(f.name));
}

async function fetchFileContent(file, env) {
  // Prefer download_url (raw CDN, no rate limit); fall back to base64 body.
  if (file.download_url) {
    const res = await fetch(file.download_url);
    if (res.ok) return res.text();
  }
  const res = await fetch(file.url, { headers: ghHeaders(env) });
  if (!res.ok) throw new Error(`Fetch ${file.name} failed: ${res.status}`);
  const json = await res.json();
  return decodeBase64(json.content);
}

function ghHeaders(env) {
  const h = {
    Accept: "application/vnd.github+json",
    "User-Agent": "iep-products-proxy",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (env.GITHUB_TOKEN) h.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  return h;
}

function decodeBase64(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

/* Minimal YAML front-matter parser (flat key: value + inline lists),
 * matching what Decap writes for the Products collection. */
function parseFrontMatter(text) {
  const data = {};
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return { data, body: text };
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      data[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => stripQuotes(s.trim()))
        .filter(Boolean);
    } else if (/^(true|false)$/i.test(val)) {
      data[key] = val.toLowerCase() === "true";
    } else {
      data[key] = stripQuotes(val);
    }
  }
  return { data, body: text.slice(m[0].length) };
}

function stripQuotes(s) {
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }
  return s;
}
