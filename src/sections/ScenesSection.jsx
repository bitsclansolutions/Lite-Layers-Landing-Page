import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';

const SCENES = [
  { img: '/scenes/marble-surface.jpg',  name: 'Marble Studio',   tag: 'Popular'   },
  { img: '/scenes/minimalist-stage.jpg',name: 'Minimalist Stage', tag: 'Trending'  },
  { img: '/scenes/warm-podium.jpg',     name: 'Warm Podium',      tag: 'Nature'    },
  { img: '/scenes/wooden-desk.jpg',     name: 'Wooden Desk',      tag: 'Lifestyle' },
  { img: '/scenes/beige-studio.jpg',    name: 'Studio Platform',  tag: 'Clean'     },
  { img: '/scenes/marble-podium.jpg',   name: 'Marble Podium',    tag: 'Luxury'    },
  { img: '/scenes/summer-scene.jpg',    name: 'Summer Scene',      tag: 'Outdoor'   },
  { img: '/scenes/forest-podium.jpg',   name: 'Forest Backdrop',  tag: 'Nature'    },
];

function SceneModal({ scene, onClose }) {
  const { t } = useT();

  // Close on Escape key
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn .18s ease',
      }}
    >
      {/* Modal card — stop click propagation so clicking the image doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: 860,
          width: '100%',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
          animation: 'scaleIn .2s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        <img
          src={scene.img}
          alt={scene.name}
          style={{ width: '100%', display: 'block', maxHeight: '80vh', objectFit: 'cover' }}
        />

        {/* Gradient overlay for label */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 50%)',
          pointerEvents: 'none',
        }} />

        {/* Scene name + tag */}
        <div style={{ position: 'absolute', bottom: 20, left: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{scene.name}</span>
          <span style={{
            background: 'rgba(233,30,140,.85)', borderRadius: 8, padding: '3px 10px',
            fontSize: 11, fontWeight: 700, color: '#fff',
          }}>{scene.tag}</span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .2s, transform .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(233,30,140,0.85)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <X size={18} color="#fff" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default function ScenesSection() {
  const { t } = useT();
  const mob = useIsMobile();
  const [active, setActive] = useState(null);

  return (
    <>
      {/* Inject modal keyframe animations once */}
      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(.92) } to { opacity:1; transform:scale(1) } }
      `}</style>

      <section id="scenes" style={{ padding: mob ? '60px 20px' : '100px 48px', background: t.bgAlt }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: mob ? 40 : 64 }}>
            <p style={{
              fontSize: 13, fontWeight: 700, letterSpacing: 2, color: '#E91E8C',
              textTransform: 'uppercase', marginBottom: 14,
            }}>Scene Library</p>
            <h2 style={{
              fontSize: mob ? 'clamp(26px,7vw,38px)' : 'clamp(30px,4vw,50px)',
              fontWeight: 800, letterSpacing: '-1px', marginBottom: 14, color: t.text,
            }}>
              200+ Professional <span className="gt">Scene Templates</span>
            </h2>
            <p style={{ fontSize: mob ? 15 : 18, color: t.textMuted, maxWidth: 520, margin: '0 auto', lineHeight: 1.75 }}>
              Every industry, every mood. Find the perfect backdrop for any product.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: mob ? 10 : 16 }} className="c4">
            {SCENES.map((scene, i) => (
              <div
                key={i}
                onClick={() => setActive(scene)}
                style={{
                  position: 'relative', borderRadius: 16, overflow: 'hidden',
                  aspectRatio: '4/3', cursor: 'pointer', transition: 'transform .3s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img src={scene.img} alt={scene.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top,rgba(0,0,0,.78) 0%,transparent 55%)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 10, left: 10,
                  fontSize: mob ? 12 : 14, fontWeight: 700, color: 'white',
                }}>{scene.name}</div>
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(233,30,140,.85)', borderRadius: 7, padding: '2px 8px',
                  fontSize: 10, fontWeight: 700, color: 'white',
                }}>{scene.tag}</div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: t.textMuted }}>
            + 190 more scenes across 15 categories inside the app
          </p>
        </div>
      </section>

      {active && <SceneModal scene={active} onClose={() => setActive(null)} />}
    </>
  );
}
