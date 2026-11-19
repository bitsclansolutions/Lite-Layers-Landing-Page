// Image rules per platform. Every figure comes from the answers in the
// "Litelayers SEO AEO Keywords US Based" sheet (Platform and Guide rows).
// Platforms change their rules; re-check these before each yearly title update.

export const SPEC_FIELDS = [
  ['recommended', 'Recommended size'],
  ['minimum',     'Minimum'],
  ['maximum',     'Maximum'],
  ['fileSize',    'File size'],
  ['formats',     'Formats'],
  ['count',       'Images per listing'],
  ['background',  'Main image background'],
  ['notes',       'Good to know'],
];

export const PLATFORM_SPECS = {
  amazon: {
    name: 'Amazon',
    platformSlug: '/amazon-product-photos',
    guideSlug: '/guides/amazon-product-image-size',
    recommended: '2000 x 2000 px is a common choice',
    minimum: '500 px; 1000 px on the longest side to enable zoom',
    maximum: '10,000 px on the longest side',
    formats: 'JPEG (preferred), TIFF, PNG, non-animated GIF',
    background: 'Pure white (RGB 255, 255, 255)',
    notes: 'The product fills about 85% of the frame. No text, logos, props or watermarks on the main image; lifestyle shots go in the secondary slots.',
  },
  etsy: {
    name: 'Etsy',
    platformSlug: '/etsy-product-photos',
    guideSlug: '/guides/etsy-listing-photo-size',
    recommended: 'At least 2000 px on each side; 2000 x 2000 square or 3000 x 2250 (4:3)',
    minimum: '635 x 635 px for the first photo, to avoid lower search placement',
    background: 'Styled scenes such as wood, stone or soft pastels suit Etsy',
    notes: 'Use sRGB color and avoid transparent PNGs. Leave space around the product so thumbnail crops do not cut it off.',
  },
  shopify: {
    name: 'Shopify',
    platformSlug: '/shopify-product-photos',
    guideSlug: '/guides/shopify-product-image-size',
    recommended: '2048 x 2048 px square',
    minimum: 'About 800 x 800 px, or most themes lose zoom',
    maximum: '5000 x 5000 px or 25 megapixels',
    fileSize: 'Under 20 MB',
    background: 'Your choice; keep one style across the store',
    notes: 'Use the same aspect ratio, background style and product size in frame for every product.',
  },
  ebay: {
    name: 'eBay',
    platformSlug: '/ebay-product-photos',
    guideSlug: '/guides/ebay-image-size',
    recommended: '1600 px on the longest side',
    minimum: '500 px on the longest side',
    fileSize: 'Up to 12 MB per photo',
    formats: 'JPEG, PNG, WEBP, HEIC and more',
    count: 'Up to 24 photos',
    background: 'White or neutral',
    notes: 'Use styled scenes in the extra photo slots.',
  },
  walmart: {
    name: 'Walmart',
    platformSlug: '/walmart-product-images',
    guideSlug: '/guides/walmart-image-requirements',
    recommended: '2200 x 2200 px square (1:1)',
    minimum: '1500 x 1500 px for zoom',
    fileSize: '5 MB or less',
    formats: 'JPEG, PNG, BMP',
    background: 'Seamless white (RGB 255, 255, 255)',
    notes: "Name files with the product's GTIN. Additional images can show the product in use.",
  },
  tiktok: {
    name: 'TikTok Shop',
    platformSlug: '/tiktok-shop-product-images',
    guideSlug: '/guides/tiktok-shop-image-requirements',
    recommended: '1000 to 1200 px square (1:1)',
    minimum: '600 x 600 px',
    fileSize: 'Under 5 MB',
    formats: 'JPG, PNG',
    count: 'Up to 9 images',
    background: 'Pure white, product only, no text, logos or borders',
    notes: 'Significantly AI-edited images must be disclosed and must not misrepresent the product.',
  },
  instagram: {
    name: 'Instagram',
    platformSlug: '/instagram-product-photos',
    guideSlug: '/guides/instagram-post-size',
    recommended: '1080 x 1350 px (4:5 portrait) for feed posts',
    background: 'Any; styled scenes work best',
    notes: 'Square 1080 x 1080, 3:4 grid-friendly 1080 x 1440, landscape 1080 x 566, Stories and Reels 1080 x 1920.',
  },
  woocommerce: {
    name: 'WooCommerce',
    platformSlug: '/woocommerce-product-images',
    recommended: "About double your theme's display size, for sharp retina screens",
    minimum: '800 x 800 px (default Storefront theme)',
    background: 'Your choice; keep one aspect ratio for a tidy shop grid',
    notes: 'Image sizes depend on your theme.',
  },
};

// The universal master size, from the "product image size guide" row.
export const UNIVERSAL_SIZE = {
  size: '2200 x 2200 px square',
  why: "It meets Walmart's recommendation, exceeds Shopify's 2048 px and Amazon's zoom threshold, and resizes down cleanly for eBay, TikTok Shop and Instagram. Make separate crops for Pinterest (2:3) and Instagram portrait (4:5).",
};

const BY_SLUG = Object.fromEntries(
  Object.entries(PLATFORM_SPECS).flatMap(([key, spec]) =>
    [spec.platformSlug, spec.guideSlug].filter(Boolean).map(slug => [slug, key])),
);

export const platformKeyForSlug = slug => BY_SLUG[slug] || null;
