import { useT } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { IMG } from '../constants/images';

const SHOTS = [
  { src: IMG.show1, label: 'Perfume'    },
  { src: IMG.show2, label: 'Cosmetics'  },
  { src: IMG.show3, label: 'Makeup'     },
  { src: IMG.show4, label: 'Watch'      },
  { src: IMG.show5, label: 'Sunglasses' },
  { src: IMG.show6, label: 'Sneakers'   },
  { src: IMG.show7, label: 'Handbag'    },
];

export default function ShowcaseSection() {
  const { t } = useT();
  const mob = useIsMobile();

  return (
    <section style={{ padding: mob ? '48px 0' : '80px 0', overflow: 'hidden', background: t.bg }}>
      <div style={{ textAlign: 'center', marginBottom: mob ? 32 : 48, padding: `0 ${mob ? 20 : 48}px` }}>
        <p style={{
          fontSize: 13, fontWeight: 700, letterSpacing: 2, color: '#E91E8C',
          textTransform: 'uppercase', marginBottom: 14,
        }}>Results</p>
        <h2 style={{
          fontSize: mob ? 'clamp(24px,7vw,36px)' : 'clamp(28px,3.5vw,46px)',
          fontWeight: 800, letterSpacing: '-1px', color: t.text,
        }}>
          Real products, <span className="gt">AI-powered results</span>
        </h2>
      </div>
      <div style={{
        display: 'flex', gap: 14, paddingInline: mob ? 20 : 48,
        overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 8,
      }}>
        {SHOTS.map((item, i) => (
          <div key={i} style={{
            flexShrink: 0, width: mob ? 160 : 220, borderRadius: 18,
            overflow: 'hidden', boxShadow: t.shadowCard, transition: 'transform .3s', position: 'relative',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <img src={item.src} alt={item.label}
              style={{ width: '100%', display: 'block', height: mob ? 200 : 290, objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '18px 12px 10px',
              background: 'linear-gradient(to top,rgba(0,0,0,.7),transparent)',
              fontSize: 13, fontWeight: 700, color: 'white',
            }}>{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
