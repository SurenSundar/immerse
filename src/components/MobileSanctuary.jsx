import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { HOME_TOOLS } from '../utils/homeTools';
import { playSingingBowl, playZenChime, playCardHover } from '../utils/zenAudio';
import { CALMING_TEXTS, PENTATONIC, lightScale, skyOpacity } from '../utils/sanctuaryJourney';
import UniverseBackground from './UniverseBackground';
import './MobileSanctuary.css';

export default function MobileSanctuary({ showGame, onComplete, onRevisit }) {
  // Patience game ("Follow the light") — same flow as desktop
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('seeking'); // 'seeking' | 'reading'
  const [pos, setPos] = useState({ x: 180, y: 250 });

  const [activeCardIdx, setActiveCardIdx] = useState(0);

  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDragged = useRef(false);

  const bentoItems = HOME_TOOLS;

  // Helper to place spark in a safe viewport container that is easy to tap
  const moveLight = () => {
    const minX = 50;
    const maxX = window.innerWidth - 50;
    const minY = 120;
    const maxY = window.innerHeight * 0.5; // Avoid bottom cards overlap

    const x = Math.max(minX, Math.min(maxX, minX + Math.random() * (maxX - minX)));
    const y = Math.max(minY, Math.min(maxY, minY + Math.random() * (maxY - minY)));
    setPos({ x, y });
  };

  // Restart from the first moment whenever the game is shown
  useEffect(() => {
    if (showGame) {
      setStep(0);
      setPhase('seeking');
      moveLight();
    }
  }, [showGame]);

  // Handle Spark tap
  const handleSparkClick = () => {
    if (phase !== 'seeking') return;
    try {
      playZenChime(PENTATONIC[step % PENTATONIC.length], 1.8, 0.45);
    } catch (e) {
      console.warn("Audio chime failed in Safari:", e);
    }
    setPhase('reading');
  };

  // Handle Bottom Sheet Continue click
  const handleContinueClick = () => {
    if (step + 1 >= CALMING_TEXTS.length) {
      onComplete();
      return;
    }
    setStep(step + 1);
    try {
      playZenChime(523.25, 0.8, 0.15); // C5 transition chime
    } catch (e) {
      console.warn("Transition chime failed:", e);
    }
    setPhase('seeking');
    moveLight();
  };

  // Play the initial zen bowl when the home view is loaded
  useEffect(() => {
    if (showGame) return;
    const timer = setTimeout(() => {
      try {
        playSingingBowl(146.83, 5.0, 0.7);
      } catch (e) {
        console.warn("Singing bowl failed to play on mount:", e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [showGame]);

  // Scroll Tracker
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollLeftVal = containerRef.current.scrollLeft;
    const cardElement = containerRef.current.querySelector('.ms-card');
    if (!cardElement) return;
    const cardWidth = cardElement.offsetWidth;
    const gap = 20; // Matches css gap
    const index = Math.round(scrollLeftVal / (cardWidth + gap));
    const finalIdx = Math.max(0, Math.min(bentoItems.length - 1, index));
    if (finalIdx !== activeCardIdx) {
      setActiveCardIdx(finalIdx);
      try {
        playCardHover(finalIdx);
      } catch (e) {
        // Suppress audio play failures on scrolling
      }
    }
  };

  const handleDotClick = (idx) => {
    if (containerRef.current) {
      const cardElement = containerRef.current.querySelector('.ms-card');
      if (!cardElement) return;
      const cardWidth = cardElement.offsetWidth;
      const gap = 20;
      containerRef.current.scrollTo({
        left: idx * (cardWidth + gap),
        behavior: 'smooth'
      });
      setActiveCardIdx(idx);
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

  if (showGame) {
    const scale = lightScale(step);

    return (
      <div className="mobile-sanctuary-root">
        {/* The night sky fades in 1/30 per moment, reaching full strength at moment 31 */}
        <div className="sanctuary-sky" style={{ opacity: skyOpacity(step) }}>
          <UniverseBackground />
        </div>
        <div className="ms-bg-glow ms-bg-glow-1" />
        <div className="ms-bg-glow ms-bg-glow-2" />

        <div className="ms-game-container">
          <button className="sanctuary-skip-btn" onClick={() => onComplete()} style={{ top: '1rem', right: '1rem' }}>
            Skip
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>

          <div className="ms-game-header">
            <div className="ms-game-brand">MonkeyMind</div>
            <div className="ms-game-title">Quiet the chattering mind</div>
          </div>

          {/* Dynamic ambient glow following the spark, scaling up like desktop */}
          <div 
            className="ms-game-ambient-glow" 
            style={{ 
              left: `${pos.x}px`, 
              top: `${pos.y}px`,
              transform: `translate(-50%, -50%) scale(${scale * 0.8 + 0.2})`
            }} 
          />

          {/* Floating Spark Node */}
          <button 
            className={`ms-game-light ${phase === 'reading' ? 'ms-game-light-reading' : ''}`}
            onClick={handleSparkClick}
            style={{
              position: 'absolute',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transition: 'left 0.4s ease-out, top 0.4s ease-out, transform 0.4s ease-out'
            }}
            aria-label="Tap the spark"
          />

          <div className={`ms-game-prompt-container ${phase === 'reading' ? 'fade-out' : ''}`}>
            <div className="ms-typewriter-text">
              {"FOLLOW THE LIGHT".split('').map((char, i) => (
                <span key={i} className="ms-typewriter-char" style={{ animationDelay: `${i * 0.1}s` }}>
                  {char === ' ' ? ' ' : char}
                </span>
              ))}
            </div>
            <div className="ms-pulse-instruction">TAP THE SPARK TO BEGIN</div>
          </div>

          {/* Bottom Card Calming Sheet */}
          <AnimatePresence>
            {phase === 'reading' && (
              <motion.div 
                key={step}
                className="ms-game-reading-card"
                initial={{ x: "-50%", y: 150, opacity: 0 }}
                animate={{ x: "-50%", y: 0, opacity: 1 }}
                exit={{ x: "-50%", y: 150, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
                  <span className="ms-card-index" style={{ color: '#00ff9d' }}>MOMENT {String(step + 1).padStart(2, '0')}</span>
                  <span style={{ height: '1px', background: 'rgba(255,255,255,0.08)', flexGrow: 1, marginLeft: '1rem' }}></span>
                </div>
                <p className="ms-calming-text">{CALMING_TEXTS[step]}</p>
                <button className="ms-next-btn" onClick={handleContinueClick}>
                  <span>Continue</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Home Screen View
  return (
    <div className="mobile-sanctuary-root ms-is-home">
      {/* Background Nebulas */}
      <div className="ms-bg-glow ms-bg-glow-1" style={{ background: `radial-gradient(circle, ${bentoItems[activeCardIdx].color}20 0%, transparent 70%)` }} />
      <div className="ms-bg-glow ms-bg-glow-2" />

      <div className="ms-home-container">
        {/* Compact Header */}
        <div className="ms-home-header">
          <div className="ms-home-brand-wrapper">
            <div className="ms-home-logo-circle">
              <div className="ms-home-logo-dot" style={{ backgroundColor: bentoItems[activeCardIdx].color, boxShadow: `0 0 10px ${bentoItems[activeCardIdx].color}` }} />
            </div>
            <div className="ms-home-brand-text">MonkeyMind</div>
          </div>
          <button 
            onClick={onRevisit}
            className="ms-sanctuary-mode-btn"
            aria-label="Revisit the sanctuary check-in"
          >
            Revisit sanctuary
          </button>
        </div>

        {/* Welcome message */}
        <div className="ms-home-welcome">
          <h2 className="ms-home-welcome-title">Breathe. Align.</h2>
          <p className="ms-home-welcome-subtitle">Swipe to explore your mental sanctuary.</p>
        </div>

        {/* Flex Scroll Swiper (Active Card Highlighted) */}
        <div className="ms-carousel-wrapper">
          {/* Active Center Card Backdrop Glow */}
          <div 
            className="ms-active-halo" 
            style={{ 
              background: `radial-gradient(circle, ${bentoItems[activeCardIdx].color}40 0%, transparent 70%)`,
              boxShadow: `0 0 80px ${bentoItems[activeCardIdx].color}15`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '280px',
              height: '390px'
            }} 
          />

          <div 
            className="ms-carousel-track-scroll"
            ref={containerRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            {bentoItems.map((item, idx) => {
              const isActive = idx === activeCardIdx;

              const isAction = !!item.action;
              const CardComponent = isAction ? 'div' : Link;
              const cardProps = isAction 
                ? { role: 'button', tabIndex: 0, onClick: (e) => handleCardClick(e, null, item.action), onKeyDown: (e) => { if (e.key === 'Enter') handleCardClick(e, null, item.action); } }
                : { to: item.path, onClick: (e) => handleCardClick(e, item.path, null) };

              return (
                <CardComponent
                  key={item.id}
                  {...cardProps}
                  className={`ms-card ${isActive ? 'ms-card-active' : 'ms-card-inactive'}`}
                  style={{
                    borderColor: isActive ? item.color : 'rgba(255, 255, 255, 0.06)',
                    boxShadow: isActive 
                      ? `0 20px 50px rgba(0, 0, 0, 0.75), 0 0 35px ${item.color}30, inset 0 0 20px ${item.color}15` 
                      : '0 8px 30px rgba(0, 0, 0, 0.45)',
                    transform: isActive ? 'scale(1.04) translateY(-6px)' : 'scale(0.92)',
                    opacity: isActive ? 1 : 0.48
                  }}
                >
                  {/* Dynamic internal top glow */}
                  <div 
                    className="ms-card-glow" 
                    style={{
                      background: `radial-gradient(circle, ${item.color}35 0%, transparent 70%)`,
                      transform: isActive ? 'scale(1.4)' : 'scale(1)'
                    }} 
                  />

                  {/* Card Top */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span 
                      className="ms-card-icon-badge" 
                      style={{ 
                        color: item.color, 
                        background: isActive ? `${item.color}18` : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isActive ? `${item.color}35` : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: isActive ? `0 0 20px ${item.color}25` : 'none'
                      }}
                    >
                      <item.Icon size={28} />
                    </span>
                    <span className="ms-card-index" style={{ color: isActive ? item.color : 'rgba(255,255,255,0.3)' }}>
                      {item.id} / {String(bentoItems.length).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Card Middle */}
                  <div className="ms-card-content">
                    <span className="ms-card-tag" style={{ color: item.color, opacity: isActive ? 0.9 : 0.5 }}>
                      {item.tag}
                    </span>
                    <h3 className="ms-card-title">
                      {item.title}
                    </h3>
                    <p className="ms-card-desc" style={{ color: isActive ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.4)' }}>
                      {item.desc}
                    </p>
                  </div>

                  {/* Card Bottom: Premium CTA */}
                  <div style={{ width: '100%' }}>
                    <div 
                      className="ms-card-btn"
                      style={{
                        background: isActive ? `linear-gradient(135deg, ${item.color}20 0%, ${item.color}05 100%)` : 'rgba(255, 255, 255, 0.02)',
                        border: isActive ? `1px solid ${item.color}50` : '1px solid rgba(255, 255, 255, 0.04)',
                        color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.3)',
                        boxShadow: isActive ? `0 8px 25px ${item.color}15` : 'none'
                      }}
                    >
                      <span>{item.cta}</span>
                      <svg className="ms-card-btn-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </div>
                </CardComponent>
              );
            })}

            {/* Padding spacer to center the last card and prevent right-cut off in Safari/WebKit */}
            <div style={{ flex: '0 0 12vw', scrollSnapAlign: 'none' }} />
          </div>
        </div>

        {/* Footer: Indicator Dots & Swipe helper */}
        <div className="ms-home-footer">
          <div className="ms-dots-container">
            {bentoItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => handleDotClick(idx)}
                className={`ms-dots-btn ${activeCardIdx === idx ? 'ms-dots-btn-active' : ''}`}
                style={{ background: activeCardIdx === idx ? item.color : 'rgba(255, 255, 255, 0.2)' }}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
          <div className="ms-swipe-helper">
            Swipe left or right
          </div>
        </div>
      </div>
    </div>
  );
}
