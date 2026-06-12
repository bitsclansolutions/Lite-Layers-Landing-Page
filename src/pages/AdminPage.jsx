import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  LayoutDashboard, Users, ImageIcon, DollarSign, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Moon, Sun, Crown, Zap,
  Upload, Trash2, Eye, EyeOff, RefreshCw, Search, CheckCircle,
  AlertCircle, ArrowUp, ArrowDown, Plus, ExternalLink, BarChart2,
  TrendingUp, ToggleLeft, ToggleRight, Shield, Activity,
  Camera, Loader, Pencil, Settings, Tag,
} from 'lucide-react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, limit,
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useT } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';

/* ─── constants ──────────────────────────────────────────────── */
const ADMIN_NAV = [
  { id: 'overview',    label: 'Overview',      icon: LayoutDashboard },
  { id: 'users',       label: 'Users',         icon: Users           },
  { id: 'scenes',      label: 'Preset Scenes', icon: ImageIcon       },
  { id: 'categories',  label: 'Categories',    icon: Tag             },
  { id: 'revenue',     label: 'Revenue',       icon: DollarSign      },
  { id: 'settings',    label: 'Settings',      icon: Settings        },
];

const PLAN_COLORS = { free: '#888', pro: '#E91E8C', business: '#7B2FBE' };

const STATUS_META = {
  active:   { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80', label: 'Active'   },
  trialing: { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa', label: 'Trialing' },
  past_due: { bg: 'rgba(239,68,68,0.15)',   text: '#f87171', label: 'Past Due' },
  canceled: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', label: 'Canceled' },
};

const EVENT_META = {
  'customer.subscription.created':  { label: 'Subscribed',   color: '#4ade80' },
  'customer.subscription.updated':  { label: 'Plan Changed',  color: '#60a5fa' },
  'subscription.deleted':           { label: 'Cancelled',     color: '#94a3b8' },
  'payment.failed':                 { label: 'Payment Failed', color: '#f87171' },
  'payment.recovered':              { label: 'Payment OK',    color: '#4ade80' },
};

/* ─── shared helpers ─────────────────────────────────────────── */
async function adminFetch(path, method = 'GET', body = null) {
  const token = await auth.currentUser?.getIdToken();
  const opts  = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res  = await fetch(path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function PlanBadge({ plan }) {
  const color = PLAN_COLORS[plan] || '#888';
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: `${color}22`, color, border: `1px solid ${color}44`,
      textTransform: 'capitalize',
    }}>{plan || 'free'}</span>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: meta.bg, color: meta.text,
    }}>{meta.label}</span>
  );
}

function StatCard({ t, title, value, subtitle, color, Icon }) {
  return (
    <div style={{
      background: t.bgCard, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: '20px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: `${color}20`, color, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} />
        </div>
        <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 600 }}>{title}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: t.text, lineHeight: 1 }}>{value}</div>
      {subtitle && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>{subtitle}</div>}
    </div>
  );
}

