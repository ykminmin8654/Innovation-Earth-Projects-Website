/**
 * Cloudflare Worker — Turnstile Verification
 * 
 * Receives form submissions from any site form,
 * verifies the Turnstile token with Cloudflare's Siteverify API,
 * and returns success/failure.
 * 
 * Environment variable required:
 *   TURNSTILE_SECRET_KEY — your Turnstile secret from Cloudflare dashboard
 */

export default {
  async fetch(request, env) {
    // ----- CORS preflight -----
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // ----- Only allow POST -----
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    // ----- Parse form data -----
    let form;
    try {
      form = await request.formData();
    } catch (err) {
      return jsonResponse({ error: "Invalid form data" }, 400);
    }

    const token = form.get("cf-turnstile-response");
    const email = form.get("email");
    const ip = request.headers.get("CF-Connecting-IP") || "";

    // ----- Basic token validation -----
    if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
      return jsonResponse({ error: "Missing or invalid token" }, 403);
    }

    // ----- Verify with Cloudflare Siteverify -----
    const verifyData = new FormData();
    verifyData.append("secret", env.TURNSTILE_SECRET_KEY);
    verifyData.append("response", token);
    verifyData.append("remoteip", ip);

    let outcome;
    try {
      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: verifyData,
          signal: AbortSignal.timeout(10000),
        }
      );
      outcome = await verifyRes.json();
    } catch (err) {
      console.error("Siteverify request failed:", err);
      return jsonResponse({ error: "Verification service unavailable" }, 502);
    }

    // ----- Handle verification result -----
    if (!outcome.success) {
      return jsonResponse(
        {
          error: "Verification failed",
          codes: outcome["error-codes"] || [],
        },
        403
      );
    }

    // ----- Token verified — process submission -----
    // This is where you'd normally save the email to a database.
    // For now, just log and return success.

    if (email) {
      console.log(`✅ Verified submission from: ${email}`);
    }

    return jsonResponse({
      success: true,
      message: "Verified and accepted",
    }, 200);
  },
};

/**
 * Helper — return JSON response with proper CORS headers
 */
function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}