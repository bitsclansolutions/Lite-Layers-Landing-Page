// /free-tools: a scannable index of every SEO page.
// Search + type tabs up top; by default, short visual groups (start here, products by
// category, scenes, marketplaces, seasonal). Every link is in the prerendered HTML.
import { useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, X, ArrowRight, ChevronDown, Wand2, Eraser, Store, Ruler, Layers, Gift,
  SprayCan, Droplet, Sun, Smile, Palette, Brush, Scissors, Bath, Heart, Package,
  Flower2, User, Flame, Sparkles, Shirt, Baby, PawPrint, Snowflake, Image as ImageIcon,
} from 'lucide-react';
import { useT } from '../../context/ThemeContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  HUBS, PRODUCTS, PRODUCT_CATEGORIES, ALL_SEO_PAGES, TOOLS_INDEX,
  getSeoPage, shortLabel, searchText, hubImage,
} from '../../data/seoPages';
import { SeoLayout, Breadcrumbs } from '../../components/seo/SeoBlocks';
import { BRAND_LOGOS } from '../../data/brandLogos';
import { platformKeyForSlug } from '../../data/platformSpecs';

const PINK = '#E91E8C';

const TABS = [
  { id: 'all',      label: 'All' },
  { id: 'product',  label: 'Products',     match: p => p.kind === 'product' },
  { id: 'Scene',    label: 'Scenes',       match: p => p.type === 'Scene' },
  { id: 'Platform', label: 'Marketplaces', match: p => p.type === 'Platform' },
  { id: 'Guide',    label: 'Size guides',  match: p => p.type === 'Guide' },
  { id: 'Seasonal', label: 'Seasonal',     match: p => p.type === 'Seasonal' },
  { id: 'Pillar',   label: 'AI tools',     match: p => p.type === 'Pillar' },
];

const POPULAR = ['Perfume', 'Serum', 'Candle', 'Amazon', 'White', 'Podium'];

const CATEGORY_ICONS = {
  'fragrance': SprayCan, 'skincare': Droplet, 'sun-care-tanning': Sun, 'lip-care': Smile,
  'makeup': Palette, 'nail-care': Brush, 'hair-care': Scissors, 'body-care': Bath,
  'feminine-care': Heart, 'personal-care-disposables': Package, 'traditional-regional-beauty': Flower2,
  'mens-grooming': User, 'oral-care': Smile, 'candles-home-fragrance': Flame,
  'household-cleaning': Sparkles, 'laundry': Shirt, 'baby-kids-care': Baby, 'pet-care': PawPrint,
};

const TYPE_META = {
  product:  { label: 'Product',     Icon: Package },
  Scene:    { label: 'Scene',       Icon: ImageIcon },
  Platform: { label: 'Marketplace', Icon: Store },
  Guide:    { label: 'Size guide',  Icon: Ruler },
  Seasonal: { label: 'Seasonal',    Icon: Gift },
  Pillar:   { label: 'AI tool',     Icon: Wand2 },
};
const typeOf = p => (p.kind === 'product' ? 'product' : p.type);

// Colour swatches for scenes without a photo.
const SCENE_SWATCH = {
  '/floating-product-photography': 'linear-gradient(160deg,#dfe9ff,#c8b6f4)',
  '/water-splash-product-photography': 'linear-gradient(160deg,#d6f1ff,#7cc4ef)',
  '/black-background-product-photography': 'linear-gradient(160deg,#2b2733,#0b0a10)',
  '/white-background-product-photos': 'radial-gradient(ellipse at 50% 35%,#ffffff 40%,#e9e6f1 100%)',
  '/pastel-product-background': 'linear-gradient(160deg,#ffd9e8,#d9f3ea)',
  '/beach-product-background': 'linear-gradient(180deg,#bfe6ff 0%,#bfe6ff 55%,#f3dcb2 56%,#e9c98f 100%)',
  '/floral-product-background': 'linear-gradient(160deg,#ffd6e3,#f7a8c4)',
  '/transparent-background-product-image': 'repeating-conic-gradient(#e6e3ee 0% 25%, #ffffff 0% 50%) 50% / 18px 18px',
};

const START_HERE = [
  { slug: '/ai-product-background-generator', Icon: Wand2,  title: 'AI Background Generator', desc: 'Put any product in a styled scene' },
  { slug: '/remove-background-product-photo', Icon: Eraser, title: 'Remove Background',       desc: 'Clean cutout in one tap' },
  { slug: '/white-background-product-photos', Icon: Layers, title: 'White Background',        desc: 'Pure white for Amazon & Walmart' },
];

