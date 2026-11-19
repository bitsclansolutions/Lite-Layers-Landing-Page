// Lookups and link resolution for the SEO pages generated from the keyword sheet.
// The page copy itself lives in seo-pages.json (built by scripts/build_seo_data.py).
import data from './seo-pages.json';
import { IMG } from '../constants/images';

export const PRODUCTS = data.products;
export const HUBS = data.hubs;
export const ALL_SEO_PAGES = [...HUBS, ...PRODUCTS];

const BY_SLUG = Object.fromEntries(ALL_SEO_PAGES.map(p => [p.slug, p]));
export const getSeoPage = slug => BY_SLUG[slug] || null;

// The index page that lists every SEO page.
export const TOOLS_INDEX = {
  slug: '/free-tools',
  title: 'Free Product Photo Tools and Guides | Lite Layers',
  h1: 'Free Product Photo Tools and Guides',
  description: 'Every free Lite Layers background generator, scene, marketplace and image size guide in one place, for perfume, skincare, cosmetics and other consumable products.',
};

export const HUB_GROUPS = [
  { type: 'Pillar',   id: 'ai-tools',   label: 'Free AI Photo Tools' },
  { type: 'Scene',    id: 'scenes',     label: 'Free Scene Backgrounds' },
  { type: 'Platform', id: 'platforms',  label: 'Free Marketplace Photo Tools' },
  { type: 'Guide',    id: 'guides',     label: 'Free Image Size Guides' },
  { type: 'Seasonal', id: 'seasonal',   label: 'Free Seasonal Backgrounds' },
];
export const hubGroup = type => HUB_GROUPS.find(g => g.type === type);

// Product categories in sheet order.
export const PRODUCT_CATEGORIES = [...new Map(
  PRODUCTS.map(p => [p.categoryId, { id: p.categoryId, label: p.category }]),
).values()].map(c => ({ ...c, products: PRODUCTS.filter(p => p.categoryId === c.id) }));

// Short link text for a page: "Perfume", "Podium Backgrounds", etc.
export function linkLabel(page) {
  if (page.kind === 'product') return `${page.productName} Background Generator`;
  return page.h1.replace(/^Free (Guide: |Tool to )?/, '');
}

// ---------- scenes ----------
// Scene names in the sheet -> a photo from our scene library (only where the photo
// really shows that scene) and the scene hub page that covers it.
// Note: some file names don't match their content (e.g. summer-scene.jpg is a grey
// podium with text on it, beige-studio.jpg is a stone podium with autumn leaves).
const SCENE_RULES = [
  [/white/i,                          null,       '/white-background-product-photos'],
  [/marble podium/i,                  IMG.scene6, '/marble-product-background'],
  [/marble/i,                         IMG.scene1, '/marble-product-background'],
  [/rose|petal/i,                     IMG.scene3, '/floral-product-background'],
  [/pastel/i,                         null,       '/pastel-product-background'],
  [/stone|slab|concrete/i,            IMG.scene5, '/stone-product-background'],
  [/podium|acrylic|pedestal/i,        IMG.scene3, '/podium-product-background'],
  [/wood/i,                           IMG.scene4, '/wood-table-product-background'],
  [/botanical|leaves|palm/i,          IMG.scene2, null],
  [/grass|lawn/i,                     IMG.scene6, null],
  [/float|cloud/i,                    null,       '/floating-product-photography'],
  [/water splash|suds|pool|ripple/i,  null,       '/water-splash-product-photography'],
  [/flower|dried/i,                   null,       '/floral-product-background'],
  [/sand|beach/i,                     null,       '/beach-product-background'],
  [/smoke|dark|leather/i,             null,       '/black-background-product-photography'],
];

export function sceneInfo(name) {
  const rule = SCENE_RULES.find(([re]) => re.test(name));
  return { name, image: rule?.[1] || null, href: rule?.[2] || null };
}

// Hero photo for hub pages that have a matching scene photo.
const HUB_SCENE_IMAGE = {
  '/podium-product-background': IMG.scene3,
  '/marble-product-background': IMG.scene6,
  '/wood-table-product-background': IMG.scene4,
  '/stone-product-background': IMG.scene5,
  '/fall-product-background': IMG.scene5,
  '/valentines-day-product-background': IMG.scene3,
  '/lifestyle-product-photos': IMG.scene1,
};
export const hubImage = slug => HUB_SCENE_IMAGE[slug] || null;

// ---------- links ----------
const productByName = name => {
  const n = name.toLowerCase().replace(/\bpages?\b/g, '').trim();
  return PRODUCTS.find(p => p.product.toLowerCase() === n || p.productName.toLowerCase() === n) || null;
};

