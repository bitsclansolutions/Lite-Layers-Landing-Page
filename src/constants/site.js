// Public address of the site. Used for canonical links, the sitemap and social previews.
// Change it here if the site moves to a custom domain.
export const SITE_URL = 'https://lite-layers-landing-page.vercel.app';

export const BRAND = 'Lite Layers';

// Free plan limits. Keep in sync with the Free plan in sections/PricingSection.jsx.
export const FREE_PLAN = {
  backgroundRemovals: 10,
  sceneGenerations: 5,
  smartResizes: 50,
  exports: 20,
  paidFrom: '$9.99',
};

export const FREE_PLAN_SUMMARY =
  `${FREE_PLAN.sceneGenerations} AI scenes and ${FREE_PLAN.backgroundRemovals} background removals every month, no card required`;
