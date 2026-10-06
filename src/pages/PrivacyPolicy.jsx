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
        <p className="doc-updated">Last updated: October 6, 2026</p>
      </header>

      <div className="mm-panel doc-body">

        <Section title="The short version">
          <P>MonkeyMind has no visitor accounts, no sign-up and no tracking. We do not collect, store or sell your personal data. Everything you do here, including anything you write in Let It Go, stays in your own browser. The only thing our server stores is the Library&rsquo;s list of books, which we edit ourselves.</P>
        </Section>

        <Section title="What stays in your browser">
          <P><strong>Sanctuary progress.</strong> We remember, for the current visit only, whether you have already seen the Sanctuary, so it does not greet you again on every page. This uses your browser&rsquo;s session storage and is cleared when you close the tab.</P>
          <P><strong>Let It Go.</strong> What you type exists only on your screen while you use it. It is never saved or sent anywhere, and it is gone once it has been released.</P>
          <P><strong>Sound and session settings.</strong> Your chosen sounds, volumes and timers live in the page while you use it and are not stored.</P>
          <P>MonkeyMind does not set cookies for visitors. The private page we use to edit the Library sets a sign-in cookie, but only for us when we sign in.</P>
        </Section>

        <Section title="Third parties involved">
          <P><strong>Our web host (Hostinger).</strong> Like every website, the server that delivers MonkeyMind keeps standard technical logs, such as IP address, browser type and the pages requested, for security and reliability. These logs are managed by our hosting provider under its own privacy policy.</P>
          <P><strong>Google Fonts.</strong> Our typefaces are loaded from Google&rsquo;s font servers, which means your browser contacts Google and shares your IP address and browser details to download them.</P>
          <P><strong>Spoken guidance.</strong> The guided meditation and the Breathe voice guide use your device&rsquo;s built-in text-to-speech voices. Depending on your browser, some voices may be processed by your browser or operating system provider. Only our own guidance (such as the meditation script or breathing counts) is spoken, never anything you type.</P>
          <P><strong>Links to other sites.</strong> Library buttons take you to stores such as Amazon. Some are affiliate links (see our Terms), so when you follow one, the store may set its own cookies to credit the referral. That happens on the store&rsquo;s site, and once you leave MonkeyMind, that site&rsquo;s own privacy policy applies.</P>
        </Section>

        <Section title="Former Community accounts">
          <P>Earlier versions of MonkeyMind had a community forum with sign-up. That feature has been removed. If you created an account then and would like any remaining data deleted, email us from the address you used and we will remove it.</P>
        </Section>

        <Section title="Children">
          <P>MonkeyMind is not directed at children under 13 and does not knowingly collect data from anyone.</P>
        </Section>

        <Section title="Changes to this policy">
          <P>If how MonkeyMind works changes, we will update this page. The date at the top always shows the latest version.</P>
        </Section>

        <Section title="Contact">
          <P>Questions about privacy: <a href="mailto:privacy@monkeymind.online" className="mm-link">privacy@monkeymind.online</a></P>
          <P>See also our <Link to="/terms" className="mm-link">Terms of Use &amp; Wellness Disclaimer</Link>.</P>
          <p className="doc-note">Note: This privacy policy is provided for informational purposes. You should consult a qualified legal professional before relying on it for compliance purposes.</p>
        </Section>

      </div>
    </div>
  );
}
