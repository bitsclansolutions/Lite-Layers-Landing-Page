// Runs after `vite build`. Builds a server bundle of the app into a fresh temp folder,
// then writes real HTML for every public page, so search engines and AI crawlers that
// don't run JavaScript can read them.
//
//   dist/index.html                         home page (prerendered)
//   dist/<slug>.html, dist/guides/<x>.html  SEO pages (served at /<slug> via cleanUrls)
//   dist/spa.html                           empty app shell, the fallback for /dashboard etc.
//   dist/sitemap.xml, dist/robots.txt
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

// A new folder every run: on Windows a fixed folder can stay locked by another
// process after deletion, which used to break the next build. It lives inside the
// project so the bundle can still import react, firebase, etc. from node_modules.
const cacheDir = join(root, 'node_modules', '.cache');
mkdirSync(cacheDir, { recursive: true });
const ssrDir = mkdtempSync(join(cacheDir, 'ssr-'));
await build({
  root,
  logLevel: 'warn',
  build: { ssr: 'src/entry-server.jsx', outDir: ssrDir, emptyOutDir: true, copyPublicDir: false },
});

const { render, getHead, headToHtml, PUBLIC_PATHS, GLOBAL_CSS, ALL_SEO_PAGES, SITE_URL } =
  await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href);

const template = readFileSync(join(dist, 'index.html'), 'utf8');
writeFileSync(join(dist, 'spa.html'), template);

// Tags in index.html that each page replaces with its own.
const HEAD_TAGS = [
  /\s*<title>[\s\S]*?<\/title>/,
  /\s*<meta name="description"[^>]*>/,
  /\s*<meta property="og:[a-z_:]+"[^>]*>/g,
];

function pageHtml(url) {
  const appHtml = render(url);
  let html = template;
  for (const re of HEAD_TAGS) html = html.replace(re, '');
  const head = headToHtml(getHead(url));
  html = html.replace('</head>', `    ${head}\n    <style id="ll-gs">${GLOBAL_CSS}</style>\n  </head>`);
  if (!html.includes('<div id="root"></div>')) throw new Error('index.html has no empty #root');
  return html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
}

const routes = [...PUBLIC_PATHS, ...ALL_SEO_PAGES.map(p => p.slug)];
for (const url of routes) {
  const file = url === '/' ? join(dist, 'index.html') : join(dist, `${url.slice(1)}.html`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, pageHtml(url));
}

const today = new Date().toISOString().slice(0, 10);
const indexable = routes.filter(u => getHead(u).robots.startsWith('index'));
writeFileSync(join(dist, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  indexable.map(u => `  <url><loc>${SITE_URL}${u === '/' ? '' : u}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
  '\n</urlset>\n');

writeFileSync(join(dist, 'robots.txt'), [
  'User-agent: *',
  'Allow: /',
  'Disallow: /dashboard',
  'Disallow: /admin',
  'Disallow: /login',
  'Disallow: /success',
  'Disallow: /api/',
  '',
  `Sitemap: ${SITE_URL}/sitemap.xml`,
  '',
].join('\n'));

try { rmSync(ssrDir, { recursive: true, force: true }); } catch { /* locked by another process; harmless leftover */ }
console.log(`Prerendered ${routes.length} pages; sitemap has ${indexable.length} URLs.`);
