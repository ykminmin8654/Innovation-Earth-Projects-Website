/* ============================================================
   Build newsletter/posts.json from newsletter/posts/*.md
   Runs in GitHub Actions when you publish via Decap CMS.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'newsletter', 'posts');
const OUTPUT_FILE = path.join(__dirname, '..', 'newsletter', 'posts.json');

/* ------------------------------------------------------------
   Minimal frontmatter parser
   ------------------------------------------------------------ */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const yamlBlock = match[1];
  const body = match[2];

  const data = {};
  const lines = yamlBlock.split('\n');

  for (let line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (value === 'true')  { data[key] = true;  continue; }
    if (value === 'false') { data[key] = false; continue; }

    data[key] = value;
  }

  return { data, body: body.trim() };
}

/* ------------------------------------------------------------
   Read time estimation (only relevant if body exists)
   ------------------------------------------------------------ */
function estimateReadTime(body) {
  if (!body) return '';
  const words = body.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return minutes + ' min read';
}

/* ------------------------------------------------------------
   Default icon per category
   ------------------------------------------------------------ */
function defaultIconFor(category) {
  switch (category) {
    case 'product':  return 'fa-rocket';
    case 'research': return 'fa-flask';
    case 'studio':   return 'fa-building';
    default:         return 'fa-star';
  }
}

/* ------------------------------------------------------------
   License metadata
   ------------------------------------------------------------ */
function licenseMeta(key) {
  const map = {
    'all-rights-reserved': { label: 'All Rights Reserved', url: null },
    'cc-by-4.0':           { label: 'CC BY 4.0',           url: 'https://creativecommons.org/licenses/by/4.0/' },
    'cc-by-sa-4.0':        { label: 'CC BY-SA 4.0',        url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    'cc-by-nc-4.0':        { label: 'CC BY-NC 4.0',        url: 'https://creativecommons.org/licenses/by-nc/4.0/' },
    'cc-by-nc-sa-4.0':     { label: 'CC BY-NC-SA 4.0',     url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/' },
    'cc0':                 { label: 'CC0 (Public Domain)', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
    'mit':                 { label: 'MIT License',          url: 'https://opensource.org/licenses/MIT' },
    'custom':              { label: 'Custom',               url: null }
  };
  return map[key] || map['all-rights-reserved'];
}

/* ------------------------------------------------------------
   Main
   ------------------------------------------------------------ */
function build() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log('No posts directory found at', POSTS_DIR);
    fs.writeFileSync(OUTPUT_FILE, '[]');
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} markdown files`);

  const posts = [];

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, body } = parseFrontmatter(raw);

    // Slug from filename (strip .md and any date prefix)
    const slug = file
      .replace(/\.md$/, '')
      .replace(/^\d{4}-\d{2}-\d{2}-/, '');

    // Excerpt from frontmatter or first chars of body
    const excerpt = data.excerpt || (body ? body.replace(/[#*_`]/g, '').slice(0, 160) + '…' : '');

    // License metadata
    const licenseKey = data.license || 'all-rights-reserved';
    const lic = licenseMeta(licenseKey);
    const licenseLabel = (licenseKey === 'custom' && data.licenseCustom)
      ? data.licenseCustom
      : lic.label;

    posts.push({
      id: slug,
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString().slice(0, 10),
      category: data.category || 'studio',
      excerpt: excerpt,
      readTime: data.readTime || estimateReadTime(body),
      author: data.author || '',
      authorImage: data.authorImage || '',
      license: licenseKey,
      licenseLabel: licenseLabel,
      licenseUrl: lic.url,
      pdf: data.pdf || '',
      txt: data.txt || '',
      featured: data.featured === true,
      icon: data.icon || defaultIconFor(data.category),
      url: '',
      body: body
    });
  }

  // Sort newest first
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
  console.log(`✅ Wrote ${posts.length} posts to ${OUTPUT_FILE}`);
}

build();