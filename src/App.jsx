import { useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';

import FocusTimer from './components/FocusTimer';
import Resonance from './components/Resonance';
import BackgroundScene from './components/BackgroundScene';

// -- Components --

function NavBar() {
  const location = useLocation();
  const isTimer = location.pathname === '/timer';

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">ZONE.io</Link>

      <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
        Home
      </Link>
      <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
        Manifesto
      </Link>
      <Link to="/resonance" className={`nav-link ${location.pathname === '/resonance' ? 'active' : ''}`}>
        Resonance
      </Link>
      <Link to="/timer" className={`nav-link ${location.pathname === '/timer' ? 'active' : ''}`} style={isTimer ? { color: '#00ff9d' } : {}}>
        Enter System
      </Link>
    </nav>
  );
}

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

// -- Pages --

function HomePage() {
  return (
    <div className="container">
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        RECLAIM YOUR <br /> <span style={{ color: '#00ff9d' }}>COGNITIVE LIBERTY</span>
      </motion.h1>

      <motion.p className="lead"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        A distraction-free environment engineered for deep work.
        Disconnect from the noise. Connect with the signal.
      </motion.p>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/timer" className="btn-primary">
          INITIATE SESSION &rarr;
        </Link>
        <Link to="/resonance" className="btn-primary" style={{ background: 'transparent', color: '#fff', border: '1px solid #fff' }}>
          BREATHE
        </Link>
      </div>

      <div className="grid-3">
        <div className="card">
          <h3>01. VISUAL FEEDBACK</h3>
          <p>Your focus state is visualized in real-time. Watch chaos organize into order as you work.</p>
        </div>
        <div className="card">
          <h3>02. RESONANCE</h3>
          <p>New: Box breathing visualization to calm the nervous system before deep work sessions.</p>
        </div>
        <div className="card">
          <h3>03. ZERO DISTRACTION</h3>
          <p>No notifications. No gamification. Just pure, unadulterated productivity.</p>
        </div>
      </div>

      <footer style={{ marginTop: '8rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', opacity: 0.5 }}>
        <small>SYSTEM V1.3 // ZONE.IO // 2024</small>
      </footer>
    </div>
  )
}

function AboutPage() {
  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h1>THE MANIFESTO</h1>

      <div className="card" style={{ padding: '3rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
        <p style={{ fontSize: '1.2rem', lineHeight: 1.8, marginBottom: '2rem', color: '#ccc' }}>
          We live in an <strong style={{ color: '#fff' }}>Attention Economy</strong>.
          Every app, every website, every notification is fighting for a slice of your mind.
        </p>

        <p style={{ fontSize: '1.2rem', lineHeight: 1.8, marginBottom: '2rem', color: '#ccc' }}>
          ZONE.io is the antidote. It is a tool designed not to capture your attention, but to help you <strong style={{ color: '#00ff9d' }}>generate it</strong>.
        </p>

        <h3 style={{ marginTop: '3rem', marginBottom: '1rem', color: '#fff' }}>DESIGN PHILOSOPHY</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#00ff9d', marginRight: '1rem' }}>///</span>
            Minimalism is not an aesthetic, it is a function.
          </li>
          <li style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#00ff9d', marginRight: '1rem' }}>///</span>
            Visuals should inform, not distract.
          </li>
        </ul>
      </div>
    </div>
  )
}

function TimerPage() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20 }}>
      <FocusTimer />
    </div>
  )
}

function ResonancePage() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20 }}>
      <Resonance />
    </div>
  )
}


function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition><HomePage /></PageTransition>
        } />
        <Route path="/about" element={
          <PageTransition><AboutPage /></PageTransition>
        } />
        <Route path="/timer" element={
          <PageTransition><TimerPage /></PageTransition>
        } />
        <Route path="/resonance" element={
          <PageTransition><ResonancePage /></PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>

        {/* Global Background Canvas */}
        <div id="canvas-container">
          <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 60 }}>
            <BackgroundScene />
          </Canvas>
        </div>

        {/* Foreground Content */}
        <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>
          <NavBar />
          <AnimatedRoutes />
        </div>

      </div>
    </Router>
  );
}
