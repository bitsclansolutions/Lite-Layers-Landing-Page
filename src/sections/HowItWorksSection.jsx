import { Camera, Layers, Wand2, ArrowRight } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';

const STEPS = [
  {
    n: '01', Icon: Camera, color: '#FF6B35',
    title: 'Upload Your Product',
    desc: 'Take a photo of your perfume, cosmetics, or any product. Any background, any lighting — AI handles isolation automatically.',
  },
  {
    n: '02', Icon: Layers, color: '#E91E8C',
    title: 'Choose a Scene',
    desc: 'Browse 200+ professionally crafted scene templates — marble studios, luxury hotels, tropical beaches and more.',
  },
  {
    n: '03', Icon: Wand2, color: '#7B2FBE',
    title: 'AI Does the Magic',
    desc: 'In seconds, AI composites your product in the scene with perfect lighting, realistic shadows and reflections.',
  },
];

export default function HowItWorksSection() {
  const { t } = useT();
  const mob = useIsMobile();

  return (
    <section style={{ padding: mob ? '60px 20px' : '100px 48px', background: t.bg }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: mob ? 40 : 64 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, letterSpacing: 2, color: '#E91E8C',
            textTransform: 'uppercase', marginBottom: 14,
          }}>Simple 3-Step Process</p>
          <h2 style={{
            fontSize: mob ? 'clamp(26px,7vw,38px)' : 'clamp(30px,4vw,50px)',
            fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.2, color: t.text,
          }}>
            From plain to <span className="gt">professional</span> in seconds
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: mob ? 16 : 28 }} className="c3">
          {STEPS.map((step, i) => (
            <div key={step.n} style={{
              background: t.stepBg, border: `1px solid ${t.border}`, borderRadius: 24,
              padding: mob ? '28px 22px' : '40px 32px', position: 'relative',
              boxShadow: t.shadow, transition: 'all .3s', cursor: 'default',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = t.shadowHover;
                e.currentTarget.style.borderColor = step.color + '55';
                e.currentTarget.style.transform = 'translateY(-8px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = t.shadow;
                e.currentTarget.style.borderColor = t.border;
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
              {i < 2 && (
                <div className="mh" style={{
                  position: 'absolute', top: 40, right: -18, zIndex: 2,
                  color: t.textFaint,
                }}>
                  <ArrowRight size={26} />
                </div>
              )}
              <div style={{
                width: 50, height: 50, borderRadius: 14,
                background: step.color + '22', border: `1px solid ${step.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <step.Icon size={24} color={step.color} strokeWidth={1.8} />
              </div>
              <div style={{
                fontSize: 60, fontWeight: 900, color: step.color + '12',
                lineHeight: 1, position: 'absolute', top: 18, right: 20,
              }}>{step.n}</div>
              <h3 style={{ fontSize: mob ? 18 : 22, fontWeight: 700, marginBottom: 10, color: t.text }}>{step.title}</h3>
              <p style={{ fontSize: mob ? 13 : 15, lineHeight: 1.75, color: t.textSub }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
