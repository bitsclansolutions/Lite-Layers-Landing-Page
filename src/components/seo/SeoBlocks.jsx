// Building blocks shared by the SEO pages (product, hub and index pages).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Check, ChevronRight, ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import { useT } from '../../context/ThemeContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PLAY_STORE_URL } from '../../constants/links';
import { FREE_PLAN } from '../../constants/site';
import { SPEC_FIELDS } from '../../data/platformSpecs';
import { linkLabel } from '../../data/seoPages';
import Navbar from '../Navbar';
import BeforeAfter from '../BeforeAfter';
import DownloadSection from '../../sections/DownloadSection';
import FooterSection from '../../sections/FooterSection';

const PINK = '#E91E8C';
const STEP_COLORS = ['#FF6B35', '#E91E8C', '#7B2FBE'];

export function SeoLayout({ children }) {
  const { t } = useT();
  return (
    <>
      <Navbar />
      <main style={{ background: t.bg }}>{children}</main>
      <DownloadSection />
      <FooterSection />
    </>
  );
}

export function Breadcrumbs({ crumbs }) {
  const { t } = useT();
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 22 }}>
      <ol style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, listStyle: 'none', fontSize: 13 }}>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.href} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {last
                ? <span aria-current="page" style={{ color: t.textSub }}>{c.label}</span>
                : <Link to={c.href} style={{ color: t.textMuted, textDecoration: 'none' }}>{c.label}</Link>}
              {!last && <ChevronRight size={13} color={t.textFaint} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Pill({ children }) {
  const { t } = useT();
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, background: t.pillBg,
      border: `1px solid ${t.pillBorder}`, borderRadius: 50, padding: '6px 16px',
      fontSize: 13, color: PINK, fontWeight: 600, marginBottom: 22, letterSpacing: .5,
    }}>
      <Sparkles size={14} strokeWidth={2.2} />
      {children}
    </div>
  );
}

export function DownloadButton({ label = 'Download Free on Google Play' }) {
  const mob = useIsMobile();
  return (
    <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="llb gb" style={{
      padding: mob ? '13px 24px' : '15px 30px', fontSize: mob ? 15 : 16,
      borderRadius: 16, fontWeight: 600, boxShadow: '0 20px 50px rgba(233,30,140,.35)', gap: 8,
    }}>
      <Play size={18} fill="white" strokeWidth={0} />
      {label}
    </a>
  );
}

export function FreePoints() {
  const { t } = useT();
  const points = [
    `${FREE_PLAN.sceneGenerations} free AI scenes a month`,
    `${FREE_PLAN.backgroundRemovals} free background removals`,
    'No credit card',
  ];
  return (
    <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', listStyle: 'none', marginTop: 26 }}>
      {points.map(p => (
        <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: t.textMuted }}>
          <Check size={14} color={PINK} strokeWidth={2.5} />{p}
        </li>
      ))}
    </ul>
  );
}

export function SeoHero({ crumbs, pill, h1, intro, beforeImg, afterImg, image, imageAlt }) {
  const { t } = useT();
  const mob = useIsMobile();
  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: mob ? '110px 20px 50px' : '140px 48px 80px' }}>
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(233,30,140,.14),transparent 68%)', filter: 'blur(70px)', pointerEvents: 'none',
      }} />
      <div style={{
        maxWidth: 1240, margin: '0 auto', position: 'relative', display: 'grid',
        gridTemplateColumns: mob ? '1fr' : '1.05fr 1fr', gap: mob ? 36 : 60, alignItems: 'center',
      }}>
        <div>
          <Breadcrumbs crumbs={crumbs} />
          <Pill>{pill}</Pill>
          <h1 style={{
            fontSize: mob ? 'clamp(30px,8.5vw,44px)' : 'clamp(36px,4.4vw,58px)',
            fontWeight: 700, lineHeight: 1.08, letterSpacing: '-1.5px', marginBottom: 20, color: t.text,
          }}>
            {h1.startsWith('Free ')
              ? <><span className="gt">Free</span>{h1.slice(4)}</>
              : h1}
          </h1>
          <p style={{ fontSize: mob ? 16 : 18, lineHeight: 1.75, color: t.textSub, marginBottom: 30, maxWidth: 560 }}>{intro}</p>
          <DownloadButton />
          <FreePoints />
        </div>
        <div>
          {beforeImg && afterImg
            ? <BeforeAfter beforeImg={beforeImg} afterImg={afterImg} />
            : image && (
              <img src={image} alt={imageAlt} style={{
                width: '100%', height: mob ? 280 : 440, objectFit: 'cover', objectPosition: 'center 75%', borderRadius: 28,
                boxShadow: t.shadowCard, display: 'block',
              }} />
            )}
        </div>
      </div>
    </section>
  );
}

