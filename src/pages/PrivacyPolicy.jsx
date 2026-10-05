import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
  <section className="doc-section">
    <h2>{title}</h2>
    {children}
  </section>
);

const P = ({ children }) => <p className="doc-p">{children}</p>;

export default function PrivacyPolicy() {
  return (
    <div className="mm-page mm-page--narrow">

      <header className="mm-page-header">
        <h1>Privacy Policy</h1>
        <p className="doc-updated">Last updated: October 5, 2026</p>
      </header>

      <div className="mm-panel doc-body">

        <Section title="Overview">
          <P>MonkeyMind ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains what data we collect when you use MonkeyMind, why we collect it, how it is stored, and your rights regarding that data.</P>
          <P>We do not sell your personal data. We do not use third-party advertising. We do not track you across other websites.</P>
        </Section>

        <Section title="What We Collect">
          <P><strong>Usage Analytics (anonymous).</strong> When you visit a page or use a tool (Focus Timer, Breathing, Meditation, Let It Go, Soundscapes), we record: the page name, tool name, how long you spent, and a randomly generated session ID. This session ID is temporary and stored only in your browser's sessionStorage — it is not linked to your identity.</P>
          <P><strong>Former Community accounts.</strong> The Community forum has closed and no new accounts are created. If you signed up before, your email address, username and any posts are still stored securely in Supabase and are no longer shown on the site. You can ask us to delete them at any time (see Your Rights).</P>
          <P><strong>Let It Go and Sanctuary.</strong> Anything you type in Let It Go and your progress through the Sanctuary stay in your browser and are never saved or sent to us.</P>
          <P><strong>Affiliate Links.</strong> Clicking an Amazon or Flipkart affiliate link redirects you to those sites. We may receive a small commission. Those sites have their own privacy policies — we have no control over the data they collect.</P>
        </Section>

        <Section title="What We Do NOT Collect">
          <P>We do not collect: your IP address for identification, cookies for tracking, device fingerprints, location data, or any personally identifiable information beyond what former Community members provided when they signed up.</P>
        </Section>

        <Section title="How Data Is Stored">
          <P>All data is stored in <strong>Supabase</strong>, a managed PostgreSQL database provider hosted on AWS infrastructure in the United States. Supabase is SOC 2 Type II certified. Data in transit is encrypted with TLS. Data at rest is encrypted with AES-256.</P>
        </Section>

        <Section title="Data Retention">
          <P>Anonymous usage events (page views, tool sessions) are retained for 90 days, then automatically deleted. Former Community accounts and posts are retained until you request deletion.</P>
        </Section>

        <Section title="Your Rights">
          <P>You may request access to, correction of, or deletion of your data at any time by emailing us at <a href="mailto:privacy@monkeymind.app" className="mm-link">privacy@monkeymind.app</a>. To delete a former Community account and its posts, email us from the address you signed up with and we will remove them. Anonymous session analytics cannot be attributed to you and therefore cannot be individually deleted.</P>
        </Section>

        <Section title="Children's Privacy">
          <P>MonkeyMind is not directed at children under 13. We do not knowingly collect data from children. If you believe we have collected data from a child, contact us immediately.</P>
        </Section>

        <Section title="Changes to This Policy">
          <P>We may update this policy from time to time. The "Last updated" date at the top will always reflect the most recent version. Continued use of MonkeyMind after changes constitutes acceptance of the updated policy.</P>
        </Section>

        <Section title="Contact">
          <P>For any privacy-related questions or requests: <a href="mailto:privacy@monkeymind.app" className="mm-link">privacy@monkeymind.app</a></P>
          <P>See also our <Link to="/terms" className="mm-link">Terms of Use &amp; Wellness Disclaimer</Link>.</P>
          <p className="doc-note">Note: This privacy policy is provided for informational purposes. You should consult a qualified legal professional before relying on it for compliance purposes.</p>
        </Section>

      </div>
    </div>
  );
}
