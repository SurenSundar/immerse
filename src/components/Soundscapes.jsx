import { useEffect, useRef, useState } from 'react';
import { SOUND_LAYERS, getMixAnalyser } from '../utils/soundscapes';
import { sound, useSound, SCENES } from '../utils/soundStore';
import { SOUND_ICONS } from '../utils/soundIcons';

const TIMERS = [15, 30, 60];
const RING = 2 * Math.PI * 46; // circumference of the volume ring (r = 46 in a 100 viewBox)

function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Central glow that breathes with the loudness of the current mix. */
function MixVisualizer({ playing }) {
  const canvasRef = useRef(null);
  const playingRef = useRef(playing);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf;
    let level = 0;
    let t = 0;
    const buf = new Float32Array(1024);

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = canvas.clientWidth;
      if (canvas.width !== size * dpr) { canvas.width = canvas.height = size * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const analyser = getMixAnalyser();
      let rms = 0;
      if (analyser && playingRef.current) {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        rms = Math.sqrt(sum / buf.length);
      }
      level += (Math.min(1, rms * 6) - level) * 0.08;
      t += reduce ? 0 : 0.012;

      const c = size / 2;
      const base = size * 0.17;
      const breathe = playingRef.current ? 0 : Math.sin(t * 1.4) * 0.04;
      const r = base * (1 + level * 0.9 + breathe);

      // Soft halo
      const halo = ctx.createRadialGradient(c, c, r * 0.2, c, c, r * 2.6);
      halo.addColorStop(0, `rgba(242, 184, 102, ${0.22 + level * 0.35})`);
      halo.addColorStop(1, 'rgba(242, 184, 102, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(c, c, r * 2.6, 0, Math.PI * 2); ctx.fill();

      // Slowly turning rings, wobbling with the sound
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        const rr = r * (1.35 + k * 0.38);
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 60) {
          const wobble = 1 + Math.sin(a * (3 + k) + t * (1 + k * 0.4)) * (0.015 + level * 0.06);
          const x = c + Math.cos(a) * rr * wobble;
          const y = c + Math.sin(a) * rr * wobble;
          if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(247, 203, 140, ${0.18 - k * 0.04 + level * 0.15})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Core
      const core = ctx.createRadialGradient(c - r * 0.3, c - r * 0.3, r * 0.1, c, c, r);
      core.addColorStop(0, '#fff3dc');
      core.addColorStop(0.5, playingRef.current ? '#f7cb8c' : '#c9cfe6');
      core.addColorStop(1, playingRef.current ? 'rgba(242, 184, 102, 0.55)' : 'rgba(170, 184, 230, 0.35)');
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="sx-viz" aria-hidden="true" />;
}

function SoundOrb({ layer, index, volume }) {
  const on = volume !== undefined;
  const Icon = SOUND_ICONS[layer.id];
  const angle = (-90 + index * 60) * (Math.PI / 180);

  const nudge = (delta) => {
    if (!on) return;
    sound.setVolume(layer.id, Math.min(1, Math.max(0.05, +(volume + delta).toFixed(2))));
  };

  return (
    <div
      className={`sx-orb ${on ? 'is-on' : ''}`}
      style={{ '--x': `${50 + Math.cos(angle) * 39}%`, '--y': `${50 + Math.sin(angle) * 39}%`, '--delay': `${index * 0.7}s` }}
    >
      <button
        className="sx-orb-core"
        onClick={() => sound.toggle(layer.id)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); nudge(0.05); }
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); nudge(-0.05); }
        }}
        aria-pressed={on}
        aria-label={on ? `${layer.label}, playing at ${Math.round(volume * 100)} percent. Arrow keys change volume.` : `Play ${layer.label}`}
      >
        <svg className="sx-ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" className="sx-ring-track" />
          <circle cx="50" cy="50" r="46" className="sx-ring-fill" style={{ strokeDasharray: RING, strokeDashoffset: RING * (1 - (on ? volume : 0)) }} />
        </svg>
        <span className="sx-ripple" aria-hidden="true" />
        <Icon size={28} aria-hidden="true" />
      </button>
      <span className="sx-orb-label">{layer.label}</span>
      {on && (
        <input
          type="range" className="mm-range sx-orb-range"
          min="0.05" max="1" step="0.05" value={volume}
          onChange={(e) => sound.setVolume(layer.id, parseFloat(e.target.value))}
          aria-label={`${layer.label} volume`}
        />
      )}
    </div>
  );
}

export default function Soundscapes() {
  const { active, muted, timerEnd, timerMinutes } = useSound();
  const [now, setNow] = useState(() => Date.now());
  const playing = Object.keys(active);

  useEffect(() => {
    if (!timerEnd) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [timerEnd]);

  const sceneOn = (mix) => {
    const keys = Object.keys(mix);
    return keys.length === playing.length && keys.every(k => k in active);
  };

  return (
    <div className="mm-page sx-page">
      <header className="mm-page-header mm-page-header--center">
        <h1>Soundscapes</h1>
        <p>Light the sounds you want around you. They keep playing as you move through MonkeyMind.</p>
      </header>

      {muted && <p className="sp-muted sx-muted">Sound is muted. Tap the speaker in the bottom-left corner to hear your mix.</p>}

      <div className="sx-layout">
        <div className="sx-stage">
          <MixVisualizer playing={playing.length > 0 && !muted} />
          <p className="sx-center-text" aria-live="polite">
            {playing.length ? `${playing.length} sound${playing.length > 1 ? 's' : ''} playing` : 'Tap a sound to begin'}
          </p>
          {SOUND_LAYERS.map((layer, i) => (
            <SoundOrb key={layer.id} layer={layer} index={i} volume={active[layer.id]} />
          ))}
        </div>

        <aside className="sx-side">
          <section className="mm-panel sx-card">
            <h2 className="sx-card-title">Scenes</h2>
            <div className="sx-scenes">
              {SCENES.map(scene => (
                <button
                  key={scene.id}
                  className={`sx-scene sx-scene--${scene.id} ${sceneOn(scene.mix) ? 'is-on' : ''}`}
                  onClick={() => sound.playScene(scene.mix)}
                  aria-pressed={sceneOn(scene.mix)}
                >
                  <span className="sx-scene-art" aria-hidden="true" />
                  <span className="sx-scene-name">{scene.label}</span>
                  <span className="sx-scene-mix">
                    {Object.keys(scene.mix).map(id => SOUND_LAYERS.find(l => l.id === id).label).join(', ')}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mm-panel sx-card">
            <h2 className="sx-card-title">Fade out after</h2>
            <div className="mm-chips" role="group" aria-label="Fade-out timer">
              <button className={`mm-chip ${!timerMinutes ? 'is-on' : ''}`} onClick={() => sound.setTimer(null)} aria-pressed={!timerMinutes}>Off</button>
              {TIMERS.map(m => (
                <button key={m} className={`mm-chip ${timerMinutes === m ? 'is-on' : ''}`} onClick={() => sound.setTimer(m)} aria-pressed={timerMinutes === m}>{m} min</button>
              ))}
            </div>
            {timerEnd && <p className="sx-remaining">Fading out in {formatRemaining(timerEnd - now)}</p>}
            {playing.length > 0 && (
              <button className="mm-btn mm-btn--sm sx-stop" onClick={() => sound.stopAll()}>Stop all sounds</button>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
