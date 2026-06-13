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

export default function PrivacyPolicyPage() {
  const { t } = useT();
  const mob = useIsMobile();

  return (
    <>
      <Navbar />
      <main style={{ background: t.bg, minHeight: '100vh', paddingTop: mob ? 80 : 100 }}>
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
              Privacy Policy
            </h1>
            <p style={{ fontSize: 14, color: t.textMuted }}>Last updated: January 1, 2026</p>
            <div style={{ height: 1, background: t.border, marginTop: 32 }} />
          </div>

          <Section title="1. Information We Collect">
            <P>We collect information you provide directly to us when you download or use the Lite Layers app, including your device information, usage data, and any photos you upload for processing.</P>
            <P>We may also collect technical information such as device identifiers, operating system version, app version, and crash reports to improve the app's performance.</P>
          </Section>

          <Section title="2. How We Use Your Information">
            <P>We use the information we collect to provide, maintain, and improve the Lite Layers app; to process your product images using our AI services; and to send you technical notices and support messages.</P>
            <P>Photos you upload are processed in real time for AI scene generation and background removal. We do not store your product images on our servers beyond the immediate processing session.</P>
          </Section>

          <Section title="3. Image Processing & AI">
            <P>All images you upload to Lite Layers are sent to our secure AI processing servers solely for the purpose of generating your edited output. Images are not used to train our AI models without your explicit consent.</P>
            <P>Processed images are temporarily cached on your device and are not shared with third parties.</P>
          </Section>

          <Section title="4. Data Sharing">
            <P>We do not sell, trade, or rent your personal information to third parties. We may share anonymized, aggregated usage statistics with partners to help improve our services.</P>
            <P>We may disclose your information if required by law or if we believe such action is necessary to comply with legal obligations or protect the rights and safety of our users.</P>
          </Section>

          <Section title="5. Data Security">
            <P>We implement industry-standard security measures to protect your information, including encrypted data transmission (TLS) and secure server infrastructure. However, no method of transmission over the internet is 100% secure.</P>
          </Section>

          <Section title="6. Your Rights">
            <P>You may request access to, correction of, or deletion of your personal data at any time by contacting us at the address below. You also have the right to opt out of any non-essential data collection.</P>
          </Section>

          <Section title="7. Children's Privacy">
            <P>Lite Layers is not directed to children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.</P>
          </Section>

          <Section title="8. Changes to This Policy">
            <P>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy in the app and updating the "last updated" date above.</P>
          </Section>

          <Section title="9. Contact Us">
            <P>If you have any questions about this Privacy Policy, please contact us at:</P>
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
