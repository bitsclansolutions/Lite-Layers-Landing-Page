import { Play, Check } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import Logo from '../components/Logo';

export default function DownloadSection() {
  const { t } = useT();
  const mob = useIsMobile();

  return (
    <section id="download" style={{ padding: mob ? '60px 20px' : '100px 48px', background: t.bg }}>
      <div style={{
        maxWidth: 960, margin: '0 auto', textAlign: 'center',
        background: 'linear-gradient(135deg,rgba(255,107,53,.1),rgba(233,30,140,.1),rgba(123,47,190,.1))',
        border: `1px solid ${t.pillBorder}`, borderRadius: mob ? 28 : 40,
        padding: mob ? '48px 24px' : '80px 60px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-35%', right: '-8%', width: 400, height: 400,
          borderRadius: '50%', background: 'radial-gradient(circle,rgba(233,30,140,.15),transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30%', left: '-8%', width: 350, height: 350,
          borderRadius: '50%', background: 'radial-gradient(circle,rgba(123,47,190,.15),transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Logo size={56} />
          <h2 style={{
            fontSize: mob ? 'clamp(28px,8vw,42px)' : 'clamp(32px,4vw,54px)',
            fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 16, marginTop: 20, color: t.text,
          }}>
            Start Creating for <span className="gt">Free Today</span>
          </h2>
          <p style={{ fontSize: mob ? 16 : 20, color: t.textSub, marginBottom: 40, lineHeight: 1.75 }}>
            Download Lite Layers and transform your first product photo in under 60 seconds.
          </p>
          <a href="#" className="llb gb" style={{
            padding: mob ? '15px 32px' : '18px 44px', fontSize: mob ? 16 : 18,
            borderRadius: 20, boxShadow: '0 28px 70px rgba(233,30,140,.45)', margin: '0 auto', fontWeight: 700, gap: 10,
          }}>
            <Play size={22} fill="white" strokeWidth={0} />
            Download on Google Play
          </a>
          <div style={{ marginTop: 28, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Free to download', 'No subscription required', 'Android'].map(label => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={14} color="#E91E8C" strokeWidth={2.5} />
                <span style={{ fontSize: 13, color: t.textMuted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
