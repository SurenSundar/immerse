// Layered ambient sounds for the Soundscapes page. Each layer has its own gain so
// several can play together; this is separate from zenAudio's single ambient slot
// (used by Focus and Meditation) so the two never stop each other.
import { getAudioContext, isGlobalMuted } from './zenAudio';

export const SOUND_LAYERS = [
  { id: 'rain', label: 'Rain', hint: 'Soft, steady rainfall' },
  { id: 'ocean', label: 'Ocean', hint: 'Slow rolling waves' },
  { id: 'wind', label: 'Wind', hint: 'A gentle breeze' },
  { id: 'stream', label: 'Stream', hint: 'Water over stones' },
  { id: 'drone', label: 'Warm Drone', hint: 'A low, steady hum' },
  { id: 'bowls', label: 'Singing Bowls', hint: 'Occasional soft bowls' },
];

let noiseBuffer = null;
function pinkNoise(ctx) {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const size = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < size; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  noiseBuffer = buffer;
  return buffer;
}

function noiseSource(ctx) {
  const src = ctx.createBufferSource();
  src.buffer = pinkNoise(ctx);
  src.loop = true;
  // Start at a random point so blended noise layers don't sound identical
  src.start(ctx.currentTime, Math.random() * 3);
  return src;
}

function lfo(ctx, freq, depth, target) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.value = freq;
  g.gain.value = depth;
  osc.connect(g).connect(target);
  osc.start();
  return osc;
}

function filter(ctx, type, freq, q = 0.7) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

/** Builds one layer's audio graph into `out`; returns nodes to stop and an optional cleanup. */
function build(ctx, id, out) {
  const nodes = [];
  let cleanup = null;

  if (id === 'rain') {
    const src = noiseSource(ctx);
    const lp = filter(ctx, 'lowpass', 1400);
    nodes.push(src, lfo(ctx, 0.08, 300, lp.frequency));
    src.connect(lp).connect(out);
  } else if (id === 'ocean') {
    const src = noiseSource(ctx);
    const lp = filter(ctx, 'lowpass', 340);
    const swell = ctx.createGain();
    swell.gain.value = 0.55;
    nodes.push(src, lfo(ctx, 0.07, 230, lp.frequency), lfo(ctx, 0.07, 0.4, swell.gain));
    src.connect(lp).connect(swell).connect(out);
  } else if (id === 'wind') {
    const src = noiseSource(ctx);
    const bp = filter(ctx, 'bandpass', 500, 1.2);
    const level = ctx.createGain();
    level.gain.value = 0.9;
    nodes.push(src, lfo(ctx, 0.05, 260, bp.frequency), lfo(ctx, 0.11, 0.35, level.gain));
    src.connect(bp).connect(level).connect(out);
  } else if (id === 'stream') {
    const src = noiseSource(ctx);
    const hp = filter(ctx, 'highpass', 900);
    const bp = filter(ctx, 'bandpass', 2200, 0.6);
    const ripple = ctx.createGain();
    ripple.gain.value = 0.7;
    nodes.push(src, lfo(ctx, 3.3, 0.18, ripple.gain), lfo(ctx, 0.2, 500, bp.frequency));
    src.connect(hp).connect(bp).connect(ripple).connect(out);
  } else if (id === 'drone') {
    [109.6, 165.3, 219.8, 330.5].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 ? 'triangle' : 'sine';
      osc.frequency.value = f;
      const lp = filter(ctx, 'lowpass', i === 3 ? 280 : 170);
      const g = ctx.createGain();
      g.gain.value = 0.16;
      osc.start();
      nodes.push(osc, lfo(ctx, 0.04 + i * 0.02, 0.1, g.gain));
      osc.connect(lp).connect(g).connect(out);
    });
  } else if (id === 'bowls') {
    // A soft, continuous "singing rim" underneath so the layer is never silent
    [146.83, 220].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.05 : 0.03;
      osc.start();
      nodes.push(osc, lfo(ctx, 0.15 + i * 0.07, 0.02, g.gain));
      osc.connect(g).connect(out);
    });

    // Struck bowls that ring for ~14s and overlap, like a real bowl practice
    const pitches = [196, 220, 261.63, 293.66, 329.63];
    let last = -1;
    const strike = (at) => {
      let i;
      do { i = Math.floor(Math.random() * pitches.length); } while (i === last);
      last = i;
      const base = pitches[i];
      const ring = 14;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(1, at + 0.05);
      env.gain.exponentialRampToValueAtTime(0.0005, at + ring);
      env.connect(out);
      [[1, 1, 1.2], [1.5, 0.45, 2.3], [1.98, 0.3, 0.75], [2.44, 0.2, 3.1], [3.01, 0.12, 1.4]].forEach(([ratio, vol, wobble]) => {
        const osc = ctx.createOscillator();
        osc.frequency.value = base * ratio;
        const g = ctx.createGain();
        g.gain.value = vol * 0.45;
        // Gentle beating, like a real bowl
        const w = ctx.createOscillator();
        const wg = ctx.createGain();
        w.frequency.value = wobble;
        wg.gain.value = vol * 0.08;
        w.connect(wg).connect(g.gain);
        osc.connect(g).connect(env);
        osc.start(at); w.start(at);
        osc.stop(at + ring + 0.2); w.stop(at + ring + 0.2);
      });
    };

    // First strike once the layer has faded in, then every 5–8 seconds
    strike(ctx.currentTime + 1.2);
    let timer;
    const schedule = () => {
      timer = setTimeout(() => { strike(ctx.currentTime + 0.05); schedule(); }, 5000 + Math.random() * 3000);
    };
    timer = setTimeout(schedule, 1200);
    cleanup = () => clearTimeout(timer);
  }
  return { nodes, cleanup };
}

// All layers feed one master bus with an analyser, so pages can visualise the mix
let master = null;
function getMaster(ctx) {
  if (master && master.ctx === ctx) return master;
  const gain = ctx.createGain();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  gain.connect(analyser);
  analyser.connect(ctx.destination);
  master = { ctx, gain, analyser };
  return master;
}

/** Analyser on the combined soundscape mix (null until something has played). */
export function getMixAnalyser() {
  return master ? master.analyser : null;
}

/**
 * Starts a layer with its own fade-in. Returns { setVolume, stop } or null when
 * audio is unavailable or the site is muted.
 */
export function startLayer(id, volume) {
  if (isGlobalMuted()) return null;
  const ctx = getAudioContext();
  if (!ctx) return null;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5);
  gain.connect(getMaster(ctx).gain);
  const { nodes, cleanup } = build(ctx, id, gain);
  let stopped = false;

  return {
    setVolume(v) {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(v, ctx.currentTime, 0.1);
    },
    stop(fadeSeconds = 0.8) {
      if (stopped) return;
      stopped = true;
      cleanup?.();
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + fadeSeconds);
      setTimeout(() => {
        nodes.forEach(n => { try { n.stop(); } catch { /* already stopped */ } });
        gain.disconnect();
      }, fadeSeconds * 1000 + 100);
    },
  };
}
