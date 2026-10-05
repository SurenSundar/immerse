let audioCtx = null;
let breathNodes = null;
let ambientNodes = null;
let isMutedGlobal = false;

// Get or set global mute status
export function isGlobalMuted() {
  return isMutedGlobal;
}

const muteListeners = new Set();

/** Subscribe to global mute changes; returns an unsubscribe function. */
export function onGlobalMuteChange(listener) {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

export function setGlobalMute(mute) {
  isMutedGlobal = mute;
  if (mute) {
    stopAmbientSound();
    stopBreathingSynth();
  }
  muteListeners.forEach(fn => fn(mute));
}

// Initialize or resume the global AudioContext
export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (e) {
    console.warn('Web Audio API is not supported or failed to initialize:', e);
  }
  return audioCtx;
}

// Play a crystal-clear, soft zen chime (sine wave with high-order overtones and quick decay)
export function playZenChime(freq, duration = 1.5, volume = 0.35) {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Create nodes
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  // Fundamental frequency
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, now);

  // Soft high overtone (fifth above octave) for a glassy bell texture
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 3.0, now);

  // Filter sweep to round off high frequencies over time
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(150, now + duration);

  // Envelope: rapid attack, smooth exponential decay
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.005);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  // Connect secondary oscillator at lower relative volume
  const osc2Gain = ctx.createGain();
  osc2Gain.gain.setValueAtTime(volume * 0.15, now);
  osc2Gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.6);

  osc1.connect(gainNode);
  osc2.connect(osc2Gain).connect(gainNode);

  gainNode.connect(filter).connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  
  osc1.stop(now + duration + 0.1);
  osc2.stop(now + duration + 0.1);
}

// Synthesize a rich Tibetan Singing Bowl.
// Struck metal resonators feature a strong base and multiple detuned, non-harmonic overtones.
// Includes a low-frequency modulator to simulate the natural amplitude wobble ("beating").
export function playSingingBowl(freq = 220, duration = 5.0, volume = 0.5) {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.08); // warm soft hit
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  masterGain.connect(ctx.destination);

  // Struck metal partial ratios and relative amplitudes
  const partials = [
    { ratio: 1.0, vol: 1.0, lfoFreq: 1.2 },
    { ratio: 1.5, vol: 0.45, lfoFreq: 2.3 },
    { ratio: 1.98, vol: 0.3, lfoFreq: 0.75 },
    { ratio: 2.44, vol: 0.22, lfoFreq: 3.1 },
    { ratio: 3.01, vol: 0.15, lfoFreq: 1.4 },
    { ratio: 3.52, vol: 0.08, lfoFreq: 4.2 },
    { ratio: 4.12, vol: 0.05, lfoFreq: 2.1 }
  ];

  partials.forEach(p => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * p.ratio, now);
    
    // Custom LFO for natural bowl pulsation (wobble)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    
    lfo.frequency.setValueAtTime(p.lfoFreq, now);
    lfoGain.gain.setValueAtTime(0.2 * p.vol, now); // Amplitude modulation depth
    
    lfo.connect(lfoGain.gain);
    gainNode.gain.setValueAtTime(p.vol * 0.35, now);
    lfoGain.connect(gainNode.gain);
    
    osc.connect(gainNode).connect(masterGain);
    
    osc.start(now);
    lfo.start(now);
    
    osc.stop(now + duration + 0.2);
    lfo.stop(now + duration + 0.2);
  });
}

// Maps a home card index to a calm, ascending pentatonic scale note
const PENTATONIC_SCALE = [
  329.63, // E4 - Card 1 (Sanctuary)
  392.00, // G4 - Card 2 (Breathing)
  440.00, // A4 - Card 3 (Let It Go)
  493.88, // B4 - Card 4 (Meditation)
  587.33, // D5 - Card 5 (Soundscapes)
  659.25, // E5 - Card 6 (Focus)
  783.99  // G5 - Card 7 (Library)
];

export function playCardHover(index) {
  const note = PENTATONIC_SCALE[index % PENTATONIC_SCALE.length];
  // Slightly longer chimes for a lingering zen echo
  playZenChime(note, 2.0, 0.25);
}

