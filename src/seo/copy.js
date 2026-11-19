// Shared, templated copy for the SEO pages. Page-specific copy comes from the sheet.
import { FREE_PLAN } from '../constants/site';

const lower = s => s.charAt(0).toLowerCase() + s.slice(1);

// "Is it free?" answer, added to every commercial page's FAQ (and its FAQ schema).
export function freeFaq(page) {
  const q = page.kind === 'product'
    ? `Is the ${page.productName.toLowerCase()} background generator really free?`
    : 'Is Lite Layers really free to use?';
  return {
    q,
    a: `Yes. Lite Layers has a free plan with no credit card required: ${FREE_PLAN.sceneGenerations} AI scene generations, ${FREE_PLAN.backgroundRemovals} background removals, ${FREE_PLAN.smartResizes} smart resizes and ${FREE_PLAN.exports} exports every month. Paid plans start at ${FREE_PLAN.paidFrom} a month if you need more.`,
  };
}

export function productSteps(page) {
  const name = page.product.toLowerCase();
  const [s1, s2] = page.scenes;
  return [
    {
      title: `Snap your ${name}`,
      desc: `Take a clear photo of your ${name} on any surface, in any light. Lite Layers cuts it out from the original background automatically.`,
    },
    {
      title: 'Pick a free scene',
      desc: `Choose a scene such as ${s1 ? lower(s1) : 'a marble podium'}${s2 ? ` or ${lower(s2)}` : ''}, or switch to pure white for Amazon, Walmart and TikTok Shop main images.`,
    },
    {
      title: 'Resize and export',
      desc: 'Resize the finished shot for Amazon, Etsy, Shopify, TikTok Shop or Instagram and save it to your phone, ready to upload.',
    },
  ];
}

const HUB_STEP2 = {
  Pillar:   'Pick a styled scene, pure white or a transparent cutout. Try several looks from the same photo.',
  Scene:    'Choose this scene style, and Lite Layers places your product in it with matching light and shadows.',
  Platform: 'Use pure white for the main image, then add styled scenes for the secondary image slots.',
  Seasonal: 'Choose a seasonal scene for ads, emails and social posts, and keep your marketplace main image on white.',
  Guide:    'Choose white for marketplace main images, or a styled scene for your store and social posts.',
};

export function hubSteps(page) {
  return [
    {
      title: 'Upload one product photo',
      desc: 'Snap your product with your phone on any background. Lite Layers removes the original background automatically.',
    },
    { title: 'Choose your background', desc: HUB_STEP2[page.type] || HUB_STEP2.Pillar },
    {
      title: 'Resize and export',
      desc: 'Use smart resize to get the right size and aspect ratio for each platform, then save it.',
    },
  ];
}
