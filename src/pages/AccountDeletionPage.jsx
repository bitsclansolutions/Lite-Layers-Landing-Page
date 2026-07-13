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

function Li({ children }) {
  const { t } = useT();
  return (
    <li style={{ fontSize: 15, lineHeight: 1.85, color: t.textSub, marginBottom: 8 }}>{children}</li>
  );
}

export default function AccountDeletionPage() {
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
              Account &amp; Data Deletion
            </h1>
            <p style={{ fontSize: 14, color: t.textMuted }}>Last updated: January 1, 2026</p>
            <div style={{ height: 1, background: t.border, marginTop: 32 }} />
          </div>

          <Section title="1. How to Request Account Deletion">
            <P>You can permanently delete your Lite Layers account and all associated data in two ways:</P>
            <ol style={{ margin: '0 0 12px', paddingLeft: 20 }}>
              <Li><strong style={{ color: t.text }}>In the app:</strong> Go to <em>Dashboard → Settings → Delete Account</em>, type "DELETE" to confirm, and tap "Delete My Account." Deletion begins immediately.</Li>
              <Li><strong style={{ color: t.text }}>By email:</strong> If you no longer have access to the app, email <strong style={{ color: t.text }}>support@litelayers.app</strong> from the address associated with your account and request deletion. We will verify your identity before processing the request.</Li>
            </ol>
            <P>You do not need to have the app installed to request deletion — the email method works for any account, active or inactive.</P>
          </Section>

          <Section title="2. What Data Is Deleted">
            <P>When your account is deleted, we permanently remove:</P>
            <ol style={{ margin: '0 0 12px', paddingLeft: 20 }}>
              <Li>Your account profile — name, email, and authentication credentials (stored in Firebase Authentication).</Li>
              <Li>All account data in our database — usage history, saved projects, subcategory and scene selections, and settings (stored in Firebase Firestore).</Li>
              <Li>Your profile/avatar image and any product photos associated with your account (stored with our media processor, Cloudinary).</Li>
            </ol>
          </Section>

          <Section title="3. What Data Is Retained, and Why">
            <P>A small amount of data may be retained after account deletion where we are legally or operationally required to do so:</P>
            <ol style={{ margin: '0 0 12px', paddingLeft: 20 }}>
              <Li><strong style={{ color: t.text }}>Fraud prevention and security logs</strong> — limited technical logs (e.g. device/IP metadata tied to abuse prevention) may be retained for a short period to protect against fraud and abuse.</Li>
              <Li><strong style={{ color: t.text }}>Backups</strong> — data may briefly persist in encrypted infrastructure backups until those backups naturally cycle out; this data is not accessible for day-to-day use and is not restored to your deleted account.</Li>
            </ol>
            <P>This retained data cannot be used to reconstruct your deleted account or restore your product photos and projects.</P>
          </Section>

          <Section title="4. How Long Deletion Takes">
            <P>Account and profile data (Firebase Authentication, Firestore, and Cloudinary media) is deleted immediately when you confirm deletion in the app, or within a maximum of 30 days when requested by email.</P>
            <P>Any retained records described in Section 3 are purged automatically according to our standard retention schedule, and in no case are used to identify you for any purpose other than legal compliance.</P>
          </Section>

          <Section title="5. Consequences of Deletion">
            <P>Before requesting deletion, please note:</P>
            <ol style={{ margin: '0 0 12px', paddingLeft: 20 }}>
              <Li>Account deletion is <strong style={{ color: t.text }}>permanent and cannot be undone</strong>. We cannot recover your account, projects, or images once deletion is complete.</Li>
              <Li>All edited and AI-generated images tied to your account are deleted and cannot be retrieved — we recommend downloading anything you want to keep before requesting deletion.</Li>
              <Li>You are welcome to create a new account at any time, but it will start fresh with no access to your previous data.</Li>
            </ol>
          </Section>

          <Section title="6. Deleting Only Specific Data">
            <P>If you'd like to delete specific data (such as a single project or image) without deleting your entire account, contact us at the email below and we'll assist you.</P>
          </Section>

          <Section title="7. Contact Us">
            <P>For questions about this policy or to request account deletion by email, contact:</P>
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