const SEASONAL_ICONS = { '/christmas-product-background': Snowflake };

/* ---------- small pieces ---------- */

function SectionHead({ title, count, sub }) {
  const { t } = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.5px', color: t.text }}>
        {title}
        {count != null && <span style={{ fontSize: 15, fontWeight: 500, color: t.textMuted, marginLeft: 10 }}>{count}</span>}
      </h2>
      {sub && <p style={{ fontSize: 14, color: t.textMuted }}>{sub}</p>}
    </div>
  );
}

function Block({ children, id }) {
  const mob = useIsMobile();
  return (
    <section id={id} style={{ padding: mob ? '26px 20px' : '34px 48px', scrollMarginTop: 150 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

function hoverLift(t) {
  return {
    onMouseEnter: e => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.transform = 'translateY(-2px)'; },
    onMouseLeave: e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = 'none'; },
  };
}

function ProductPill({ page }) {
  const { t } = useT();
  return (
    <Link to={page.slug} style={{
      display: 'inline-block', padding: '7px 13px', borderRadius: 30, fontSize: 13, fontWeight: 500,
      textDecoration: 'none', color: t.textSub, background: t.bgAlt, border: `1px solid ${t.border}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.color = PINK; e.currentTarget.style.borderColor = t.pillBorder; e.currentTarget.style.background = t.pillBg; }}
      onMouseLeave={e => { e.currentTarget.style.color = t.textSub; e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.bgAlt; }}>
      {shortLabel(page)}
    </Link>
  );
}

// Desktop: an open card. Mobile: a collapsible row (closed by default) with a short
// preview, so 18 categories don't turn into a long scroll. Product links stay in the
// HTML either way, so crawlers still see them.
function CategoryCard({ category }) {
  const { t } = useT();
  const mob = useIsMobile();
  const [open, setOpen] = useState(false);
  const Icon = CATEGORY_ICONS[category.id] || Package;
  const expanded = !mob || open;
  const names = category.products.map(shortLabel);
  const preview = names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');

  const head = (
    <>
      <span style={{
        width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: t.pillBg, color: PINK, flexShrink: 0,
      }}><Icon size={19} strokeWidth={2} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 16, fontWeight: 600, color: t.text }}>{category.label}</span>
        {mob && !open && (
          <span style={{ display: 'block', fontSize: 13, color: t.textMuted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {preview}
          </span>
        )}
      </span>
      <span style={{
        fontSize: 12, fontWeight: 600, color: t.textMuted, background: t.bgAlt, borderRadius: 10, padding: '2px 8px',
      }}>{category.products.length}</span>
      {mob && (
        <ChevronDown size={18} color={open ? PINK : t.textMuted} style={{
          flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s ease',
        }} />
      )}
    </>
  );

  return (
    <div id={category.id} style={{
      background: t.bgCard, border: `1px solid ${open && mob ? t.pillBorder : t.border}`, borderRadius: mob ? 18 : 22,
      padding: mob ? 0 : 20, boxShadow: t.shadow, scrollMarginTop: 150,
      breakInside: 'avoid', marginBottom: mob ? 10 : 14,
    }}>
      {mob ? (
        <h3 style={{ margin: 0 }}>
          <button type="button" aria-expanded={open} aria-controls={`${category.id}-list`} onClick={() => setOpen(o => !o)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', textAlign: 'left',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 18,
          }}>{head}</button>
        </h3>
      ) : (
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>{head}</h3>
      )}
      <div id={`${category.id}-list`} style={{
        display: 'grid', gridTemplateRows: expanded ? '1fr' : '0fr', transition: 'grid-template-rows .3s ease',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: mob ? '0 16px 16px' : 0 }}>
            {category.products.map(p => <ProductPill key={p.slug} page={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneTile({ page }) {
  const { t } = useT();
  const mob = useIsMobile();
  const img = hubImage(page.slug);
  return (
    <Link to={page.slug} style={{
      display: 'block', textDecoration: 'none', borderRadius: 18, overflow: 'hidden',
      border: `1px solid ${t.border}`, background: t.bgCard, transition: 'transform .2s ease',
    }} {...hoverLift(t)}>
      <div aria-hidden="true" style={{
        height: mob ? 84 : 104,
        background: img ? `center 70% / cover no-repeat url("${img}")` : (SCENE_SWATCH[page.slug] || t.bgAlt),
      }} />
      <div style={{ padding: '10px 12px', fontSize: 14, fontWeight: 600, color: t.text }}>{shortLabel(page)}</div>
    </Link>
  );
}

// Real platform logo: white mark on the brand colour, like an app icon.
const INSTAGRAM_BG = 'linear-gradient(45deg,#FEDA75,#FA7E1E 30%,#D62976 60%,#962FBF 85%,#4F5BD5)';
function PlatformLogo({ slug, label }) {
  const logo = BRAND_LOGOS[platformKeyForSlug(slug)];
  const box = { width: 38, height: 38, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  if (!logo) {
    return <span className="gb" style={{ ...box, color: '#fff', fontSize: 15, fontWeight: 700 }}>{label.charAt(0)}</span>;
  }
  const vb = (logo.viewBox || '0 0 24 24').split(' ').map(Number);
  const svgW = vb[2] > vb[3] ? 30 : 20; // wide wordmarks (eBay) get more width
  return (
    <span aria-hidden="true" style={{
      ...box,
      background: logo.title === 'Instagram' ? INSTAGRAM_BG : logo.hex,
      boxShadow: logo.hex === '#000000' ? 'inset 0 0 0 1px rgba(255,255,255,.18)' : 'none',
    }}>
      <svg viewBox={vb.join(' ')} width={svgW} height={svgW * vb[3] / vb[2]} fill="#fff"><path d={logo.path} /></svg>
    </span>
  );
}

function MarketplaceCard({ platform }) {
  const { t } = useT();
  const guide = HUBS.find(h => h.type === 'Guide' && shortLabel(h) === shortLabel(platform));
  const linkStyle = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none' };
  return (
    <div style={{
      background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 22, padding: '18px 20px',
      boxShadow: t.shadow, transition: 'transform .2s ease',
    }} {...hoverLift(t)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <PlatformLogo slug={platform.slug} label={shortLabel(platform)} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text }}>{shortLabel(platform)}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link to={platform.slug} style={{ ...linkStyle, color: PINK }}>
          <Store size={14} /> Photo tool <ArrowRight size={13} />
        </Link>
        {guide && (
          <Link to={guide.slug} style={{ ...linkStyle, color: t.textSub }}>
            <Ruler size={14} /> Size guide <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}

function ResultCard({ page }) {
  const { t } = useT();
  const { label, Icon } = TYPE_META[typeOf(page)];
  return (
    <Link to={page.slug} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16,
      background: t.bgCard, border: `1px solid ${t.border}`, textDecoration: 'none', boxShadow: t.shadow,
      transition: 'transform .2s ease',
    }} {...hoverLift(t)}>
      {typeOf(page) === 'Platform' ? <PlatformLogo slug={page.slug} label={shortLabel(page)} /> : (
        <span style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: t.pillBg, color: PINK,
        }}><Icon size={17} /></span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: t.text }}>{shortLabel(page)}</span>
        <span style={{ display: 'block', fontSize: 12, color: t.textMuted, marginTop: 2 }}>
          {label}{page.category ? ` · ${page.category}` : ''}
        </span>
      </span>
      <ArrowRight size={16} color={PINK} style={{ flexShrink: 0 }} />
    </Link>
  );
}

/* ---------- views ---------- */

function OverviewView({ show }) {
  const { t } = useT();
  const mob = useIsMobile();
  const grid = (desktop, mobile) => ({ display: 'grid', gap: mob ? 10 : 14, gridTemplateColumns: `repeat(${mob ? mobile : desktop},minmax(0,1fr))` });
  const pillars = HUBS.filter(h => h.type === 'Pillar' && !START_HERE.some(s => s.slug === h.slug));
  const universal = getSeoPage('/guides/product-image-size-guide');

  return (
    <>
      {show('all') && (
        <Block id="start">
          <SectionHead title="Start here" sub="The three tools most sellers need first" />
          <div style={grid(3, 1)}>
            {START_HERE.map(({ slug, Icon, title, desc }) => {
              return (
                <Link key={slug} to={slug} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: mob ? 18 : 22, borderRadius: 22,
                  textDecoration: 'none', background: `linear-gradient(135deg,rgba(255,107,53,.08),rgba(233,30,140,.08),rgba(123,47,190,.08)), ${t.bgCard}`,
                  border: `1px solid ${t.border}`, boxShadow: t.shadow, transition: 'transform .2s ease',
                }} {...hoverLift(t)}>
                  <span className="gb" style={{
                    width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                  }}><Icon size={22} /></span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: t.text }}>{title}</span>
                    <span style={{ display: 'block', fontSize: 13, color: t.textMuted, marginTop: 3 }}>{desc}</span>
                  </span>
                  <ArrowRight size={18} color={PINK} />
                </Link>
              );
            })}
          </div>
        </Block>
      )}

      {show('product') && (
        <Block id="products">
          <SectionHead title="Pick your product" count={PRODUCTS.length} sub="Tap a product for its free background generator" />
          <div style={{ columnCount: mob ? 1 : 3, columnGap: 14 }}>
            {PRODUCT_CATEGORIES.map(c => <CategoryCard key={c.id} category={c} />)}
          </div>
        </Block>
      )}

      {show('Scene') && (
        <Block id="scenes">
          <SectionHead title="Pick a scene" count={HUBS.filter(h => h.type === 'Scene').length} />
          <div style={grid(6, 3)}>
            {HUBS.filter(h => h.type === 'Scene').map(h => <SceneTile key={h.slug} page={h} />)}
          </div>
        </Block>
      )}

      {(show('Platform') || show('Guide')) && (
        <Block id="marketplaces">
          <SectionHead title="Selling on a marketplace?" sub="Photo rules and image sizes for each platform" />
          <div style={grid(4, 2)}>
            {HUBS.filter(h => h.type === 'Platform').map(h => <MarketplaceCard key={h.slug} platform={h} />)}
          </div>
          {universal && (
            <Link to={universal.slug} style={{
              marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 22,
              textDecoration: 'none', background: t.bgCard, border: `1px solid ${t.border}`, boxShadow: t.shadow,
              transition: 'transform .2s ease',
            }} {...hoverLift(t)}>
              <span style={{
                width: 38, height: 38, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: t.pillBg, color: PINK,
              }}><Ruler size={19} /></span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: t.text }}>
                One size for every platform? <span style={{ color: t.textSub, fontWeight: 500 }}>See the free product image size guide</span>
              </span>
              <ArrowRight size={16} color={PINK} />
            </Link>
          )}
        </Block>
      )}

      {show('Seasonal') && (
        <Block id="seasonal">
          <SectionHead title="Seasonal backgrounds" count={HUBS.filter(h => h.type === 'Seasonal').length} />
          <div style={grid(4, 2)}>
            {HUBS.filter(h => h.type === 'Seasonal').map(h => {
              const Icon = SEASONAL_ICONS[h.slug] || Gift;
              return (
                <Link key={h.slug} to={h.slug} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 16, textDecoration: 'none',
                  background: t.bgCard, border: `1px solid ${t.border}`, boxShadow: t.shadow, transition: 'transform .2s ease',
                }} {...hoverLift(t)}>
                  <Icon size={17} color={PINK} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{shortLabel(h)}</span>
                </Link>
              );
            })}
          </div>
        </Block>
      )}

      {show('Pillar') && (
        <Block id="ai-tools">
          <SectionHead title="More AI tools" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {(show('all') ? pillars : HUBS.filter(h => h.type === 'Pillar')).map(h => <ProductPill key={h.slug} page={h} />)}
          </div>
        </Block>
      )}
    </>
  );
}

function ResultsView({ results, query, onClear }) {
  const { t } = useT();
  const mob = useIsMobile();
  return (
    <Block id="results">
      <p style={{ fontSize: 14, color: t.textMuted, marginBottom: 16 }} aria-live="polite">
        {results.length} {results.length === 1 ? 'result' : 'results'}{query ? <> for <strong style={{ color: t.text }}>“{query}”</strong></> : null}
      </p>
      {results.length > 0 ? (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: `repeat(${mob ? 1 : 3},minmax(0,1fr))` }}>
          {results.map(p => <ResultCard key={p.slug} page={p} />)}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px 20px', border: `1px dashed ${t.border}`, borderRadius: 22 }}>
          <Search size={28} color={t.textFaint} />
          <p style={{ fontSize: 16, fontWeight: 600, color: t.text, margin: '12px 0 6px' }}>No tools match that yet</p>
          <p style={{ fontSize: 14, color: t.textMuted, marginBottom: 18 }}>Try a product like “lotion”, a scene like “marble”, or a platform like “Etsy”.</p>
          <button type="button" onClick={onClear} style={{
            padding: '10px 18px', borderRadius: 12, border: `1px solid ${t.pillBorder}`, background: t.pillBg,
            color: PINK, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>Show all tools</button>
        </div>
      )}
    </Block>
  );
}

/* ---------- page ---------- */

export default function FreeToolsPage() {
  const { t } = useT();
  const mob = useIsMobile();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');

  const counts = useMemo(() => Object.fromEntries(
    TABS.map(tb => [tb.id, tb.match ? ALL_SEO_PAGES.filter(tb.match).length : ALL_SEO_PAGES.length]),
  ), []);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    const tb = TABS.find(x => x.id === tab);
    return ALL_SEO_PAGES
      .filter(p => !tb.match || tb.match(p))
      .filter(p => !q || q.split(/\s+/).every(w => searchText(p).includes(w)))
      .sort((a, b) => shortLabel(a).localeCompare(shortLabel(b)));
  }, [q, tab]);

  // Searching shows a flat result list; otherwise the grouped overview (filtered by tab).
  const show = section => tab === 'all' || section === tab
    || (section === 'Platform' && tab === 'Guide');

  const clear = () => { setQuery(''); setTab('all'); inputRef.current?.focus(); };

  return (
    <SeoLayout>
      {/* Hero + search */}
      <section style={{ padding: mob ? '104px 20px 8px' : '132px 48px 12px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '70vw', height: '50vw',
          borderRadius: '50%', background: 'radial-gradient(circle,rgba(233,30,140,.13),transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Breadcrumbs crumbs={[{ label: 'Home', href: '/' }, { label: 'Free Tools', href: TOOLS_INDEX.slug }]} />
          </div>
          <h1 style={{
            fontSize: mob ? 'clamp(30px,8.5vw,40px)' : 'clamp(36px,4vw,52px)', fontWeight: 700,
            letterSpacing: '-1.5px', lineHeight: 1.1, color: t.text, marginBottom: 14,
          }}>
            <span className="gt">Free</span> Product Photo Tools
          </h1>
          <p style={{ fontSize: mob ? 15 : 17, color: t.textSub, marginBottom: 26 }}>
            {ALL_SEO_PAGES.length} free tools and guides. Search or pick your product.
          </p>

          <div role="search" style={{ position: 'relative' }}>
            <Search size={20} color={t.textMuted} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search: perfume, Amazon, marble…"
              aria-label="Search free tools"
              className="ll-tools-search"
              style={{
                width: '100%', padding: mob ? '16px 48px 16px 52px' : '18px 52px 18px 54px', borderRadius: 18,
                fontSize: mob ? 15 : 16, fontFamily: 'inherit', color: t.text, background: t.bgCard,
                border: `1px solid ${t.bgNavBorder}`, boxShadow: t.shadowCard === 'none' ? 'none' : t.shadow, outline: 'none',
              }}
            />
            {query && (
              <button type="button" onClick={clear} aria-label="Clear search" style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32,
                borderRadius: '50%', border: 'none', background: t.pillBg, color: PINK, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><X size={16} /></button>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <span style={{ fontSize: 13, color: t.textMuted }}>Popular:</span>
            {POPULAR.map(w => (
              <button key={w} type="button" onClick={() => { setQuery(w); setTab('all'); }} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                border: `1px solid ${t.border}`, background: 'transparent', color: t.textSub,
              }}>{w}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Type tabs (sticky under the navbar) */}
      <div style={{
        position: 'sticky', top: mob ? 76 : 92, zIndex: 20, padding: mob ? '12px 0' : '14px 48px',
        background: t.bg, borderBottom: `1px solid ${t.border}`,
      }}>
        <div role="tablist" aria-label="Filter tools by type" className="ll-hscroll" style={{
          maxWidth: 1180, margin: '0 auto', display: 'flex', gap: 8, overflowX: 'auto',
          padding: mob ? '0 20px 2px' : '0 0 2px', justifyContent: mob ? 'flex-start' : 'center', scrollbarWidth: 'none',
        }}>
          {TABS.map(tb => {
            const active = tab === tb.id;
            return (
              <button key={tb.id} role="tab" aria-selected={active} type="button" onClick={() => setTab(tb.id)}
                className={active ? 'gb' : ''}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 30,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  border: `1px solid ${active ? 'transparent' : t.border}`,
                  background: active ? undefined : t.bgCard, color: active ? '#fff' : t.textSub,
                }}>
                {tb.label}
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '1px 7px', borderRadius: 10,
                  background: active ? 'rgba(255,255,255,.22)' : t.bgAlt, color: active ? '#fff' : t.textMuted,
                }}>{counts[tb.id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ paddingBottom: 20 }}>
        {q
          ? <ResultsView results={results} query={query.trim()} onClear={clear} />
          : <OverviewView show={show} />}
      </div>
    </SeoLayout>
  );
}
