import { Sparkles, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { IMG } from '../constants/images';
import Logo from '../components/Logo';

export default function HeroSection() {
  const { t } = useT();
  const mob = useIsMobile();

  return (
    <section style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative',
      overflow: 'hidden', padding: mob ? '120px 20px 60px' : '130px 48px 80px', background: t.bg,
    }}>
      {/* Glow blobs */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-8%', width: '55vw', height: '55vw',
        borderRadius: '50%', background: 'radial-gradient(circle,rgba(233,30,140,.16),transparent 68%)',
        filter: 'blur(70px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-8%', width: '48vw', height: '48vw',
        borderRadius: '50%', background: 'radial-gradient(circle,rgba(123,47,190,.14),transparent 68%)',
        filter: 'blur(70px)', pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center',
        gap: mob ? 0 : 60, width: '100%', position: 'relative',
        flexDirection: mob ? 'column' : 'row',
      }}>
        {/* Left */}
        <div style={{ flex: 1, maxWidth: mob ? '100%' : 580 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, background: t.pillBg,
            border: `1px solid ${t.pillBorder}`, borderRadius: 50, padding: '6px 16px',
            fontSize: 13, color: '#E91E8C', fontWeight: 700, marginBottom: 24, letterSpacing: .5,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#E91E8C',
              animation: 'pulse 2s infinite', display: 'inline-block',
            }} />
            AI-Powered Product Photography
          </div>

          <h1 style={{
            fontSize: mob ? 'clamp(32px,9vw,48px)' : 'clamp(38px,5vw,66px)',
            fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 20, color: t.text,
          }}>
            Turn Any Product Into{' '}
            <span className="gt">Studio-Quality</span>{' '}Photos
          </h1>

          <p style={{ fontSize: mob ? 16 : 18, lineHeight: 1.75, color: t.textSub, marginBottom: 36 }}>
            Pick your product, choose from 200+ professional scene templates, and let AI
            composite a perfect shot in seconds — built for ecommerce sellers.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
            <a href="#download" className="llb gb" style={{
              padding: mob ? '13px 24px' : '15px 30px', fontSize: mob ? 15 : 16,
              borderRadius: 16, fontWeight: 700, boxShadow: '0 20px 50px rgba(233,30,140,.35)', gap: 8,
            }}>
              <Play size={18} fill="white" strokeWidth={0} />
              Download on Google Play
            </a>
            <a href="#features" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: t.outlineBtn, border: `1px solid ${t.outlineBtnBorder}`,
              padding: mob ? '13px 22px' : '15px 28px', borderRadius: 16, textDecoration: 'none',
              color: t.text, fontWeight: 600, fontSize: mob ? 15 : 16, transition: 'all .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
              See Features
              <ArrowRight size={18} strokeWidth={2} />
            </a>
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex' }}>
              {[IMG.av1, IMG.av2, IMG.av3, IMG.av4].map((src, i) => (
                <img key={i} src={src} alt="" style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: `2.5px solid ${t.bg}`, marginLeft: i === 0 ? 0 : -11, objectFit: 'cover',
                }} />
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 3 }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FF6B35">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <div style={{ fontSize: 13, color: t.textMuted }}>10,000+ happy sellers</div>
            </div>
          </div>
        </div>

        {/* Right: floating product cards — varied sizes & positions */}
        <div className="hr" style={{ flex: 1, position: 'relative', minHeight: 560 }}>

          {/* Card 1 — top-left, "Original" badge */}
          <div className="ll-f1" style={{
            position: 'absolute', top: '5%', left: '4%', width: 192,
            borderRadius: 20, overflow: 'hidden', boxShadow: t.shadowCard,
          }}>
            <img src={IMG.hero1} alt="Product original"
              style={{ width: '100%', display: 'block' }} />
            <div style={{
              position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,.62)',
              backdropFilter: 'blur(8px)', padding: '3px 10px', borderRadius: 12,
              fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.85)', letterSpacing: 1, textTransform: 'uppercase',
            }}>Original</div>
          </div>

          {/* Card 2 — top-right, "AI Scene" badge */}
          <div className="ll-f2" style={{
            position: 'absolute', top: '0%', right: '3%', width: 200,
            borderRadius: 20, overflow: 'hidden', boxShadow: '0 28px 70px rgba(233,30,140,.32)',
          }}>
            <img src={IMG.hero2} alt="Product AI scene"
              style={{ width: '100%', display: 'block' }} />
            <div style={{
              position: 'absolute', bottom: 10, right: 10,
              background: 'linear-gradient(135deg,rgba(233,30,140,.9),rgba(123,47,190,.9))',
              padding: '3px 10px', borderRadius: 12,
              fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: 1, textTransform: 'uppercase',
            }}>AI Scene</div>
          </div>

          {/* Card 3 — bottom-left */}
          <div className="ll-f3" style={{
            position: 'absolute', bottom: '3%', left: '12%', width: 186,
            borderRadius: 20, overflow: 'hidden', boxShadow: '0 28px 70px rgba(123,47,190,.3)',
          }}>
            <img src={IMG.hero3} alt="Product 3"
              style={{ width: '100%', display: 'block' }} />
          </div>

          {/* Card 4 — bottom-right */}
          <div className="ll-f4" style={{
            position: 'absolute', bottom: '5%', right: '6%', width: 176,
            borderRadius: 20, overflow: 'hidden', boxShadow: '0 28px 70px rgba(255,107,53,.26)',
          }}>
            <img src={IMG.hero4} alt="Product 4"
              style={{ width: '100%', display: 'block' }} />
          </div>

          {/* AI processing badge */}
          <div style={{
            position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%,-50%)',
            background: 'linear-gradient(135deg,rgba(233,30,140,.92),rgba(123,47,190,.92))',
            backdropFilter: 'blur(12px)', borderRadius: 50, padding: '12px 20px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 20px 50px rgba(233,30,140,.45)', whiteSpace: 'nowrap', zIndex: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={16} color="white" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>AI Processing Done</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.72)' }}>Scene applied in 4.2s</div>
            </div>
            <CheckCircle2 size={16} color="rgba(255,255,255,.8)" strokeWidth={2} />
          </div>
        </div>
      </div>
    </section>
  );
}
