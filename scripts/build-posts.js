/* ============================================================
   Build newsletter/posts.json from newsletter/posts/*.md
   Runs in GitHub Actions when you publish a post via Decap CMS.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'newsletter', 'posts');
const OUTPUT_FILE = path.join(__dirname, '..', 'newsletter', 'posts.json');

/* ------------------------------------------------------------
   Minimal frontmatter parser
   Handles: strings, booleans, dates, quoted strings
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
   Estimate read time from body
   ------------------------------------------------------------ */
function estimateReadTime(body) {
  const words = body.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return minutes + ' min read';
}

/* ------------------------------------------------------------
   Default icon for each category
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

    // Slug derived from filename (strip .md and any date prefix)
    const slug = file
      .replace(/\.md$/, '')
      .replace(/^\d{4}-\d{2}-\d{2}-/, '');

    // Excerpt: use frontmatter excerpt, or first 160 chars of body
    const excerpt = data.excerpt || body.replace(/[#*_`]/g, '').slice(0, 160) + '…';

    posts.push({
      id: slug,
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString().slice(0, 10),
      category: data.category || 'studio',
      excerpt: excerpt,
      readTime: data.readTime || estimateReadTime(body),
      featured: data.featured === true,
      icon: data.icon || defaultIconFor(data.category),
      url: '',  // no external URL by default — post detail page is used instead
      body: body
    });
  }

  // Sort newest first
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
  console.log(`✅ Wrote ${posts.length} posts to ${OUTPUT_FILE}`);
}

build();