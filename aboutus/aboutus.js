<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Innovation Earth Projects — Free tools for student builders</title>
  <meta name="description" content="A student-run studio shipping free software for competitors, learners, and makers." />

  <!-- Redirect to the home page immediately -->
  <meta http-equiv="refresh" content="0; url=./home/home.html" />
  <link rel="canonical" href="./home/home.html" />

  <!-- Fallback styling for the brief moment before redirect -->
  <style>
    :root {
      --teal: #008080;
      --teal-deep: #005F5F;
      --ink: #0B1A1F;
      --ink-soft: #33474D;
      --muted: #6A8085;
      --bg: #F8FBFC;
      --surface: #FFFFFF;
      --border: #E1EDEF;
      --font: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      font-family: var(--font);
      background: var(--bg);
      color: var(--ink);
      display: grid;
      place-items: center;
      text-align: center;
      padding: 2rem;
    }
    .gateway {
      max-width: 420px;
    }
    .gateway__mark {
      display: inline-flex;
      color: var(--teal);
      margin-bottom: 1.5rem;
      animation: pulse 2s ease-in-out infinite;
    }
    .gateway__title {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 0.5rem;
      color: var(--teal-deep);
    }
    .gateway__sub {
      color: var(--muted);
      font-size: 0.95rem;
      margin: 0 0 1.5rem;
    }
    .gateway__link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: var(--teal);
      color: #fff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      transition: background 0.2s ease;
    }
    .gateway__link:hover { background: var(--teal-deep); }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.08); opacity: 0.85; }
    }
  </style>
</head>

<body>
  <div class="gateway">
    <span class="gateway__mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" width="64" height="64">
        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="3"/>
        <path d="M32 12 L32 52 M12 32 L52 32" stroke="currentColor" stroke-width="3"/>
        <circle cx="32" cy="32" r="8" fill="currentColor"/>
      </svg>
    </span>

    <h1 class="gateway__title">Innovation Earth Projects</h1>
    <p class="gateway__sub">Redirecting you to the home page…</p>

    <a class="gateway__link" href="./home/home.html">
      Continue <span aria-hidden="true">→</span>
    </a>
  </div>

  <!-- JS fallback in case meta refresh is blocked -->
  <script>
    window.location.replace('./home/home.html');
  </script>
</body>
</html>