// Generates custom pink noise (sloped, deep rain sound)
function createPinkNoiseBuffer(ctx, seconds = 2.0) {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11; // normalise volume
    b6 = white * 0.115926;
  }
  return buffer;
}

// Dynamic breathing synthesizer for the Resonance screen
export function startBreathingSynth(phase, duration = 4.0, volume = 0.5) {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Clean up any stale nodes
  stopBreathingSynth();

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  
  // Pink noise forms the breath wind simulation
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = createPinkNoiseBuffer(ctx, 2.0);
  noiseSource.loop = true;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.setValueAtTime(1.8, now); // soft wind resonance

  // Warm sine oscillator for pitch guidance
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0, now);

  if (phase === 'INHALE') {
    // Chest expanding: sweep wind filter and pitch upwards
    filter.frequency.setValueAtTime(240, now);
    filter.frequency.exponentialRampToValueAtTime(750, now + duration);
    
    osc.frequency.setValueAtTime(164.81, now); // E3
    osc.frequency.exponentialRampToValueAtTime(220.00, now + duration); // A3
    
    gainNode.gain.linearRampToValueAtTime(volume * 0.45, now + 0.8);
    gainNode.gain.setValueAtTime(volume * 0.45, now + duration - 0.2);
    gainNode.gain.linearRampToValueAtTime(0, now + duration); // smooth breath tail
    
    oscGain.gain.linearRampToValueAtTime(volume * 0.15, now + duration * 0.8);
    oscGain.gain.linearRampToValueAtTime(0, now + duration);
  } else if (phase === 'HOLD') {
    // Air suspended: static calm drone
    filter.frequency.setValueAtTime(280, now);
    osc.frequency.setValueAtTime(220.00, now); // A3
    
    gainNode.gain.linearRampToValueAtTime(volume * 0.18, now + 0.4);
    gainNode.gain.setValueAtTime(volume * 0.18, now + duration - 0.25);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    oscGain.gain.linearRampToValueAtTime(volume * 0.12, now + 0.4);
    oscGain.gain.setValueAtTime(volume * 0.12, now + duration - 0.25);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
  } else if (phase === 'EXHALE') {
    // Relax and sigh: sweep filter and pitch downward
    filter.frequency.setValueAtTime(750, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + duration);
    
    osc.frequency.setValueAtTime(220.00, now); // A3
    osc.frequency.exponentialRampToValueAtTime(110.00, now + duration); // A2
    
    gainNode.gain.linearRampToValueAtTime(volume * 0.55, now + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    
    oscGain.gain.linearRampToValueAtTime(volume * 0.22, now + 0.3);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  }

  noiseSource.connect(filter).connect(gainNode);
  osc.connect(oscGain).connect(gainNode);
  gainNode.connect(ctx.destination);
  
  noiseSource.start(now);
  osc.start(now);
  
  breathNodes = {
    noiseSource,
    osc,
    gainNode,
    oscGain,
    filter
  };
}

export function stopBreathingSynth() {
  if (breathNodes) {
    try {
      breathNodes.noiseSource.stop();
      breathNodes.osc.stop();
    } catch {
      // Ignored
    }
    breathNodes = null;
  }
}

