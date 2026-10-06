import { ErrorBoundary } from './ErrorBoundary';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';

import UniverseBackground from './components/UniverseBackground';
import monkSvg from './assets/monk_5778234.svg?url';
import SoundDock from './components/SoundDock';
// Each tool page is its own chunk, so visitors only download what they open
// (the 3D engine is only needed by Focus and Breathe).
const FocusTimer = lazy(() => import('./components/FocusTimer'));
const Resonance = lazy(() => import('./components/Resonance'));
const Meditation = lazy(() => import('./components/Meditation'));
const LetItGo = lazy(() => import('./components/LetItGo'));
const Soundscapes = lazy(() => import('./components/Soundscapes'));
const Books = lazy(() => import('./pages/Books'));
const BookDetail = lazy(() => import('./pages/BookDetail'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const Admin = lazy(() => import('./pages/Admin'));
import WellnessNotice from './components/WellnessNotice';
import Navbar from './components/Navbar';
import MobileSanctuary from './components/MobileSanctuary';
import { HOME_TOOLS } from './utils/homeTools';
import { TbVolume, TbVolumeOff } from 'react-icons/tb';
import { CALMING_TEXTS, PENTATONIC, lightScale, skyOpacity, shouldShowSanctuary, markSanctuaryDone, requestSanctuary } from './utils/sanctuaryJourney';

import { getAudioContext, playZenChime, playSingingBowl, playCardHover, isGlobalMuted, setGlobalMute } from './utils/zenAudio';
import { updateMetaTags } from './utils/meta';

/** Keeps the page title and social/SEO meta tags in sync with the route */
function usePageMeta() {
  const location = useLocation();
  useEffect(() => {
    const titleMap = {
      '/': "MonkeyMind - Premium Meditation, Mindfulness & Heartfulness Sanctuary",
      '/timer': "Zen Focus Session | MonkeyMind",
      '/resonance': "Resonance Breathing Session | MonkeyMind",
      '/books': "The Sanctuary Library | MonkeyMind Books",
      '/meditate': "Guided Meditation | MonkeyMind",
      '/let-it-go': "Let It Go | MonkeyMind",
      '/soundscapes': "Soundscapes | MonkeyMind",
      '/privacy': "Privacy Policy | MonkeyMind",
      '/terms': "Terms of Use & Wellness Disclaimer | MonkeyMind",
      '/admin': "Library admin | MonkeyMind",
    };

    const descriptionMap = {
      '/': "Quiet the restless monkey mind. Discover MonkeyMind, a calm, immersive digital sanctuary. Practice guided breathing, let go of worries, meditate, and listen to soothing soundscapes.",
      '/timer': "Boost your productivity with our Pomodoro Zen Focus Timer. Customize ambient soundscapes like forest rivers and singing bowls to stay in deep focus.",
      '/resonance': "Relax with slow, guided breathing. Practice box breathing, 4-7-8 and resonance patterns with gentle zen chimes.",
      '/books': "Explore the Library: hand-picked books and audiobooks on meditation, mindfulness and calm.",
      '/meditate': "A gentle voice-guided meditation with a breathing guide and your choice of calming background sounds.",
      '/let-it-go': "Write down what is weighing on you and watch the words drift away. Nothing is saved or sent anywhere.",
      '/soundscapes': "Blend calming ambient sounds: rain, ocean waves, wind, a flowing stream, a warm drone and singing bowls, with a fade-out timer.",
      '/terms': "MonkeyMind is a relaxation tool, not medical advice. Read our terms of use and wellness disclaimer.",
      '/privacy': "MonkeyMind has no visitor accounts and no tracking. Read what stays in your browser and which third parties are involved."
    };
    
    // Book pages set their own title, description and share image
    if (location.pathname.startsWith('/books/')) return;

    // Update all head elements for SEO / Social Cards
    {
      const title = titleMap[location.pathname] || "MonkeyMind - Premium Meditation Sanctuary";
      const desc = descriptionMap[location.pathname] || "Quiet your restless mind with MonkeyMind's breathing exercises, focus timers, and bookstore.";
      updateMetaTags(title, desc, location.pathname);
    }

  }, [location.pathname]);
}

// -- Components --

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="page-wrapper"
    >
      {children}
    </motion.div>
  );
}

