import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TbSparkles, TbWind, TbFeather, TbYoga, TbHeadphones, TbHourglass, TbBooks, TbHome, TbMenu2, TbX } from 'react-icons/tb';
import { requestSanctuary } from '../utils/sanctuaryJourney';

const NAV_ITEMS = [
  { path: '/',            label: 'Sanctuary',  Icon: TbSparkles,   action: 'sanctuary' },
  { path: '/resonance',   label: 'Breathe',    Icon: TbWind },
  { path: '/let-it-go',   label: 'Let It Go',  Icon: TbFeather },
  { path: '/meditate',    label: 'Meditate',   Icon: TbYoga },
  { path: '/soundscapes', label: 'Sounds',     Icon: TbHeadphones },
  { path: '/timer',       label: 'Focus',      Icon: TbHourglass },
  { path: '/books',       label: 'Library',    Icon: TbBooks },
];

/** Shared click behaviour: Sanctuary asks the home page to replay it */
function handleNavClick(e, item, after) {
  if (item.action === 'sanctuary') requestSanctuary();
  after?.();
}

export default function Navbar() {
  const location = useLocation();
  const path = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (p) => path === p;

  // Close drawer on navigation
  useEffect(() => { setMenuOpen(false); }, [path]);

  // Close drawer with Escape (outside clicks are handled by the backdrop)
  useEffect(() => {
    if (!menuOpen) return;
    const fn = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [menuOpen]);

  if (path === '/') return null;

  return (
    <>
      {/* Desktop: one floating glass bar */}
      <motion.nav
        className="mm-nav"
        aria-label="Main navigation"
        initial={{ opacity: 0, y: -12, x: '-50%' }}
        animate={{ opacity: 1, y: 0, x: '-50%' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link to="/" className="mm-nav__brand">
          <span className="mm-nav__flame" aria-hidden="true" />
          MonkeyMind
        </Link>
        <div className="mm-nav__links">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={(e) => handleNavClick(e, item)}
              className={`mm-nav__link ${isActive(item.path) ? 'is-active' : ''}`}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <Link to="/" className="mm-nav__home" title="Home" aria-label="Home">
          <TbHome size={18} />
        </Link>
      </motion.nav>

      {/* Mobile: slim pill with a menu button */}
      <div className="mm-mnav">
        <Link to="/" className="mm-nav__brand">
          <span className="mm-nav__flame" aria-hidden="true" />
          MonkeyMind
        </Link>
        <button
          className="mm-mnav__burger"
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <TbX size={20} /> : <TbMenu2 size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="mm-drawer-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              className="mm-drawer"
              aria-label="Menu"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            >
              <div className="mm-drawer__top">
                <span className="mm-drawer__title">Menu</span>
                <button className="mm-mnav__burger" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  <TbX size={20} />
                </button>
              </div>
              <div className="mm-drawer__links">
                {NAV_ITEMS.map((item, i) => (
                  <motion.div
                    key={item.path}
                    initial={{ x: 24, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      to={item.path}
                      onClick={(e) => handleNavClick(e, item, () => setMenuOpen(false))}
                      className={`mm-drawer__link ${isActive(item.path) ? 'is-active' : ''}`}
                      aria-current={isActive(item.path) ? 'page' : undefined}
                    >
                      <item.Icon size={20} aria-hidden="true" />
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mm-drawer__foot">
                <Link to="/" className="mm-btn" onClick={() => setMenuOpen(false)}>
                  <TbHome size={18} /> Home
                </Link>
                <div className="mm-drawer__small">
                  <Link to="/privacy" onClick={() => setMenuOpen(false)}>Privacy</Link>
                  <Link to="/terms" onClick={() => setMenuOpen(false)}>Terms</Link>
                </div>
                <a
                  className="mm-drawer__credit"
                  href="https://webgrid.studio/"
                  target="_blank"
                  rel="noopener"
                  aria-label="Powered by webgrid.studio (opens in a new tab)"
                >
                  Powered by
                  <img src="/webgrid-studio.svg" width="150" height="71" alt="" decoding="async" />
                </a>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
