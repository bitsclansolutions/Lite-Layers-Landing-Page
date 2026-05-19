import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    tagline: 'Get started, no card required',
    color: '#888',
    features: [
      '10 background removals / month',
      '5 AI scene generations / month',
      '50 smart resizes / month',
      '20 exports / month',
      'All aspect ratios',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    period: '/mo',
    tagline: 'For growing sellers',
    color: '#E91E8C',
    popular: true,
    features: [
      '50 background removals / month',
      '30 AI scene generations / month',
      'Unlimited smart resizes',
      'Unlimited exports',
      'All aspect ratios',
      'Priority support',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 19.99,
    period: '/mo',
    tagline: 'For high-volume studios',
    color: '#7B2FBE',
    features: [
      'Unlimited background removals',
      'Unlimited AI scene generations',
      'Unlimited smart resizes',
      'Unlimited exports',
      'All aspect ratios',
      'Priority processing + support',
    ],
  },
];

export default function PricingPage() {
  const { t } = useT();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError]     = useState('');

  const currentPlan = userData?.plan || 'free';

  const handleSubscribe = async (plan) => {
    if (plan.id === 'free') return;
    if (!user) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }
    setError('');
    setLoading(plan.id);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id, userId: user.uid, userEmail: user.email }),
      });
      if (!res.ok) throw new Error('Server error');
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError('Unable to start checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: "'Inter',sans-serif" }}>
      <Navbar />

      <div style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 1100, margin: '0 auto', padding: '120px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, color: t.text, margin: '0 0 16px' }}>
            Choose your <span className="gt">plan</span>
          </h1>
          <p style={{ fontSize: 17, color: t.textMuted, margin: 0 }}>
            Upgrade anytime. Cancel anytime. No hidden fees.
          </p>
        </div>

        {error && (
          <div style={{
            maxWidth: 500, margin: '0 auto 32px', padding: '12px 18px', borderRadius: 12,
            background: 'rgba(239,68,68,0.12)', color: '#f87171',
            border: '1px solid rgba(239,68,68,0.25)', textAlign: 'center', fontSize: 14,
          }}>{error}</div>
        )}

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          alignItems: 'start',
        }}>
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isPopular = plan.popular;
            return (
              <div key={plan.id} style={{
                background: t.bgCard,
                border: `1.5px solid ${isPopular ? plan.color : t.border}`,
                borderRadius: 24,
                padding: '32px 28px',
                backdropFilter: 'blur(24px)',
                boxShadow: isPopular ? `0 0 40px ${plan.color}22` : t.shadowCard,
                position: 'relative',
              }}>
                {isPopular && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: '#E91E8C', color: '#fff', fontSize: 11, fontWeight: 700,
                    padding: '5px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                  }}>MOST POPULAR</div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: plan.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {plan.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 44, fontWeight: 900, color: t.text }}>
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </span>
                    {plan.period && (
                      <span style={{ fontSize: 14, color: t.textMuted }}>{plan.period}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: t.textMuted, margin: 0 }}>{plan.tagline}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Check size={15} color={plan.color} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: t.textSub, lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrent || loading === plan.id || plan.id === 'free'}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 12, fontSize: 14,
                    fontWeight: 700, cursor: isCurrent || plan.id === 'free' ? 'default' : 'pointer',
                    border: 'none', transition: 'all .2s', fontFamily: "'Inter',sans-serif",
                    background: isCurrent
                      ? t.bgBar
                      : isPopular
                        ? 'linear-gradient(135deg,#FF6B35,#E91E8C)'
                        : plan.id === 'business'
                          ? 'linear-gradient(135deg,#7B2FBE,#E91E8C)'
                          : t.bgBar,
                    color: isCurrent ? t.textMuted : plan.id === 'free' ? t.textMuted : '#fff',
                    opacity: loading === plan.id ? 0.7 : 1,
                  }}>
                  {loading === plan.id
                    ? 'Loading…'
                    : isCurrent
                      ? 'Current Plan'
                      : plan.id === 'free'
                        ? 'Free Forever'
                        : 'Get Started'}
                </button>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: t.textMuted, marginTop: 40 }}>
          Subscriptions are billed monthly and can be cancelled anytime from your dashboard.
        </p>
      </div>
    </div>
  );
}