/* ─── confirm modal ──────────────────────────────────────────── */
function ConfirmModal({ t, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onCancel}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.id === 'dark' ? '#110a1f' : '#fff',
          border: `1px solid ${t.border}`, borderRadius: 20, padding: '32px',
          width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: t.text, marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.6, marginBottom: 28 }}>{message}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={loading} style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', background: t.outlineBtn, border: `1px solid ${t.border}`,
            color: t.textMuted, fontFamily: "'Inter',sans-serif",
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', border: 'none', fontFamily: "'Inter',sans-serif",
            background: danger ? 'rgba(239,68,68,0.85)' : '#E91E8C', color: '#fff',
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── overview tab ───────────────────────────────────────────── */
function AdminOverview({ t }) {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const fetch_ = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await adminFetch('/api/admin-get-stats');
      setStats(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const mrrEst = stats
    ? `$${(stats.proUsers * 9.99 + stats.businessUsers * 29.99).toFixed(0)}`
    : '…';

  const planTotal = stats ? (stats.totalUsers || 1) : 1;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 4 }}>Platform Overview</h1>
          <p style={{ fontSize: 14, color: t.textMuted }}>Real-time stats from Firestore</p>
        </div>
        <button onClick={fetch_} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', border: `1px solid ${t.border}`, background: t.outlineBtn,
          color: t.textMuted, fontFamily: "'Inter',sans-serif",
        }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{
          marginBottom: 24, padding: '12px 16px', borderRadius: 12,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          fontSize: 13, color: '#f87171',
        }}>{error}</div>
      )}

      {/* KPI cards */}
      <div className="c4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard t={t} title="Total Users"       value={loading ? '…' : stats?.totalUsers}          color="#E91E8C" Icon={Users}       />
        <StatCard t={t} title="Active Subs"        value={loading ? '…' : stats?.activeSubscriptions} color="#7B2FBE" Icon={CheckCircle}  subtitle="Paid + trialing" />
        <StatCard t={t} title="New Signups (30d)"  value={loading ? '…' : stats?.newSignupsLast30Days} color="#FF6B35" Icon={TrendingUp}  />
        <StatCard t={t} title="Est. MRR"           value={loading ? '…' : mrrEst}                     color="#3b82f6" Icon={DollarSign}  subtitle="@$9.99 Pro / $29.99 Biz" />
      </div>

      {/* Plan breakdown */}
      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`,
        borderRadius: 16, padding: '24px', marginBottom: 24,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18 }}>Plan Distribution</div>
        {loading
          ? <div style={{ color: t.textMuted, fontSize: 13 }}>Loading…</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'freeUsers',     label: 'Free',     color: '#888'    },
                { key: 'proUsers',      label: 'Pro',      color: '#E91E8C' },
                { key: 'businessUsers', label: 'Business', color: '#7B2FBE' },
              ].map(({ key, label, color }) => {
                const count = stats?.[key] ?? 0;
                const pct   = Math.round((count / planTotal) * 100);
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{label}</span>
                      <span style={{ fontSize: 13, color: t.textMuted }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 8, background: t.bgBar, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 8, background: color, transition: 'width .4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>

      {/* Subscription health */}
      {stats && (
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: '24px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18 }}>Subscription Health</div>
          <div className="c3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { label: 'Active',    val: stats.activeSubscriptions,  color: '#4ade80' },
              { label: 'Trialing',  val: stats.trialingSubscriptions, color: '#60a5fa' },
              { label: 'Past Due',  val: stats.pastDueSubscriptions,  color: '#f87171' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{
                padding: '18px', borderRadius: 12,
                background: `${color}10`, border: `1px solid ${color}30`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── users tab ──────────────────────────────────────────────── */
const PLAN_LABELS = { free: 'Free', pro: 'Pro', business: 'Business' };

function AdminUsers({ t }) {
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [planFilter, setPlanFilter]   = useState('all');
  const [expandedUid, setExpandedUid] = useState(null);
  const [changePlan, setChangePlan]   = useState(null); // {uid, email, plan}
  const [newPlan, setNewPlan]         = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // {uid, email}
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await adminFetch('/api/admin-get-users');
      setUsers(data.users || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || u.email?.toLowerCase().includes(q)
      || u.displayName?.toLowerCase().includes(q);
    const matchPlan = planFilter === 'all' || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  async function handleChangePlan() {
    if (!newPlan || !changePlan) return;
    setActionLoading(true);
    try {
      await adminFetch('/api/admin-update-user', 'POST', {
        userId: changePlan.uid, action: 'changePlan', plan: newPlan,
      });
      setChangePlan(null);
      await fetchUsers();
    } catch (e) { alert(e.message); }
    finally { setActionLoading(false); }
  }

  async function handleResetUsage(uid) {
    setActionLoading(true);
    try {
      await adminFetch('/api/admin-update-user', 'POST', { userId: uid, action: 'resetUsage' });
      await fetchUsers();
    } catch (e) { alert(e.message); }
    finally { setActionLoading(false); }
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminFetch('/api/admin-delete-user', 'POST', { userId: deleteTarget.uid });
      setDeleteTarget(null);
      await fetchUsers();
    } catch (e) { alert(e.message); }
    finally { setActionLoading(false); }
  }

  const row = (u) => {
    const joined = u.createdAt ? new Date(u.createdAt * 1000).toLocaleDateString() : '—';
    const isExpanded = expandedUid === u.id;
    const initials = u.displayName
      ? u.displayName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
      : u.email?.[0]?.toUpperCase() ?? '?';

    return (
      <div key={u.id}>
        {/* Main row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.5fr 1fr 1fr 1fr auto',
          gap: 12, alignItems: 'center',
          padding: '14px 20px',
          borderBottom: `1px solid ${t.border}`,
          cursor: 'pointer',
        }} onClick={() => setExpandedUid(isExpanded ? null : u.id)}>
          {/* Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#FF6B35,#E91E8C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden',
            }}>
              {u.photoURL
                ? <img src={u.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            <div style={{ minWidth: 0 }}>
              {u.displayName && (
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.displayName}
                </div>
              )}
              <div style={{ fontSize: 12, color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.email}
              </div>
            </div>
          </div>
          {/* Plan */}
          <div><PlanBadge plan={u.plan} /></div>
          {/* Status */}
          <div>{u.subscriptionStatus ? <StatusBadge status={u.subscriptionStatus} /> : <span style={{ fontSize: 12, color: t.textFaint }}>—</span>}</div>
          {/* Joined */}
          <div style={{ fontSize: 12, color: t.textMuted }}>{joined}</div>
          {/* Expand caret */}
          <div style={{ color: t.textMuted }}>
            {isExpanded ? <ChevronLeft size={16} style={{ transform: 'rotate(-90deg)' }} /> : <ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} />}
          </div>
        </div>

        {/* Expanded detail */}
        {isExpanded && (
          <div style={{
            padding: '20px 24px', background: t.id === 'dark' ? 'rgba(255,255,255,0.025)' : 'rgba(120,80,200,0.03)',
            borderBottom: `1px solid ${t.border}`,
          }}>
            {/* Usage */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>Current Period Usage</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {[
                  { label: 'BG Removals', key: 'bgRemovals' },
                  { label: 'AI Scenes',   key: 'sceneGenerations' },
                  { label: 'Resizes',     key: 'resizes' },
                  { label: 'Exports',     key: 'exports' },
                ].map(({ label, key }) => (
                  <div key={key} style={{
                    padding: '8px 14px', borderRadius: 10,
                    background: t.bgBar, border: `1px solid ${t.border}`,
                  }}>
                    <div style={{ fontSize: 11, color: t.textMuted }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: t.text }}>{u.usage?.[key] ?? 0}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Meta */}
            <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>
              <span>Stripe Customer: <code style={{ color: t.text, fontSize: 11 }}>{u.stripeCustomerId || '—'}</code></span>
              {u.currentPeriodEnd && (
                <span style={{ marginLeft: 20 }}>
                  Period ends: {new Date(u.currentPeriodEnd * 1000).toLocaleDateString()}
                </span>
              )}
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={e => { e.stopPropagation(); setNewPlan(u.plan); setChangePlan({ uid: u.id, email: u.email, plan: u.plan }); }}
                style={{
                  padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: `1px solid ${t.border}`, background: t.outlineBtn,
                  color: t.text, fontFamily: "'Inter',sans-serif",
                }}>Change Plan</button>
              <button
                onClick={e => { e.stopPropagation(); handleResetUsage(u.id); }}
                disabled={actionLoading}
                style={{
                  padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid rgba(251,191,36,0.3)',
                  background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
                  fontFamily: "'Inter',sans-serif",
                }}>Reset Usage</button>
              <button
                onClick={e => { e.stopPropagation(); setDeleteTarget({ uid: u.id, email: u.email }); }}
                style={{
                  padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.1)', color: '#f87171',
                  fontFamily: "'Inter',sans-serif",
                }}>Delete User</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 4 }}>Users</h1>
          <p style={{ fontSize: 14, color: t.textMuted }}>{filtered.length} of {users.length} users shown</p>
        </div>
        <button onClick={fetchUsers} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', border: `1px solid ${t.border}`, background: t.outlineBtn,
          color: t.textMuted, fontFamily: "'Inter',sans-serif",
        }}>
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.textMuted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{
              width: '100%', padding: '9px 12px 9px 34px',
              borderRadius: 10, border: `1px solid ${t.border}`,
              background: t.bgCard, color: t.text, fontSize: 13,
              fontFamily: "'Inter',sans-serif", outline: 'none',
            }}
          />
        </div>
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          style={{
            padding: '9px 14px', borderRadius: 10, border: `1px solid ${t.border}`,
            background: t.bgCard, color: t.text, fontSize: 13,
            fontFamily: "'Inter',sans-serif", cursor: 'pointer', outline: 'none',
          }}>
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
        </select>
      </div>

      {error && (
        <div style={{
          marginBottom: 16, padding: '12px 16px', borderRadius: 12,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          fontSize: 13, color: '#f87171',
        }}>{error}</div>
      )}

      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr auto',
          gap: 12, padding: '10px 20px',
          background: t.id === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(120,80,200,0.04)',
          borderBottom: `1px solid ${t.border}`,
        }}>
          {['User', 'Plan', 'Status', 'Joined', ''].map((h, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              {h}
            </div>
          ))}
        </div>

        {loading
          ? <div style={{ padding: '40px', textAlign: 'center', color: t.textMuted, fontSize: 14 }}>Loading users…</div>
          : filtered.length === 0
            ? <div style={{ padding: '40px', textAlign: 'center', color: t.textMuted, fontSize: 14 }}>No users found</div>
            : filtered.map(row)
        }
      </div>

      {/* Change plan modal */}
      {changePlan && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setChangePlan(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: t.id === 'dark' ? '#110a1f' : '#fff',
            border: `1px solid ${t.border}`, borderRadius: 20, padding: '32px',
            width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: t.text, marginBottom: 6 }}>Change Plan</div>
            <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 24 }}>{changePlan.email}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {['free', 'pro', 'business'].map(p => (
                <label key={p} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${newPlan === p ? PLAN_COLORS[p] : t.border}`,
                  background: newPlan === p ? `${PLAN_COLORS[p]}12` : 'transparent',
                }}>
                  <input type="radio" name="plan" value={p} checked={newPlan === p}
                    onChange={() => setNewPlan(p)} style={{ accentColor: PLAN_COLORS[p] }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: newPlan === p ? PLAN_COLORS[p] : t.text }}>
                    {PLAN_LABELS[p]}
                  </span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setChangePlan(null)} style={{
                padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', background: t.outlineBtn, border: `1px solid ${t.border}`,
                color: t.textMuted, fontFamily: "'Inter',sans-serif",
              }}>Cancel</button>
              <button onClick={handleChangePlan} disabled={actionLoading || newPlan === changePlan.plan} style={{
                padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', border: 'none', background: '#E91E8C', color: '#fff',
                fontFamily: "'Inter',sans-serif", opacity: (actionLoading || newPlan === changePlan.plan) ? 0.5 : 1,
              }}>
                {actionLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <ConfirmModal
          t={t}
          title="Delete User"
          message={`Permanently delete ${deleteTarget.email}? This will cancel their Stripe subscription, delete all their data, and remove their Firebase Auth account. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={actionLoading}
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

/* ─── scenes tab ─────────────────────────────────────────────── */
function AdminScenes({ t, user, onTabChange }) {
  const [scenes, setScenes]           = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeCatId, setActiveCatId] = useState('all');
  const [uploadOpen, setUploadOpen]   = useState(false);
  const [uploadFile, setUploadFile]   = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCatId, setUploadCatId] = useState('');
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deletingId, setDeletingId]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [togglingId, setTogglingId]   = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'scene_categories'), orderBy('order', 'asc'));
    return onSnapshot(q, snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'preset_scenes'), orderBy('order', 'asc'));
    return onSnapshot(q, snap => {
      setScenes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  // hierarchy helpers (2-level: parent → subcategory)
  const parents    = categories.filter(c => !c.parentId);
  const childrenOf = (pid) => categories.filter(c => c.parentId === pid);
  const isLeaf     = (cat) => !categories.some(c => c.parentId === cat.id);
  const leafCats   = categories.filter(c => isLeaf(c));

  const filteredScenes = (() => {
    if (activeCatId === 'all') return scenes;
    const cat = categories.find(c => c.id === activeCatId);
    if (!cat) return [];
    const ids = isLeaf(cat) ? [cat.id] : childrenOf(cat.id).map(c => c.id);
    return scenes.filter(s => ids.includes(s.categoryId));
  })();

  const activeCat = categories.find(c => c.id === activeCatId);
  const activeCatName = activeCat
    ? (activeCat.parentId
        ? `${categories.find(c => c.id === activeCat.parentId)?.name} / ${activeCat.name}`
        : activeCat.name)
    : '';

  function pickFile(file) {
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  }
  function handleFileDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file?.type.startsWith('image/')) pickFile(file);
  }
  async function handleUpload() {
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploading(true); setUploadError('');
    try {
      const sig = await adminFetch('/api/admin-sign-upload', 'POST', { folder: 'litelayers/scenes' });
      const form = new FormData();
      form.append('file', uploadFile);
      form.append('api_key', sig.apiKey);
      form.append('timestamp', sig.timestamp);
      form.append('signature', sig.signature);
      form.append('folder', sig.folder);
      const resp = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: 'POST', body: form,
      });
      if (!resp.ok) throw new Error('Cloudinary upload failed');
      const { secure_url, public_id } = await resp.json();
      const thumbnailUrl = secure_url.replace('/upload/', '/upload/w_600,c_fill,q_auto/');
      await addDoc(collection(db, 'preset_scenes'), {
        title: uploadTitle.trim(), imageUrl: secure_url, thumbnailUrl,
        publicId: public_id, isActive: true, order: scenes.length + 1,
        createdAt: serverTimestamp(), uploadedBy: user.uid,
        categoryId: uploadCatId || '',
      });
      setUploadOpen(false);
      setUploadFile(null); setUploadTitle(''); setUploadPreview(''); setUploadCatId('');
    } catch (e) { setUploadError(e.message); }
    finally { setUploading(false); }
  }
  async function handleToggleActive(scene) {
    setTogglingId(scene.id);
    try { await updateDoc(doc(db, 'preset_scenes', scene.id), { isActive: !scene.isActive }); }
    catch { /* ignore */ } finally { setTogglingId(null); }
  }
  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeletingId(deleteConfirm.id);
    try {
      await adminFetch('/api/admin-delete-scene', 'POST', {
        sceneId: deleteConfirm.id, publicId: deleteConfirm.publicId,
      });
      setDeleteConfirm(null);
    } catch (e) { alert(e.message); }
    finally { setDeletingId(null); }
  }
  async function handleReorder(scene, dir) {
    const idx = scenes.findIndex(s => s.id === scene.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= scenes.length) return;
    const swap = scenes[swapIdx];
    await Promise.all([
      updateDoc(doc(db, 'preset_scenes', scene.id), { order: swap.order }),
      updateDoc(doc(db, 'preset_scenes', swap.id),  { order: scene.order }),
    ]);
  }
  const closeUpload = () => {
    if (uploading) return;
    setUploadOpen(false); setUploadFile(null);
    setUploadTitle(''); setUploadPreview(''); setUploadError(''); setUploadCatId('');
  };

  const chip = (active) => ({
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Inter',sans-serif",
    border:     active ? '1px solid #E91E8C' : `1px solid ${t.border}`,
    background: active ? 'rgba(233,30,140,0.12)' : t.outlineBtn,
    color:      active ? '#E91E8C' : t.textMuted,
    transition: 'all .15s',
  });
  const badge = (active) => ({
    padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700,
    background: active ? 'rgba(233,30,140,0.2)' : t.bgBar,
    color:      active ? '#E91E8C' : t.textFaint,
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 4 }}>Preset Scenes</h1>
          <p style={{ fontSize: 14, color: t.textMuted }}>
            {activeCatId === 'all'
              ? `${scenes.length} scenes · ${scenes.filter(s => s.isActive).length} active`
              : `${filteredScenes.length} in "${activeCatName}"`}
          </p>
        </div>
        <button onClick={() => setUploadOpen(true)} className="llb gb"
          style={{ padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
          <Plus size={16} /> Upload Scene
        </button>
      </div>

      {/* Category filter chips — parent chips collapse/expand their subcategory chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24, alignItems: 'center' }}>
        <button onClick={() => setActiveCatId('all')} style={chip(activeCatId === 'all')}>
          All <span style={badge(activeCatId === 'all')}>{scenes.length}</span>
        </button>
        {parents.map(parent => {
          const kids = childrenOf(parent.id);
          const isParentActive = activeCatId === parent.id;
          const total = kids.length > 0
            ? kids.reduce((s, c) => s + scenes.filter(sc => sc.categoryId === c.id).length, 0)
            : scenes.filter(s => s.categoryId === parent.id).length;
          return (
            <Fragment key={parent.id}>
              <button onClick={() => setActiveCatId(parent.id)} style={chip(isParentActive)}>
                {parent.name}
                {kids.length > 0 && <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 1 }}>▾</span>}
                <span style={badge(isParentActive)}>{total}</span>
              </button>
              {kids.map(child => {
                const isChildActive = activeCatId === child.id;
                const count = scenes.filter(s => s.categoryId === child.id).length;
                return (
                  <button key={child.id} onClick={() => setActiveCatId(child.id)} style={{
                    ...chip(isChildActive),
                    fontSize: 11,
                    borderStyle: isChildActive ? 'solid' : 'dashed',
                    paddingLeft: 10,
                  }}>
                    <span style={{ fontSize: 10, color: isChildActive ? '#E91E8C' : t.textFaint }}>└</span>
                    {child.name}
                    <span style={badge(isChildActive)}>{count}</span>
                  </button>
                );
              })}
            </Fragment>
          );
        })}
        <button onClick={() => onTabChange('categories')} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', border: `1px dashed ${t.border}`,
          background: 'transparent', color: t.textMuted, fontFamily: "'Inter',sans-serif",
        }}>
          <Tag size={11} /> Manage Categories
        </button>
      </div>

      {loading
        ? <div style={{ color: t.textMuted, fontSize: 14 }}>Loading scenes…</div>
        : filteredScenes.length === 0
          ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20,
            }}>
              <ImageIcon size={40} color={t.textMuted} style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 8 }}>
                {activeCatId === 'all' ? 'No scenes yet' : `No scenes in "${activeCatName}"`}
              </div>
              <div style={{ fontSize: 14, color: t.textMuted }}>
                {activeCatId === 'all'
                  ? 'Upload your first background scene to get started.'
                  : 'Upload a scene and assign it to this category.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 18 }}>
              {filteredScenes.map((scene, i) => (
                <div key={scene.id} style={{
                  background: t.bgCard, border: `1px solid ${t.border}`,
                  borderRadius: 16, overflow: 'hidden',
                  opacity: scene.isActive ? 1 : 0.55, transition: 'opacity .2s',
                }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: '#111', overflow: 'hidden' }}>
                    <img src={scene.thumbnailUrl || scene.imageUrl} alt={scene.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                    {!scene.isActive && (
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.5)',
                        fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '.5px',
                      }}>HIDDEN</div>
                    )}
                    {(() => {
                      const cat = categories.find(c => c.id === scene.categoryId);
                      if (!cat) return null;
                      const par = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
                      return (
                        <div style={{
                          position: 'absolute', top: 7, left: 7,
                          padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                          background: 'rgba(0,0,0,0.55)', color: '#e2d9f3',
                          backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.12)',
                          maxWidth: 'calc(100% - 14px)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {par ? `${par.name} / ${cat.name}` : cat.name}
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 10,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{scene.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleReorder(scene, 'up')} disabled={i === 0} style={{
                          width: 26, height: 26, borderRadius: 6, border: `1px solid ${t.border}`,
                          background: t.outlineBtn, color: t.textMuted, cursor: i === 0 ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: i === 0 ? 0.35 : 1,
                        }}><ArrowUp size={12} /></button>
                        <button onClick={() => handleReorder(scene, 'down')} disabled={i === filteredScenes.length - 1} style={{
                          width: 26, height: 26, borderRadius: 6, border: `1px solid ${t.border}`,
                          background: t.outlineBtn, color: t.textMuted,
                          cursor: i === filteredScenes.length - 1 ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: i === filteredScenes.length - 1 ? 0.35 : 1,
                        }}><ArrowDown size={12} /></button>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleToggleActive(scene)} disabled={togglingId === scene.id}
                          title={scene.isActive ? 'Hide from users' : 'Show to users'}
                          style={{
                            width: 26, height: 26, borderRadius: 6,
                            border: `1px solid ${scene.isActive ? 'rgba(74,222,128,.3)' : t.border}`,
                            background: scene.isActive ? 'rgba(74,222,128,.1)' : t.outlineBtn,
                            color: scene.isActive ? '#4ade80' : t.textMuted,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                          {scene.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                        <button onClick={() => setDeleteConfirm(scene)} title="Delete scene"
                          style={{
                            width: 26, height: 26, borderRadius: 6,
                            border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.08)',
                            color: '#f87171', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      }

      {/* Upload modal */}
      {uploadOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={closeUpload}>
          <div onClick={e => e.stopPropagation()} style={{
            background: t.id === 'dark' ? '#110a1f' : '#fff',
            border: `1px solid ${t.border}`, borderRadius: 24, padding: '32px',
            width: '100%', maxWidth: 480, boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: t.text }}>Upload Scene</div>
              <button onClick={closeUpload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}>
                <X size={20} />
              </button>
            </div>
            <div onDragOver={e => e.preventDefault()} onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                borderRadius: 14, border: `2px dashed ${uploadPreview ? '#E91E8C' : t.border}`,
                cursor: 'pointer', overflow: 'hidden',
                background: uploadPreview ? 'transparent' : t.bgBar,
                marginBottom: 16, aspectRatio: '16/9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {uploadPreview
                ? <img src={uploadPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <Upload size={32} color={t.textMuted} style={{ marginBottom: 10 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Drop image here</div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>or click to browse · JPG, PNG, WebP</div>
                  </div>
                )
              }
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => pickFile(e.target.files?.[0])} />
            </div>
            <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
              placeholder="Scene title (e.g. Marble Studio)"
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: `1px solid ${t.border}`, background: t.bgCard,
                color: t.text, fontSize: 14, fontFamily: "'Inter',sans-serif",
                outline: 'none', marginBottom: 12, boxSizing: 'border-box',
              }} />
            <select value={uploadCatId} onChange={e => setUploadCatId(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: `1px solid ${t.border}`, background: t.bgCard,
                color: t.text, fontSize: 14, fontFamily: "'Inter',sans-serif",
                outline: 'none', marginBottom: 20, boxSizing: 'border-box', cursor: 'pointer',
              }}>
              <option value="">— Select category —</option>
              {parents.filter(p => isLeaf(p)).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
              {parents.filter(p => !isLeaf(p)).map(parent => (
                <optgroup key={parent.id} label={parent.name}>
                  {childrenOf(parent.id).map(child => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {uploadError && (
              <div style={{
                marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                fontSize: 13, color: '#f87171',
              }}>{uploadError}</div>
            )}
            <button onClick={handleUpload} disabled={!uploadFile || !uploadTitle.trim() || uploading}
              className="llb gb"
              style={{
                width: '100%', justifyContent: 'center', padding: '13px',
                borderRadius: 12, fontSize: 15, fontWeight: 700,
                opacity: (!uploadFile || !uploadTitle.trim() || uploading) ? 0.5 : 1,
                cursor: (!uploadFile || !uploadTitle.trim() || uploading) ? 'not-allowed' : 'pointer',
              }}>
              {uploading ? 'Uploading…' : 'Upload Scene'}
            </button>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal t={t} title="Delete Scene"
          message={`Delete "${deleteConfirm.title}"? The image will be removed from Cloudinary and will no longer appear in the app.`}
          confirmLabel="Delete" danger loading={!!deletingId}
          onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} />
      )}
    </div>
  );
}

/* ─── categories tab ─────────────────────────────────────────── */
function AdminCategories({ t }) {
  const [categories, setCategories]   = useState([]);
  const [scenes, setScenes]           = useState([]);
  const [loading, setLoading]         = useState(true);
  // addParentId: null=modal closed, ''=new top-level, '<id>'=new sub under that parent
  const [addParentId, setAddParentId] = useState(null);
  const [newName, setNewName]         = useState('');
  const [adding, setAdding]           = useState(false);
  const [editId, setEditId]           = useState(null);
  const [editName, setEditName]       = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const addInputRef  = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'scene_categories'), orderBy('order', 'asc'));
    return onSnapshot(q, snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'preset_scenes'), snap => {
      setScenes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
  }, []);

  useEffect(() => { if (addParentId !== null) addInputRef.current?.focus(); }, [addParentId]);
  useEffect(() => { if (editId) editInputRef.current?.focus(); }, [editId]);

  const catParents    = categories.filter(c => !c.parentId);
  const childrenOf    = (pid) => categories.filter(c => c.parentId === pid);
  const isLeaf        = (cat) => !categories.some(c => c.parentId === cat.id);
  const sceneCount    = (catId) => scenes.filter(s => s.categoryId === catId).length;
  const totalCount    = (cat) => isLeaf(cat)
    ? sceneCount(cat.id)
    : childrenOf(cat.id).reduce((s, c) => s + sceneCount(c.id), 0);

  async function handleAdd() {
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      const siblings = addParentId === '' ? catParents : childrenOf(addParentId);
      await addDoc(collection(db, 'scene_categories'), {
        name,
        parentId: addParentId === '' ? null : addParentId,
        order:    siblings.length + 1,
        createdAt: serverTimestamp(),
      });
      setNewName(''); setAddParentId(null);
    } finally { setAdding(false); }
  }

  async function handleRename(id) {
    const name = editName.trim();
    if (name) await updateDoc(doc(db, 'scene_categories', id), { name });
    setEditId(null); setEditName('');
  }

  function tryDelete(cat) {
    const kids = childrenOf(cat.id);
    if (kids.length > 0) {
      alert(`Cannot delete "${cat.name}" — it has ${kids.length} subcategor${kids.length !== 1 ? 'ies' : 'y'}. Delete subcategories first.`);
      return;
    }
    const count = sceneCount(cat.id);
    if (count > 0) {
      alert(`Cannot delete "${cat.name}" — ${count} scene${count !== 1 ? 's are' : ' is'} assigned to it. Move or delete those scenes first.`);
      return;
    }
    setDeleteConfirm(cat);
  }

  async function confirmDelete() {
    if (!deleteConfirm || deleting) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'scene_categories', deleteConfirm.id));
      setDeleteConfirm(null);
    } finally { setDeleting(false); }
  }

  const col = { fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: '.06em', textTransform: 'uppercase' };
  const actionBtn = (danger) => ({
    width: 30, height: 30, borderRadius: 7,
    border: danger ? '1px solid rgba(239,68,68,.3)' : `1px solid ${t.border}`,
    background: danger ? 'rgba(239,68,68,.08)' : t.outlineBtn,
    color: danger ? '#f87171' : t.textMuted,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  });
  const addSubBtn = {
    height: 30, padding: '0 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
    border: '1px solid rgba(233,30,140,.3)', background: 'rgba(233,30,140,.06)',
    color: '#E91E8C', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
    flexShrink: 0, fontFamily: "'Inter',sans-serif",
  };

  function renderRow(cat, isChild) {
    const count   = totalCount(cat);
    const created = cat.createdAt?.toDate
      ? cat.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—';
    const rowStyle = {
      display: 'flex', alignItems: 'center', gap: 12,
      padding: isChild ? '11px 18px 11px 44px' : '14px 18px',
      borderBottom: `1px solid ${t.border}`,
      background: isChild
        ? (t.id === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.018)')
        : 'transparent',
    };

    if (editId === cat.id) {
      return (
        <div key={cat.id} style={rowStyle}>
          {isChild && <span style={{ color: t.textFaint, fontSize: 14, flexShrink: 0, marginLeft: -18 }}>└</span>}
          <input ref={editInputRef} value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  handleRename(cat.id);
              if (e.key === 'Escape') { setEditId(null); setEditName(''); }
            }}
            style={{
              flex: 1, padding: '7px 12px', borderRadius: 9, fontSize: 14,
              border: '1.5px solid #E91E8C', background: t.bgCard, color: t.text,
              fontFamily: "'Inter',sans-serif", outline: 'none',
            }} />
          <button onClick={() => handleRename(cat.id)} style={{
            padding: '7px 14px', borderRadius: 9, border: 'none',
            background: '#E91E8C', color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Inter',sans-serif",
          }}>Save</button>
          <button onClick={() => { setEditId(null); setEditName(''); }} style={{
            padding: '7px 14px', borderRadius: 9, border: `1px solid ${t.border}`,
            background: t.outlineBtn, color: t.textMuted, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Inter',sans-serif",
          }}>Cancel</button>
        </div>
      );
    }

    return (
      <div key={cat.id} style={rowStyle}>
        {isChild && <span style={{ color: t.textFaint, fontSize: 14, flexShrink: 0, marginLeft: -18 }}>└</span>}
        <div style={{ flex: 1, fontSize: isChild ? 13 : 14, fontWeight: isChild ? 500 : 700, color: t.text }}>
          {cat.name}
          {!isChild && !isLeaf(cat) && (
            <span style={{ fontSize: 11, color: t.textFaint, fontWeight: 400, marginLeft: 8 }}>
              {childrenOf(cat.id).length} sub
            </span>
          )}
        </div>
        <div style={{ width: 70, textAlign: 'center' }}>
          <span style={{
            padding: '2px 9px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: count > 0 ? 'rgba(233,30,140,0.1)' : t.bgBar,
            color: count > 0 ? '#E91E8C' : t.textFaint,
          }}>{count}</span>
        </div>
        <div style={{ width: 110, fontSize: 12, color: t.textMuted }}>{created}</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'flex-end',
          minWidth: isChild ? 68 : 148 }}>
          {!isChild && (
            <button onClick={() => { setAddParentId(cat.id); setNewName(''); }} style={addSubBtn} title="Add subcategory">
              <Plus size={10} /> Sub
            </button>
          )}
          <button onClick={() => { setEditId(cat.id); setEditName(cat.name); }} title="Rename" style={actionBtn(false)}>
            <Pencil size={13} />
          </button>
          <button onClick={() => tryDelete(cat)} title="Delete" style={actionBtn(true)}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  }

  const addModalTitle = addParentId === ''
    ? 'New Category'
    : `Add Subcategory to "${categories.find(c => c.id === addParentId)?.name}"`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 4 }}>Categories</h1>
          <p style={{ fontSize: 14, color: t.textMuted }}>
            {catParents.length} {catParents.length === 1 ? 'category' : 'categories'}
            {categories.length > catParents.length && ` · ${categories.length - catParents.length} subcategories`}
          </p>
        </div>
        <button onClick={() => { setAddParentId(''); setNewName(''); }} className="llb gb"
          style={{ padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
          <Plus size={16} /> New Category
        </button>
      </div>

      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
          borderBottom: `1px solid ${t.border}`, background: t.bgBar }}>
          <div style={{ flex: 1, ...col }}>Name</div>
          <div style={{ width: 70, ...col, textAlign: 'center' }}>Scenes</div>
          <div style={{ width: 110, ...col }}>Created</div>
          <div style={{ minWidth: 148 }} />
        </div>

        {loading && <div style={{ padding: '32px 18px', color: t.textMuted, fontSize: 14 }}>Loading…</div>}

        {!loading && catParents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Tag size={36} color={t.textMuted} style={{ marginBottom: 14 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 6 }}>No categories yet</div>
            <div style={{ fontSize: 13, color: t.textMuted }}>
              Create a top-level category, then add subcategories to it.
            </div>
          </div>
        )}

        {catParents.map(parent => (
          <Fragment key={parent.id}>
            {renderRow(parent, false)}
            {childrenOf(parent.id).map(child => renderRow(child, true))}
          </Fragment>
        ))}
      </div>

      {/* Add / Add-sub modal */}
      {addParentId !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => { setAddParentId(null); setNewName(''); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: t.id === 'dark' ? '#110a1f' : '#fff',
            border: `1px solid ${t.border}`, borderRadius: 20, padding: 32,
            width: '100%', maxWidth: 400, boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: t.text, marginBottom: 6 }}>{addModalTitle}</div>
            {addParentId !== '' && (
              <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>
                Scenes are assigned to subcategories, not to the parent category.
              </div>
            )}
            <input ref={addInputRef} value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder={addParentId === '' ? 'e.g. Nature, Abstract' : 'e.g. Forest, Ocean'}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: `1px solid ${t.border}`, background: t.bgCard,
                color: t.text, fontSize: 14, fontFamily: "'Inter',sans-serif",
                outline: 'none', marginBottom: 20, boxSizing: 'border-box',
              }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAdd} disabled={!newName.trim() || adding}
                className="llb gb"
                style={{
                  flex: 1, justifyContent: 'center', padding: '11px',
                  borderRadius: 10, fontSize: 14, fontWeight: 700,
                  opacity: (!newName.trim() || adding) ? 0.5 : 1,
                  cursor: (!newName.trim() || adding) ? 'not-allowed' : 'pointer',
                }}>
                {adding ? 'Adding…' : (addParentId === '' ? 'Add Category' : 'Add Subcategory')}
              </button>
              <button onClick={() => { setAddParentId(null); setNewName(''); }} style={{
                padding: '11px 20px', borderRadius: 10,
                border: `1px solid ${t.border}`, background: t.outlineBtn,
                color: t.textMuted, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Inter',sans-serif",
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal t={t} title="Delete"
          message={`Delete "${deleteConfirm.name}"? This cannot be undone.`}
          confirmLabel="Delete" danger loading={deleting}
          onConfirm={confirmDelete} onCancel={() => setDeleteConfirm(null)} />
      )}
    </div>
  );
}

/* ─── revenue tab ────────────────────────────────────────────── */
function AdminRevenue({ t }) {
  const [events, setEvents]     = useState([]);
  const [evLoading, setEvLoad]  = useState(true);
  const [stats, setStats]       = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'subscription_events'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setEvLoad(false);
    }, () => setEvLoad(false));
    return unsub;
  }, []);

  useEffect(() => {
    adminFetch('/api/admin-get-stats').then(setStats).catch(() => {});
  }, []);

  const mrrEst = stats ? (stats.proUsers * 9.99 + stats.businessUsers * 29.99) : null;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 4 }}>Revenue</h1>
        <p style={{ fontSize: 14, color: t.textMuted }}>Subscription events and estimates</p>
      </div>

      {/* KPIs */}
      <div className="c3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard t={t} title="Est. MRR" value={mrrEst !== null ? `$${mrrEst.toFixed(0)}` : '…'} color="#E91E8C" Icon={DollarSign} subtitle="@$9.99 Pro / $29.99 Biz" />
        <StatCard t={t} title="Pro Subs"      value={stats?.proUsers      ?? '…'} color="#E91E8C" Icon={Crown} />
        <StatCard t={t} title="Business Subs" value={stats?.businessUsers  ?? '…'} color="#7B2FBE" Icon={Zap}   />
      </div>

      {/* Recent events */}
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${t.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Recent Subscription Events</span>
          <span style={{ fontSize: 12, color: t.textMuted }}>Last 50</span>
        </div>

        {evLoading
          ? <div style={{ padding: '40px', textAlign: 'center', color: t.textMuted, fontSize: 14 }}>Loading…</div>
          : events.length === 0
            ? <div style={{ padding: '40px', textAlign: 'center', color: t.textMuted, fontSize: 14 }}>No events yet. Subscription events will appear here as they happen.</div>
            : events.map(ev => {
              const meta = EVENT_META[ev.eventType] || { label: ev.eventType, color: '#94a3b8' };
              const ts   = ev.timestamp?.seconds
                ? new Date(ev.timestamp.seconds * 1000).toLocaleString()
                : '—';
              return (
                <div key={ev.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                  gap: 16, alignItems: 'center',
                  padding: '12px 20px', borderBottom: `1px solid ${t.border}`,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.email || ev.uid || 'Unknown'}
                    </div>
                  </div>
                  <span style={{
                    padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: `${meta.color}20`, color: meta.color, whiteSpace: 'nowrap',
                  }}>{meta.label}</span>
                  <PlanBadge plan={ev.plan} />
                  <span style={{ fontSize: 11, color: t.textMuted, whiteSpace: 'nowrap' }}>{ts}</span>
                </div>
              );
            })
        }
      </div>

      {/* Stripe dashboard link */}
      <a
        href="https://dashboard.stripe.com"
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          background: t.outlineBtn, border: `1px solid ${t.border}`,
          color: t.text, textDecoration: 'none',
        }}>
        <ExternalLink size={15} />Open Stripe Dashboard
      </a>
    </div>
  );
}

/* ─── admin settings tab ────────────────────────────────────── */
function AdminSettings({ t, user, userData }) {
  const isGoogle  = user?.providerData?.[0]?.providerId === 'google.com';
  const photoURL  = userData?.photoURL || user?.photoURL || null;
  const initials  = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  const fileRef = useRef(null);
  const [uploading,    setUploading]    = useState(false);
  const [photoError,   setPhotoError]   = useState('');
  const [photoSuccess, setPhotoSuccess] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setPhotoError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024)    { setPhotoError('Image must be under 5 MB.');      return; }
    setPhotoError(''); setPhotoSuccess(false); setUploading(true);
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

  const inputBox = {
    padding: '10px 14px', borderRadius: 10, fontSize: 14,
    border: `1px solid ${t.border}`, background: t.bgAlt, color: t.textSub,
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 4 }}>Settings</h1>
      <p style={{ color: t.textMuted, fontSize: 14, marginBottom: 32 }}>Manage your admin account settings.</p>

      {/* Profile photo */}
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: '28px', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 20 }}>Profile Photo</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
              background: 'linear-gradient(135deg,#FF6B35,#E91E8C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff', border: `3px solid ${t.border}`,
            }}>
              {photoURL
                ? <img src={photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            {!isGoogle && (
              <>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
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
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>
              {user?.displayName || 'Admin'}
            </div>
            <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 10 }}>{user?.email}</div>
            {isGoogle ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: t.bgBar, color: t.textMuted, border: `1px solid ${t.border}`,
              }}>Photo managed by Google</div>
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

      {/* Account info */}
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: '24px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 20 }}>Account</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 600, marginBottom: 6 }}>Email</div>
            <div style={inputBox}>{user?.email}</div>
          </div>
          {user?.displayName && (
            <div>
              <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 600, marginBottom: 6 }}>Display Name</div>
              <div style={inputBox}>{user.displayName}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 600, marginBottom: 6 }}>Role</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 10, fontSize: 14,
              border: '1px solid rgba(233,30,140,0.3)',
              background: 'rgba(233,30,140,0.08)', color: '#E91E8C',
            }}>
              <Shield size={14} /> Administrator
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── admin sidebar ──────────────────────────────────────────── */
function AdminSidebar({ t, active, onSelect, user, userData, onSignOut, collapsed }) {
  const sidebarBg = t.id === 'dark' ? 'rgba(255,255,255,0.025)' : 'rgba(120,80,200,0.04)';
  const initials  = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <aside style={{
      width: collapsed ? 64 : 240, height: '100vh',
      position: 'sticky', top: 0, background: sidebarBg,
      borderRight: `1px solid ${t.border}`,
      display: 'flex', flexDirection: 'column',
      transition: 'width .22s ease', overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Logo + Admin badge */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: collapsed ? '0' : '0 18px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: `1px solid ${t.border}`,
        height: 64, flexShrink: 0, gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg,#E91E8C,#7B2FBE)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={14} color="#fff" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.3px', color: t.text, lineHeight: 1.1 }}>
              Lite <span className="gt">Layers</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#E91E8C', letterSpacing: '.5px', textTransform: 'uppercase' }}>
              Admin
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {ADMIN_NAV.map(({ id, label, icon: Icon }) => {
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

        {/* Divider */}
        <div style={{ height: 1, background: t.border, margin: '8px 0' }} />
      </nav>

      {/* User + sign out */}
      <div style={{ padding: collapsed ? '12px 8px' : '12px 8px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {user && (
          <div style={{
            padding: collapsed ? '8px 0' : '8px 14px', marginBottom: 4,
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start', gap: 10,
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
        )}
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
            fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, width: '100%',
          }}>
          <LogOut size={16} style={{ transform: 'scaleX(-1)' }} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

/* ─── admin header ───────────────────────────────────────────── */
function AdminHeader({ t, active, isDark, toggle, isMobile, menuOpen, onMenuToggle }) {
  const pageTitle = ADMIN_NAV.find(n => n.id === active)?.label ?? 'Admin';
  const sidebarBg = t.id === 'dark' ? 'rgba(255,255,255,0.025)' : 'rgba(120,80,200,0.04)';

  return (
    <header style={{
      height: 56, flexShrink: 0,
      display: 'flex', alignItems: 'center',
      padding: isMobile ? '0 16px' : '0 32px',
      borderBottom: `1px solid ${t.border}`,
      background: sidebarBg, backdropFilter: 'blur(16px)', gap: 16,
    }}>
      {isMobile && (
        <button onClick={onMenuToggle} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: t.text, padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      )}

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: t.text }}>{pageTitle}</span>
        <span style={{
          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800,
          background: 'rgba(233,30,140,0.15)', color: '#E91E8C',
          textTransform: 'uppercase', letterSpacing: '.5px',
        }}>Admin</span>
      </div>

      <button
        onClick={toggle}
        title={isDark ? 'Switch to light' : 'Switch to dark'}
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
          {isDark ? <Moon size={11} color="#fff" strokeWidth={2.5} /> : <Sun size={11} color="#fff" strokeWidth={2.5} />}
        </div>
      </button>
    </header>
  );
}

/* ─── main ───────────────────────────────────────────────────── */
const VALID_TABS = ['overview', 'users', 'scenes', 'categories', 'revenue', 'settings'];

export default function AdminPage() {
  const { t, isDark, toggle } = useT();
  const { user, userData, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActiveState] = useState(() => {
    const tab = searchParams.get('tab');
    return VALID_TABS.includes(tab) ? tab : 'overview';
  });
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  const setActive = (tab) => {
    setActiveState(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
    setMenuOpen(false);
  };

  const SIDEBAR_W = collapsed ? 64 : 240;

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: t.bg, fontFamily: "'Inter',sans-serif", position: 'relative',
    }}>
      {!isMobile && (
        <AdminSidebar
          t={t} active={active} onSelect={setActive}
          user={user} userData={userData} onSignOut={signOut}
          collapsed={collapsed}
        />
      )}

      {!isMobile && (
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            position: 'absolute', top: 20, left: SIDEBAR_W - 12, zIndex: 20,
            width: 24, height: 24, borderRadius: '50%',
            border: `1px solid ${t.border}`,
            background: t.id === 'dark' ? '#1a0f2e' : '#ffffff',
            color: t.textMuted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: t.id === 'dark' ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(90,50,180,0.15)',
            transition: 'left .22s ease', padding: 0,
          }}>
          {collapsed ? <ChevronRight size={13} strokeWidth={2.5} /> : <ChevronLeft size={13} strokeWidth={2.5} />}
        </button>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <AdminHeader
          t={t} active={active} isDark={isDark} toggle={toggle}
          isMobile={isMobile} menuOpen={menuOpen} onMenuToggle={() => setMenuOpen(o => !o)}
        />
        <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 16px' : '36px 40px' }}>
          {active === 'overview'  && <AdminOverview  t={t} />}
          {active === 'users'     && <AdminUsers     t={t} />}
          {active === 'scenes'      && <AdminScenes      t={t} user={user} onTabChange={setActive} />}
          {active === 'categories'  && <AdminCategories  t={t} />}
          {active === 'revenue'     && <AdminRevenue     t={t} />}
          {active === 'settings'  && <AdminSettings  t={t} user={user} userData={userData} />}
        </main>
      </div>

      {/* Mobile menu */}
      {isMobile && menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 98,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
          }} />
          <div style={{
            position: 'fixed', top: 56, left: 12, right: 12, zIndex: 99,
            borderRadius: 20,
            background: t.id === 'dark' ? 'rgba(15,8,30,0.97)' : 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(24px)',
            border: `1px solid ${t.border}`,
            boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
            padding: '8px 16px 20px',
          }}>
            {ADMIN_NAV.map(({ id, label, icon: Icon }) => {
              const isActive = active === id;
              return (
                <button key={id} onClick={() => setActive(id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 12px',
                  background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  borderBottom: `1px solid ${t.border}`,
                  cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                  fontSize: 16, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#E91E8C' : t.text, textAlign: 'left',
                }}>
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  {label}
                  {isActive && <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#E91E8C', flexShrink: 0 }} />}
                </button>
              );
            })}
            <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => { setMenuOpen(false); signOut(); }} style={{
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