export function Section({ eyebrow, title, intro, children, id, narrow }) {
  const { t } = useT();
  const mob = useIsMobile();
  return (
    <section id={id} style={{ padding: mob ? '44px 20px' : '70px 48px' }}>
      <div style={{ maxWidth: narrow ? 860 : 1240, margin: '0 auto' }}>
        {eyebrow && (
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, color: PINK, textTransform: 'uppercase', marginBottom: 12 }}>
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 style={{
            fontSize: mob ? 'clamp(24px,6.5vw,32px)' : 'clamp(28px,3vw,40px)',
            fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.2, color: t.text, marginBottom: intro ? 14 : 30,
          }}>{title}</h2>
        )}
        {intro && <p style={{ fontSize: 16, lineHeight: 1.8, color: t.textSub, marginBottom: 30, maxWidth: 760 }}>{intro}</p>}
        {children}
      </div>
    </section>
  );
}

// The sheet's main AEO question, answered up front so search and AI engines can quote it.
export function AnswerBlock({ q, a }) {
  const { t } = useT();
  const mob = useIsMobile();
  return (
    <Section narrow>
      <div style={{
        background: t.bgCard, border: `1px solid ${t.pillBorder}`, borderRadius: 28,
        padding: mob ? '28px 22px' : '40px 44px', boxShadow: t.shadow,
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, color: PINK, textTransform: 'uppercase', marginBottom: 12 }}>
          Quick answer
        </p>
        <h2 style={{ fontSize: mob ? 22 : 28, fontWeight: 700, lineHeight: 1.3, color: t.text, marginBottom: 14, letterSpacing: '-.5px' }}>{q}</h2>
        <p style={{ fontSize: mob ? 16 : 17, lineHeight: 1.85, color: t.textSub }}>{a}</p>
      </div>
    </Section>
  );
}

