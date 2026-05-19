import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useT } from '../context/ThemeContext';

export default function PaymentSuccessPage() {
  const { t } = useT();
  const navigate = useNavigate();

  useEffect(() => {
    const id = setTimeout(() => navigate('/dashboard', { replace: true }), 4000);
    return () => clearTimeout(id);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: t.bg, fontFamily: "'Inter',sans-serif", padding: 24,
    }}>
      <div style={{
        textAlign: 'center', maxWidth: 420,
        background: t.bgCard, border: `1.5px solid rgba(34,197,94,0.35)`,
        borderRadius: 24, padding: '48px 36px',
        backdropFilter: 'blur(24px)', boxShadow: '0 0 60px rgba(34,197,94,0.12)',
      }}>
        <CheckCircle size={56} color="#4ade80" style={{ marginBottom: 20 }} />
        <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text, margin: '0 0 12px' }}>
          You&apos;re all set!
        </h1>
        <p style={{ fontSize: 15, color: t.textMuted, lineHeight: 1.7, margin: '0 0 28px' }}>
          Your subscription is now active. Your new limits are already applied in the Lite Layers app.
        </p>
        <p style={{ fontSize: 13, color: t.textFaint }}>Redirecting to dashboard…</p>
      </div>
    </div>
  );
}
