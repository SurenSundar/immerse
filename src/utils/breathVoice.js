// Spoken breathing guide using the browser's built-in speech synthesis.
import { isGlobalMuted } from './zenAudio';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

export const hasBreathVoice = () => !!synth;

// Natural / enhanced voices sound far less robotic, so try those first
const QUALITY = ['natural', 'enhanced', 'premium'];
const PREFERRED = ['samantha', 'serena', 'karen', 'moira', 'tessa', 'google uk english female', 'google us english', 'zira', 'victoria'];
let cachedVoice = null;

function pickVoice() {
  if (!synth) return null;
  if (cachedVoice) return cachedVoice;
  const voices = synth.getVoices();
  if (!voices.length) return null;
  const english = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  const pool = english.length ? english : voices;
  const named = (list) => PREFERRED.map((n) => list.find((v) => v.name.toLowerCase().includes(n))).find(Boolean);
  const quality = pool.filter((v) => QUALITY.some((q) => v.name.toLowerCase().includes(q)));
  return (cachedVoice = named(quality) || quality[0] || named(pool) || pool[0]);
}

if (synth && synth.addEventListener) {
  synth.addEventListener('voiceschanged', () => { cachedVoice = null; });
}

// Slow, soft delivery so the guide feels like a calm teacher, not a metronome
const CALM = { rate: 0.75, pitch: 0.95, volume: 0.8 };

// Speak one short word or phrase.
// interrupt: true cuts off anything still playing (used at a phase change so
// the voice never drifts behind the visual). Counts pass false and never clip
// the previous word; they return false so the caller can wait a moment.
export function speakBreath(text, { interrupt = true } = {}) {
  if (!synth || isGlobalMuted()) return true;
  try {
    if (interrupt) synth.cancel();
    else if (synth.speaking || synth.pending) return false;
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.rate = CALM.rate;
    u.pitch = CALM.pitch;
    u.volume = CALM.volume;
    synth.speak(u);
  } catch (err) {
    console.warn('Breath voice failed:', err);
  }
  return true;
}

export function stopBreathVoice() {
  if (!synth) return;
  try { synth.cancel(); } catch { /* ignore */ }
}

const CUE_WORDS = { INHALE: 'Breathe in', HOLD: 'Hold', EXHALE: 'Breathe out' };
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

// Speaks the guide for one breathing phase. Returns a cleanup function.
// mode: 'cues' → just the phase name; 'counts' → the phase name, then a
// countdown that matches the on-screen timer: "Breathe in… three… two… one".
// elapsedMs lets the guide join a phase that is already under way and stay
// in step with the timer.
export function guidePhase(phaseName, duration, mode, elapsedMs = 0) {
  if (!synth || mode === 'off') return () => {};
  const timers = [];
  const joinedLate = elapsedMs > 400;
  if (mode === 'counts') {
    if (!joinedLate) speakBreath(CUE_WORDS[phaseName]);
    // The screen shows `duration` for the first second, then counts down;
    // the phase name stands in for that first number.
    for (let i = 1; i < duration; i++) {
      const at = i * 1000 - elapsedMs;
      const n = duration - i;
      if (at < 0) continue;
      const word = NUMBER_WORDS[n] ?? String(n);
      // If the last word is still finishing, wait for it (up to ~0.5s) rather
      // than cutting it off; past that, drop this number to stay in sync.
      const attempt = (tries) => {
        if (speakBreath(word, { interrupt: false }) || tries === 0) return;
        timers.push(setTimeout(() => attempt(tries - 1), 120));
      };
      timers.push(setTimeout(() => attempt(4), at));
    }
  } else if (!joinedLate || elapsedMs < duration * 500) {
    // Late joiners still hear the cue if most of the phase is left
    speakBreath(CUE_WORDS[phaseName]);
  }
  return () => timers.forEach(clearTimeout);
}
