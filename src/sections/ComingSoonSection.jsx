import { Zap, Users, CheckCircle2, Rocket } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { IMG } from '../constants/images';

export default function ComingSoonSection() {
  const { t, isDark } = useT();
  const mob = useIsMobile();

  return (
    <section id="coming-soon" style={{ padding: mob ? '60px 20px' : '100px 48px', background: t.bg }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: mob ? 40 : 64 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, background: t.pillBg,
            border: `1px solid ${t.pillBorder}`, borderRadius: 50, padding: '8px 20px',
            fontSize: 14, fontWeight: 700, color: '#E91E8C', marginBottom: 22,
          }}>
            <Rocket size={16} strokeWidth={2} />
            Coming Soon
          </span>
          <h2 style={{
            fontSize: mob ? 'clamp(26px,7vw,38px)' : 'clamp(30px,4vw,50px)',
            fontWeight: 800, letterSpacing: '-1px', marginBottom: 14, color: t.text,
          }}>
            Even More <span className="gt">Power Features</span>
          </h2>
          <p style={{ fontSize: mob ? 15 : 18, color: t.textMuted, maxWidth: 520, margin: '0 auto', lineHeight: 1.75 }}>
            We're building the future of AI product photography — here's what's next.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? 20 : 28 }} className="up-grid">
          {/* Batch Editing */}
          <div style={{
            background: isDark ? 'linear-gradient(135deg,rgba(255,107,53,.08),rgba(233,30,140,.05))' : '#ffffff',
            border: '1px solid rgba(255,107,53,.22)', borderRadius: 28, overflow: 'hidden',
            boxShadow: t.shadow, transition: 'transform .3s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ padding: mob ? '32px 24px 24px' : '48px 44px 36px' }}>
              <span style={{
                display: 'inline-flex', gap: 8, alignItems: 'center',
                background: 'rgba(255,107,53,.14)', borderRadius: 50, padding: '6px 16px',
                fontSize: 13, fontWeight: 700, color: '#FF6B35', marginBottom: 18,
              }}>
                <Zap size={14} strokeWidth={2.5} />
                Batch Processing
              </span>
              <h3 style={{ fontSize: mob ? 24 : 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 12, color: t.text }}>
                Edit 100s of Products at Once
              </h3>
              <p style={{ fontSize: mob ? 14 : 15, lineHeight: 1.8, color: t.textSub, marginBottom: 22 }}>
                Select your entire product catalog, pick one scene, and apply it to all simultaneously.
                Minutes instead of hours.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Multi-select products', 'One scene → all products', 'Bulk export'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                    <CheckCircle2 size={15} color="#FF6B35" strokeWidth={2} />
                    <span style={{ fontSize: 13, color: t.textSub }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ paddingInline: mob ? 24 : 44 }}>
              <img src={IMG.batchImg} alt="Batch editing"
                style={{ width: '100%', borderRadius: '14px 14px 0 0', display: 'block', height: 200, objectFit: 'cover' }} />
            </div>
          </div>

          {/* Virtual Try-On */}
          <div style={{
            background: isDark ? 'linear-gradient(135deg,rgba(123,47,190,.08),rgba(60,20,120,.05))' : '#ffffff',
            border: '1px solid rgba(123,47,190,.22)', borderRadius: 28, overflow: 'hidden',
            boxShadow: t.shadow, transition: 'transform .3s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ padding: mob ? '32px 24px 24px' : '48px 44px 36px' }}>
              <span style={{
                display: 'inline-flex', gap: 8, alignItems: 'center',
                background: 'rgba(123,47,190,.14)', borderRadius: 50, padding: '6px 16px',
                fontSize: 13, fontWeight: 700, color: '#9B5DE5', marginBottom: 18,
              }}>
                <Users size={14} strokeWidth={2} />
                Virtual Try-On
              </span>
              <h3 style={{ fontSize: mob ? 24 : 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 12, color: t.text }}>
                See Any Outfit On Yourself
              </h3>
              <p style={{ fontSize: mob ? 14 : 15, lineHeight: 1.8, color: t.textSub, marginBottom: 22 }}>
                Upload your photo + any clothing item. Our AI generates a realistic image of you wearing
                it — shop smarter, return less.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Upload your photo', 'Pick any garment', 'See yourself wearing it'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                    <CheckCircle2 size={15} color="#9B5DE5" strokeWidth={2} />
                    <span style={{ fontSize: 13, color: t.textSub }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ paddingInline: mob ? 24 : 44 }}>
              <img src={IMG.tryonImg} alt="Virtual try-on"
                style={{ width: '100%', borderRadius: '14px 14px 0 0', display: 'block', height: 200, objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
