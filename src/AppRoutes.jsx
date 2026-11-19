// Providers + routes. Rendered inside BrowserRouter in the browser (App.jsx)
// and inside StaticRouter at build time (entry-server.jsx).
import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Ctx, THEMES } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { useGlobalStyles } from './hooks/useGlobalStyles';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import SeoHead from './components/seo/SeoHead';
import ScrollManager from './components/ScrollManager';
import { getSeoPage, TOOLS_INDEX } from './data/seoPages';
import { PUBLIC_PATHS } from './seo/head';

import LandingPage         from './pages/LandingPage';
import PrivacyPolicyPage   from './pages/PrivacyPolicyPage';
import TermsPage           from './pages/TermsPage';
import AccountDeletionPage from './pages/AccountDeletionPage';
import LoginPage           from './pages/LoginPage';
import PricingPage         from './pages/PricingPage';
import DashboardPage       from './pages/DashboardPage';
import AdminPage           from './pages/AdminPage';
import PaymentSuccessPage  from './pages/PaymentSuccessPage';
import FreeToolsPage       from './pages/seo/FreeToolsPage';
import SeoRoute            from './pages/seo/SeoRoute';

const readStoredTheme = () => {
  try { return localStorage.getItem('theme') !== 'light'; } catch { return true; }
};

// Marketing pages render straight away instead of waiting for Firebase sign-in,
// so prerendered HTML isn't wiped to a blank screen on load.
const isPublicPage = path => PUBLIC_PATHS.includes(path) || Boolean(getSeoPage(path.replace(/\/+$/, '')));

export default function AppRoutes() {
  useGlobalStyles();
  const { pathname } = useLocation();
  const [isDark, setIsDark] = useState(() => (typeof window === 'undefined' ? true : readStoredTheme()));
  const t = isDark ? THEMES.dark : THEMES.light;

  // index.css paints <body> dark; follow the theme so light mode has no dark edges or
  // overscroll, and native controls (scrollbars, form fields) match.
  useEffect(() => {
    document.body.style.background = t.bg;
    document.body.style.color = t.text;
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [t, isDark]);

  const toggle = () => setIsDark(d => {
    try { localStorage.setItem('theme', d ? 'light' : 'dark'); } catch { /* storage blocked */ }
    return !d;
  });

  return (
    <Ctx.Provider value={{ t, isDark, toggle }}>
      <AuthProvider renderWhileLoading={isPublicPage(pathname)}>
        <SeoHead />
        <ScrollManager />
        <div style={{ background: t.bg, color: t.text, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif" }}>
          <Routes>
            <Route path="/"                 element={<LandingPage />}         />
            <Route path="/privacy-policy"   element={<PrivacyPolicyPage />}   />
            <Route path="/terms"            element={<TermsPage />}           />
            <Route path="/account-deletion" element={<AccountDeletionPage />} />
            <Route path="/login"            element={<LoginPage />}           />
            <Route path="/pricing"          element={<PricingPage />}         />
            <Route path="/success"          element={<PaymentSuccessPage />}  />
            <Route path={TOOLS_INDEX.slug}  element={<FreeToolsPage />}       />
            <Route path="/dashboard"        element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/admin"            element={
              <AdminRoute><AdminPage /></AdminRoute>
            } />
            {/* SEO pages from the keyword sheet (and the 404 page for anything else) */}
            <Route path="*"                 element={<SeoRoute />}            />
          </Routes>
        </div>
      </AuthProvider>
    </Ctx.Provider>
  );
}
