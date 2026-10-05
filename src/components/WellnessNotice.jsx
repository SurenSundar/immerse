import { Link } from 'react-router-dom';

/** Always-visible relaxation / not-medical-advice line shown at the bottom of every page. */
export default function WellnessNotice() {
  return (
    <div className="wellness-notice" role="note">
      <span className="wellness-notice-long">MonkeyMind is for relaxation only. It is not medical advice and not a substitute for professional care.</span>
      <span className="wellness-notice-short">Relaxation only · Not medical advice</span>
      <Link to="/terms#wellness" className="wellness-notice-link">Learn more</Link>
    </div>
  );
}
