import { Quote } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { IMG } from '../constants/images';

const TESTIMONIALS = [
  {
    name: 'Sarah K.', role: 'Shopify Store Owner', avatar: IMG.sarah,
    text: 'Lite Layers transformed my listings. I used to pay $400 per shoot — now I get better results in 5 minutes from my phone. My conversion rate jumped 38%.',
  },
  {
    name: 'Marcus T.', role: 'Amazon FBA Seller', avatar: IMG.marcus,
    text: 'The AI scene generator is incredible. Applied a luxury marble scene to my skincare line and click-through rate went up 47%. Looks exactly like a professional studio.',
  },
  {
    name: 'Priya M.', role: 'Beauty Brand Founder', avatar: IMG.priya,
    text: 'Background removal is pixel-perfect, even on glass perfume bottles. The resize presets save me hours every week. Absolute must-have for any beauty brand.',
  },
];

export default function TestimonialsSection() {
  const { t } = useT();
  const mob = useIsMobile();

  return (
    <section style={{ padding: mob ? '60px 20px' : '100px 48px', background: t.bgAlt }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: mob ? 40 : 64 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, letterSpacing: 2, color: '#E91E8C',
            textTransform: 'uppercase', marginBottom: 14,
          }}>Testimonials</p>
          <h2 style={{
            fontSize: mob ? 'clamp(26px,7vw,38px)' : 'clamp(30px,4vw,50px)',
            fontWeight: 800, letterSpacing: '-1px', color: t.text,
          }}>
            Loved by sellers <span className="gt">worldwide</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: mob ? 14 : 24 }} className="c3">
          {TESTIMONIALS.map((item, i) => (
            <div key={i} style={{
              background: t.stepBg, border: `1px solid ${t.border}`, borderRadius: 22,
              padding: mob ? '24px 20px' : 36, boxShadow: t.shadow, transition: 'all .3s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = t.shadowHover; e.currentTarget.style.transform = 'translateY(-6px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = t.shadow; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} width="15" height="15" viewBox="0 0 24 24" fill="#FF6B35">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <Quote size={20} color={t.textFaint} strokeWidth={1.5} />
              </div>
              <p style={{
                fontSize: mob ? 14 : 15, lineHeight: 1.8, color: t.textSub,
                marginBottom: 22, fontStyle: 'italic',
              }}>"{item.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={item.avatar} alt={item.name}
                  style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(233,30,140,.4)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: t.textMuted }}>{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
