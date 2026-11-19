// Template for the 42 hub pages: pillar, scene, platform, guide and seasonal.
import { IMG } from '../../constants/images';
import {
  breadcrumbsFor, productsForHub, relatedHubsForHub, hubImage, PRODUCT_CATEGORIES,
} from '../../data/seoPages';
import { PLATFORM_SPECS, platformKeyForSlug, UNIVERSAL_SIZE } from '../../data/platformSpecs';
import { freeFaq, hubSteps } from '../../seo/copy';
import {
  SeoLayout, SeoHero, Section, AnswerBlock, Steps, FaqList, LinkCards, SpecTable, SpecChart,
} from '../../components/seo/SeoBlocks';

const PILLS = {
  Pillar: 'Free AI Product Photo Tool',
  Scene: 'Free Scene Backgrounds',
  Platform: 'Free Marketplace Photo Tool',
  Guide: 'Free Image Size Guide',
  Seasonal: 'Free Seasonal Backgrounds',
};

const UNIVERSAL_SLUG = '/guides/product-image-size-guide';

function heroImages(page) {
  const image = hubImage(page.slug);
  if (image) return { image, imageAlt: `${page.h1.replace(/^Free /, '')} example` };
  if (page.type === 'Scene' || page.type === 'Seasonal') return { beforeImg: IMG.scenesBefore, afterImg: IMG.scenesAfter };
  return { beforeImg: IMG.bgBefore, afterImg: IMG.bgAfter };
}

export default function HubSeoPage({ page }) {
  const [aeo] = page.faqs;
  const isGuide = page.type === 'Guide';
  const isUniversal = page.slug === UNIVERSAL_SLUG;
  const specKey = platformKeyForSlug(page.slug);
  const spec = specKey && PLATFORM_SPECS[specKey];
  const products = productsForHub(page);
  const showAllProducts = products.length >= 40;
  const related = relatedHubsForHub(page);
  const faqs = isGuide ? [] : [freeFaq(page)];

  return (
    <SeoLayout>
      <SeoHero
        crumbs={breadcrumbsFor(page)}
        pill={PILLS[page.type]}
        h1={page.h1}
        intro={page.metaDescription}
        {...heroImages(page)}
      />

      <AnswerBlock q={aeo.q} a={aeo.a} />

      {spec && (
        <Section
          eyebrow={isGuide ? 'At a glance' : 'Image requirements'}
          title={`${spec.name} product image requirements`}
          narrow
        >
          <SpecTable spec={spec} />
          <p style={{ fontSize: 13, marginTop: 14, opacity: .7 }}>
            Platforms update their rules from time to time. Check the {spec.name} seller help pages before a big launch.
          </p>
        </Section>
      )}

      {isUniversal && (
        <Section
          eyebrow="One chart"
          title="Product image sizes for every platform"
          intro={`Short on time? Shoot one ${UNIVERSAL_SIZE.size} master. ${UNIVERSAL_SIZE.why}`}
        >
          <SpecChart specs={Object.values(PLATFORM_SPECS)} />
        </Section>
      )}

      <Section
        eyebrow="How it works"
        title={isGuide ? 'Get the right size from any photo, free' : 'Three steps, one free app'}
      >
        <Steps steps={hubSteps(page)} />
      </Section>

      {products.length > 0 && !showAllProducts && (
        <Section
          eyebrow="Popular products"
          title="Free background generators for these products"
        >
          <LinkCards pages={products} compact />
        </Section>
      )}

      {showAllProducts && (
        <Section eyebrow="Every product" title="Free background generators by product">
          {PRODUCT_CATEGORIES.map(c => (
            <div key={c.id} style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>{c.label}</h3>
              <LinkCards pages={c.products} compact />
            </div>
          ))}
        </Section>
      )}

      {faqs.length > 0 && (
        <Section id="faq" eyebrow="FAQ" title="Questions" narrow>
          <FaqList faqs={faqs} />
        </Section>
      )}

      <Section eyebrow="Keep going" title={isGuide ? 'More free guides and tools' : 'Related free tools'}>
        <LinkCards pages={related} />
      </Section>
    </SeoLayout>
  );
}