export function Steps({ steps }) {
  const { t } = useT();
  const mob = useIsMobile();
  return (
    <ol className="c3" style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(3,1fr)', gap: mob ? 14 : 24, listStyle: 'none' }}>
      {steps.map((s, i) => (
        <li key={s.title} style={{
          background: t.stepBg, border: `1px solid ${t.border}`, borderRadius: 24,
          padding: mob ? '24px 20px' : '32px 28px', boxShadow: t.shadow,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${STEP_COLORS[i]}22`, color: STEP_COLORS[i], fontWeight: 700, fontSize: 15,
          }}>{i + 1}</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: t.text, marginBottom: 10 }}>{s.title}</h3>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: t.textSub }}>{s.desc}</p>
        </li>
      ))}
    </ol>
  );
}

const SCENE_GRADIENTS = [
  'linear-gradient(135deg,#FFE3D3,#F7B2D0)',
  'linear-gradient(135deg,#D8E7FF,#C9B8F2)',
  'linear-gradient(135deg,#E6F4EA,#BFE3D0)',
  'linear-gradient(135deg,#FDF1D6,#F1C9A0)',
];

export function SceneGrid({ scenes, productName }) {
  const { t } = useT();
  const mob = useIsMobile();
  return (
    <div className="c4" style={{ display: 'grid', gridTemplateColumns: mob ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: mob ? 12 : 20 }}>
      {scenes.map((s, i) => {
        const card = (
          <div style={{
            borderRadius: 22, overflow: 'hidden', border: `1px solid ${t.border}`, background: t.bgCard,
            boxShadow: t.shadow, height: '100%',
          }}>
            {s.image
              ? <img src={s.image} alt={`${s.name} scene for ${productName} product photos`} loading="lazy"
                  style={{ width: '100%', height: mob ? 130 : 190, objectFit: 'cover', objectPosition: 'center 75%', display: 'block' }} />
              : <div aria-hidden="true" style={{
                  height: mob ? 130 : 190,
                  // White scenes get a white tile with a soft studio falloff and edge, so it
                  // still reads as a tile on light-theme cards; others a soft colour tile.
                  background: /white/i.test(s.name)
                    ? 'radial-gradient(ellipse at 50% 35%, #ffffff 40%, #ece9f3 100%)'
                    : SCENE_GRADIENTS[i % SCENE_GRADIENTS.length],
                  boxShadow: /white/i.test(s.name) ? `inset 0 -1px 0 ${t.border}` : undefined,
                }} />}
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: t.text }}>{s.name}</span>
              {s.href && <ArrowRight size={16} color={PINK} />}
            </div>
          </div>
        );
        return s.href
          ? <Link key={s.name} to={s.href} style={{ textDecoration: 'none' }}>{card}</Link>
          : <div key={s.name}>{card}</div>;
      })}
    </div>
  );
}

export function ChipList({ items }) {
  const { t } = useT();
  return (
    <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 10, listStyle: 'none' }}>
      {items.map(item => (
        <li key={item} style={{
          padding: '9px 16px', borderRadius: 30, fontSize: 14, fontWeight: 500,
          background: t.bgCard, border: `1px solid ${t.border}`, color: t.textSub,
        }}>{item}</li>
      ))}
    </ul>
  );
}

// Custom FAQ accordion. Answers stay in the HTML when closed (hidden by a 0-height
// grid row, not removed), so search engines and AI crawlers still read them.
function FaqItem({ q, a, index, open, onToggle }) {
  const { t, isDark } = useT();
  const mob = useIsMobile();
  const id = `faq-${index}`;
  return (
    <div style={{
      borderRadius: 20,
      border: `1px solid ${open ? t.pillBorder : t.border}`,
      background: open
        ? `linear-gradient(135deg, ${isDark ? 'rgba(233,30,140,.08)' : 'rgba(233,30,140,.05)'}, ${isDark ? 'rgba(123,47,190,.08)' : 'rgba(123,47,190,.04)'}), ${t.bgCard}`
        : t.bgCard,
      boxShadow: open ? t.shadowHover : t.shadow,
      transition: 'border-color .25s ease, box-shadow .25s ease, background .25s ease',
    }}>
      <h3 style={{ margin: 0 }}>
        <button
          type="button"
          id={`${id}-btn`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="ll-faq-btn"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: mob ? 12 : 16,
            padding: mob ? '18px 18px' : '20px 24px', background: 'none', border: 'none',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', borderRadius: 20,
          }}
        >
          <span aria-hidden="true" style={{
            flexShrink: 0, fontSize: 13, fontWeight: 700, letterSpacing: .5,
            color: open ? '#E91E8C' : t.textFaint, transition: 'color .25s ease',
            minWidth: 22,
          }}>{String(index + 1).padStart(2, '0')}</span>
          <span style={{
            flex: 1, fontSize: mob ? 16 : 17, fontWeight: 600, lineHeight: 1.45,
            color: t.text,
          }}>{q}</span>
          <span aria-hidden="true" className={open ? 'gb' : ''} style={{
            flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: open ? undefined : t.pillBg,
            border: `1px solid ${open ? 'transparent' : t.pillBorder}`,
            color: open ? '#fff' : '#E91E8C',
          }}>
            <ChevronDown size={18} strokeWidth={2.4} style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform .3s ease',
            }} />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-btn`}
        style={{
          display: 'grid', gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows .32s ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <p style={{
            fontSize: 15, lineHeight: 1.8, color: t.textSub,
            padding: mob ? '0 18px 20px 52px' : '0 24px 22px 62px',
            opacity: open ? 1 : 0, transition: 'opacity .25s ease',
          }}>{a}</p>
        </div>
      </div>
    </div>
  );
}

export function FaqList({ faqs }) {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {faqs.map((f, i) => (
        <FaqItem
          key={f.q} q={f.q} a={f.a} index={i}
          open={openIndex === i}
          onToggle={() => setOpenIndex(cur => (cur === i ? -1 : i))}
        />
      ))}
    </div>
  );
}

export function LinkCards({ pages, compact }) {
  const { t } = useT();
  const mob = useIsMobile();
  return (
    <ul className={compact ? 'c4' : 'c3'} style={{
      display: 'grid', gridTemplateColumns: mob ? (compact ? 'repeat(2,1fr)' : '1fr') : `repeat(${compact ? 4 : 3},1fr)`,
      gap: compact ? 10 : 16, listStyle: 'none',
    }}>
      {pages.map(p => (
        <li key={p.slug}>
          <Link to={p.slug} style={{
            display: 'block', height: '100%', textDecoration: 'none', background: t.bgCard,
            border: `1px solid ${t.border}`, borderRadius: compact ? 14 : 20,
            padding: compact ? '12px 16px' : '20px 22px', boxShadow: t.shadow,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = PINK; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}>
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              fontSize: compact ? 14 : 16, fontWeight: 600, color: t.text,
            }}>
              {linkLabel(p)}
              <ArrowRight size={15} color={PINK} style={{ flexShrink: 0 }} />
            </span>
            {!compact && (
              <span style={{ display: 'block', fontSize: 14, lineHeight: 1.65, color: t.textMuted, marginTop: 8 }}>
                {p.metaDescription}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

const cell = (t, head) => ({
  padding: '14px 16px', textAlign: 'left', verticalAlign: 'top', fontSize: 14, lineHeight: 1.6,
  borderBottom: `1px solid ${t.border}`, color: head ? t.text : t.textSub, fontWeight: head ? 700 : 400,
});

// Spec table for one platform.
export function SpecTable({ spec }) {
  const { t } = useT();
  const rows = SPEC_FIELDS.filter(([k]) => spec[k]);
  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 20, overflow: 'hidden', background: t.bgCard }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <caption style={{ position: 'absolute', left: -9999 }}>{spec.name} product image requirements</caption>
        <tbody>
          {rows.map(([k, label]) => (
            <tr key={k}>
              <th scope="row" style={{ ...cell(t, true), width: '34%' }}>{label}</th>
              <td style={cell(t)}>{spec[k]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// One chart comparing every platform.
export function SpecChart({ specs }) {
  const { t } = useT();
  const cols = [['recommended', 'Recommended'], ['minimum', 'Minimum'], ['background', 'Main image background']];
  return (
    <div className="ll-hscroll" style={{ overflowX: 'auto', border: `1px solid ${t.border}`, borderRadius: 20, background: t.bgCard }}>
      <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
        <caption style={{ position: 'absolute', left: -9999 }}>Product image sizes by platform</caption>
        <thead>
          <tr>
            <th scope="col" style={cell(t, true)}>Platform</th>
            {cols.map(([k, label]) => <th key={k} scope="col" style={cell(t, true)}>{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {specs.map(s => (
            <tr key={s.name}>
              <th scope="row" style={cell(t, true)}>
                <Link to={s.guideSlug || s.platformSlug} style={{ color: PINK, textDecoration: 'none' }}>{s.name}</Link>
              </th>
              {cols.map(([k]) => <td key={k} style={cell(t)}>{s[k] || '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
