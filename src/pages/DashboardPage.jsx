import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  LayoutDashboard, BarChart2, CreditCard, Settings,
  LogOut, Crown, Zap, RefreshCw, Download, ChevronRight,
  ChevronLeft, Moon, Sun, Camera, Loader, Menu, X,
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useT } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';

/* ─── constants ─────────────────────────────────────────── */
const LIMITS = {
  free:     { bgRemovals: 10,  sceneGenerations: 5,  resizes: 50,  exports: 20  },
  pro:      { bgRemovals: 50,  sceneGenerations: 30, resizes: -1,  exports: -1  },
  business: { bgRemovals: -1,  sceneGenerations: -1, resizes: -1,  exports: -1  },
};

const PLAN_META = {
  free:     { label: 'Free',     color: '#888',     icon: null   },
  pro:      { label: 'Pro',      color: '#E91E8C',  icon: Crown  },
  business: { label: 'Business', color: '#7B2FBE',  icon: Zap    },
};

const STATUS_COLORS = {
  active:             { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80' },
  trialing:           { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  past_due:           { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
  canceled:           { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  incomplete:         { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
  incomplete_expired: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
};

function statusLabel(status, cancelAtPeriodEnd) {
  if (cancelAtPeriodEnd && status === 'active') return 'Cancelled';
  const map = {
    active: 'Active', trialing: 'Trialing', past_due: 'Past Due',
    canceled: 'Canceled', incomplete: 'Pending', incomplete_expired: 'Expired',
  };
  return map[status] || status;
}

const NAV = [
  { id: 'overview',  label: 'Overview',    icon: LayoutDashboard },
  { id: 'usage',     label: 'Usage',       icon: BarChart2       },
  { id: 'billing',   label: 'Billing',     icon: CreditCard      },
  { id: 'settings',  label: 'Settings',    icon: Settings        },
];

const CHART_LINES = [
  { key: 'bgRemovals',       label: 'BG Removals', color: '#E91E8C' },
  { key: 'sceneGenerations', label: 'AI Scenes',   color: '#7B2FBE' },
  { key: 'resizes',          label: 'Resizes',     color: '#FF6B35' },
  { key: 'exports',          label: 'Exports',     color: '#3b82f6' },
];

/* ─── helpers ────────────────────────────────────────────── */
function usageLabel(used, limit) {
  return limit === -1 ? `${used} / ∞` : `${used} / ${limit}`;
}
function usagePct(used, limit) {
  if (limit === -1 || limit === 0) return 0;
  return Math.min((used / limit) * 100, 100);
}
function barColor(pct) {
  if (pct >= 90) return '#f87171';
  if (pct >= 70) return '#fb923c';
  return '#E91E8C';
}
function lastNMonths(n) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}
// Returns the Firestore key for the user's current usage period.
// Paid users: use the Stripe billing period start date (YYYY-MM-DD) stored by the webhook.
// Free users: fall back to the first day of the current calendar month.
function currentPeriodKey(userData) {
  if (userData?.usagePeriodStart) return userData.usagePeriodStart;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}
function monthLabel(ym) {
  const [y, m] = ym.split('-');
  return new Date(+y, +m - 1, 15).toLocaleString('default', { month: 'short' });
}

/* ─── line chart ─────────────────────────────────────────── */
function UsageTrendChart({ t, monthlyData }) {
  const W = 560, H = 210;
  const padL = 36, padR = 16, padT = 16, padB = 34;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n = monthlyData.length;

  const maxVal = Math.max(
    ...monthlyData.flatMap(d => CHART_LINES.map(l => d.values[l.key] ?? 0)),
    5,
  );

  const xPos = i => padL + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const yPos = v => padT + chartH - (v / maxVal) * chartH;

  const smoothPath = pts => {
    if (!pts.length) return '';
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1][0] + pts[i][0]) / 2;
      d += ` C ${cpx} ${pts[i - 1][1]}, ${cpx} ${pts[i][1]}, ${pts[i][0]} ${pts[i][1]}`;
    }
    return d;
  };

  const areaPath = pts => {
    if (!pts.length) return '';
    return `${smoothPath(pts)} L ${pts[pts.length - 1][0]} ${padT + chartH} L ${pts[0][0]} ${padT + chartH} Z`;
  };

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Grid */}
        {gridLines.map(pct => {
          const y = padT + chartH * (1 - pct);
          return (
            <g key={pct}>
              <line x1={padL} x2={W - padR} y1={y} y2={y}
                stroke={t.border} strokeWidth={pct === 0 ? 1 : 0.5}
                strokeDasharray={pct === 0 ? undefined : '4 3'}
              />
              <text x={padL - 6} y={y + 4} fontSize={9} fill={t.textMuted} textAnchor="end">
                {Math.round(maxVal * pct)}
              </text>
            </g>
          );
        })}

        {/* Area fills */}
        {CHART_LINES.map(line => {
          const pts = monthlyData.map((d, i) => [xPos(i), yPos(d.values[line.key] ?? 0)]);
          return <path key={`a-${line.key}`} d={areaPath(pts)} fill={line.color} fillOpacity={0.07} />;
        })}

        {/* Lines */}
        {CHART_LINES.map(line => {
          const pts = monthlyData.map((d, i) => [xPos(i), yPos(d.values[line.key] ?? 0)]);
          return (
            <path key={`l-${line.key}`} d={smoothPath(pts)}
              fill="none" stroke={line.color} strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round"
            />
          );
        })}

        {/* Dots */}
        {CHART_LINES.map(line =>
          monthlyData.map((d, i) => {
            const val = d.values[line.key] ?? 0;
            return (
              <circle key={`${line.key}-${i}`}
                cx={xPos(i)} cy={yPos(val)} r={3.5}
                fill={line.color}
                stroke={t.id === 'dark' ? '#07030f' : '#ffffff'}
                strokeWidth={2}
              >
                <title>{`${line.label}: ${val}`}</title>
              </circle>
            );
          })
        )}

        {/* X labels */}
        {monthlyData.map((d, i) => (
          <text key={i} x={xPos(i)} y={H - 6} fontSize={10} fill={t.textMuted} textAnchor="middle">
            {d.label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginTop: 14 }}>
        {CHART_LINES.map(l => (
          <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 22, height: 3, borderRadius: 2, background: l.color }} />
            <span style={{ fontSize: 12, color: t.textMuted }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── sub-views ──────────────────────────────────────────── */
function UsageError({ t, error, onRefresh }) {
  return (
    <div style={{
      padding: '14px 18px', borderRadius: 12, marginBottom: 24,
      background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
    }}>
      <span style={{ fontSize: 13, color: '#f87171', lineHeight: 1.6 }}>{error}</span>
      <button onClick={onRefresh} style={{
        padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, flexShrink: 0,
        cursor: 'pointer', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
        color: '#f87171', fontFamily: "'Inter',sans-serif",
      }}>Retry</button>
    </div>
  );
}

function Overview({ t, user, userData, usage, monthlyData, loadingUsage, usageError, onNavigate, onRefresh }) {
  const rawPlan = userData?.plan || 'free';
  const rawStatus = userData?.subscriptionStatus;
  const periodEndMs = userData?.currentPeriodEnd?.seconds
    ? userData.currentPeriodEnd.seconds * 1000
    : null;
  // Client-side safety net: if the billing period has already ended but Firestore
  // hasn't caught up yet (e.g. webhook delay), stop showing the stale cancellation
  // notice and fall back to Free instead of a past due date.
  const periodExpired = periodEndMs !== null && Date.now() >= periodEndMs;
  const expiredOverride = rawPlan !== 'free' && periodExpired && (userData?.cancelAtPeriodEnd ?? false);
  const plan = expiredOverride ? 'free' : rawPlan;
  const status = expiredOverride ? undefined : rawStatus;
  const meta = PLAN_META[plan];
  const limits = LIMITS[plan];
  const PlanIcon = meta.icon;
  const cancelAtPeriodEnd = (userData?.cancelAtPeriodEnd ?? false)
    && status === 'active' && plan !== 'free';
  const statusStyle = cancelAtPeriodEnd
    ? { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' }
    : STATUS_COLORS[status] || null;
  const periodEnd = periodEndMs && !periodExpired
    ? new Date(periodEndMs).toLocaleDateString()
    : null;

  const quickStats = [
    { icon: BarChart2, label: 'BG Removals',  key: 'bgRemovals'      },
    { icon: Zap,       label: 'AI Scenes',    key: 'sceneGenerations' },
    { icon: RefreshCw, label: 'Resizes',      key: 'resizes'         },
    { icon: Download,  label: 'Exports',      key: 'exports'         },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 4 }}>
        Welcome back{user?.displayName ? `, ${user.displayName}` : ''}
      </h1>
      <p style={{ color: t.textMuted, fontSize: 14, marginBottom: 32 }}>
        Here's a summary of your account.
      </p>

      {usageError && <UsageError t={t} error={usageError} onRefresh={onRefresh} />}

      {/* Plan banner */}
      <div style={{
        background: t.bgCard, border: `1.5px solid ${meta.color}44`,
        borderRadius: 16, padding: '24px',
        boxShadow: `0 0 40px ${meta.color}14`, marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: `${meta.color}22`, color: meta.color,
            }}>
              {PlanIcon ? <PlanIcon size={20} /> : <span style={{ fontWeight: 900, fontSize: 16 }}>F</span>}
            </div>
            <div>
              <div style={{ fontSize: 12, color: t.textMuted }}>Current plan</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: t.text }}>{meta.label}</div>
            </div>
            {statusStyle && (
              <div style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: statusStyle.bg, color: statusStyle.text,
              }}>{statusLabel(status, cancelAtPeriodEnd)}</div>
            )}
          </div>
          <button
            onClick={() => onNavigate('billing')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: `1px solid ${t.border}`,
              background: t.outlineBtn, color: t.text, fontFamily: "'Inter',sans-serif",
            }}>
            {plan === 'free' ? 'Upgrade' : 'Manage'} <ChevronRight size={14} />
          </button>
        </div>

        {/* Cancellation scheduled notice */}
        {cancelAtPeriodEnd && periodEnd && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)',
            fontSize: 13, color: '#fbbf24',
          }}>
            Your {meta.label} plan is cancelled and will end on <strong>{periodEnd}</strong>. You'll move to Free after that.
          </div>
        )}

        {/* Past due notice */}
        {status === 'past_due' && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: 13, color: '#f87171',
          }}>
            Your last payment failed. Go to <strong style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onNavigate('billing')}>Billing</strong> to fix your payment method.
          </div>
        )}
      </div>

      {/* Quick usage grid */}
      <div className="c4" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        {quickStats.map(({ icon: Icon, label, key }) => {
          const used = usage?.[key] ?? 0;
          const limit = limits[key];
          const pct = usagePct(used, limit);
          return (
            <div key={key} style={{
              background: t.bgCard, border: `1px solid ${t.border}`,
              borderRadius: 14, padding: '20px',
              opacity: loadingUsage ? 0.5 : 1, transition: 'opacity .3s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon size={15} color={t.textMuted} />
                <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 600 }}>{label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.text, marginBottom: 10 }}>
                {loadingUsage ? '…' : usageLabel(used, limit)}
              </div>
              {!loadingUsage && limit !== -1 && (
                <div style={{ height: 4, borderRadius: 4, background: t.bgBar, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4, width: `${pct}%`,
                    background: barColor(pct), transition: 'width .4s',
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Usage trend chart */}
      {monthlyData.length > 0 && (
        <div style={{
          background: t.bgCard, border: `1px solid ${t.border}`,
          borderRadius: 16, padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Usage Trends</span>
            <span style={{ fontSize: 12, color: t.textMuted }}>Last 6 months</span>
          </div>
          <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 20 }}>
            Monthly usage across all features
          </div>
          <UsageTrendChart t={t} monthlyData={monthlyData} />
        </div>
      )}
    </div>
  );
}

function UsageView({ t, usage, userData, loadingUsage, usageError, onRefresh }) {
  const plan = userData?.plan || 'free';
  const limits = LIMITS[plan];

  const stats = [
    { icon: BarChart2, label: 'Background Removals', key: 'bgRemovals',       desc: 'Remove backgrounds from product photos' },
    { icon: Zap,       label: 'AI Scene Generations', key: 'sceneGenerations', desc: 'Generate studio-quality backgrounds'    },
    { icon: RefreshCw, label: 'Smart Resizes',        key: 'resizes',          desc: 'Resize images for any platform'        },
    { icon: Download,  label: 'Exports',              key: 'exports',          desc: 'Download processed images'             },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 4 }}>Usage</h1>
      <p style={{ color: t.textMuted, fontSize: 14, marginBottom: 32 }}>
        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} usage
      </p>
      {usageError && <UsageError t={t} error={usageError} onRefresh={onRefresh} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {stats.map(({ icon: Icon, label, key, desc }) => {
          const used = usage?.[key] ?? 0;
          const limit = limits[key];
          const pct = usagePct(used, limit);
          return (
            <div key={key} style={{
              background: t.bgCard, border: `1px solid ${t.border}`,
              borderRadius: 16, padding: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(233,30,140,0.12)', color: '#E91E8C',
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{label}</div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: t.text }}>{usageLabel(used, limit)}</div>
                  {limit !== -1 && (
                    <div style={{ fontSize: 12, color: t.textMuted }}>{Math.round(pct)}% used</div>
                  )}
                </div>
              </div>
              {limit !== -1 && (
                <div style={{ height: 6, borderRadius: 6, background: t.bgBar, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 6, width: `${pct}%`,
                    background: barColor(pct), transition: 'width .4s',
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const BILLING_PLANS = [
  {
    id: 'free', name: 'Free', price: '$0', period: '',
    features: ['10 BG Removals/mo', '5 AI Scenes/mo', '50 Resizes/mo', '20 Exports/mo'],
  },
  {
    id: 'pro', name: 'Pro', price: '$9.99', period: '/mo',
    features: ['50 BG Removals/mo', '30 AI Scenes/mo', 'Unlimited Resizes', 'Unlimited Exports'],
  },
  {
    id: 'business', name: 'Business', price: '$19.99', period: '/mo',
    features: ['Unlimited everything', 'Priority processing', 'API access', 'Dedicated support'],
  },
];

function BillingView({ t, userData, user }) {
  const [portalBusy, setPortalBusy] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');

  const rawPlan           = userData?.plan || 'free';
  const rawStatus         = userData?.subscriptionStatus;
  const periodEndMs       = userData?.currentPeriodEnd?.seconds
    ? userData.currentPeriodEnd.seconds * 1000
    : null;
  // Client-side safety net: if the billing period has already ended but Firestore
  // hasn't caught up yet (e.g. webhook delay), stop showing the stale cancellation
  // notice and fall back to Free instead of a past due date.
  const periodExpired     = periodEndMs !== null && Date.now() >= periodEndMs;
  const expiredOverride   = rawPlan !== 'free' && periodExpired && (userData?.cancelAtPeriodEnd ?? false);
  const plan              = expiredOverride ? 'free' : rawPlan;
  const status            = expiredOverride ? undefined : rawStatus;
  const meta              = PLAN_META[plan];
  const PlanIcon          = meta.icon;
  // Only treat as cancelling if subscription is genuinely active — guards against
  // stale cancelAtPeriodEnd in Firestore when the subscription is already deleted.
  const cancelAtPeriodEnd = (userData?.cancelAtPeriodEnd ?? false)
    && status === 'active' && plan !== 'free';
  const periodEnd         = periodEndMs && !periodExpired
    ? new Date(periodEndMs).toLocaleDateString()
    : null;
  const statusStyle = cancelAtPeriodEnd
    ? { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' }
    : STATUS_COLORS[status] || null;

  const handleUpgrade = async (p) => {
    if (p.id === 'free' || p.id === plan) return;
    setError('');
    setLoadingPlan(p.id);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ plan: p.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Unable to start checkout. Please try again.');
      setLoadingPlan(null);
    }
  };

  const handleManage = async () => {
    if (!userData?.stripeCustomerId) return;
    setPortalBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Server error');
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError('Unable to open billing portal. Please try again.');
      setPortalBusy(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 4 }}>Billing</h1>
      <p style={{ color: cancelAtPeriodEnd ? '#fbbf24' : t.textMuted, fontSize: 14, marginBottom: 32 }}>
        {cancelAtPeriodEnd && periodEnd
          ? `Your ${meta.label} plan is cancelled and will end on ${periodEnd}. Reactivate to keep access.`
          : 'Manage your subscription and billing details.'}
      </p>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 12, marginBottom: 24, fontSize: 13,
          background: 'rgba(239,68,68,0.10)', color: '#f87171',
          border: '1px solid rgba(239,68,68,0.25)',
        }}>{error}</div>
      )}

      {/* Active plan banner */}
      <div style={{
        background: t.bgCard, border: `1.5px solid ${meta.color}44`,
        borderRadius: 16, padding: '24px', marginBottom: 32,
        boxShadow: `0 0 40px ${meta.color}14`,
      }}>
        <div style={{ fontSize: 12, color: cancelAtPeriodEnd ? '#fbbf24' : t.textMuted, marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {cancelAtPeriodEnd ? 'Cancelled' : 'Active Plan'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: plan !== 'free' ? 20 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: `${meta.color}22`, color: meta.color,
            }}>
              {PlanIcon ? <PlanIcon size={22} /> : <span style={{ fontWeight: 900, fontSize: 18 }}>F</span>}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.text }}>{meta.label}</div>
              <div style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>
                {plan === 'free' ? 'No active subscription' : plan === 'pro' ? '$9.99 / month' : '$19.99 / month'}
              </div>
            </div>
            {statusStyle && (
              <div style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: statusStyle.bg, color: statusStyle.text,
              }}>{statusLabel(status, cancelAtPeriodEnd)}</div>
            )}
          </div>

          {plan !== 'free' && userData?.stripeCustomerId && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleManage} disabled={portalBusy}
                style={{
                  padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: portalBusy ? 'default' : 'pointer', border: `1px solid ${t.border}`,
                  background: t.outlineBtn, color: t.text, fontFamily: "'Inter',sans-serif",
                  opacity: portalBusy ? 0.7 : 1,
                }}>
                {portalBusy ? 'Loading…' : 'Manage'}
              </button>

              {/* Show Reactivate when scheduled for cancellation, Cancel otherwise */}
              {cancelAtPeriodEnd ? (
                <button onClick={handleManage} disabled={portalBusy}
                  style={{
                    padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: portalBusy ? 'default' : 'pointer',
                    border: '1px solid rgba(34,197,94,0.35)',
                    background: 'rgba(34,197,94,0.08)', color: '#4ade80',
                    fontFamily: "'Inter',sans-serif", opacity: portalBusy ? 0.7 : 1,
                  }}>
                  Reactivate
                </button>
              ) : (
                <button onClick={handleManage} disabled={portalBusy}
                  style={{
                    padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: portalBusy ? 'default' : 'pointer',
                    border: '1px solid rgba(239,68,68,0.35)',
                    background: 'rgba(239,68,68,0.08)', color: '#f87171',
                    fontFamily: "'Inter',sans-serif", opacity: portalBusy ? 0.7 : 1,
                  }}>
                  Cancel Plan
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info rows — paid plans only */}
        {plan !== 'free' && (
          <div style={{
            borderTop: `1px solid ${t.border}`, paddingTop: 16,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {periodEnd && (
                <div>
                  <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {cancelAtPeriodEnd ? 'Access Ends' : 'Next Renewal'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>
                    {cancelAtPeriodEnd ? (
                      <span style={{ color: '#fbbf24' }}>{periodEnd}</span>
                    ) : (
                      <>
                        {plan === 'pro' ? '$9.99' : '$19.99'}
                        <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 400, marginLeft: 6 }}>on {periodEnd}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cancellation scheduled warning */}
            {cancelAtPeriodEnd && periodEnd && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10, flexWrap: 'wrap', gap: 10,
                background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)',
              }}>
                <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600 }}>
                  Your plan is cancelled and will end on {periodEnd}. Click Reactivate to keep access.
                </span>
              </div>
            )}

            {/* Past due warning */}
            {status === 'past_due' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, flexWrap: 'wrap',
                background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
              }}>
                <span style={{ fontSize: 13, color: '#f87171', fontWeight: 600, flex: 1 }}>
                  Payment failed — Stripe will retry automatically. Update your card to avoid losing access.
                </span>
                <button onClick={handleManage} disabled={portalBusy}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', background: '#f87171', color: '#fff',
                    border: 'none', fontFamily: "'Inter',sans-serif", flexShrink: 0,
                  }}>
                  Fix Now
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {BILLING_PLANS.map(p => {
          const isCurrent = p.id === plan;
          const m = PLAN_META[p.id];
          const isLoading = loadingPlan === p.id;
          const isUpgrade = p.id !== 'free' && !isCurrent;
          const isDowngrade = p.id === 'free' && !isCurrent;

          let btnLabel = isCurrent ? 'Current Plan' : isDowngrade ? 'Downgrade to Free' : 'Upgrade';
          if (isLoading) btnLabel = 'Loading…';

          const cardInner = (
            <div style={{
              background: isCurrent ? t.bg : t.bgCard,
              borderRadius: isCurrent ? 14 : 16,
              padding: '24px', position: 'relative',
              height: '100%', boxSizing: 'border-box',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: t.text }}>{p.name}</div>
                {isCurrent && (
                  <div style={{
                    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: cancelAtPeriodEnd
                      ? 'linear-gradient(135deg,#b45309,#fbbf24)'
                      : 'linear-gradient(135deg,#FF6B35,#E91E8C,#7B2FBE)',
                    color: '#fff', flexShrink: 0,
                  }}>{cancelAtPeriodEnd ? 'Cancelled' : 'Active'}</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 16 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: m.color }}>{p.price}</span>
                {p.period && <span style={{ fontSize: 13, color: t.textMuted }}>{p.period}</span>}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {p.features.map(f => (
                  <li key={f} style={{ fontSize: 13, color: t.textSub, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: m.color, fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              {/* Hide the neutral "Current Plan" button when cancelling — Reactivate below is the only action */}
              {!(isCurrent && cancelAtPeriodEnd) && (
                <button
                  onClick={() => isUpgrade ? handleUpgrade(p) : isDowngrade ? handleManage() : null}
                  disabled={isCurrent || isLoading}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    textAlign: 'center', cursor: isCurrent ? 'default' : 'pointer',
                    border: isDowngrade ? `1px solid ${t.border}` : 'none',
                    background: isCurrent
                      ? t.bgBar
                      : isUpgrade
                        ? p.id === 'business'
                          ? 'linear-gradient(135deg,#7B2FBE,#E91E8C)'
                          : 'linear-gradient(135deg,#FF6B35,#E91E8C)'
                        : t.outlineBtn,
                    color: isCurrent ? t.textMuted : isDowngrade ? t.text : '#fff',
                    fontFamily: "'Inter',sans-serif",
                    opacity: isLoading ? 0.7 : 1,
                    transition: 'opacity .2s',
                  }}>
                  {btnLabel}
                </button>
              )}

              {/* Cancel / Reactivate — only on active paid plan card */}
              {isCurrent && p.id !== 'free' && (
                <button
                  onClick={handleManage}
                  disabled={portalBusy}
                  style={{
                    width: '100%', padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    marginTop: 8, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                    border: cancelAtPeriodEnd ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
                    background: cancelAtPeriodEnd ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                    color: cancelAtPeriodEnd ? '#4ade80' : '#f87171',
                    opacity: portalBusy ? 0.7 : 1,
                  }}>
                  {cancelAtPeriodEnd ? 'Reactivate Plan' : 'Cancel Plan'}
                </button>
              )}
            </div>
          );

          return isCurrent ? (
            <div key={p.id} style={{
              background: 'linear-gradient(135deg,#FF6B35,#E91E8C,#7B2FBE)',
              borderRadius: 16, padding: 2, position: 'relative',
            }}>
              {cardInner}
            </div>
          ) : (
            <div key={p.id} style={{
              border: `1px solid ${t.border}`,
              borderRadius: 16, position: 'relative',
            }}>
              {cardInner}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: t.textMuted, marginTop: 24 }}>
        Subscriptions are billed monthly. Cancel or change plans anytime via Manage Subscription.
      </p>
    </div>
  );
}

function SettingsView({ t, user, userData }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const isGoogle  = user?.providerData?.[0]?.providerId === 'google.com';
  const photoURL  = userData?.photoURL || user?.photoURL || null;
  const initials  = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  const fileRef           = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState(false);

  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleteText,    setDeleteText]    = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState('');

  const plan             = userData?.plan || 'free';
  const cancelAtPeriodEnd = (userData?.cancelAtPeriodEnd ?? false) && userData?.subscriptionStatus === 'active';
  const hasActiveSub     = ['active', 'trialing', 'past_due'].includes(userData?.subscriptionStatus) && plan !== 'free';
  const periodEnd        = userData?.currentPeriodEnd?.seconds
    ? new Date(userData.currentPeriodEnd.seconds * 1000).toLocaleDateString()
    : null;

  function deleteWarning() {
    if (hasActiveSub && !cancelAtPeriodEnd) {
      return `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} subscription will be cancelled immediately and you'll lose access right away.`;
    }
    if (hasActiveSub && cancelAtPeriodEnd) {
      return `Your remaining plan benefits will be forfeited immediately${periodEnd ? ` (access would have continued until ${periodEnd})` : ''}.`;
    }
    return 'Your account and all data will be permanently deleted.';
  }

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE') return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId: user.uid }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Deletion failed');
      }
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(err.message || 'Something went wrong. Please try again.');
      setDeleteLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file.'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be under 5 MB.'); return;
    }
    setPhotoError('');
    setPhotoSuccess(false);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'avatars');
      formData.append('public_id', user.uid);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData },
      );
      if (!res.ok) throw new Error('Cloudinary upload failed');
      const { secure_url: url } = await res.json();
      await Promise.all([
        updateProfile(auth.currentUser, { photoURL: url }),
        updateDoc(doc(db, 'users', user.uid), { photoURL: url }),
      ]);
      setPhotoSuccess(true);
    } catch (err) {
      setPhotoError(`Upload failed: ${err?.message ?? err}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 4 }}>Settings</h1>
      <p style={{ color: t.textMuted, fontSize: 14, marginBottom: 32 }}>
        Manage your account settings.
      </p>

      {/* ── Profile photo ── */}
      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`,
        borderRadius: 16, padding: '28px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 20 }}>Profile Photo</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {/* Avatar with edit overlay */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
              background: 'linear-gradient(135deg,#FF6B35,#E91E8C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff',
              border: `3px solid ${t.border}`,
            }}>
              {photoURL
                ? <img src={photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>

            {isGoogle ? (
              /* Google badge — no edit */
              <div title="Managed by Google" style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 24, height: 24, borderRadius: '50%',
                background: '#fff', border: `2px solid ${t.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,.2)',
              }}>
                <svg width="13" height="13" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.1 0 5.8 1.1 8 2.9l6-6C34.4 3.1 29.5 1 24 1 14.7 1 6.8 6.6 3.2 14.6l7 5.4C12 14 17.5 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-10 6.8-17.4z"/>
                  <path fill="#FBBC05" d="M10.2 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.7-4.6l-7-5.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.6 2.6 10.8l7.6-6.2z"/>
                  <path fill="#34A853" d="M24 47c5.4 0 10-1.8 13.3-4.9l-7.4-5.7c-1.8 1.2-4.2 2-5.9 2-6.4 0-11.9-4.3-13.8-10.2l-7.6 6.2C6.9 41.5 14.7 47 24 47z"/>
                </svg>
              </div>
            ) : (
              /* Edit button */
              <>
                <input
                  ref={fileRef} type="file" accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => !uploading && fileRef.current?.click()}
                  disabled={uploading}
                  title="Change profile photo"
                  style={{
                    position: 'absolute', bottom: 2, right: 2,
                    width: 28, height: 28, borderRadius: '50%', padding: 0,
                    background: '#E91E8C', border: `2px solid ${t.bg}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: uploading ? 'default' : 'pointer',
                    boxShadow: '0 2px 8px rgba(233,30,140,.4)',
                  }}>
                  {uploading
                    ? <Loader size={13} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                    : <Camera size={13} color="#fff" />
                  }
                </button>
              </>
            )}
          </div>

          {/* Right-side text */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>
              {user?.displayName || 'Your Name'}
            </div>
            <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 10 }}>{user?.email}</div>

            {isGoogle ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: t.bgBar, color: t.textMuted, border: `1px solid ${t.border}`,
              }}>
                <svg width="12" height="12" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.1 0 5.8 1.1 8 2.9l6-6C34.4 3.1 29.5 1 24 1 14.7 1 6.8 6.6 3.2 14.6l7 5.4C12 14 17.5 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-10 6.8-17.4z"/>
                  <path fill="#FBBC05" d="M10.2 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.7-4.6l-7-5.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.6 2.6 10.8l7.6-6.2z"/>
                  <path fill="#34A853" d="M24 47c5.4 0 10-1.8 13.3-4.9l-7.4-5.7c-1.8 1.2-4.2 2-5.9 2-6.4 0-11.9-4.3-13.8-10.2l-7.6 6.2C6.9 41.5 14.7 47 24 47z"/>
                </svg>
                Photo managed by Google
              </div>
            ) : (
              <button
                onClick={() => !uploading && fileRef.current?.click()}
                disabled={uploading}
                style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: uploading ? 'default' : 'pointer',
                  background: t.outlineBtn, border: `1px solid ${t.border}`,
                  color: t.text, fontFamily: "'Inter',sans-serif",
                  display: 'flex', alignItems: 'center', gap: 7,
                }}>
                <Camera size={14} />
                {uploading ? 'Uploading…' : 'Change Photo'}
              </button>
            )}
          </div>
        </div>

        {photoError && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: 'rgba(239,68,68,0.12)', color: '#f87171',
            border: '1px solid rgba(239,68,68,0.25)',
          }}>{photoError}</div>
        )}
        {photoSuccess && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: 'rgba(34,197,94,0.12)', color: '#4ade80',
            border: '1px solid rgba(34,197,94,0.25)',
          }}>Profile photo updated successfully.</div>
        )}
      </div>

      {/* ── Account info ── */}
      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`,
        borderRadius: 16, padding: '24px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 20 }}>Account</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 600, marginBottom: 6 }}>Email</div>
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 14,
              border: `1px solid ${t.border}`, background: t.bgAlt, color: t.textSub,
            }}>{user?.email}</div>
          </div>
          {user?.displayName && (
            <div>
              <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 600, marginBottom: 6 }}>Display Name</div>
              <div style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 14,
                border: `1px solid ${t.border}`, background: t.bgAlt, color: t.textSub,
              }}>{user.displayName}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div style={{
        background: t.bgCard, border: `1px solid rgba(239,68,68,0.25)`,
        borderRadius: 16, padding: '24px',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>Danger Zone</div>
        <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 16 }}>
          These actions are permanent and cannot be undone.
        </div>
        <button
          onClick={() => { setDeleteOpen(true); setDeleteText(''); setDeleteError(''); }}
          style={{
            padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
            fontFamily: "'Inter',sans-serif",
          }}>
          Delete Account
        </button>
      </div>

      {/* ── Delete account modal ── */}
      {deleteOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}
          onClick={e => { if (e.target === e.currentTarget && !deleteLoading) { setDeleteOpen(false); } }}
        >
          <div style={{
            width: '100%', maxWidth: 440,
            background: t.bgCard, border: '1.5px solid rgba(239,68,68,0.35)',
            borderRadius: 20, padding: '32px 28px',
            boxShadow: '0 0 60px rgba(239,68,68,0.15)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f87171', marginBottom: 8 }}>
              Delete Account
            </div>
            <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.7, marginBottom: 20 }}>
              {deleteWarning()}
              {' '}All your projects, usage history, and account data will be permanently removed.
            </div>

            <div style={{
              padding: '12px 14px', borderRadius: 10, marginBottom: 20, fontSize: 13,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5', lineHeight: 1.6,
            }}>
              This action <strong>cannot be undone</strong>. Type <strong>DELETE</strong> below to confirm.
            </div>

            <input
              value={deleteText}
              onChange={e => setDeleteText(e.target.value)}
              placeholder="Type DELETE to confirm"
              autoComplete="off"
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14,
                background: t.bgAlt, color: t.text, border: `1px solid ${deleteText === 'DELETE' ? 'rgba(239,68,68,0.5)' : t.border}`,
                outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif",
                marginBottom: 16,
              }}
            />

            {deleteError && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16,
                background: 'rgba(239,68,68,0.12)', color: '#f87171',
                border: '1px solid rgba(239,68,68,0.25)',
              }}>{deleteError}</div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleteLoading}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', background: t.bgBar, border: `1px solid ${t.border}`,
                  color: t.textMuted, fontFamily: "'Inter',sans-serif",
                  opacity: deleteLoading ? 0.6 : 1,
                }}>
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteText !== 'DELETE' || deleteLoading}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: deleteText === 'DELETE' && !deleteLoading ? 'pointer' : 'default',
                  background: 'rgba(239,68,68,0.85)', border: 'none', color: '#fff',
                  fontFamily: "'Inter',sans-serif",
                  opacity: deleteText !== 'DELETE' || deleteLoading ? 0.45 : 1,
                  transition: 'opacity .2s',
                }}>
                {deleteLoading ? 'Deleting…' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── sidebar ────────────────────────────────────────────── */
function Sidebar({ t, active, onSelect, user, userData, onSignOut, collapsed }) {
  const sidebarBg = t.id === 'dark'
    ? 'rgba(255,255,255,0.025)'
    : 'rgba(120,80,200,0.04)';

  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      height: '100vh',
      position: 'sticky', top: 0,
      background: sidebarBg,
      borderRight: `1px solid ${t.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width .22s ease',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: collapsed ? '0' : '0 18px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: `1px solid ${t.border}`,
        height: 64, flexShrink: 0, gap: 10,
      }}>
        <img
          src={t.id === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
          alt="Lite Layers"
          style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }}
        />
        {!collapsed && (
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.5px', color: t.text, whiteSpace: 'nowrap' }}>
            Lite <span className="gt">Layers</span>
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 12,
                padding: collapsed ? '11px 0' : '11px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: isActive
                  ? (t.id === 'dark' ? 'rgba(233,30,140,0.15)' : 'rgba(233,30,140,0.1)')
                  : 'transparent',
                color: isActive ? '#E91E8C' : t.textMuted,
                fontFamily: "'Inter',sans-serif",
                fontSize: 14, fontWeight: isActive ? 700 : 500,
                transition: 'background .15s, color .15s',
                width: '100%',
              }}>
              <Icon size={17} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && isActive && (
                <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#E91E8C' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div style={{ padding: collapsed ? '12px 8px' : '12px 8px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Avatar row — always visible, expands to show name/email when not collapsed */}
        {user && (() => {
          const initials = user.displayName
            ? user.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
            : user.email?.[0]?.toUpperCase() ?? '?';
          return (
            <div style={{
              padding: collapsed ? '8px 0' : '8px 14px',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#FF6B35,#E91E8C)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden',
              }}>
                {(userData?.photoURL || user.photoURL)
                  ? <img src={userData?.photoURL || user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials
                }
              </div>
              {!collapsed && (
                <div style={{ minWidth: 0 }}>
                  {user.displayName && (
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.displayName}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Divider between user info and sign out */}
        <div style={{ height: 1, background: t.border, margin: '4px 0' }} />

        <button
          onClick={onSignOut}
          title={collapsed ? 'Sign Out' : undefined}
          style={{
            display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 10,
            padding: collapsed ? '11px 0' : '11px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#f87171',
            fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500,
            width: '100%',
          }}>
          <LogOut size={16} style={{ transform: 'scaleX(-1)' }} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

/* ─── dashboard header ───────────────────────────────────── */
function DashboardHeader({ t, active, isDark, toggle, isMobile, menuOpen, onMenuToggle }) {
  const pageTitle = NAV.find(n => n.id === active)?.label ?? 'Dashboard';

  const sidebarBg = t.id === 'dark'
    ? 'rgba(255,255,255,0.025)'
    : 'rgba(120,80,200,0.04)';

  return (
    <header style={{
      height: 56, flexShrink: 0,
      display: 'flex', alignItems: 'center',
      padding: isMobile ? '0 16px' : '0 32px',
      borderBottom: `1px solid ${t.border}`,
      background: sidebarBg,
      backdropFilter: 'blur(16px)',
      gap: 16,
    }}>
      {/* Mobile: hamburger on left */}
      {isMobile && (
        <button
          onClick={onMenuToggle}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: t.text, padding: 4, display: 'flex', alignItems: 'center',
            flexShrink: 0,
          }}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      )}

      {/* Page title */}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: t.text }}>{pageTitle}</span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={toggle}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
            position: 'relative', flexShrink: 0, padding: 0,
            background: isDark ? 'rgba(255,255,255,.13)' : 'rgba(120,80,200,.15)',
          }}>
          <div style={{
            position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
            background: 'linear-gradient(135deg,#FF6B35,#E91E8C)',
            left: isDark ? 3 : 23, transition: 'left .22s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isDark
              ? <Moon size={11} color="#fff" strokeWidth={2.5} />
              : <Sun size={11} color="#fff" strokeWidth={2.5} />
            }
          </div>
        </button>
      </div>
    </header>
  );
}

/* ─── main ───────────────────────────────────────────────── */
const VALID_TABS = ['overview', 'usage', 'billing', 'settings'];

export default function DashboardPage() {
  const { t, isDark, toggle } = useT();
  const { user, userData, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActiveState]        = useState(() => {
    const tab = searchParams.get('tab');
    return VALID_TABS.includes(tab) ? tab : 'overview';
  });
  const [usage, setUsage]           = useState(null);
  const [monthlyData, setMonthly]   = useState([]);
  const [collapsed, setCollapsed]   = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageError, setUsageError]     = useState('');
  // Track which tabs have been visited so we can keep them mounted (cache)
  const visited = useRef(new Set([
    VALID_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview',
  ]));

  const setActive = (tab) => {
    visited.current.add(tab);
    setActiveState(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
    setMenuOpen(false);
  };

  const fetchUsage = async (uid, currentUserData) => {
    setLoadingUsage(true);
    setUsageError('');
    try {
      // Historical chart: last 6 calendar months
      const months = lastNMonths(6);
      const results = await Promise.all(
        months.map(ym =>
          getDoc(doc(db, 'users', uid, 'usage', ym)).then(snap => ({
            ym,
            label: monthLabel(ym),
            values: snap.exists()
              ? snap.data()
              : { bgRemovals: 0, sceneGenerations: 0, resizes: 0, exports: 0 },
          }))
        )
      );
      setMonthly(results);

      // Current period usage: billing-cycle-aligned key so limits reset on
      // the actual renewal date, not the 1st of the calendar month.
      const periodDoc = currentPeriodKey(currentUserData);
      const periodSnap = await getDoc(doc(db, 'users', uid, 'usage', periodDoc));
      setUsage(
        periodSnap.exists()
          ? periodSnap.data()
          : { bgRemovals: 0, sceneGenerations: 0, resizes: 0, exports: 0 }
      );
    } catch (err) {
      setUsageError(
        err?.code === 'permission-denied'
          ? 'Firestore permission denied — check your security rules allow authenticated reads on users/{uid}/usage.'
          : `Failed to load usage: ${err?.message ?? err}`
      );
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    if (!user || !userData) return;
    fetchUsage(user.uid, userData);
  }, [user, userData?.usagePeriodStart]);

  const viewProps = {
    t, user, userData, usage, monthlyData,
    loadingUsage, usageError,
    onRefresh: () => user && fetchUsage(user.uid, userData),
  };

  const SIDEBAR_W = collapsed ? 64 : 240;

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: t.bg, fontFamily: "'Inter',sans-serif",
      position: 'relative',
    }}>
      {/* Sidebar — hidden on mobile, replaced by bottom nav */}
      {!isMobile && (
        <Sidebar
          t={t}
          active={active}
          onSelect={setActive}
          user={user}
          userData={userData}
          onSignOut={signOut}
          collapsed={collapsed}
        />
      )}

      {/* Collapse toggle — desktop only */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            position: 'absolute',
            top: 20,
            left: SIDEBAR_W - 12,
            zIndex: 20,
            width: 24, height: 24,
            borderRadius: '50%',
            border: `1px solid ${t.border}`,
            background: t.id === 'dark' ? '#1a0f2e' : '#ffffff',
            color: t.textMuted,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: t.id === 'dark'
              ? '0 2px 8px rgba(0,0,0,0.5)'
              : '0 2px 8px rgba(90,50,180,0.15)',
            transition: 'left .22s ease',
            padding: 0,
          }}>
          {collapsed
            ? <ChevronRight size={13} strokeWidth={2.5} />
            : <ChevronLeft  size={13} strokeWidth={2.5} />
          }
        </button>
      )}

      {/* Right column: header + scrollable content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <DashboardHeader
          t={t}
          active={active}
          isDark={isDark}
          toggle={toggle}
          isMobile={isMobile}
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen(o => !o)}
        />

        <main style={{
          flex: 1, overflowY: 'auto',
          padding: isMobile ? '20px 16px' : '36px 40px',
        }}>
          {visited.current.has('overview') && (
            <div style={{ display: active === 'overview' ? 'block' : 'none' }}>
              <Overview {...viewProps} onNavigate={setActive} onRefresh={() => user && fetchUsage(user.uid)} />
            </div>
          )}
          {visited.current.has('usage') && (
            <div style={{ display: active === 'usage' ? 'block' : 'none' }}>
              <UsageView {...viewProps} />
            </div>
          )}
          {visited.current.has('billing') && (
            <div style={{ display: active === 'billing' ? 'block' : 'none' }}>
              <BillingView {...viewProps} />
            </div>
          )}
          {visited.current.has('settings') && (
            <div style={{ display: active === 'settings' ? 'block' : 'none' }}>
              <SettingsView {...viewProps} />
            </div>
          )}
        </main>
      </div>

      {/* Mobile slide-down menu */}
      {isMobile && menuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 98,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
            }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed', top: 56, left: 12, right: 12, zIndex: 99,
            borderRadius: 20,
            background: t.id === 'dark' ? 'rgba(15,8,30,0.97)' : 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(24px)',
            border: `1px solid ${t.border}`,
            boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
            padding: '8px 16px 20px',
          }}>
            {/* Nav items */}
            {NAV.map(({ id, label, icon: Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 12px',
                    background: 'transparent',
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    borderBottom: `1px solid ${t.border}`,
                    cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                    fontSize: 16, fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#E91E8C' : t.text,
                    textAlign: 'left',
                  }}>
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  {label}
                  {isActive && (
                    <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#E91E8C', flexShrink: 0 }} />
                  )}
                </button>
              );
            })}

            {/* User info + sign out */}
            <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px 10px', borderBottom: `1px solid ${t.border}` }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg,#FF6B35,#E91E8C)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden',
                  }}>
                    {(userData?.photoURL || user.photoURL)
                      ? <img src={userData?.photoURL || user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (user.displayName ? user.displayName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : user.email?.[0]?.toUpperCase() ?? '?')
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    {user.displayName && (
                      <div style={{ fontSize: 14, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.displayName}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => { setMenuOpen(false); signOut(); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px 0', borderRadius: 14, fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.08)', color: '#f87171',
                  fontFamily: "'Inter',sans-serif",
                }}>
                <LogOut size={16} style={{ transform: 'scaleX(-1)' }} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