// "Links To" is free text in the sheet: slugs, product names, or groups such as
// "All scene, platform and product pages". Turn it into a list of pages.
export function resolveLinksTo(text) {
  const out = [];
  for (const raw of String(text || '').split(';')) {
    const part = raw.trim();
    if (!part) continue;
    if (part.startsWith('/')) { if (getSeoPage(part)) out.push(getSeoPage(part)); continue; }
    const lower = part.toLowerCase();
    const isGroup = /^all\b|scene pages|platform pages|guide pages|product pages/.test(lower);
    if (isGroup) {
      if (/scene/.test(lower))    out.push(...HUBS.filter(h => h.type === 'Scene'));
      if (/platform/.test(lower)) out.push(...HUBS.filter(h => h.type === 'Platform'));
      if (/guide/.test(lower))    out.push(...HUBS.filter(h => h.type === 'Guide'));
      if (/product/.test(lower))  out.push(...PRODUCTS);
      continue;
    }
    for (const name of part.split(/,| and (?=[a-z])/i)) {
      const p = productByName(name);
      if (p) out.push(p);
    }
  }
  return [...new Map(out.map(p => [p.slug, p])).values()];
}

// Product pages a hub should show: the ones the sheet lists for it. When the sheet
// names none, fall back to the high-priority product pages that link to it.
export function productsForHub(hub) {
  const listed = resolveLinksTo(hub.linksTo).filter(p => p.kind === 'product');
  if (listed.length) return listed;
  return PRODUCTS.filter(p => p.internalLinks.includes(hub.slug) && p.priority === 'High').slice(0, 12);
}

// Other hub pages a hub should link to.
export function relatedHubsForHub(hub) {
  const listed = resolveLinksTo(hub.linksTo).filter(p => p.kind === 'hub');
  const siblings = HUBS.filter(h => h.type === hub.type);
  const pillar = getSeoPage('/ai-product-background-generator');
  const all = [...listed, ...siblings, pillar].filter(h => h && h.slug !== hub.slug);
  return [...new Map(all.map(p => [p.slug, p])).values()].slice(0, 9);
}

export function relatedForProduct(product) {
  const hubs = product.internalLinks.map(getSeoPage).filter(Boolean);
  const siblings = PRODUCTS.filter(p => p.categoryId === product.categoryId && p.slug !== product.slug);
  return { hubs, siblings };
}

export function breadcrumbsFor(page) {
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Free Tools', href: TOOLS_INDEX.slug }];
  if (page.kind === 'product') {
    crumbs.push({ label: page.category, href: `${TOOLS_INDEX.slug}#${page.categoryId}` });
  } else {
    const g = hubGroup(page.type);
    crumbs.push({ label: g.label.replace(/^Free /, ''), href: `${TOOLS_INDEX.slug}#${g.id}` });
  }
  crumbs.push({ label: linkLabel(page), href: page.slug });
  return crumbs;
}

// ---------- short names for the /free-tools index ----------
// One or two words per page, so the index can be scanned instead of read.
const HUB_SHORT = {
  '/ai-product-background-generator': 'AI Background Generator',
  '/change-product-photo-background': 'Change Photo Background',
  '/remove-background-product-photo': 'Remove Background',
  '/ai-product-photography': 'AI Product Photography',
  '/product-mockup-generator': 'Mockup Generator',
  '/lifestyle-product-photos': 'Lifestyle Photos',
  '/podium-product-background': 'Podium',
  '/floating-product-photography': 'Floating',
  '/marble-product-background': 'Marble',
  '/stone-product-background': 'Stone',
  '/wood-table-product-background': 'Wooden Table',
  '/water-splash-product-photography': 'Water Splash',
  '/black-background-product-photography': 'Black',
  '/white-background-product-photos': 'White',
  '/pastel-product-background': 'Pastel',
  '/beach-product-background': 'Beach',
  '/floral-product-background': 'Floral',
  '/transparent-background-product-image': 'Transparent PNG',
  '/amazon-product-photos': 'Amazon',
  '/etsy-product-photos': 'Etsy',
  '/shopify-product-photos': 'Shopify',
  '/ebay-product-photos': 'eBay',
  '/walmart-product-images': 'Walmart',
  '/tiktok-shop-product-images': 'TikTok Shop',
  '/instagram-product-photos': 'Instagram',
  '/woocommerce-product-images': 'WooCommerce',
  '/guides/amazon-product-image-size': 'Amazon',
  '/guides/etsy-listing-photo-size': 'Etsy',
  '/guides/shopify-product-image-size': 'Shopify',
  '/guides/instagram-post-size': 'Instagram',
  '/guides/ebay-image-size': 'eBay',
  '/guides/walmart-image-requirements': 'Walmart',
  '/guides/tiktok-shop-image-requirements': 'TikTok Shop',
  '/guides/product-image-size-guide': 'Every Platform',
  '/christmas-product-background': 'Christmas',
  '/valentines-day-product-background': "Valentine's Day",
  '/mothers-day-product-background': "Mother's Day",
  '/black-friday-product-images': 'Black Friday',
  '/halloween-product-background': 'Halloween',
  '/fourth-of-july-product-background': 'Fourth of July',
  '/fall-product-background': 'Fall',
  '/summer-product-background': 'Summer',
};

export const shortLabel = page =>
  page.kind === 'product' ? page.productName : (HUB_SHORT[page.slug] || linkLabel(page));

// Text searched by the /free-tools search box.
export const searchText = page => [
  shortLabel(page), page.h1, page.primaryKeyword, page.category, page.type,
  ...(page.variants || []), ...(page.secondaryKeywords || []),
].filter(Boolean).join(' ').toLowerCase();
