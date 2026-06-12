import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Ctx, THEMES } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { useGlobalStyles } from './hooks/useGlobalStyles';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage        from './pages/LandingPage';
import PrivacyPolicyPage  from './pages/PrivacyPolicyPage';
import TermsPage          from './pages/TermsPage';
import LoginPage          from './pages/LoginPage';
import PricingPage        from './pages/PricingPage';
import DashboardPage      from './pages/DashboardPage';
import AdminPage          from './pages/AdminPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import AdminRoute         from './components/AdminRoute';

export default function App() {
  useGlobalStyles();
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('theme') !== 'light'
  );
  const t = isDark ? THEMES.dark : THEMES.light;

  const toggle = () => setIsDark(d => {
    localStorage.setItem('theme', d ? 'light' : 'dark');
    return !d;
  });

  return (
    <Ctx.Provider value={{ t, isDark, toggle }}>
      <BrowserRouter>
        <AuthProvider>
          <div style={{ background: t.bg, color: t.text, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif" }}>
            <Routes>
              <Route path="/"               element={<LandingPage />}        />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />}  />
              <Route path="/terms"          element={<TermsPage />}          />
              <Route path="/login"          element={<LoginPage />}          />
              <Route path="/pricing"        element={<PricingPage />}        />
              <Route path="/success"        element={<PaymentSuccessPage />} />
              <Route path="/dashboard"      element={
                <ProtectedRoute><DashboardPage /></ProtectedRoute>
              } />
              <Route path="/admin"          element={
                <AdminRoute><AdminPage /></AdminRoute>
              } />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </Ctx.Provider>
  );
}
