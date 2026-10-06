import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { TbVolume, TbVolumeOff, TbMicrophone, TbMicrophoneOff } from 'react-icons/tb';
import { getAudioContext, playSingingBowl, startBreathingSynth, stopBreathingSynth } from '../utils/zenAudio';
import { hasBreathVoice, guidePhase, preloadBreathClips, speakBreath, stopBreathVoice } from '../utils/breathVoice';

const VOICE_KEY = 'mm-breath-voice';
const VOICE_STYLE_KEY = 'mm-breath-voice-style';
const readPref = (key, fallback) => {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
const writePref = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
};

const PHASE_COLORS = {
    INHALE: '#00ff9d', // Bright Teal
    HOLD: '#00b8ff',   // Cyan
    EXHALE: '#0088ff', // Deep Blue
};

const PATTERNS = {
    BOX: {
        id: 'BOX',
        label: 'Box breathing',
        short: 'Box',
        desc: 'Inhale 4s • Hold 4s • Exhale 4s • Hold 4s',
        phases: [
            { name: 'INHALE', duration: 4, scale: 2 },
            { name: 'HOLD', duration: 4, scale: 2 },
            { name: 'EXHALE', duration: 4, scale: 0.5 },
            { name: 'HOLD', duration: 4, scale: 0.5 },
        ]
    },
    RELAX: {
        id: 'RELAX',
        label: '4-7-8 relax',
        short: '4-7-8',
        desc: 'Inhale 4s • Hold 7s • Exhale 8s',
        phases: [
            { name: 'INHALE', duration: 4, scale: 2 },
            { name: 'HOLD', duration: 7, scale: 2 },
            { name: 'EXHALE', duration: 8, scale: 0.5 },
        ]
    },
    ENERGY: {
        id: 'ENERGY',
        label: 'Energy awake',
        short: 'Energy',
        desc: 'Inhale 6s • Exhale 2s',
        phases: [
            { name: 'INHALE', duration: 6, scale: 2 },
            { name: 'EXHALE', duration: 2, scale: 0.5 },
        ]
    }
};

function ParticleLung({ color, phaseName }) {
    const mesh = useRef();
    const count = 2000;

    // Using refs for stable arrays
    const particles = useRef(null);
    const speeds = useRef(null);

    // Initialize
    const particlesData = useMemo(() => {
        const p = new Float32Array(count * 3);
        const s = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const r = 1 + Math.random() * 0.5;

            p[i * 3] = r * Math.sin(phi) * Math.cos(theta); // x
            p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
            p[i * 3 + 2] = r * Math.cos(phi); // z
            s[i] = Math.random();
        }
        return { p, s };
    }, []);

    if (!particles.current) {
        particles.current = particlesData.p;
        speeds.current = particlesData.s;
    }

    const dummy = useRef(new THREE.Object3D());

    // Color Transition Logic
    const colorRef = useRef(new THREE.Color(color));
    const targetColorRef = useRef(new THREE.Color(color));

    useEffect(() => {
        targetColorRef.current.set(color);
    }, [color]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        // Smoothly lerp color
        colorRef.current.lerp(targetColorRef.current, 0.05);
        if (mesh.current) {
            mesh.current.material.color.copy(colorRef.current);
        }

        for (let i = 0; i < count; i++) {
            let x = particles.current[i * 3];
            let y = particles.current[i * 3 + 1];
            let z = particles.current[i * 3 + 2];

            const speed = speeds.current[i];
            const swirl = Math.sin(t * speed + x);

            dummy.current.position.set(
                x * (1 + swirl * 0.1),
                y * (1 + swirl * 0.1),
                z * (1 + swirl * 0.1)
            );

            dummy.current.rotation.x = t * speed;
            dummy.current.rotation.y = t * speed * 0.5;
            dummy.current.scale.setScalar(0.02); // Particle size

            dummy.current.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.current.matrix);
        }
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshBasicMaterial transparent opacity={0.6} />
        </instancedMesh>
    );
}