/** matchMedia hook that reads the real value on first render (no desktop->mobile flash) */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
}

// -- Pages --


function MonkeyMindGame({ onComplete }) {
  const [step, setStep] = useState(0); // index into CALMING_TEXTS
  const [phase, setPhase] = useState('seeking'); // 'seeking' | 'reading'
  const [pos, setPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [alignment, setAlignment] = useState('center');
  const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  const moveLight = () => {
    // Dynamic safe margins so light never spawns too close to the edges
    const marginX = window.innerWidth * 0.15; 
    const marginYTop = window.innerHeight * 0.15;
    const marginYBottom = window.innerHeight * 0.45; // Leave almost half the screen at the bottom for the card
    
    const safeWidth = window.innerWidth - (marginX * 2);
    const safeHeight = window.innerHeight - marginYTop - marginYBottom;
    
    // Ensure we always have at least a tiny safe area
    const x = marginX + (Math.random() * Math.max(10, safeWidth));
    const y = marginYTop + (Math.random() * Math.max(10, safeHeight));
    
    if (x < window.innerWidth / 3) {
      setAlignment('left');
    } else if (x > (window.innerWidth * 2) / 3) {
      setAlignment('right');
    } else {
      setAlignment('center');
    }
    
    setPos({ x, y });
  };


  useEffect(() => {
    moveLight();
    
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    // Esc skips the sanctuary at any point
    const handleKey = (e) => { if (e.key === 'Escape') onComplete(); };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onComplete]);

  const handleLightClick = () => {
    if (phase !== 'seeking') return;

    // Play climbing pentatonic chime
    getAudioContext();
    playZenChime(PENTATONIC[step % PENTATONIC.length], 1.8, 0.45);
    setPhase('reading');
  };

  const handleNextClick = () => {
    if (step + 1 >= CALMING_TEXTS.length) {
      onComplete();
      return;
    }
    setStep(s => s + 1);
    // Play a soft high-pitched transition chime
    playZenChime(523.25, 0.8, 0.15); // C5 chime
    setPhase('seeking');
    moveLight();
  };

  const scale = lightScale(step);
  const lightRadius = (12 * scale) / 2;

  const containerStyle = {};

  // Vertical placement: dynamically check if placing below would overflow
  if (pos.y + lightRadius + 350 > window.innerHeight) {
    // Too close to bottom, flip it ABOVE the light
    containerStyle.bottom = `${window.innerHeight - pos.y + lightRadius + 40}px`;
  } else {
    // Safe to place BELOW the light
    containerStyle.top = `${pos.y + lightRadius + 40}px`;
  }

  // Horizontal placement constraints
  if (alignment === 'left') {
    const safeLeft = Math.max(20, Math.min(pos.x, window.innerWidth - 440));
    containerStyle.left = `${safeLeft}px`;
    containerStyle.alignItems = 'flex-start';
    containerStyle.textAlign = 'left';
  } else if (alignment === 'right') {
    const safeRight = Math.max(20, Math.min(window.innerWidth - pos.x, window.innerWidth - 440));
    containerStyle.right = `${safeRight}px`;
    containerStyle.alignItems = 'flex-end';
    containerStyle.textAlign = 'right';
  } else {
    // Keep center aligned but clamp it to viewport using CSS max-width and min/max transforms if needed
    // The CSS max-width: 85vw keeps it from overflowing the screen horizontally
    containerStyle.left = `${pos.x}px`;
    containerStyle.transform = 'translateX(-50%)';
    containerStyle.alignItems = 'center';
    containerStyle.textAlign = 'center';
  }

  return (
    <div className="monkey-game-root">
      {/* The night sky fades in 1/30 per moment, reaching full strength at moment 31 */}
      <div className="sanctuary-sky" style={{ opacity: skyOpacity(step) }}>
        <UniverseBackground />
      </div>
      <div className="ambient-glow" style={{ 
        left: `${pos.x}px`, 
        top: `${pos.y}px`,
        transform: `translate(-50%, -50%) scale(${scale * 0.8 + 0.2})`
      }} />
      
      <div className="cursor-glow" style={{
         left: `${mousePos.x}px`,
         top: `${mousePos.y}px`
      }} />

      <div className={`creative-instruction-container ${phase === 'reading' ? 'fade-out' : ''}`}>
        <div className="typewriter-text">
          {"FOLLOW THE LIGHT".split('').map((char, i) => (
            <span key={i} className="typewriter-char" style={{ animationDelay: `${i * 0.1}s` }}>
              {char === ' ' ? ' ' : char}
            </span>
          ))}
        </div>
        <div className="pulse-instruction">CLICK THE SPARK TO BEGIN</div>
      </div>

      <button className="sanctuary-skip-btn" onClick={() => onComplete()} title="Skip (Esc)">
        Skip
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>

      <button
        className={`monkey-light ${phase === 'reading' ? 'reading-mode' : ''}`}
        style={{ 
          left: `${pos.x}px`, 
          top: `${pos.y}px`,
          transform: `translate(-50%, -50%) scale(${scale})`
        }}
        onClick={handleLightClick}
        aria-label="Find the light"
      />

      {phase === 'reading' && (
        <div className="monkey-reading-container" style={containerStyle} key={step}>
          <div className="reading-card-header">
            <span className="mindful-counter">MOMENT {String(step + 1).padStart(2, '0')}</span>
            <span className="decor-line"></span>
          </div>
          <p className="calming-text">{CALMING_TEXTS[step]}</p>
          <button className="monkey-next-btn" onClick={handleNextClick} autoFocus>
            <span className="btn-text">Continue</span>
            <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function MobileBentoSlider({ onRevisit }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef(null);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDragged = useRef(false);

  const bentoItems = HOME_TOOLS;

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollLeftVal = containerRef.current.scrollLeft;
    const cardElement = containerRef.current.querySelector('.mobile-bento-card');
    if (!cardElement) return;
    const cardWidth = cardElement.offsetWidth;
    const gap = 20; // Matches CSS gap
    const index = Math.round(scrollLeftVal / (cardWidth + gap));
    setActiveIdx(Math.max(0, Math.min(bentoItems.length - 1, index)));
  };

  const handleDotClick = (idx) => {
    if (containerRef.current) {
      const cardElement = containerRef.current.querySelector('.mobile-bento-card');
      if (!cardElement) return;
      const cardWidth = cardElement.offsetWidth;
      const gap = 20;
      containerRef.current.scrollTo({
        left: idx * (cardWidth + gap),
        behavior: 'smooth'
      });
      setActiveIdx(idx);
    }
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeft.current = containerRef.current.scrollLeft;
    hasDragged.current = false;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    // Small timeout to let click listener fire and check hasDragged
    setTimeout(() => {
      isDragging.current = false;
    }, 50);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 8) {
      hasDragged.current = true;
    }
    containerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleCardClick = (e, path, action) => {
    if (hasDragged.current) {
      e.preventDefault();
      return;
    }
    if (action === 'sanctuary') {
      e.preventDefault();
      onRevisit();
    }
  };

  return (
    <div className="mobile-bento-slider-wrapper">
      <div 
        className="mobile-bento-track"
        ref={containerRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {bentoItems.map((item, idx) => {
          const isAction = !!item.action;
          const CardComponent = isAction ? 'div' : Link;
          const cardProps = isAction 
            ? { role: 'button', tabIndex: 0, onClick: (e) => handleCardClick(e, null, item.action), onKeyDown: (e) => { if (e.key === 'Enter') handleCardClick(e, null, item.action); } }
            : { to: item.path, onClick: (e) => handleCardClick(e, item.path, null) };

          const isActive = activeIdx === idx;

          return (
            <CardComponent
              key={item.id}
              {...cardProps}
              className={`mobile-bento-card ${isActive ? 'mobile-bento-card--active' : ''}`}
              style={{
                borderColor: isActive ? item.color : 'rgba(255, 255, 255, 0.08)',
                boxShadow: isActive 
                  ? `0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px ${item.color}35, inset 0 0 20px ${item.color}15` 
                  : '0 8px 30px rgba(0, 0, 0, 0.4)'
              }}
            >
              {/* Dynamic colorful radial glow inside the card */}
              <div 
                className="card-ambient-glow" 
                style={{
                  position: 'absolute',
                  top: '-25%',
                  right: '-25%',
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${item.color}28 0%, transparent 70%)`,
                  filter: 'blur(35px)',
                  pointerEvents: 'none',
                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isActive ? 'scale(1.35)' : 'scale(1)',
                  opacity: isActive ? 0.95 : 0.45
                }} 
              />

              {/* Card Top: Circular glass badge & Slide count */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', zIndex: 2 }}>
                <span className="card-icon" style={{ 
                  color: item.color, 
                  background: isActive ? `${item.color}18` : 'rgba(255, 255, 255, 0.03)',
                  padding: '14px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${isActive ? `${item.color}45` : 'rgba(255, 255, 255, 0.06)'}`,
                  boxShadow: isActive ? `0 0 20px ${item.color}35` : 'none',
                  transition: 'all 0.5s ease'
                }}>
                  <item.Icon size={40} />
                </span>
                <span style={{ 
                  fontFamily: 'JetBrains Mono, monospace', 
                  fontSize: '0.72rem', 
                  fontWeight: 800, 
                  color: isActive ? item.color : 'rgba(255,255,255,0.25)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.5s ease'
                }}>
                  {item.id} / {String(bentoItems.length).padStart(2, '0')}
                </span>
              </div>

              {/* Card Middle: Tagline + Title + Desc */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left', marginTop: '1.8rem', flexGrow: 1, zIndex: 2 }}>
                <span style={{ 
                  fontSize: '0.68rem', 
                  fontWeight: 800, 
                  color: item.color, 
                  letterSpacing: '1.5px', 
                  textTransform: 'uppercase',
                  opacity: isActive ? 0.95 : 0.5,
                  transition: 'all 0.5s ease'
                }}>
                  {item.tag}
                </span>
                <h3 style={{ 
                  margin: '0', 
                  fontSize: 'clamp(1.4rem, 6.2vw, 1.8rem)', 
                  fontWeight: 900, 
                  color: '#fff',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.15
                }}>
                  {item.title}
                </h3>
                <p style={{ 
                  margin: '0.2rem 0 0 0', 
                  fontSize: '0.82rem', 
                  color: isActive ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.45)',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  transition: 'color 0.5s ease'
                }}>
                  {item.desc}
                </p>
              </div>

              {/* Card Bottom: Full-Width App Button */}
              <div style={{ width: '100%', marginTop: '1.8rem', zIndex: 2 }}>
                <div style={{
                  width: '100%',
                  background: isActive ? `linear-gradient(135deg, ${item.color}25 0%, ${item.color}10 100%)` : 'rgba(255, 255, 255, 0.02)',
                  border: isActive ? `1px solid ${item.color}55` : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '18px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.35)',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  boxShadow: isActive ? `0 8px 25px ${item.color}15` : 'none',
                  transition: 'all 0.5s ease',
                  boxSizing: 'border-box'
                }}>
                  <span>{item.cta}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: isActive ? 'translateX(3px)' : 'translateX(0px)', transition: 'transform 0.3s' }}>
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </CardComponent>
          );
        })}

        {/* Padding spacer to center the last card */}
        <div style={{ flex: '0 0 11vw', scrollSnapAlign: 'none' }} />
      </div>

      {/* Swipe Indicator Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '-0.5rem', marginBottom: '2rem' }}>
        {bentoItems.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => handleDotClick(idx)}
            style={{
              width: activeIdx === idx ? '20px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: activeIdx === idx ? item.color : 'rgba(255,255,255,0.2)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function MonkeyMindHero({ onRevisit }) {
  const word = "MONKEYMIND".split("");
  const containerRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Play the deep singing bowl when the Hero section mounts (after game completes or on reload)
  useEffect(() => {
    // slight delay so it aligns with the animation start
    const timer = setTimeout(() => {
      playSingingBowl(146.83, 6.0, 0.8); // D3 singing bowl
    }, 800);
    return () => clearTimeout(timer);
  }, []);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Fade out the initial welcome text and the giant MONKEYMIND word much faster
  const textOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  
  // Cut the Monk's max scale to match a 30% footprint and adjust X so it's centered in the left third
  const monkScale = useTransform(scrollYProgress, [0, 0.6], [1, 5]);
  // We want to translate the monk less so it stays visible in the left 30% instead of shifting entirely off-screen
  const monkX = useTransform(scrollYProgress, [0, 0.6], ["0vw", "-10vw"]);
  const monkY = useTransform(scrollYProgress, [0, 0.6], ["0vh", "5vh"]);
  
  const bentoOpacity = useTransform(scrollYProgress, [0.4, 0.8], [0, 1]);
  const bentoY = useTransform(scrollYProgress, [0.4, 0.8], ["50px", "0px"]);
  const bentoPointer = useTransform(scrollYProgress, v => v > 0.5 ? 'auto' : 'none');

  return (
    <div ref={containerRef} style={isMobile ? { height: 'auto', position: 'relative', width: '100%' } : { height: '300vh', position: 'relative', width: '100%' }}>
      <div className="monkey-hero-root" style={isMobile ? { position: 'relative', height: 'auto', minHeight: '100vh', overflow: 'visible', padding: '120px 20px 60px' } : { position: 'fixed', top: 0, left: 0, right: 0, height: '100vh', overflow: 'hidden' }}>
        <div className="hero-ambient-bg"></div>
        <button className="hero-revisit-btn" onClick={onRevisit} title="Take a quiet moment">
          <span className="hero-revisit-dot" />Revisit sanctuary
        </button>
        {!isMobile && (
          <motion.div className="hero-scroll-hint" style={{ opacity: textOpacity }} aria-hidden="true">
            Scroll to explore
            <span className="hero-scroll-line" />
          </motion.div>
        )}
        
        <section className="hero" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="hero-inner" style={{ width: '100%' }}>
            
            {/* Wrapped the welcome message in the textOpacity so it hides on scroll */}
            <motion.div style={{ opacity: textOpacity }}>
              <div className="welcome-message">
                <span className="welcome-text">Breathe. Align.</span>
                <h2 className="welcome-sub">Welcome to your sanctuary of focus.</h2>
              </div>
            </motion.div>

            <h1 className="hero-title water-title">
              {word.map((char, i) => {
                const outlineDelay = i * 0.3; 
                const fillDelay = 2.5 + (i * 0.2); 

                if (char === 'O') {
                  return (
                    <span key={i} className="water-letter letter-o">
                      {/* The circle outline also fades out on scroll */}
                      <motion.span style={{ opacity: textOpacity, position: 'absolute', inset: 0 }}>
                        <span className="line-to-o-container">
                          <span className="line-to-o" style={{ animationDelay: `${outlineDelay}s` }}></span>
                        </span>
                      </motion.span>
                      
                      {/* The Monk wrapper itself DOES NOT fade out, so he persists */}
                      <span className="monk-wrapper" style={{ animationDelay: `${outlineDelay + 2.5}s` }}>
                        <motion.div 
                          style={isMobile ? { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } : { scale: monkScale, x: monkX, y: monkY, transformOrigin: 'center center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <img src={monkSvg} className="monk-svg" alt="Zen monk meditating in lotus position - MonkeyMind sanctuary logo" />
                        </motion.div>
                      </span>
                    </span>
                  );
                }

                return (
                  <span key={i} className="water-letter">
                    <motion.span style={{ opacity: textOpacity }}>
                      <span className="water-letter-outline" style={{ animationDelay: `${outlineDelay}s` }}>{char}</span>
                    </motion.span>
                    <motion.span style={{ opacity: textOpacity, position: 'absolute', inset: 0 }}>
                      <span className="water-letter-fill" style={{ animationDelay: `${fillDelay}s` }}>{char}</span>
                    </motion.span>
                  </span>
                );
              })}
            </h1>

            <motion.div 
              className="bento-grid-container"
              style={isMobile ? { opacity: 1, pointerEvents: 'auto', position: 'relative', width: '100%', height: 'auto', margin: '2rem auto 0', display: 'block' } : { opacity: bentoOpacity, y: bentoY, pointerEvents: bentoPointer }}
            >
              {isMobile ? (
                <MobileBentoSlider onRevisit={onRevisit} />
              ) : (
                <div className="bento-grid">
                  {[[0, 1], [2, 3, 4], [5, 6]].map((row, r) => (
                    <div key={r} className={`bento-row row-${r + 1}`}>
                      {row.map(i => {
                        const item = HOME_TOOLS[i];
                        const inner = (
                          <>
                            <div className="card-texture"></div>
                            <span className="card-icon"><item.Icon size={36} /></span>
                            <span className="card-bg-number">{item.id}</span>
                            <div className="card-content">
                              <h3>{item.title}</h3>
                              <p>{item.short}</p>
                            </div>
                          </>
                        );
                        const cls = `bento-card card-${i + 1}`;
                        if (item.action) {
                          const run = () => onRevisit();
                          return (
                            <div key={item.id} className={cls} role="button" tabIndex={0} style={{ cursor: 'pointer' }}
                              onMouseEnter={() => playCardHover(i)} onClick={run}
                              onKeyDown={(e) => { if (e.key === 'Enter') run(); }}>
                              {inner}
                            </div>
                          );
                        }
                        return (
                          <Link key={item.id} className={cls} to={item.path} onMouseEnter={() => playCardHover(i)}>
                            {inner}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

          </div>
        </section>
      </div>

    </div>
  );
}


function WebappHome() {
  const isPhone = useMediaQuery('(max-width: 450px)');
  const [showSanctuary, setShowSanctuary] = useState(shouldShowSanctuary);

  const finishSanctuary = useCallback(() => {
    markSanctuaryDone();
    setShowSanctuary(false);
    window.scrollTo(0, 0);
  }, []);

  const revisit = () => {
    requestSanctuary();
    setShowSanctuary(true);
  };

  if (isPhone) {
    return (
      <ErrorBoundary>
        <MobileSanctuary showGame={showSanctuary} onComplete={finishSanctuary} onRevisit={revisit} />
      </ErrorBoundary>
    );
  }

  if (showSanctuary) {
    return <MonkeyMindGame onComplete={finishSanctuary} />;
  }

  return <ErrorBoundary><MonkeyMindHero onRevisit={revisit} /></ErrorBoundary>;
}

function HomePage() {
  useEffect(() => {
    document.title = "MonkeyMind - Premium Meditation, Mindfulness & Heartfulness Sanctuary";
  }, []);
  return <WebappHome />;
}

function TimerPage() {
  useEffect(() => {
    document.title = "Zen Focus Session | MonkeyMind";
  }, []);
  return (
    <div className="mm-scope" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20 }}>
      <Suspense fallback={null}><FocusTimer /></Suspense>
    </div>
  )
}

function ResonancePage() {
  useEffect(() => {
    document.title = "Resonance Breathing Session | MonkeyMind";
  }, []);
  return (
    <div className="mm-scope" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20 }}>
      <Suspense fallback={null}><Resonance /></Suspense>
    </div>
  )
}

function MeditationPage() { return <div className="mm-scope" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, overflowY: 'auto', paddingBottom: 'var(--notice-h)', boxSizing: 'border-box' }}><Suspense fallback={null}><Meditation /></Suspense></div>; }
function LetItGoPage()    { return <div className="mm-scope" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, overflowY: 'auto', paddingBottom: 'var(--notice-h)', boxSizing: 'border-box' }}><Suspense fallback={null}><LetItGo /></Suspense></div>; }
function SoundscapesPage() { return <div className="mm-scope" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, overflowY: 'auto', paddingBottom: 'var(--notice-h)', boxSizing: 'border-box' }}><Suspense fallback={null}><Soundscapes /></Suspense></div>; }

function TermsPage()     { return <div className="mm-scope" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, overflowY: 'auto', paddingBottom: 'var(--notice-h)', boxSizing: 'border-box' }}><Suspense fallback={null}><TermsOfUse /></Suspense></div>; }
function PrivacyPage()   { return <div className="mm-scope" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, overflowY: 'auto', paddingBottom: 'var(--notice-h)', boxSizing: 'border-box' }}><Suspense fallback={null}><PrivacyPolicy /></Suspense></div>; }
function BooksPage()     { return <div className="mm-scope" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, overflowY: 'auto', paddingBottom: 'var(--notice-h)', boxSizing: 'border-box' }}><Suspense fallback={null}><Books /></Suspense></div>; }

