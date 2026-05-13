import { Building2, Lightbulb, Zap, Target, Palette, Store, Camera, Smartphone, Package, MessageSquare, ShoppingCart, PenLine } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { IMG } from '../constants/images';
import BeforeAfter from '../components/BeforeAfter';

function Pill({ col, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, background: col + '18',
      border: `1px solid ${col}44`, borderRadius: 50, padding: '6px 16px',
      fontSize: 13, color: col, fontWeight: 700, marginBottom: 20,
    }}>{label}</span>
  );
}

function Bullet({ Icon, text, col = '#E91E8C' }) {
  const { t } = useT();
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: col + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
      }}>
        <Icon size={14} color={col} strokeWidth={2} />
      </div>
      <span style={{ fontSize: 14, color: t.textSub, lineHeight: 1.65 }}>{text}</span>
    </div>
  );
}

const RESIZE_PRESETS = [
  { p: 'Instagram', s: '1080×1080', Icon: Camera      },
  { p: 'Story',     s: '1080×1920', Icon: Smartphone  },
  { p: 'Amazon',    s: '2000×2000', Icon: Package     },
  { p: 'Facebook',  s: '1200×628',  Icon: MessageSquare },
  { p: 'Shopify',   s: '2048×2048', Icon: ShoppingCart },
  { p: 'Custom',    s: 'Any size',  Icon: PenLine     },
];

export default function FeaturesSection() {
  const { t } = useT();
  const mob = useIsMobile();
  const sp = mob ? '60px 20px' : '40px 48px 100px';

  return (
    <section id="features" style={{ padding: sp, background: t.bgAlt }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: mob ? 48 : 80 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, letterSpacing: 2, color: '#E91E8C',
            textTransform: 'uppercase', marginBottom: 14,
          }}>Core Features</p>
          <h2 style={{
            fontSize: mob ? 'clamp(26px,7vw,38px)' : 'clamp(30px,4vw,50px)',
            fontWeight: 800, letterSpacing: '-1px', color: t.text,
          }}>
            Everything for <span className="gt">perfect product photos</span>
          </h2>
        </div>

        {/* Feature 1: AI Scene Generation */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: mob ? 32 : 80, alignItems: 'center', marginBottom: mob ? 60 : 130,
        }} className="c2">
          <div>
            <Pill col="#E91E8C" label="Feature 01" />
            <h3 style={{
              fontSize: mob ? 26 : 'clamp(26px,3.5vw,42px)', fontWeight: 800,
              lineHeight: 1.2, marginBottom: 16, letterSpacing: '-.8px', color: t.text,
            }}>
              AI Scene{' '}
              <span style={{
                background: 'linear-gradient(135deg,#FF6B35,#E91E8C)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Generation</span>
            </h3>
            <p style={{ fontSize: mob ? 15 : 17, lineHeight: 1.8, color: t.textSub, marginBottom: 24 }}>
              Pick a scene template and watch our AI place your perfume, skincare, or cosmetic
              product into it naturally — perfect lighting and shadows included.
            </p>
            <Bullet Icon={Building2}  col="#E91E8C" text="200+ scenes: luxury, nature, urban, abstract" />
            <Bullet Icon={Lightbulb} col="#E91E8C" text="AI-matched lighting and shadow for photorealistic results" />
            <Bullet Icon={Zap}        col="#E91E8C" text="Full HD output ready in under 10 seconds" />
          </div>
          <BeforeAfter
            beforeImg={IMG.scenesBefore}
            afterImg={IMG.scenesAfter}
            beforeLabel="Plain Studio"
            afterLabel="AI Scene Applied"
          />
        </div>

        {/* Feature 2: AI Background Replacement */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: mob ? 32 : 80, alignItems: 'center', marginBottom: mob ? 60 : 130,
        }} className="c2">
          <BeforeAfter
            beforeImg={IMG.bgBefore}
            afterImg={IMG.bgAfter}
            beforeLabel="Original Background"
            afterLabel="New Background"
          />
          <div>
            <Pill col="#7B2FBE" label="Feature 02" />
            <h3 style={{
              fontSize: mob ? 26 : 'clamp(26px,3.5vw,42px)', fontWeight: 800,
              lineHeight: 1.2, marginBottom: 16, letterSpacing: '-.8px', color: t.text,
            }}>
              AI Background{' '}
              <span style={{
                background: 'linear-gradient(135deg,#7B2FBE,#9B5DE5)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Replacement</span>
            </h3>
            <p style={{ fontSize: mob ? 15 : 17, lineHeight: 1.8, color: t.textSub, marginBottom: 24 }}>
              Remove any background instantly and replace it with a professional setting — clean
              white for marketplaces, or a luxury backdrop for brand campaigns.
            </p>
            <Bullet Icon={Target}  col="#7B2FBE" text="One-tap removal with sub-pixel edge precision" />
            <Bullet Icon={Palette} col="#7B2FBE" text="Solid colors, gradients, bokeh, or custom scenes" />
            <Bullet Icon={Store}   col="#7B2FBE" text="Amazon, Shopify, Etsy-ready white background presets" />
          </div>
        </div>

        {/* Feature 3: Smart Resize */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: mob ? 32 : 80, alignItems: 'center',
        }} className="c2">
          <div>
            <Pill col="#FF6B35" label="Feature 03" />
            <h3 style={{
              fontSize: mob ? 26 : 'clamp(26px,3.5vw,42px)', fontWeight: 800,
              lineHeight: 1.2, marginBottom: 16, letterSpacing: '-.8px', color: t.text,
            }}>
              Smart{' '}
              <span style={{
                background: 'linear-gradient(135deg,#FF6B35,#FFAA00)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Resize</span>
            </h3>
            <p style={{ fontSize: mob ? 15 : 17, lineHeight: 1.8, color: t.textSub, marginBottom: 24 }}>
              Export in the exact dimensions every platform requires — pre-configured presets,
              no manual cropping, no guesswork.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {RESIZE_PRESETS.map(({ p, s, Icon }) => (
                <div key={p} style={{
                  background: t.stepBg, border: `1px solid ${t.border}`,
                  borderRadius: 12, padding: '12px 8px', textAlign: 'center',
                  boxShadow: t.shadow, transition: 'all .2s', cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,107,53,.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(255,107,53,.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 6px',
                  }}>
                    <Icon size={16} color="#FF6B35" strokeWidth={2} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2, color: t.text }}>{p}</div>
                  <div style={{ fontSize: 9, color: t.textMuted }}>{s}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <img src={IMG.resizeDemo} alt="Product smart resize"
              style={{ width: '100%', borderRadius: 22, boxShadow: t.shadowCard, display: 'block' }} />
            <div style={{
              position: 'absolute', top: 16, left: 16,
              background: 'linear-gradient(135deg,rgba(255,107,53,.92),rgba(233,30,140,.92))',
              borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 700, color: 'white',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <Camera size={14} strokeWidth={2} />
              1080×1080 — Instagram
            </div>
            <div style={{
              position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,.7)',
              backdropFilter: 'blur(10px)', borderRadius: 12, padding: '10px 16px',
              fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.88)',
              border: '1px solid rgba(255,255,255,.1)',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <Package size={14} strokeWidth={2} />
              15+ Export Presets
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
