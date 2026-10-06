# products/data

One markdown file per product, created **only** through the Admin panel (`/admin/`).

The Products page and the Home page read these files directly from the GitHub
repository via the public GitHub Contents API (see `products/products.js`),
because Jekyll on GitHub Pages does not publish raw `.md` files.

Files added here are picked up automatically after the CMS commits them —
no rebuild or code change is needed.
