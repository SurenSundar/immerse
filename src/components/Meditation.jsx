import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TbPlayerPause, TbPlayerPlay, TbPlayerStop, TbMicrophone, TbMicrophoneOff, TbCheck } from 'react-icons/tb';
import { getAudioContext, playSingingBowl, isGlobalMuted, onGlobalMuteChange } from '../utils/zenAudio';
import { SoundPicker } from './SoundDock';

export default function Meditation() {
  const [phase, setPhase] = useState('settings'); // 'settings' | 'active' | 'complete'
  
  // Settings States
  const [duration, setDuration] = useState(120); // 2m (120s), 5m (300s), 10m (600s)
  const [voices, setVoices] = useState([]);
  const [selectedGender, setSelectedGender] = useState('female'); // 'female' | 'male'
  const [voiceVolume, setVoiceVolume] = useState(0.5);
  const [isMutedGlobalState, setIsMutedGlobalState] = useState(() => isGlobalMuted());

  // Active Meditation States
  const [timeLeft, setTimeLeft] = useState(120);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState('');

  // Breathing guide indicator text (Inhale / Exhale)
  const [breathIndicator, setBreathIndicator] = useState('Inhale');

  const timerRef = useRef(null);
  const breathCycleRef = useRef(null);
  const lastCueRef = useRef(null);

  // Load browser speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      setVoices(allVoices);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Show a notice while the whole site is muted
  useEffect(() => onGlobalMuteChange(setIsMutedGlobalState), []);

  const selectedVoice = useMemo(() => {
    if (voices.length === 0) return null;

    // Filter English voices first, then general
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const candidateVoices = englishVoices.length > 0 ? englishVoices : voices;

    if (selectedGender === 'female') {
      const preferredFemale = ['samantha', 'victoria', 'siri', 'google us english', 'zira', 'karen', 'moira', 'tessa'];
      for (const name of preferredFemale) {
        const found = candidateVoices.find(v => v.name.toLowerCase().includes(name));
        if (found) return found;
      }
      const fallbackFemale = candidateVoices.find(v => {
        const n = v.name.toLowerCase();
        return !n.includes('male') && !n.includes('david') && !n.includes('alex') && !n.includes('daniel') && !n.includes('fred') && !n.includes('george') && !n.includes('oliver');
      });
      return fallbackFemale || candidateVoices[0];
    } else {
      const preferredMale = ['daniel', 'alex', 'david', 'siri', 'google uk english male', 'fred', 'george', 'oliver'];
      for (const name of preferredMale) {
        const found = candidateVoices.find(v => v.name.toLowerCase().includes(name));
        if (found) return found;
      }
      const fallbackMale = candidateVoices.find(v => {
        const n = v.name.toLowerCase();
        return n.includes('male') || n.includes('david') || n.includes('alex') || n.includes('daniel') || n.includes('fred') || n.includes('george') || n.includes('oliver');
      });
      return fallbackMale || candidateVoices[0];
    }
  }, [voices, selectedGender]);

  // Generate meditation script dynamically depending on total duration
  const script = useMemo(() => {
    const percentages = [0, 0.08, 0.22, 0.40, 0.60, 0.78, 0.90];
    const speechLines = [
      "Welcome to this guided meditation. Sit comfortably, rest your hands, and gently close your eyes.",
      "Bring your awareness to your breathing. Observe each inhalation and each exhalation without trying to change it.",
      "As you breathe, consciously release any tension. Relax your forehead, eyes, jaw, and allow your shoulders to drop.",
      "If your thoughts begin to wander, that is normal. Gently and without judgment, bring your focus back to the sensation of breathing.",
      "Feel a deep sense of stillness and peace filling your chest. Breathe in clarity, breathe out any remaining stress.",
      "Enjoy this moment of quiet awareness. There is nothing you need to do, nowhere else you need to be. Just rest in the present.",
      "Slowly bring your awareness back to your surroundings. Wiggle your fingers and toes, and when you are ready, gently open your eyes."
    ];

    const timeline = {};
    percentages.forEach((pct, idx) => {
      const triggerTime = Math.floor(duration * pct);
      timeline[triggerTime] = speechLines[idx];
    });
    return timeline;
  }, [duration]);

  // Speak helper using Web Speech Synthesis
  const speakText = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    try {
      // Cancel active speech to avoid overlaps
      window.speechSynthesis.cancel();
      
      if (isGlobalMuted() || isLocalMuted) return;

      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      // Lock to calming, slow rate and customized soft pitch
      utterance.rate = 0.7; // Very slow and calm rate
      utterance.pitch = selectedGender === 'female' ? 1.3 : 1.25; // 3X softer/lighter pitch (less bassy)
      utterance.volume = voiceVolume; // User adjustable volume
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
    }
  };

  // Timer Countdown and Speech Cues
  useEffect(() => {
    if (phase !== 'active' || !isPlaying) return;

    const elapsed = duration - timeLeft;

    // Check if there is a speech cue for the current elapsed time (skip 0 since handled by click gesture)
    if (elapsed > 0 && script[elapsed] !== undefined && lastCueRef.current !== elapsed) {
      lastCueRef.current = elapsed;
      setActiveSubtitle(script[elapsed]);
      speakText(script[elapsed]);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleMeditationComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isPlaying, timeLeft, duration, script, isLocalMuted]);

  // Breathing Visual Rhythm (8-second cycle: 4s Inhale, 4s Exhale)
  useEffect(() => {
    if (phase !== 'active' || !isPlaying) return;

    const runBreathCycle = () => {
      setBreathIndicator(prev => (prev === 'Inhale' ? 'Exhale' : 'Inhale'));
    };

    breathCycleRef.current = setInterval(runBreathCycle, 4000);

    return () => clearInterval(breathCycleRef.current);
  }, [phase, isPlaying]);

  // Clean up synthesis and audio on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleStart = () => {
    getAudioContext();
    setTimeLeft(duration);
    lastCueRef.current = 0;
    setBreathIndicator('Inhale');
    setPhase('active');
    
    // Play warm bowl chime to start
    playSingingBowl(220, 5.0, 0.7);
    
    // Speak first line immediately under direct user click event context to satisfy browser policies
    setActiveSubtitle(script[0]);
    speakText(script[0]);
  };

  const handleMeditationComplete = () => {
    setPhase('complete');
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Play final high chime
    playSingingBowl(329.63, 6.0, 0.8);
  };

  const togglePlayPause = () => {
    if (typeof window === 'undefined') return;
    
    if (isPlaying) {
      setIsPlaying(false);
      window.speechSynthesis.pause();
    } else {
      setIsPlaying(true);
      window.speechSynthesis.resume();
    }
  };

  const toggleLocalMute = () => {
    if (typeof window === 'undefined') return;

    const nextMute = !isLocalMuted;
    setIsLocalMuted(nextMute);
    
    if (nextMute) {
      window.speechSynthesis.cancel();
    } else {
      // Repeat the current subtitle when unmuting
      speakText(activeSubtitle);
    }
  };

  const endSession = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPhase('settings');
    setIsPlaying(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const DURATIONS = [
    { label: '2 min', value: 120 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 }
  ];
  const VOICES = [
    { id: 'female', label: 'Female guide', desc: 'Soft and soothing' },
    { id: 'male', label: 'Male guide', desc: 'Calm and grounding' }
  ];

  const voiceSlider = (
    <div>
      <div className="med-slider-row">
        <span>Guide voice volume</span>
        <span>{Math.round(voiceVolume * 100)}%</span>
      </div>
      <input
        type="range" className="mm-range"
        min="0.1" max="1.0" step="0.05"
        value={voiceVolume}
        onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
        aria-label="Guide voice volume"
      />
    </div>
  );

  return (
    <div className={`med-page med-page--${phase}`}>
      {phase === 'settings' && (
        <div className="mm-page med-setup">
          <header className="mm-page-header mm-page-header--center">
            <h1>Meditation</h1>
            <p>A gentle voice guides you while you breathe. Choose a length, a guide and the sounds around you.</p>
          </header>

          {isMutedGlobalState && (
            <p className="med-warning">Sound is muted. Tap the speaker icon in the bottom-left corner to hear the guide.</p>
          )}

          <div className="med-grid">
            <section className="mm-panel med-card">
              <div className="med-field">
                <p className="mm-label">Length</p>
                <div className="mm-chips" role="group" aria-label="Session length">
                  {DURATIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`mm-chip ${duration === opt.value ? 'is-on' : ''}`}
                      aria-pressed={duration === opt.value}
                      onClick={() => { setDuration(opt.value); setTimeLeft(opt.value); }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="med-field">
                <p className="mm-label">Guide voice</p>
                <div className="med-voices" role="group" aria-label="Guide voice">
                  {VOICES.map(opt => (
                    <button
                      key={opt.id}
                      className={`med-voice ${selectedGender === opt.id ? 'is-on' : ''}`}
                      aria-pressed={selectedGender === opt.id}
                      onClick={() => setSelectedGender(opt.id)}
                    >
                      {opt.label}
                      <span>{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="med-field">{voiceSlider}</div>

              <button className="mm-btn mm-btn--primary med-begin" onClick={handleStart}>Begin session</button>
              <p className="med-safety">For relaxation only, not medical advice. Stop if you feel unwell.</p>
            </section>

            <section className="mm-panel med-card">
              <p className="mm-label med-sounds-label">Sounds around you (optional)</p>
              <SoundPicker />
            </section>
          </div>
        </div>
      )}

      {phase === 'active' && (
        <div className="med-session">
          <div className="med-ring">
            <div className="med-ring__glow" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
            <div className="med-ring__glow med-ring__glow--2" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
            <span className="med-time">{formatTime(timeLeft)}</span>
          </div>
          <p className="med-cue" style={{ opacity: isPlaying ? 1 : 0.4 }}>{breathIndicator}</p>
          <p className="med-subtitle" aria-live="polite">{activeSubtitle}</p>

          <div className="med-controls">
            <button className="mm-btn" onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Resume'}>
              {isPlaying ? <TbPlayerPause size={22} /> : <TbPlayerPlay size={22} />}
            </button>
            <button className={`mm-btn ${isLocalMuted ? 'is-on' : ''}`} onClick={toggleLocalMute} aria-label={isLocalMuted ? 'Turn guide voice on' : 'Turn guide voice off'} aria-pressed={isLocalMuted}>
              {isLocalMuted ? <TbMicrophoneOff size={20} /> : <TbMicrophone size={20} />}
            </button>
            <button className="mm-btn" onClick={endSession} aria-label="End session">
              <TbPlayerStop size={20} />
            </button>
          </div>

          <div className="mm-panel med-mixer">{voiceSlider}</div>
        </div>
      )}

      {phase === 'complete' && (
        <div className="mm-page med-done">
          <div className="med-done__mark"><TbCheck size={32} /></div>
          <h1 className="med-title">Session complete</h1>
          <p>Your mind is a little quieter. Carry this calm with you into the rest of your day.</p>
          <div className="med-done-actions">
            <button className="mm-btn mm-btn--primary" onClick={() => setPhase('settings')}>Sit again</button>
            <Link to="/" className="mm-btn">Home</Link>
          </div>
        </div>
      )}
    </div>
  );
}
