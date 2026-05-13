import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className="nav-pill" style={{
      position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, display: 'flex', alignItems: 'center',
      width: 'min(96vw, 1440px)',
      padding: '14px 24px 14px 28px',
      borderRadius: 50,
      background: t.bgNav,
      backdropFilter: 'blur(24px)',
      border: `1px solid ${t.bgNavBorder}`,
      boxShadow: scrolled ? t.bgNavShadow : '0 4px 20px rgba(0,0,0,.22)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        <Logo size={30} />
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.5px', color: t.text }}>
          Lite <span className="gt">Layers</span>
        </span>
      </div>

      {/* Separator */}
      <div className="nav-sep" style={{ width: 1, height: 24, background: t.border, margin: '0 20px', flexShrink: 0 }} />

      {/* Nav links */}
      <div className="nav-links" style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
        {[['Features', '#features'], ['Scenes', '#scenes'], ['Coming Soon', '#coming-soon'], ['Contact', '#contact']].map(([label, href]) => (
          <a key={label} href={href} style={{
            color: t.textMuted, textDecoration: 'none', fontSize: 14, fontWeight: 500,
            padding: '8px 20px', borderRadius: 30, transition: 'all .2s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E91E8C'; e.currentTarget.style.background = t.pillBg; }}
            onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = 'transparent'; }}>
            {label}
          </a>
        ))}
      </div>

      {/* Separator */}
      <div className="nav-sep" style={{ width: 1, height: 24, background: t.border, margin: '0 20px', flexShrink: 0 }} />

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <ThemeToggle />
        <a href="#download" className="llb gb"
          style={{ padding: '11px 26px', fontSize: 14, borderRadius: 30, fontWeight: 700, whiteSpace: 'nowrap', gap: 7 }}>
          <Download size={14} strokeWidth={2.5} />
          Download Free
        </a>
      </div>
    </nav>
  );
}
