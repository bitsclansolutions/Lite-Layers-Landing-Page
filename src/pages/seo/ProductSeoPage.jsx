// Template for the 67 "free [product] background generator" pages.
import { IMG } from '../../constants/images';
import { breadcrumbsFor, sceneInfo, relatedForProduct } from '../../data/seoPages';
import { freeFaq, productSteps } from '../../seo/copy';
import {
  SeoLayout, SeoHero, Section, AnswerBlock, Steps, SceneGrid, ChipList, FaqList, LinkCards,
} from '../../components/seo/SeoBlocks';

export default function ProductSeoPage({ page }) {
  const name = page.product.toLowerCase();
  const [aeo, ...moreFaqs] = page.faqs;
  // Pure white is always offered (marketplace main images); it links to the white background page.
  const scenes = [...page.scenes, 'Clean white backdrop'].map(sceneInfo);
  const { hubs, siblings } = relatedForProduct(page);

  return (
    <SeoLayout>
      <SeoHero
        crumbs={breadcrumbsFor(page)}
        pill={`Free AI ${page.productName} Background Generator`}
        h1={page.h1}
        intro={page.metaDescription}
        beforeImg={IMG.bgBefore}
        afterImg={IMG.bgAfter}
      />

      <AnswerBlock q={aeo.q} a={aeo.a} />

      <Section
        eyebrow="Scene ideas"
        title={`Free ${name} product photography ideas`}
        intro={`These scenes suit ${name} best. Each one is a starting point: pick it in the app and Lite Layers places your ${name} in it with matching light and shadows.`}
      >
        <SceneGrid scenes={scenes} productName={name} />
      </Section>

      <Section
        eyebrow="How it works"
        title={`How to use the free background generator for ${name}`}
      >
        <Steps steps={productSteps(page)} />
      </Section>

      {page.variants.length > 0 && (
        <Section
          eyebrow="Every format"
          title={`Works for every kind of ${name}`}
          intro={`Use the same free ${name} background generator for your whole range, so every listing in your store looks consistent.`}
        >
          <ChipList items={page.variants} />
        </Section>
      )}

      <Section id="faq" eyebrow="FAQ" title={`${page.productName} photo questions`} narrow>
        <FaqList faqs={[...moreFaqs, freeFaq(page)]} />
      </Section>

      <Section eyebrow="Keep going" title="Backgrounds, platforms and guides">
        <LinkCards pages={hubs} />
      </Section>

      {siblings.length > 0 && (
        <Section title={`More free ${page.category.toLowerCase()} background generators`}>
          <LinkCards pages={siblings} compact />
        </Section>
      )}
    </SeoLayout>
  );
}
