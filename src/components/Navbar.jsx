import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, LayoutDashboard, LogIn, Menu, X } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
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
  const mob                 = useIsMobile();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => { if (!mob) setMenuOpen(false); }, [mob]);

  const linkStyle = {
    color: t.textMuted, textDecoration: 'none', fontSize: 14, fontWeight: 500,
    padding: '8px 20px', borderRadius: 30, transition: 'all .2s', whiteSpace: 'nowrap',
  };

  const mobileLinkStyle = {
    color: t.text, textDecoration: 'none', fontSize: 16, fontWeight: 600,
    padding: '14px 0', borderBottom: `1px solid ${t.border}`, display: 'block',
  };

  return (
    <>
      <nav className="nav-pill" style={{
        position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, display: 'flex', alignItems: 'center',
        width: 'min(96vw, 1440px)',
        padding: mob ? '12px 16px' : '14px 24px 14px 28px',
        borderRadius: 50,
        background: t.bgNav,
        backdropFilter: 'blur(24px)',
        border: `1px solid ${t.bgNavBorder}`,
        boxShadow: scrolled ? t.bgNavShadow : '0 4px 20px rgba(0,0,0,.22)',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0, textDecoration: 'none' }}>
          <Logo size={28} />
          <span style={{ fontSize: mob ? 17 : 20, fontWeight: 800, letterSpacing: '-.5px', color: t.text }}>
            Lite <span className="gt">Layers</span>
          </span>
        </Link>

        {/* Desktop: separator + nav links */}
        {!mob && (
          <>
            <div style={{ width: 1, height: 24, background: t.border, margin: '0 20px', flexShrink: 0 }} />
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
            <div style={{ width: 1, height: 24, background: t.border, margin: '0 20px', flexShrink: 0 }} />
          </>
        )}

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: mob ? 8 : 10, marginLeft: mob ? 'auto' : 0, flexShrink: 0 }}>
          <ThemeToggle />

          {!mob && (
            user ? (
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
            )
          )}

          <a href="#download" className="llb gb"
            style={{ padding: mob ? '9px 16px' : '11px 26px', fontSize: mob ? 13 : 14, borderRadius: 30, fontWeight: 700, whiteSpace: 'nowrap', gap: 6 }}>
            <Download size={13} strokeWidth={2.5} />
            {mob ? 'Download' : 'Download Free'}
          </a>

          {/* Hamburger — mobile only */}
          {mob && (
            <button onClick={() => setMenuOpen(o => !o)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: t.text, padding: 4, display: 'flex', alignItems: 'center',
            }}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {mob && menuOpen && (
        <div style={{
          position: 'fixed', top: 76, left: '2vw', right: '2vw',
          zIndex: 999, borderRadius: 20,
          background: t.bgNav, backdropFilter: 'blur(24px)',
          border: `1px solid ${t.bgNavBorder}`,
          boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
          padding: '8px 24px 20px',
        }}>
          {NAV_LINKS.map(([label, href]) => {
            const isRoute = href.startsWith('/');
            return isRoute ? (
              <Link key={label} to={href} style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>{label}</Link>
            ) : (
              <a key={label} href={href} style={mobileLinkStyle} onClick={() => setMenuOpen(false)}>{label}</a>
            );
          })}
          <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user ? (
              <button onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px 0', borderRadius: 14, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', border: `1px solid ${t.border}`,
                  background: t.outlineBtn, color: t.text, fontFamily: "'Inter',sans-serif",
                }}>
                <LayoutDashboard size={16} strokeWidth={2.5} />
                Dashboard
              </button>
            ) : (
              <button onClick={() => { navigate('/login'); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px 0', borderRadius: 14, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', border: `1px solid ${t.border}`,
                  background: t.outlineBtn, color: t.text, fontFamily: "'Inter',sans-serif",
                }}>
                <LogIn size={16} strokeWidth={2.5} />
                Log In
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
