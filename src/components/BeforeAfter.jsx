import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsLeftRight } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

/**
 * Two modes:
 *   Direct  — pass `beforeImg` + `afterImg` (real photo pair, shown as-is)
 *   Compose — pass `productImg` + `sceneImg` + `plainBg` (CSS compositing fallback)
 */
export default function BeforeAfter({
  // Direct mode
  beforeImg,
  afterImg,
  // Compose mode (fallback)
  productImg,
  sceneImg,
  plainBg = '#f0ede8',
  // Labels
  beforeLabel = 'Before',
  afterLabel  = 'After',
}) {
  const mob      = useIsMobile();
  const [pos, setPos] = useState(45);
  const ref      = useRef(null);
  const dragging = useRef(false);
  const direct   = Boolean(beforeImg && afterImg);

  const move = useCallback((clientX) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos(Math.min(94, Math.max(6, ((clientX - r.left) / r.width) * 100)));
  }, []);

  useEffect(() => {
    const up = () => { dragging.current = false; };
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="ba-wrap"
      onMouseMove={e => dragging.current && move(e.clientX)}
      onTouchMove={e => move(e.touches[0].clientX)}
      style={{
        position: 'relative', width: '100%', height: mob ? 260 : 460, borderRadius: 22,
        overflow: 'hidden', cursor: 'ew-resize',
        boxShadow: '0 32px 90px rgba(0,0,0,.55)', userSelect: 'none',
      }}
    >
      {/* ── AFTER (right side, always full width underneath) ── */}
      {direct ? (
        <img src={afterImg} alt="After" draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src={sceneImg} alt="Scene" draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(.85)' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top,rgba(0,0,0,.6) 0%,rgba(0,0,0,.08) 45%,transparent 75%)',
          }} />
          <img src={productImg} alt="Product in scene" draggable={false}
            style={{
              position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)',
              height: '72%', width: 'auto', maxWidth: '80%', objectFit: 'contain',
              filter: 'drop-shadow(0 18px 36px rgba(0,0,0,.75)) drop-shadow(0 4px 12px rgba(0,0,0,.5))',
            }} />
        </div>
      )}

      {/* ── BEFORE (left side, clipped by slider position) ── */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {direct ? (
          <img src={beforeImg} alt="Before" draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, background: plainBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src={productImg} alt="Product original" draggable={false}
              style={{
                height: '82%', width: 'auto', maxWidth: '85%', objectFit: 'contain',
                filter: 'drop-shadow(0 10px 24px rgba(0,0,0,.18))',
              }} />
          </div>
        )}
      </div>

      {/* ── Divider + handle ── */}
      <div
        onMouseDown={() => { dragging.current = true; }}
        onTouchStart={() => { dragging.current = true; }}
        style={{
          position: 'absolute', top: 0, bottom: 0, left: `${pos}%`,
          transform: 'translateX(-50%)', width: 3,
          background: 'rgba(255,255,255,.9)', zIndex: 10, cursor: 'ew-resize',
        }}
      >
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg,#FF6B35,#E91E8C,#7B2FBE)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(233,30,140,.55)',
        }}>
          <ChevronsLeftRight size={20} color="white" strokeWidth={2.2} />
        </div>
      </div>

      {/* ── Labels ── */}
      <span style={{
        position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,.65)',
        backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: 20,
        fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,.9)', textTransform: 'uppercase',
      }}>
        {beforeLabel}
      </span>
      <span style={{
        position: 'absolute', bottom: 14, right: 14,
        background: 'linear-gradient(135deg,rgba(233,30,140,.9),rgba(123,47,190,.9))',
        backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: 20,
        fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#fff', textTransform: 'uppercase',
      }}>
        {afterLabel}
      </span>
    </div>
  );
}
