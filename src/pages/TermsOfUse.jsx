import { Link } from 'react-router-dom';

const P = ({ children, className = '' }) => <p className={`doc-p ${className}`}>{children}</p>;
const Strong = ({ children }) => <strong>{children}</strong>;

/** Collapsible section for the longer legal terms */
const Accordion = ({ title, children }) => (
  <details className="terms-accordion">
    <summary>{title}</summary>
    <div className="terms-accordion-body">{children}</div>
  </details>
);

export default function TermsOfUse() {
  return (
    <div className="mm-page mm-page--narrow">

      <header className="mm-page-header">
        <h1>Terms of Use</h1>
        <p className="doc-updated">Last updated: October 5, 2026</p>
      </header>

      {/* Wellness disclaimer: always open, never collapsed */}
      <section id="wellness" className="mm-panel doc-callout">
        <h2>Wellness Disclaimer</h2>
        <P><Strong>MonkeyMind is for relaxation only.</Strong> It is a wellness and relaxation tool. It does not provide medical advice, diagnosis or treatment, and it is not a substitute for care from a qualified professional.</P>
        <P>MonkeyMind is not a medical service. We are not doctors, therapists or healthcare providers, we have no medical expertise, and we are not affiliated with any medical organisation. Nothing on this site, including the sanctuary, breathing exercises, meditations, Let It Go, soundscapes or the library, should be taken as medical or psychological advice.</P>
        <P><Strong>Breathing exercises.</Strong> Breathe gently and never force your breath. If you feel dizzy, lightheaded, short of breath or unwell, stop and breathe normally. If you are pregnant or have a heart, lung or other medical condition, speak to a doctor before trying exercises that include breath-holds.</P>
        <P><Strong>If you are in crisis</Strong> or thinking about harming yourself, please contact your local emergency number or a crisis helpline right away. MonkeyMind cannot help in an emergency.</P>
      </section>

      <div className="doc-accordions">
        <Accordion title="1. Accepting these terms">
          <P>By using MonkeyMind (the website and apps) you agree to these Terms of Use and our <Link to="/privacy" className="mm-link">Privacy Policy</Link>. If you do not agree, please do not use MonkeyMind. You must be at least 13 years old to use it.</P>
        </Accordion>

        <Accordion title="2. Use at your own risk">
          <P>MonkeyMind is provided "as is" and "as available", without warranties of any kind. You choose whether and how to use the exercises, and you are responsible for listening to your body and stopping whenever something does not feel right.</P>
        </Accordion>

        <Accordion title="3. Limitation of liability">
          <P>To the fullest extent permitted by law, MonkeyMind and its creators are not liable for any injury, loss or damage, direct or indirect, arising from your use of, or inability to use, MonkeyMind or any content on it. Some jurisdictions do not allow certain limitations, so parts of this section may not apply to you.</P>
        </Accordion>

        <Accordion title="4. Affiliate links">
          <P>Some links in the Library are affiliate links. If you buy through them, we may earn a small commission at no extra cost to you. This does not change which books we feature.</P>
        </Accordion>

        <Accordion title="5. Content and ownership">
          <P>The MonkeyMind name, design, text, sounds and code belong to MonkeyMind. You may use the site for your own personal, non-commercial relaxation. Please do not copy or redistribute it without permission.</P>
        </Accordion>

        <Accordion title="6. Changes to these terms">
          <P>We may update these terms from time to time. The date at the top shows the latest version. Continuing to use MonkeyMind after a change means you accept the updated terms.</P>
        </Accordion>

        <Accordion title="7. Contact">
          <P>Questions about these terms: <a href="mailto:hello@monkeymind.app" className="mm-link">hello@monkeymind.app</a></P>
        </Accordion>
      </div>

      <p className="doc-note">Note: These terms are provided for informational purposes. You should consult a qualified legal professional before relying on them.</p>
    </div>
  );
}
