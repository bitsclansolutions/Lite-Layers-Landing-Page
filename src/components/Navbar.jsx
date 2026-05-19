import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, LayoutDashboard, LogIn } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  ['Features',    '#features'   ],
  ['Scenes',      '#scenes'     ],
  ['Coming Soon', '#coming-soon'],
  ['Pricing',     '#pricing'    ],
  ['Contact',     '#contact'    ],
];

export default function Navbar() {
  const { t }               = useT();
  const { user, userData }  = useAuth();
  const navigate            = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const linkStyle = {
    color: t.textMuted, textDecoration: 'none', fontSize: 14, fontWeight: 500,
    padding: '8px 20px', borderRadius: 30, transition: 'all .2s', whiteSpace: 'nowrap',
  };

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
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0, textDecoration: 'none' }}>
        <Logo size={30} />
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.5px', color: t.text }}>
          Lite <span className="gt">Layers</span>
        </span>
      </Link>

      <div className="nav-sep" style={{ width: 1, height: 24, background: t.border, margin: '0 20px', flexShrink: 0 }} />

      {/* Nav links */}
      <div className="nav-links" style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
        {NAV_LINKS.map(([label, href]) => {
          const isRoute = href.startsWith('/');
          return isRoute ? (
            <Link key={label} to={href} style={linkStyle}
              onMouseEnter={e => { e.currentTarget.style.color = '#E91E8C'; e.currentTarget.style.background = t.pillBg; }}
              onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = 'transparent'; }}>
              {label}
            </Link>
          ) : (
            <a key={label} href={href} style={linkStyle}
              onMouseEnter={e => { e.currentTarget.style.color = '#E91E8C'; e.currentTarget.style.background = t.pillBg; }}
              onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = 'transparent'; }}>
              {label}
            </a>
          );
        })}
      </div>

      <div className="nav-sep" style={{ width: 1, height: 24, background: t.border, margin: '0 20px', flexShrink: 0 }} />

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <ThemeToggle />

        {user ? (
          <button onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 30, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', border: `1px solid ${t.border}`,
              background: t.outlineBtn, color: t.text, fontFamily: "'Inter',sans-serif",
              whiteSpace: 'nowrap',
            }}>
            <LayoutDashboard size={14} strokeWidth={2.5} />
            Dashboard
            {userData?.plan && userData.plan !== 'free' && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                background: userData.plan === 'pro' ? '#E91E8C' : '#7B2FBE', color: '#fff',
                textTransform: 'capitalize',
              }}>{userData.plan}</span>
            )}
          </button>
        ) : (
          <button onClick={() => navigate('/login')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 30, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', border: `1px solid ${t.border}`,
              background: t.outlineBtn, color: t.text, fontFamily: "'Inter',sans-serif",
              whiteSpace: 'nowrap',
            }}>
            <LogIn size={14} strokeWidth={2.5} />
            Log In
          </button>
        )}

        <a href="#download" className="llb gb"
          style={{ padding: '11px 26px', fontSize: 14, borderRadius: 30, fontWeight: 700, whiteSpace: 'nowrap', gap: 7 }}>
          <Download size={14} strokeWidth={2.5} />
          Download Free
        </a>
      </div>
    </nav>
  );
}