function ResonanceScene() {
    const [currentPatternKey, setCurrentPatternKey] = useState('BOX');
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [startTime, setStartTime] = useState(() => Date.now());
    const [timeLeft, setTimeLeft] = useState(4); // default to 4 since BOX inhale is 4s
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [soundVolume, setSoundVolume] = useState(0.4);
    const [isVoiceOn, setIsVoiceOn] = useState(() => hasBreathVoice() && readPref(VOICE_KEY, 'off') === 'on');
    const [voiceStyle, setVoiceStyle] = useState(() => (readPref(VOICE_STYLE_KEY, 'cues') === 'counts' ? 'counts' : 'cues'));
    const [isMobile, setIsMobile] = useState(false);
    const groupRef = useRef();

    useEffect(() => {
        const media = window.matchMedia('(max-width: 768px)');
        setIsMobile(media.matches);
        const listener = (e) => setIsMobile(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);

    const pattern = PATTERNS[currentPatternKey];

    // Safety guard for pattern changes before phaseIndex state resets
    const safePhaseIndex = phaseIndex >= pattern.phases.length ? 0 : phaseIndex;

    useEffect(() => {
        setPhaseIndex(0);
        setStartTime(Date.now());
        setTimeLeft(pattern.phases[0].duration);
    }, [currentPatternKey, pattern]);

    // Handle phase audio triggers
    const currentPhase = pattern.phases[safePhaseIndex];
    const currentPhaseName = currentPhase.name;
    const duration = currentPhase.duration;

    // Read volume through a ref so dragging the slider doesn't restart the phase audio
    const soundVolumeRef = useRef(soundVolume);
    useEffect(() => { soundVolumeRef.current = soundVolume; }, [soundVolume]);

    // Duck the breathing synth a little while the voice guide is speaking
    const isVoiceOnRef = useRef(isVoiceOn);
    useEffect(() => { isVoiceOnRef.current = isVoiceOn; }, [isVoiceOn]);

    useEffect(() => {
        if (isSoundEnabled) {
            getAudioContext();
            // Subtle transition tone (G4 Singing Bowl)
            playSingingBowl(392.00, 1.8, soundVolumeRef.current * 0.35);
            // Dynamic breathing synth
            startBreathingSynth(currentPhaseName, duration, soundVolumeRef.current * (isVoiceOnRef.current ? 0.6 : 1));
        } else {
            stopBreathingSynth();
        }

        return () => {
            stopBreathingSynth();
        };
    }, [safePhaseIndex, currentPatternKey, isSoundEnabled, currentPhaseName, duration]);

    const phaseStartRef = useRef(startTime);
    useEffect(() => { phaseStartRef.current = startTime; }, [startTime]);

    // Spoken guide at the start of each phase (and each second in counts mode)
    useEffect(() => {
        if (!isVoiceOn) return undefined;
        return guidePhase(currentPhaseName, duration, voiceStyle, Date.now() - phaseStartRef.current);
    }, [safePhaseIndex, currentPatternKey, isVoiceOn, voiceStyle, currentPhaseName, duration]);

    useEffect(() => () => stopBreathVoice(), []);

    const toggleVoice = () => {
        const next = !isVoiceOn;
        setIsVoiceOn(next);
        writePref(VOICE_KEY, next ? 'on' : 'off');
        // Start audio inside the tap so iOS/Safari allow the voice for later phases
        if (next) { getAudioContext(); preloadBreathClips(); speakBreath(' '); }
        else stopBreathVoice();
    };

    const chooseVoiceStyle = (style) => {
        setVoiceStyle(style);
        writePref(VOICE_STYLE_KEY, style);
    };

    useFrame(() => {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        
        // Double safety check inside frame loop
        const framePhaseIndex = phaseIndex >= pattern.phases.length ? 0 : phaseIndex;
        const currentPhase = pattern.phases[framePhaseIndex];

        // Update time left (ceiling to show full seconds, maxing out at 1)
        setTimeLeft(Math.max(1, Math.ceil(currentPhase.duration - elapsed)));

        if (elapsed > currentPhase.duration) {
            setPhaseIndex((prev) => {
                const nextIdx = (prev + 1) % pattern.phases.length;
                return nextIdx >= pattern.phases.length ? 0 : nextIdx;
            });
            setStartTime(now);
        }

        const p = Math.min(elapsed / currentPhase.duration, 1);

        // Easing logic
        let s = 1;
        if (currentPhase.name === 'INHALE') {
            const ease = 1 - Math.pow(1 - p, 3);
            s = 0.5 + ease * 1.5;
        } else if (currentPhase.name === 'HOLD') {
            s = currentPhase.scale;
        } else if (currentPhase.name === 'EXHALE') {
            const ease = 1 - Math.pow(1 - p, 3);
            s = 2 - ease * 1.5;
        }

        if (groupRef.current) {
            groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, s, 0.05));
            groupRef.current.rotation.y += 0.002;
        }
    });

    const currentColor = PHASE_COLORS[currentPhaseName];

    return (
        <>
            <ambientLight intensity={0.5} />

            {/* 3D CONTENT */}
            <group ref={groupRef} position={[0, 1.2, 0]}>
                <ParticleLung color={currentColor} phaseName={currentPhaseName} />
            </group>

            {/* HTML OVERLAY */}
            <Html center position={isMobile ? [0, -1.8, 0] : [0, -2.5, 0]} style={{ width: '100vw' }}>
                <div className="breathe-ui">
                    <div className="breathe-phase" style={{ color: currentColor }}>
                        {currentPhaseName.toLowerCase()}
                    </div>
                    <div className="breathe-count">{timeLeft}s</div>

                    <p className="breathe-info">
                        <strong>{pattern.label}</strong>
                        {pattern.desc}
                        <small>Breathe gently. Stop if you feel dizzy, and breathe normally anytime.</small>
                    </p>

                    <div className="mm-chips breathe-patterns" role="group" aria-label="Breathing pattern">
                        {Object.values(PATTERNS).map((p) => (
                            <button
                                key={p.id}
                                className={`mm-chip ${currentPatternKey === p.id ? 'is-on' : ''}`}
                                aria-pressed={currentPatternKey === p.id}
                                onClick={() => {
                                    getAudioContext();
                                    setCurrentPatternKey(p.id);
                                }}
                            >
                                {p.short}
                            </button>
                        ))}
                    </div>

                    <div className="mm-panel breathe-sound">
                        <button
                            className="mm-btn mm-btn--ghost mm-btn--sm"
                            onClick={() => {
                                getAudioContext();
                                setIsSoundEnabled(!isSoundEnabled);
                            }}
                            aria-pressed={isSoundEnabled}
                        >
                            {isSoundEnabled ? <TbVolume size={18} /> : <TbVolumeOff size={18} />}
                            {isSoundEnabled ? 'Sound on' : 'Sound off'}
                        </button>
                        <span className="breathe-sound__divider" />
                        <input
                            type="range"
                            className="mm-range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={soundVolume}
                            onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                            disabled={!isSoundEnabled}
                            aria-label="Breathing sound volume"
                        />
                    </div>

                    {hasBreathVoice() && (
                        <div className="mm-panel breathe-sound breathe-voice">
                            <button
                                className="mm-btn mm-btn--ghost mm-btn--sm"
                                onClick={toggleVoice}
                                aria-pressed={isVoiceOn}
                            >
                                {isVoiceOn ? <TbMicrophone size={18} /> : <TbMicrophoneOff size={18} />}
                                {isVoiceOn ? 'Voice on' : 'Voice off'}
                            </button>
                            <span className="breathe-sound__divider" />
                            <div className="mm-chips" role="group" aria-label="Voice guide style">
                                {[['cues', 'Cues'], ['counts', 'Counts']].map(([id, label]) => (
                                    <button
                                        key={id}
                                        className={`mm-chip ${voiceStyle === id ? 'is-on' : ''}`}
                                        aria-pressed={voiceStyle === id}
                                        disabled={!isVoiceOn}
                                        onClick={() => chooseVoiceStyle(id)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Html>

            <EffectComposer>
                <Bloom luminanceThreshold={0} intensity={1} radius={0.8} />
            </EffectComposer>
        </>
    )
}

export default function Resonance() {
    useEffect(() => {
        return () => { stopBreathingSynth(); stopBreathVoice(); }; // Clean up audio nodes
    }, []);

    return (
        <div className="breathe-page">
            <div className="hero-ambient-bg"></div>

            <Canvas camera={{ position: [0, 0, 8] }}>
                <ResonanceScene />
                <OrbitControls enableZoom={false} enableRotate={false} enablePan={false} />
            </Canvas>
        </div>
    )
}
