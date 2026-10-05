import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise, Glitch, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { getAudioContext, playSingingBowl } from '../utils/zenAudio';

// --- Particle Focus Formation ---
function FocusParticles({ count = 2000, mode = "idle" }) {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    const particles = useMemo(() => {
        const data = [];
        for (let i = 0; i < count; i++) {
            const cloudX = (Math.random() - 0.5) * 60;
            const cloudY = (Math.random() - 0.5) * 60;
            const cloudZ = (Math.random() - 0.5) * 60;

            const phi = Math.acos(1 - 2 * (i + 0.5) / count);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            const radius = 12;

            const sphereX = radius * Math.cos(theta) * Math.sin(phi);
            const sphereY = radius * Math.sin(theta) * Math.sin(phi);
            const sphereZ = radius * Math.cos(phi);

            data.push({
                x: cloudX, y: cloudY, z: cloudZ,
                cx: cloudX, cy: cloudY, cz: cloudZ,
                sx: sphereX, sy: sphereY, sz: sphereZ,
                scale: Math.random() * 0.5 + 0.5,
                phase: Math.random() * Math.PI * 2
            });
        }
        return data;
    }, [count]);

    useFrame((state) => {
        if (!mesh.current) return;
        const time = state.clock.getElapsedTime();

        // Color logic
        const targetColor = tempColor;
        if (mode === 'focus') targetColor.set("#00ff9d");
        else if (mode === 'break') targetColor.set("#ff0055");
        else targetColor.set("#00b8ff");

        particles.forEach((p, i) => {
            let destX, destY, destZ;
            if (mode === 'focus') {
                destX = p.sx; destY = p.sy; destZ = p.sz;
            } else {
                destX = p.cx + Math.sin(time * 0.5 + p.phase) * 5;
                destY = p.cy + Math.cos(time * 0.3 + p.phase) * 5;
                destZ = p.cz + Math.sin(time * 0.2 + p.phase) * 5;
            }

            const strength = mode === 'focus' ? 0.04 : 0.02;
            p.x += (destX - p.x) * strength;
            p.y += (destY - p.y) * strength;
            p.z += (destZ - p.z) * strength;

            dummy.position.set(p.x, p.y, p.z);
            dummy.rotation.set(time + p.phase, time * 0.5, 0);
            const s = p.scale + Math.sin(time * 3 + p.phase) * 0.1;
            dummy.scale.setScalar(s);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
            mesh.current.setColorAt(i, targetColor);
        });

        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;

        const rotSpeed = mode === 'focus' ? 0.002 : 0.0005;
        mesh.current.rotation.y += rotSpeed;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <tetrahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
    );
}

// --- Logic ---

export default function FocusTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('idle');
    const [customTime, setCustomTime] = useState(25);
    const [isEditing, setIsEditing] = useState(false);

    // Timer Interval
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setIsActive(false);
                        if (mode === 'focus') {
                            // Focus session complete: play double singing bowl resonance
                            playSingingBowl(146.83, 6.5, 0.8); // Deep D3 bowl
                            setTimeout(() => playSingingBowl(220.00, 5.0, 0.6), 1400); // Higher A3 resonance
                            setMode('break');
                            return 5 * 60;
                        } else {
                            // Break complete: play warning chime
                            playSingingBowl(220.00, 5.0, 0.7); // A3 bowl
                            setMode('idle');
                            return customTime * 60;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, mode, customTime]);


    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleTimeChange = (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 0;
        if (val > 120) val = 120; // Max 2 hours
        setCustomTime(val);
        if (!isActive) setTimeLeft(val * 60);
    };

    const toggleTimer = () => {
        // An empty / zero duration can't be started
        if (!isActive && timeLeft <= 0) return;
        getAudioContext();
        if (!isActive) {
            if (mode === 'idle') {
                setMode('focus');
            }
            // Starting or resuming: play deep singing bowl
            playSingingBowl(220.00, 4.5, 0.65);
        } else {
            // Pausing: play soft crystal pause chime
            playSingingBowl(329.63, 1.8, 0.35);
        }
        setIsActive(!isActive);
        setIsEditing(false);
    };

    const resetTimer = () => {
        getAudioContext();
        // Play grounding reset bowl
        playSingingBowl(164.81, 2.5, 0.45);
        setIsActive(false);
        setMode('idle');
        setTimeLeft(customTime * 60);
    };

    const canEdit = !isActive && mode === 'idle';

    return (
        <div className="focus-page">
            <Canvas
                dpr={[1, 2]}
                camera={{ position: [0, 0, 40], fov: 45 }}
                gl={{ toneMapping: THREE.ReinhardToneMapping }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            >
                <FocusParticles count={2500} mode={mode} />
                <EffectComposer disableNormalPass>
                    <Bloom luminanceThreshold={0.2} intensity={1.5} radius={0.5} />
                    <Noise opacity={0.05} />
                    <Vignette darkness={0.6} />
                    {mode === 'break' && <Glitch delay={[0.5, 3]} duration={[0.1, 0.3]} strength={[0.2, 0.4]} />}
                </EffectComposer>
            </Canvas>

            <div className="focus-overlay">
                <span className={`focus-status focus-status--${mode}`}>
                    {mode === 'idle' ? 'Ready when you are' : mode === 'focus' ? 'Focus session' : 'Short break'}
                </span>

                <div
                    className={`focus-time focus-time--${mode} ${canEdit ? 'is-editable' : ''}`}
                    onClick={() => { if (canEdit) setIsEditing(true); }}
                    role={canEdit ? 'button' : undefined}
                    tabIndex={canEdit && !isEditing ? 0 : undefined}
                    onKeyDown={(e) => { if (canEdit && e.key === 'Enter') setIsEditing(true); }}
                    aria-label={canEdit && !isEditing ? `Session length ${customTime} minutes. Press to change.` : undefined}
                >
                    {isEditing ? (
                        <input
                            type="number"
                            value={customTime}
                            onChange={handleTimeChange}
                            onBlur={() => setIsEditing(false)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setIsEditing(false); }}
                            autoFocus
                            min="1" max="120"
                            aria-label="Session length in minutes"
                        />
                    ) : formatTime(timeLeft)}
                </div>

                {canEdit && !isEditing && (
                    <p className="focus-hint">Tap the time to change the length</p>
                )}

                {!isEditing && mode !== 'break' && (
                    <input
                        type="text"
                        className="mm-input focus-task"
                        placeholder="What are you focusing on?"
                        aria-label="What are you focusing on?"
                    />
                )}

                <div className="focus-actions">
                    <button className="mm-btn mm-btn--primary" onClick={toggleTimer}>
                        {isActive ? 'Pause' : (mode === 'idle' ? 'Start focus' : 'Resume')}
                    </button>
                    <button className="mm-btn" onClick={resetTimer}>Reset</button>
                </div>

                <p className="focus-sound-hint">Add rain, waves or bowls with the Sounds button. They keep playing while you work.</p>
            </div>
        </div>
    );
}