function BookDetailPage() { return <div className="mm-scope" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, overflowY: 'auto', paddingBottom: 'var(--notice-h)', boxSizing: 'border-box' }}><Suspense fallback={null}><BookDetail /></Suspense></div>; }

function AdminPage()     { return <div className="mm-scope" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, overflowY: 'auto', paddingBottom: 'var(--notice-h)', boxSizing: 'border-box' }}><Suspense fallback={null}><Admin /></Suspense></div>; }

function NotFoundPage() {
  return (
    <div className="not-found-page mm-scope">
      <p className="not-found-code">404</p>
      <h1>This path leads nowhere</h1>
      <p>The page you were looking for has drifted away, like a passing thought.</p>
      <Link to="/" className="not-found-link">Return home</Link>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  usePageMeta();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/timer" element={<PageTransition><TimerPage /></PageTransition>} />
        <Route path="/resonance" element={<PageTransition><ResonancePage /></PageTransition>} />
        <Route path="/meditate" element={<PageTransition><MeditationPage /></PageTransition>} />
        <Route path="/let-it-go" element={<PageTransition><LetItGoPage /></PageTransition>} />
        <Route path="/soundscapes" element={<PageTransition><SoundscapesPage /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
        <Route path="/books" element={<PageTransition><BooksPage /></PageTransition>} />
        <Route path="/books/:id" element={<PageTransition><BookDetailPage /></PageTransition>} />
        <Route path="/admin" element={<AdminPage />} />
        {/* Removed sections: send old links home instead of a dead end */}
        {['/about', '/about-us', '/community', '/blog', '/blog/*', '/zen-garden'].map(p => (
          <Route key={p} path={p} element={<Navigate to="/" replace />} />
        ))}
        <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function AppRouter({ children }) {
  const isCapacitor = 
    !!window.Capacitor || 
    window.location.protocol === 'capacitor:' || 
    (window.location.hostname === 'localhost' && window.location.port === '');

  if (isCapacitor) {
    return <HashRouter>{children}</HashRouter>;
  }
  return <BrowserRouter>{children}</BrowserRouter>;
}

export default function App() {
  return (
    <AppRouter>
      <AppLayout />
    </AppRouter>
  );
}

function GlobalMuteButton() {
  const [isMuted, setIsMuted] = useState(() => isGlobalMuted());

  const handleToggle = () => {
    const nextMute = !isMuted;
    setGlobalMute(nextMute);
    setIsMuted(nextMute);
  };

  return (
    <button
      onClick={handleToggle}
      className={`mm-mute ${isMuted ? 'is-muted' : ''}`}
      aria-label={isMuted ? 'Unmute site sound' : 'Mute site sound'}
      aria-pressed={isMuted}
      title={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? <TbVolumeOff size={19} /> : <TbVolume size={19} />}
    </button>
  );
}

function AppLayout() {
  const location = useLocation();
  const hideBackground = location.pathname === '/';
  // The shared Sounds button sits on every tool page (Soundscapes is the full mixer itself)
  const showSoundDock = ['/resonance', '/let-it-go', '/meditate', '/timer'].includes(location.pathname);

  return (
    <div className="mm-app-bg" style={{ position: 'relative', width: '100%', minHeight: '100vh', height: 'auto' }}>
      <GlobalMuteButton />
      <Navbar />
      {!hideBackground && (
        <UniverseBackground />
      )}

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', height: 'auto' }}>
        <AnimatedRoutes />
      </div>

      {showSoundDock && <SoundDock />}
      <WellnessNotice />
    </div>
  );
}
