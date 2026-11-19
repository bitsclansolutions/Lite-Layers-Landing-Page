// <head> data for every route: title, description, canonical, social tags and JSON-LD.
// Used by the client (components/seo/SeoHead.jsx) and by the build-time prerender.
import { SITE_URL, BRAND, FREE_PLAN, FREE_PLAN_SUMMARY } from '../constants/site';
import { PLAY_STORE_URL } from '../constants/links';
import { getSeoPage, breadcrumbsFor, TOOLS_INDEX } from '../data/seoPages';
import { freeFaq } from './copy';

const DEFAULT = {
  title: 'Lite Layers - AI Photography for Consumable Products',
  description: 'Lite Layers - AI product photography app for consumable products. Transform plain photos of perfumes, skincare, cosmetics and personal-care products into stunning, studio-quality visuals in seconds. AI scene generation, background removal, smart resize.',
};

const OG_IMAGE = `${SITE_URL}/AI%20Background%20Generation%20Images/After.png`;

const STATIC = {
  '/': {
    ...DEFAULT,
    ogTitle: 'Lite Layers - AI Photography for Consumable Products',
    ogDescription: 'Turn any consumable product photo, from perfumes and skincare to cosmetics and haircare, into a professional studio shot using AI scene generation.',
  },
  [TOOLS_INDEX.slug]: { title: TOOLS_INDEX.title, description: TOOLS_INDEX.description },
  '/privacy-policy':   { title: `Privacy Policy | ${BRAND}`, description: 'How Lite Layers collects, uses and protects your data.' },
  '/terms':            { title: `Terms of Service | ${BRAND}`, description: 'The terms that apply when you use the Lite Layers app.' },
  '/account-deletion': { title: `Delete Your Account | ${BRAND}`, description: 'How to delete your Lite Layers account and data.' },
  '/pricing':          { title: `Pricing | ${BRAND}`, description: `Start free with ${FREE_PLAN_SUMMARY}. Paid plans from ${FREE_PLAN.paidFrom} a month.` },
};

// Private or utility pages that search engines should not index.
const NOINDEX = ['/login', '/dashboard', '/admin', '/success'];

export const PUBLIC_PATHS = Object.keys(STATIC);

const appSchema = {
  '@type': 'SoftwareApplication',
  name: BRAND,
  operatingSystem: 'Android',
  applicationCategory: 'PhotographyApplication',
  downloadUrl: PLAY_STORE_URL,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

function seoPageJsonLd(page, url) {
  const crumbs = breadcrumbsFor(page);
  const faqs = page.kind === 'product' || page.type !== 'Guide'
    ? [...page.faqs, freeFaq(page)]
    : page.faqs;
  const graph = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem', position: i + 1, name: c.label, item: `${SITE_URL}${c.href.split('#')[0]}`,
      })),
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question', name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];
  if (page.intent === 'Commercial') graph.push({ ...appSchema, url });
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function getHead(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const url = `${SITE_URL}${path === '/' ? '' : path}`;
  const page = getSeoPage(path);

  if (page) {
    return {
      title: page.metaTitle,
      description: page.metaDescription,
      canonical: url,
      robots: 'index,follow',
      ogTitle: page.metaTitle,
      ogDescription: page.metaDescription,
      ogImage: OG_IMAGE,
      jsonLd: seoPageJsonLd(page, url),
    };
  }

  const s = STATIC[path];
  // Only known public pages are indexable: private pages (NOINDEX) and unknown URLs are not.
  const noindex = !s || NOINDEX.some(p => path.startsWith(p));
  const base = s || DEFAULT;
  return {
    title: base.title,
    description: base.description,
    canonical: s ? url : null,
    robots: noindex ? 'noindex,follow' : 'index,follow',
    ogTitle: base.ogTitle || base.title,
    ogDescription: base.ogDescription || base.description,
    ogImage: OG_IMAGE,
    jsonLd: path === '/' ? { '@context': 'https://schema.org', ...appSchema, url: SITE_URL } : null,
  };
}

const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The same head as an HTML string, for the prerender script.
export function headToHtml(h) {
  return [
    `<title>${esc(h.title)}</title>`,
    `<meta name="description" content="${esc(h.description)}" />`,
    `<meta name="robots" content="${h.robots}" />`,
    h.canonical && `<link rel="canonical" href="${esc(h.canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${BRAND}" />`,
    `<meta property="og:title" content="${esc(h.ogTitle)}" />`,
    `<meta property="og:description" content="${esc(h.ogDescription)}" />`,
    h.canonical && `<meta property="og:url" content="${esc(h.canonical)}" />`,
    `<meta property="og:image" content="${esc(h.ogImage)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    h.jsonLd && `<script type="application/ld+json" id="ld-json">${JSON.stringify(h.jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].filter(Boolean).join('\n    ');
}
