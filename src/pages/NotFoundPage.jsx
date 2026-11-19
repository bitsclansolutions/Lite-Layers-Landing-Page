import { Link } from 'react-router-dom';
import { useT } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import FooterSection from '../sections/FooterSection';

export default function NotFoundPage() {
  const { t } = useT();
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '140px 20px 80px', textAlign: 'center' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: '#E91E8C', textTransform: 'uppercase', marginBottom: 12 }}>404</p>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: t.text, marginBottom: 14 }}>Page not found</h1>
          <p style={{ fontSize: 16, color: t.textSub, marginBottom: 28 }}>This page doesn't exist or has moved.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: '#E91E8C', fontWeight: 700, textDecoration: 'none' }}>Go home</Link>
            <Link to="/free-tools" style={{ color: '#E91E8C', fontWeight: 700, textDecoration: 'none' }}>Browse free tools</Link>
          </div>
        </div>
      </main>
      <FooterSection />
    </>
  );
}
