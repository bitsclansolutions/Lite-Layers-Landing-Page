import { Share2, Play, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useT } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import Logo from '../components/Logo';

const ROUTE_LINKS = {
  'Privacy Policy':   '/privacy-policy',
  'Terms of Service': '/terms',
  'Delete Account':   '/account-deletion',
};

const LINK_GROUPS = [
  { title: 'Features', links: ['AI Scene Adding', 'Background Removal', 'Smart Resize', 'Batch Editing *', 'Virtual Try-On *'] },
  { title: 'Company',  links: ['About', 'Blog', 'Press Kit'] },
  { title: 'Support',  links: ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service', 'Delete Account'] },
];

const SOCIAL = [
  { Icon: Share2, label: 'Twitter'   },
  { Icon: Play,   label: 'YouTube'   },
  { Icon: Camera, label: 'Instagram' },
];

export default function FooterSection() {
  const { t } = useT();
  const mob = useIsMobile();

  return (
    <footer id="contact" style={{ background: t.bg, padding: mob ? '0 12px 20px' : '0 24px 28px' }}>
      {/* Pill container */}
      <div style={{
        maxWidth: 1440,
        width: 'min(96vw, 1440px)',
        margin: '0 auto',
        background: t.bgNav,
        backdropFilter: 'blur(24px)',
        border: `1px solid ${t.bgNavBorder}`,
        borderRadius: 32,
        boxShadow: t.bgNavShadow,
        padding: mob ? '36px 24px 24px' : '52px 52px 32px',
      }}>
        {/* Top: brand + links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: mob ? '1fr 1fr' : '2fr 1fr 1fr 1fr',
          gap: mob ? 28 : 40,
          marginBottom: mob ? 32 : 48,
        }} className={mob ? '' : 'c4'}>

          {/* Brand */}
          <div style={{ gridColumn: mob ? '1 / -1' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Logo size={30} />
              <span style={{ fontSize: 19, fontWeight: 800, color: t.text }}>
                Lite <span className="gt">Layers</span>
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.85, color: t.textMuted, maxWidth: 260 }}>
              AI-powered product photography for modern ecommerce sellers. Studio-quality visuals from your phone.
            </p>
          </div>

          {/* Link groups */}
          {LINK_GROUPS.map(({ title, links }) => (
            <div key={title}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: t.text }}>{title}</div>
              {links.map(label => {
                const to = ROUTE_LINKS[label];
                const sharedStyle = { fontSize: 13, color: t.textMuted, textDecoration: 'none', transition: 'color .2s' };
                return (
                  <div key={label} style={{ marginBottom: 10 }}>
                    {to && !to.startsWith('#') ? (
                      <Link to={to} style={sharedStyle}
                        onMouseEnter={e => e.currentTarget.style.color = '#E91E8C'}
                        onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
                        {label}
                      </Link>
                    ) : (
                      <a href={to || '#'} style={sharedStyle}
                        onMouseEnter={e => e.currentTarget.style.color = '#E91E8C'}
                        onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
                        {label}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: `1px solid ${t.border}`, paddingTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 14,
        }}>
          <div style={{ fontSize: 12, color: t.textMuted }}>
            © 2026 Lite Layers. All rights reserved. * Coming soon
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {SOCIAL.map(({ Icon, label }) => (
              <a key={label} href="#" title={label} style={{
                width: 34, height: 34, borderRadius: '50%',
                background: t.stepBg, border: `1px solid ${t.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', transition: 'all .2s', boxShadow: t.shadow,
                color: t.textMuted,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E91E8C'; e.currentTarget.style.color = '#E91E8C'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}>
                <Icon size={15} strokeWidth={1.8} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
