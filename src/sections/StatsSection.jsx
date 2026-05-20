import { Smartphone, Palette, Crop, Star } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';

const STATS = [
  { num: '10K+', label: 'App Downloads',   Icon: Smartphone },
  { num: '200+', label: 'Scene Templates', Icon: Palette    },
  { num: '15+',  label: 'Export Formats',  Icon: Crop       },
  { num: '4.9',  label: 'Average Rating',  Icon: Star       },
];

export default function StatsSection() {
  const { t } = useT();
  const mob = useIsMobile();

  return (
    <section style={{
      padding: mob ? '40px 20px' : '52px 48px',
      background: t.bgBar,
      borderTop: `1px solid ${t.border}`,
      borderBottom: `1px solid ${t.border}`,
    }}>
      <div style={{
        maxWidth: 1000, margin: '0 auto', display: 'grid',
        gridTemplateColumns: mob ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: mob ? 20 : 32,
      }} className="s4">
        {STATS.map(({ num, label, Icon }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg,rgba(255,107,53,.15),rgba(233,30,140,.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px',
            }}>
              <Icon size={22} color="#E91E8C" strokeWidth={2} />
            </div>
            <div style={{
              fontSize: mob ? 34 : 44, fontWeight: 900, lineHeight: 1, marginBottom: 8,
              background: 'linear-gradient(135deg,#FF6B35,#E91E8C)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{num}</div>
            <div style={{ fontSize: mob ? 12 : 14, color: t.textMuted, fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
