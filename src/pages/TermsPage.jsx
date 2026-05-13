import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useT } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import Navbar from '../components/Navbar';
import FooterSection from '../sections/FooterSection';

function Section({ title, children }) {
  const { t } = useT();
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text, marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}

function P({ children }) {
  const { t } = useT();
  return (
    <p style={{ fontSize: 15, lineHeight: 1.85, color: t.textSub, marginBottom: 12 }}>{children}</p>
  );
}

export default function TermsPage() {
  const { t } = useT();
  const mob = useIsMobile();

  return (
    <>
      <Navbar />
      <main style={{ background: t.bg, minHeight: '100vh', paddingTop: 100 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: mob ? '40px 20px 80px' : '60px 48px 100px' }}>

          {/* Back link */}
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
            color: t.textMuted, fontSize: 14, fontWeight: 500, marginBottom: 40,
            transition: 'color .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#E91E8C'}
            onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
            <ArrowLeft size={16} strokeWidth={2} />
            Back to Home
          </Link>

          {/* Header */}
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: '#E91E8C', textTransform: 'uppercase', marginBottom: 12 }}>Legal</p>
            <h1 style={{ fontSize: mob ? 32 : 44, fontWeight: 900, letterSpacing: '-1.5px', color: t.text, marginBottom: 14 }}>
              Terms of Service
            </h1>
            <p style={{ fontSize: 14, color: t.textMuted }}>Last updated: January 1, 2026</p>
            <div style={{ height: 1, background: t.border, marginTop: 32 }} />
          </div>

          <Section title="1. Acceptance of Terms">
            <P>By downloading, installing, or using the Lite Layers mobile application ("App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.</P>
          </Section>

          <Section title="2. Description of Service">
            <P>Lite Layers is an AI-powered product photography application that allows users to edit product images using features including AI scene generation, background removal, and smart resizing for ecommerce platforms.</P>
            <P>We reserve the right to modify, suspend, or discontinue any part of the service at any time without prior notice.</P>
          </Section>

          <Section title="3. User Accounts & Eligibility">
            <P>You must be at least 13 years of age to use the App. By using Lite Layers, you represent that you meet this requirement and that all information you provide is accurate and complete.</P>
          </Section>

          <Section title="4. Acceptable Use">
            <P>You agree to use the App only for lawful purposes and in accordance with these Terms. You must not use the App to process images that contain illegal content, infringe on third-party intellectual property rights, or violate any applicable laws.</P>
            <P>You retain full ownership of the product images you upload. By using the App, you grant Lite Layers a limited, temporary license solely to process your images for the purpose of delivering the service.</P>
          </Section>

          <Section title="5. Intellectual Property">
            <P>The App, its original content, features, and functionality are and will remain the exclusive property of Lite Layers and its licensors. Our trademarks and trade dress may not be used without our prior written permission.</P>
            <P>AI-generated outputs produced using your uploaded images are owned by you, subject to any applicable third-party AI model licenses.</P>
          </Section>

          <Section title="6. In-App Purchases & Subscriptions">
            <P>Some features of the App may require in-app purchases or a subscription. All purchases are final and non-refundable except as required by applicable law. Subscription plans will auto-renew unless cancelled at least 24 hours before the end of the current billing period.</P>
          </Section>

          <Section title="7. Disclaimer of Warranties">
            <P>The App is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not warrant that the App will be uninterrupted, error-free, or that any defects will be corrected.</P>
          </Section>

          <Section title="8. Limitation of Liability">
            <P>To the maximum extent permitted by applicable law, Lite Layers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the App.</P>
          </Section>

          <Section title="9. Governing Law">
            <P>These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions. Any disputes arising from these Terms shall be resolved through binding arbitration.</P>
          </Section>

          <Section title="10. Changes to Terms">
            <P>We reserve the right to update these Terms at any time. Continued use of the App after changes are posted constitutes your acceptance of the revised Terms.</P>
          </Section>

          <Section title="11. Contact Us">
            <P>If you have any questions about these Terms, please contact us at:</P>
            <div style={{
              background: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 16,
              padding: '20px 24px', marginTop: 8,
            }}>
              <p style={{ fontSize: 15, color: t.text, fontWeight: 600, marginBottom: 4 }}>Lite Layers</p>
              <p style={{ fontSize: 14, color: t.textMuted }}>support@litelayers.app</p>
            </div>
          </Section>
        </div>
      </main>
      <FooterSection />
    </>
  );
}
