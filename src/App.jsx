import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Ctx, THEMES } from './context/ThemeContext';
import { useGlobalStyles } from './hooks/useGlobalStyles';

import LandingPage       from './pages/LandingPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage         from './pages/TermsPage';

export default function App() {
  useGlobalStyles();
  const [isDark, setIsDark] = useState(true);
  const t = isDark ? THEMES.dark : THEMES.light;

  return (
    <Ctx.Provider value={{ t, isDark, toggle: () => setIsDark(d => !d) }}>
      <div style={{ background: t.bg, color: t.text, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif" }}>
        <BrowserRouter>
          <Routes>
            <Route path="/"               element={<LandingPage />}       />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms"          element={<TermsPage />}         />
          </Routes>
        </BrowserRouter>
      </div>
    </Ctx.Provider>
  );
}
