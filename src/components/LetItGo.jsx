import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { playSingingBowl } from '../utils/zenAudio';
import { SoundPicker } from './SoundDock';

const MAX_CHARS = 600;
const BURN_MS = 6000;        // how long each letter takes to rise and fade
const TARGET_MS = 42000;     // a long text takes roughly this long to leave
const MIN_STEP = 110;        // ...but never faster than this per letter
const MAX_STEP = 340;        // ...and short texts linger, letter by letter

/** Splits text into lines → words → letters, with a start time for every letter. */
function planRelease(text) {
  const letters = text.replace(/\s/g, '').length || 1;
  const step = Math.min(MAX_STEP, Math.max(MIN_STEP, TARGET_MS / letters));
  let t = 900; // a breath before the first letter goes
  let i = 0;
  const lines = text.split('\n').map(line => {
    const words = line.split(/( +)/).map(chunk => {
      if (/^ +$/.test(chunk)) { t += step * 0.6; return { space: chunk }; }
      return {
        letters: [...chunk].map(ch => {
          const r = (n) => Math.sin((i + 1) * n) * 0.5 + 0.5; // stable pseudo-random per letter
          const item = {
            ch,
            delay: t,
            dx: `${(r(12.9898) - 0.5) * 90}px`,
            dy: `${-(120 + r(78.233) * 140)}px`,
            rot: `${(r(37.719) - 0.5) * 50}deg`,
          };
          t += step;
          i += 1;
          return item;
        }),
      };
    });
    t += step * 2;
    return words;
  });
  return { lines, total: t + BURN_MS };
}

function bowl(freq) {
  try { playSingingBowl(freq, 7, 0.45); } catch { /* audio is optional */ }
}

/** Embers that lift off each letter as it catches light. */
function useEmbers(canvasRef, active, containerRef, plan) {
  useLayoutEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Where each letter sits on screen, in release order
    const spots = [...containerRef.current.querySelectorAll('.lig-ch')].map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, at: parseFloat(el.dataset.delay) + BURN_MS * 0.12 };
    });
    const particles = [];
    let next = 0;
    let raf;
    const t0 = performance.now();

    const frame = (now) => {
      const elapsed = now - t0;
      while (next < spots.length && spots[next].at <= elapsed) {
        const s = spots[next++];
        if (!reduce) {
          for (let k = 0; k < 3; k++) {
            particles.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 0.5, vy: -(0.35 + Math.random() * 0.7), life: 1, decay: 0.004 + Math.random() * 0.006, size: 0.8 + Math.random() * 1.8, seed: Math.random() * 6 });
          }
        }
      }
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let p = particles.length - 1; p >= 0; p--) {
        const e = particles[p];
        e.x += e.vx + Math.sin(elapsed / 700 + e.seed) * 0.25;
        e.y += e.vy;
        e.life -= e.decay;
        if (e.life <= 0) { particles.splice(p, 1); continue; }
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 5);
        g.addColorStop(0, `rgba(255, 230, 180, ${e.life})`);
        g.addColorStop(0.4, `rgba(242, 184, 102, ${e.life * 0.6})`);
        g.addColorStop(1, 'rgba(242, 184, 102, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 5, 0, Math.PI * 2); ctx.fill();
      }
      if (next < spots.length || particles.length) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, canvasRef, containerRef, plan]);
}

/** Gentle in / out cue while the words leave */
function BreathCue() {
  const [inhale, setInhale] = useState(true);
  useEffect(() => {
    let id;
    const loop = (isIn) => { id = setTimeout(() => { setInhale(!isIn); loop(!isIn); }, isIn ? 4000 : 6000); };
    loop(true);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="lig-breath" aria-live="polite">
      <span className={`lig-breath-dot ${inhale ? 'is-in' : 'is-out'}`} aria-hidden="true" />
      {inhale ? 'Breathe in' : 'Breathe out, and let it go'}
    </div>
  );
}

/**
 * Write what's weighing on you and watch it leave, one letter at a time.
 * Nothing is stored or sent anywhere; the text only lives in this component's state.
 */
export default function LetItGo() {
  const [text, setText] = useState('');
  const [stage, setStage] = useState('write'); // 'write' | 'release' | 'after'
  const [releasing, setReleasing] = useState('');
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const paperRef = useRef(null);
  const canvasRef = useRef(null);

  const plan = useMemo(() => (releasing ? planRelease(releasing) : null), [releasing]);
  useEmbers(canvasRef, stage === 'release', paperRef, plan);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const release = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setReleasing(trimmed);
    setText('');
    setStage('release');
    bowl(196);
    timerRef.current = setTimeout(() => {
      setReleasing('');
      setStage('after');
      bowl(293.66);
    }, planRelease(trimmed).total + 800);
  };

  const again = () => {
    setStage('write');
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  return (
    <div className={`lig2 lig2--${stage}`}>
      <div className="lig2-sky" aria-hidden="true" />
      <canvas ref={canvasRef} className="lig2-embers" aria-hidden="true" />

      <div className="lig2-inner">
        {stage === 'write' && (
          <>
            <header className="mm-page-header mm-page-header--center">
              <h1>Let It Go</h1>
              <p>Write down what is weighing on you. When you are ready, watch it leave, one letter at a time.</p>
            </header>

            <div className="lig2-paper">
              <textarea
                ref={inputRef}
                className="lig2-input"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                placeholder="It's okay. Write it here…"
                rows={6}
                aria-label="What's weighing on you"
              />
              <span className="lig2-count" aria-hidden="true">{text.length} / {MAX_CHARS}</span>
            </div>

            <button className="mm-btn mm-btn--primary lig2-release" onClick={release} disabled={!text.trim()}>
              Let it go
            </button>
            <p className="lig2-private">It stays on this screen only. Nothing is saved or sent.</p>

            <section className="lig2-sounds">
              <h2>Something to listen to while it leaves</h2>
              <SoundPicker />
            </section>
          </>
        )}

        {stage === 'release' && plan && (
          <>
            <p className="lig2-watching">Watch it go. There is no rush.</p>
            <div className="lig2-paper lig2-paper--burning" ref={paperRef} aria-label="Your words, leaving" role="img">
              <p className="lig2-text">
                {plan.lines.map((line, li) => (
                  <span key={li}>
                    {line.map((w, wi) => w.space !== undefined
                      ? <span key={wi}>{w.space}</span>
                      : (
                        <span key={wi} className="lig2-word">
                          {w.letters.map((l, ci) => (
                            <span
                              key={ci}
                              className="lig-ch"
                              data-delay={l.delay}
                              style={{ '--dx': l.dx, '--dy': l.dy, '--rot': l.rot, animationDelay: `${l.delay}ms`, animationDuration: `${BURN_MS}ms` }}
                            >
                              {l.ch}
                            </span>
                          ))}
                        </span>
                      ))}
                    {li < plan.lines.length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
            <BreathCue />
          </>
        )}

        {stage === 'after' && (
          <div className="lig2-after">
            <div className="lig2-paper lig2-paper--empty" aria-hidden="true" />
            <h1>It&rsquo;s gone.</h1>
            <p>Notice the space it leaves behind. You don&rsquo;t have to carry it right now.</p>
            <div className="lig2-after-actions">
              <button className="mm-btn mm-btn--primary" onClick={again}>Let go of something else</button>
              <Link to="/resonance" className="mm-btn">Breathe for a minute</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