// Continuous ambient audio loops (for Focus Timer & Meditation)
export function startAmbientSound(type, volume = 0.5) {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  stopAmbientSound();

  if (type === 'none' || !type) return;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(volume, now + 1.2); // smooth fade-in
  masterGain.connect(ctx.destination);

  if (type === 'rain') {
    // Continuous pink noise with LFO-modulated lowpass filter (simulating wind sway)
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = createPinkNoiseBuffer(ctx, 3.0);
    rainSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);

    const windLFO = ctx.createOscillator();
    const windGain = ctx.createGain();
    windLFO.frequency.setValueAtTime(0.08, now); // slow 12s wind cycle
    windGain.gain.setValueAtTime(350, now); // modulate cutoff by +/- 350Hz

    windLFO.connect(windGain).connect(filter.frequency);
    rainSource.connect(filter).connect(masterGain);
    
    rainSource.start(now);
    windLFO.start(now);

    ambientNodes = { sources: [rainSource, windLFO], gainNode: masterGain };
    
  } else if (type === 'waves') {
    // Pink noise modulated by a very slow 12s wave oscillator for rise/fall effect
    const waveSource = ctx.createBufferSource();
    waveSource.buffer = createPinkNoiseBuffer(ctx, 3.0);
    waveSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    const waveLFO = ctx.createOscillator();
    waveLFO.frequency.setValueAtTime(0.07, now); // slow rolling waves

    const lfoFilterGain = ctx.createGain();
    lfoFilterGain.gain.setValueAtTime(220, now); // sweeps cutoff between 100Hz and 540Hz

    const lfoVolumeGain = ctx.createGain();
    lfoVolumeGain.gain.setValueAtTime(0.35, now); // sweeps amplitude

    waveLFO.connect(lfoFilterGain).connect(filter.frequency);

    const modulatorGain = ctx.createGain();
    modulatorGain.gain.setValueAtTime(0.45, now); // baseline gain
    waveLFO.connect(lfoVolumeGain).connect(modulatorGain.gain);

    waveSource.connect(filter).connect(modulatorGain).connect(masterGain);

    waveSource.start(now);
    waveLFO.start(now);

    ambientNodes = { sources: [waveSource, waveLFO], gainNode: masterGain };

  } else if (type === 'binaural') {
    // 150Hz Left / 156Hz Right + Low cushion drone (Theta waves)
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(150.0, now);
    
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(156.0, now); // 6Hz difference

    const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    
    const oscLGain = ctx.createGain();
    oscLGain.gain.setValueAtTime(0.2, now);

    const oscRGain = ctx.createGain();
    oscRGain.gain.setValueAtTime(0.2, now);

    // Warm, deep pink noise cushion filter
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createPinkNoiseBuffer(ctx, 3.0);
    noiseSource.loop = true;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(90, now); // deep low-pass
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);

    noiseSource.connect(noiseFilter).connect(noiseGain).connect(masterGain);
    noiseSource.start(now);

    if (pannerL && pannerR) {
      pannerL.pan.setValueAtTime(-1, now);
      pannerR.pan.setValueAtTime(1, now);
      oscL.connect(oscLGain).connect(pannerL).connect(masterGain);
      oscR.connect(oscRGain).connect(pannerR).connect(masterGain);
    } else {
      oscL.connect(oscLGain).connect(masterGain);
      oscR.connect(oscRGain).connect(masterGain);
    }

    oscL.start(now);
    oscR.start(now);

    ambientNodes = { sources: [oscL, oscR, noiseSource], gainNode: masterGain };
  } else if (type === 'drone') {
    // Warm detuned meditation drone
    const baseFreq = 110.0; // A2
    const oscs = [];

    const frequencies = [
      baseFreq - 0.4,
      baseFreq * 1.5 + 0.3, // E3 (fifth)
      baseFreq * 2.0 - 0.2, // A3 (octave)
      baseFreq * 3.0 + 0.5  // E4 (octave + fifth)
    ];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(idx === 3 ? 280 : 160, now);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.04 + idx * 0.02, now); // very slow cycle
      lfoGain.gain.setValueAtTime(0.12, now); // modulate amplitude

      lfo.connect(lfoGain.gain);
      gainNode.gain.setValueAtTime(0.15, now);
      lfoGain.connect(gainNode.gain);

      osc.connect(filter).connect(gainNode).connect(masterGain);
      osc.start(now);
      lfo.start(now);

      oscs.push(osc, lfo);
    });

    ambientNodes = { sources: oscs, gainNode: masterGain };
  }
}

export function setAmbientVolume(volume) {
  if (ambientNodes && ambientNodes.gainNode) {
    const ctx = getAudioContext();
    if (ctx) {
      ambientNodes.gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1);
    }
  }
}

export function stopAmbientSound() {
  if (ambientNodes) {
    ambientNodes.sources.forEach(src => {
      try {
        src.stop();
      } catch {
        // Ignored
      }
    });
    ambientNodes = null;
  }
}
