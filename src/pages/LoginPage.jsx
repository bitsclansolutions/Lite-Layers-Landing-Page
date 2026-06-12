import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const INPUT = (t) => ({
  width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 14,
  background: t.bgAlt, color: t.text, outline: 'none', boxSizing: 'border-box',
  border: `1px solid ${t.border}`, fontFamily: "'Inter',sans-serif",
});

export default function LoginPage() {
  const { t } = useT();
  const mob = useIsMobile();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, user, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab]                 = useState('login');
  const [email, setEmail]             = useState('');
  const [pass, setPass]               = useState('');
  const [name, setName]               = useState('');
  const [error, setError]             = useState('');
  const [busy, setBusy]               = useState(false);
  const [awaitingRedirect, setAwaitingRedirect] = useState(false);

  // Once we've signed in and userData has loaded from Firestore, redirect based on role.
  useEffect(() => {
    if (!awaitingRedirect || !user || userData === null) return;
    const dest = userData.role === 'admin'
      ? '/admin'
      : (location.state?.from || '/dashboard');
    navigate(dest, { replace: true });
  }, [awaitingRedirect, user, userData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (tab === 'login') {
        await signInWithEmail(email, pass);
      } else {
        await signUpWithEmail(email, pass, name);
      }
      setAwaitingRedirect(true);
    } catch (err) {
      setError(friendlyError(err.code));
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
      setAwaitingRedirect(true);
    } catch (err) {
      setError(friendlyError(err.code));
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: t.bg, padding: 24, fontFamily: "'Inter',sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: mob ? '12px 16px' : '16px 28px',
        borderBottom: `1px solid ${t.border}`,
        background: t.id === 'dark' ? 'rgba(7,3,15,0.85)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(16px)',
        zIndex: 10,
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: t.textMuted, textDecoration: 'none', fontSize: 14, fontWeight: 500,
          transition: 'color .2s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = t.text}
          onMouseLeave={e => e.currentTarget.style.color = t.textMuted}
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <ThemeToggle />
      </div>

      <div style={{
        width: '100%', maxWidth: 420,
        background: t.bgCard, border: `1px solid ${t.border}`,
        borderRadius: 24, padding: mob ? '28px 20px' : '40px 36px',
        backdropFilter: 'blur(24px)',
        boxShadow: t.shadowCard,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, textDecoration: 'none' }}>
          <Logo size={28} />
          <span style={{ fontSize: 18, fontWeight: 800, color: t.text }}>
            Lite <span className="gt">Layers</span>
          </span>
        </Link>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: t.bgBar, borderRadius: 12,
          padding: 4, marginBottom: 28, gap: 4,
        }}>
          {['login', 'signup'].map((tab_) => (
            <button key={tab_} onClick={() => { setTab(tab_); setError(''); }}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 9, border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .2s',
                background: tab === tab_ ? '#E91E8C' : 'transparent',
                color:      tab === tab_ ? '#fff'    : t.textMuted,
                fontFamily: "'Inter',sans-serif",
              }}>
              {tab_ === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'signup' && (
            <input
              placeholder="Full name"
              value={name} onChange={e => setName(e.target.value)}
              style={INPUT(t)}
            />
          )}
          <input
            type="email" placeholder="Email address" required
            value={email} onChange={e => setEmail(e.target.value)}
            style={INPUT(t)}
          />
          <input
            type="password" placeholder="Password" required minLength={6}
            value={pass} onChange={e => setPass(e.target.value)}
            style={INPUT(t)}
          />

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 13,
              background: 'rgba(239,68,68,0.12)', color: '#f87171',
              border: '1px solid rgba(239,68,68,0.25)',
            }}>{error}</div>
          )}

          <button type="submit" disabled={busy} className="llb gb"
            style={{
              padding: '13px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
              width: '100%', marginTop: 4, opacity: busy ? 0.7 : 1, justifyContent: 'center',
            }}>
            {busy ? 'Please wait…' : tab === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: t.border }} />
          <span style={{ fontSize: 12, color: t.textMuted }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: t.border }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={busy}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 12, cursor: 'pointer',
            background: t.outlineBtn, border: `1px solid ${t.outlineBtnBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontSize: 14, fontWeight: 600, color: t.text, fontFamily: "'Inter',sans-serif",
            opacity: busy ? 0.7 : 1, transition: 'all .2s',
          }}>
          <GoogleIcon />
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: t.textMuted, marginTop: 24 }}>
          By continuing you agree to our{' '}
          <Link to="/terms" style={{ color: '#E91E8C', textDecoration: 'none' }}>Terms</Link>
          {' & '}
          <Link to="/privacy-policy" style={{ color: '#E91E8C', textDecoration: 'none' }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.1 0 5.8 1.1 8 2.9l6-6C34.4 3.1 29.5 1 24 1 14.7 1 6.8 6.6 3.2 14.6l7 5.4C12 14 17.5 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-10 6.8-17.4z"/>
      <path fill="#FBBC05" d="M10.2 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.7-4.6l-7-5.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.6 2.6 10.8l7.6-6.2z"/>
      <path fill="#34A853" d="M24 47c5.4 0 10-1.8 13.3-4.9l-7.4-5.7c-1.8 1.2-4.2 2-5.9 2-6.4 0-11.9-4.3-13.8-10.2l-7.6 6.2C6.9 41.5 14.7 47 24 47z"/>
    </svg>
  );
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':       'No account found with this email.',
    'auth/wrong-password':       'Incorrect password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/invalid-credential':   'Incorrect email or password.',
    'auth/unauthorized-domain':  'This domain is not authorised in Firebase. Add it under Authentication → Settings → Authorized domains.',
    'auth/operation-not-allowed': 'Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.',
    'auth/popup-blocked':        'Popup was blocked by your browser. Please allow popups for this site.',
  };
  return map[code] || `Something went wrong (${code}). Please try again.`;
}
