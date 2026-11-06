import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { IMG } from '../constants/images';

const SHOTS = [
  { src: IMG.show1, label: 'Perfume'    },
  { src: IMG.show2, label: 'Cosmetics'  },
  { src: IMG.show3, label: 'Makeup'     },
  { src: IMG.show4, label: 'Skincare'   },
  { src: IMG.show5, label: 'Lipstick'   },
  { src: IMG.show6, label: 'Candles'    },
  { src: IMG.show7, label: 'Haircare'   },
];

export default function ShowcaseSection() {
  const { t } = useT();
  const mob = useIsMobile();
  const rowRef = useRef(null);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Track whether there is more to see on either side, to show/hide the arrows.
  const updateArrows = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [mob]);

  const scrollByCards = (dir) => {
    const el = rowRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const arrowStyle = (side, visible) => ({
    position: 'absolute', top: '50%', [side]: -22, transform: 'translateY(-50%)', zIndex: 2,
    width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: t.bgCard, color: t.text, border: `1px solid ${t.border}`,
    boxShadow: t.shadowCard, backdropFilter: 'blur(12px)',
    opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none', transition: 'opacity .2s',
  });

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
          Real consumable products, <span className="gt">AI-powered results</span>
        </h2>
      </div>
      {/* Same centred 1240px frame as the other sections */}
      <div style={{ paddingInline: mob ? 20 : 48 }}>
      <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto' }}>
      {!mob && (
        <>
          <button type="button" aria-label="Scroll left" onClick={() => scrollByCards(-1)} style={arrowStyle('left', canLeft)}>
            <ChevronLeft size={22} />
          </button>
          <button type="button" aria-label="Scroll right" onClick={() => scrollByCards(1)} style={arrowStyle('right', canRight)}>
            <ChevronRight size={22} />
          </button>
        </>
      )}
      <div ref={rowRef} onScroll={updateArrows} className="ll-hscroll" style={{
        display: 'flex', gap: 14,
        overflowX: 'auto', scrollSnapType: 'x mandatory',
        paddingTop: 16, paddingBottom: 18,
      }}>
        {SHOTS.map((item, i) => (
          <div key={i} style={{
            flexShrink: 0, scrollSnapAlign: 'start', width: mob ? 160 : 220, borderRadius: 18,
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
      </div>
      </div>
    </section>
  );
}
