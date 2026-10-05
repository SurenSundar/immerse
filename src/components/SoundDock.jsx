import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TbMusic, TbX, TbArrowRight } from 'react-icons/tb';
import { SOUND_LAYERS } from '../utils/soundscapes';
import { SOUND_ICONS } from '../utils/soundIcons';
import { sound, useSound } from '../utils/soundStore';

/** The six shared sounds as toggles (with a volume slider for each one playing). */
export function SoundPicker({ showVolumes = true }) {
  const { active, muted } = useSound();
  return (
    <div className="sp">
      <div className="sp-grid" role="group" aria-label="Background sounds">
        {SOUND_LAYERS.map(layer => {
          const Icon = SOUND_ICONS[layer.id];
          const on = layer.id in active;
          return (
            <div key={layer.id} className={`sp-item ${on ? 'is-on' : ''}`}>
              <button className="sp-toggle" onClick={() => sound.toggle(layer.id)} aria-pressed={on}>
                <Icon size={20} aria-hidden="true" />
                <span>{layer.label}</span>
              </button>
              {showVolumes && on && (
                <input
                  type="range" className="mm-range sp-volume"
                  min="0.05" max="1" step="0.05"
                  value={active[layer.id]}
                  onChange={(e) => sound.setVolume(layer.id, parseFloat(e.target.value))}
                  aria-label={`${layer.label} volume`}
                />
              )}
            </div>
          );
        })}
      </div>
      {muted && <p className="sp-muted">Sound is muted. Tap the speaker in the bottom-left corner to hear it.</p>}
    </div>
  );
}

/** Floating "Sounds" button available on every tool page. */
export default function SoundDock() {
  const { active } = useSound();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const count = Object.keys(active).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [open]);

  return (
    <div className="sd" ref={ref}>
      {open && (
        <div className="mm-panel sd-panel" role="dialog" aria-label="Background sounds">
          <div className="sd-head">
            <span>Background sounds</span>
            <button className="mm-btn mm-btn--ghost sd-close" onClick={() => setOpen(false)} aria-label="Close sounds">
              <TbX size={18} />
            </button>
          </div>
          <SoundPicker />
          <div className="sd-foot">
            {count > 0 && <button className="mm-btn mm-btn--ghost mm-btn--sm" onClick={() => sound.stopAll()}>Stop all</button>}
            <Link to="/soundscapes" className="mm-btn mm-btn--sm" onClick={() => setOpen(false)}>
              Open mixer <TbArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
      <button
        className={`sd-button ${count ? 'is-playing' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label={count ? `Sounds, ${count} playing` : 'Sounds'}
      >
        <span className="sd-eq" aria-hidden="true"><i /><i /><i /></span>
        <TbMusic size={18} className="sd-note" aria-hidden="true" />
        Sounds{count ? ` · ${count}` : ''}
      </button>
    </div>
  );
}
