import { Link, useLocation } from 'react-router-dom';

/** Always-visible relaxation / not-medical-advice line and studio credit shown at the bottom of every page. */
export default function WellnessNotice() {
  // The Sanctuary journey comes first: keep the credit quiet there
  const isSanctuary = useLocation().pathname === '/';
  return (
    <div className="wellness-notice" role="note">
      <span className="wellness-notice-text">
        <span className="wellness-notice-long">MonkeyMind is for relaxation only. It is not medical advice and not a substitute for professional care.</span>
        <Link to="/terms#wellness" className="wellness-notice-link">
          <span className="wellness-notice-short">Not medical advice</span>
          <span className="wellness-notice-more">Learn more</span>
        </Link>
      </span>
      <PoweredByWebGrid className={isSanctuary ? 'is-subtle' : ''} />
    </div>
  );
}

/** "Powered by webgrid.studio" badge with the studio mark. */
export function PoweredByWebGrid({ className = '' }) {
  return (
    <a
      className={`webgrid-badge ${className}`.trim()}
      href="https://webgrid.studio/"
      target="_blank"
      rel="noopener"
      aria-label="Powered by webgrid.studio (opens in a new tab)"
    >
      <span className="webgrid-badge__by">Powered by</span>
      <img src="/webgrid-mark.svg" width="20" height="20" alt="" decoding="async" />
      <b>webgrid.studio</b>
    </a>
  );
}
