// One shared ambient mix for the whole site. Every tool (Breathe, Let It Go,
// Meditation, Focus, Soundscapes) reads and changes the same six sounds, and the
// mix keeps playing while you move between pages until you stop it.
import { useSyncExternalStore } from 'react';
import { startLayer } from './soundscapes';
import { getAudioContext, isGlobalMuted, onGlobalMuteChange } from './zenAudio';

export const DEFAULT_VOLUME = 0.5;

export const SCENES = [
  { id: 'rainy-night', label: 'Rainy night', mix: { rain: 0.6, drone: 0.25 } },
  { id: 'ocean-calm', label: 'Ocean calm', mix: { ocean: 0.65, wind: 0.2 } },
  { id: 'forest-stream', label: 'Forest stream', mix: { stream: 0.55, wind: 0.3, bowls: 0.2 } },
  { id: 'temple', label: 'Temple', mix: { bowls: 0.55, drone: 0.35 } },
  { id: 'deep-rest', label: 'Deep rest', mix: { ocean: 0.4, rain: 0.3, drone: 0.3 } },
];

let state = { active: {}, muted: isGlobalMuted(), timerEnd: null, timerMinutes: null };
const listeners = new Set();
const layers = {};
let timerId = null;

function emit() { listeners.forEach(fn => fn()); }

// Bring the playing layers in line with the selected mix
function sync() {
  Object.keys(layers).forEach(id => {
    if (!(id in state.active) || state.muted) {
      layers[id].stop();
      delete layers[id];
    }
  });
  if (state.muted) return;
  Object.entries(state.active).forEach(([id, vol]) => {
    if (layers[id]) layers[id].setVolume(vol);
    else {
      const handle = startLayer(id, vol);
      if (handle) layers[id] = handle;
    }
  });
}

function update(patch) {
  state = { ...state, ...patch };
  sync();
  emit();
}

function clearTimer() {
  clearInterval(timerId);
  timerId = null;
}

export const sound = {
  toggle(id) {
    getAudioContext(); // unlock audio inside the tap
    const active = { ...state.active };
    if (id in active) delete active[id];
    else active[id] = DEFAULT_VOLUME;
    update({ active });
  },
  setVolume(id, volume) {
    if (!(id in state.active)) return;
    update({ active: { ...state.active, [id]: volume } });
  },
  playScene(mix) {
    getAudioContext();
    update({ active: { ...mix } });
  },
  stopAll(fadeSeconds = 0.8) {
    Object.values(layers).forEach(h => h.stop(fadeSeconds));
    Object.keys(layers).forEach(id => delete layers[id]);
    clearTimer();
    update({ active: {}, timerEnd: null, timerMinutes: null });
  },
  /** Fade everything out after `minutes` (null cancels). */
  setTimer(minutes) {
    clearTimer();
    if (!minutes) { update({ timerEnd: null, timerMinutes: null }); return; }
    update({ timerEnd: Date.now() + minutes * 60000, timerMinutes: minutes });
    timerId = setInterval(() => {
      if (state.timerEnd && Date.now() >= state.timerEnd) sound.stopAll(8);
    }, 1000);
  },
};

onGlobalMuteChange(muted => update({ muted }));

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** React hook: { active, muted, timerEnd, timerMinutes } */
export function useSound() {
  return useSyncExternalStore(subscribe, () => state);
}
