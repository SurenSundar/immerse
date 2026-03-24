import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise, Glitch, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

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
        if (mode === 'focus') targetColor.set("#00ffaa");
        else if (mode === 'break') targetColor.set("#ff0055");
        else targetColor.set("#ffffff");

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
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            clearInterval(interval);
            setIsActive(false);
            if (mode === 'focus') {
                setMode('break');
                setTimeLeft(5 * 60);
            } else {
                setMode('idle');
                setTimeLeft(customTime * 60);
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, customTime]);

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
        if (!isActive && mode === 'idle') {
            setMode('focus');
        }
        setIsActive(!isActive);
        setIsEditing(false);
    };

    const resetTimer = () => {
        setIsActive(false);
        setMode('idle');
        setTimeLeft(customTime * 60);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
            <Canvas
                dpr={[1, 2]}
                camera={{ position: [0, 0, 40], fov: 45 }}
                gl={{ toneMapping: THREE.ReinhardToneMapping }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            >
                <color attach="background" args={['#050505']} />
                <FocusParticles count={2500} mode={mode} />
                <EffectComposer disableNormalPass>
                    <Bloom luminanceThreshold={0.2} intensity={1.5} radius={0.5} />
                    <Noise opacity={0.05} />
                    <Vignette darkness={0.6} />
                    {mode === 'break' && <Glitch delay={[0.5, 3]} duration={[0.1, 0.3]} strength={[0.2, 0.4]} />}
                </EffectComposer>
            </Canvas>

            <div
                style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    pointerEvents: 'none', zIndex: 10, display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', color: 'white', fontFamily: 'monospace'
                }}
            >
                <div style={{
                    border: '1px solid rgba(255,255,255,0.3)', padding: '0.5rem 1rem',
                    borderRadius: '20px', marginBottom: '1rem', textTransform: 'uppercase',
                    letterSpacing: '2px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)',
                    color: mode === 'focus' ? '#00ffaa' : mode === 'break' ? '#ff0055' : 'white',
                    borderColor: mode === 'focus' ? '#00ffaa' : mode === 'break' ? '#ff0055' : 'rgba(255,255,255,0.3)'
                }}>
                    {mode === 'idle' ? 'System Idle' : mode === 'focus' ? 'Focus Session' : 'Short Break'}
                </div>

                {/* Editable Timer Display */}
                <div
                    onClick={() => { if (!isActive && mode === 'idle') setIsEditing(true); }}
                    style={{
                        fontSize: '15vmin', fontWeight: 'bold', letterSpacing: '-5px',
                        color: mode === 'break' ? '#ff0055' : 'white',
                        textShadow: '0 0 30px rgba(0,0,0,0.5)', marginBottom: '1rem',
                        lineHeight: 1, cursor: (!isActive && mode === 'idle') ? 'pointer' : 'default',
                        pointerEvents: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}
                >
                    {isEditing ? (
                        <input
                            type="number"
                            value={customTime}
                            onChange={handleTimeChange}
                            onBlur={() => setIsEditing(false)}
                            autoFocus
                            min="1" max="120"
                            style={{
                                background: 'transparent', border: 'none', borderBottom: '2px solid white',
                                color: 'inherit', fontSize: 'inherit', fontFamily: 'inherit', fontWeight: 'inherit',
                                textAlign: 'center', width: '3ch', outline: 'none', padding: 0, margin: 0
                            }}
                        />
                    ) : formatTime(timeLeft)}
                </div>

                {(!isActive && mode === 'idle' && !isEditing) && (
                    <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '2rem' }}>
                        (CLICK TIMER TO EDIT)
                    </div>
                )}

                <div style={{ pointerEvents: 'auto', marginBottom: '3rem', opacity: mode === 'break' ? 0 : 1, transition: 'opacity 0.5s', display: isEditing ? 'none' : 'block' }}>
                    <input
                        type="text"
                        placeholder="What are you focusing on?"
                        style={{
                            background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)',
                            color: 'white', fontSize: '1.5rem', textAlign: 'center', width: '400px', maxWidth: '80vw',
                            padding: '0.5rem', outline: 'none', fontFamily: 'monospace'
                        }}
                    />
                </div>

                <div style={{ pointerEvents: 'auto', display: 'flex', gap: '1.5rem' }}>
                    <button
                        onClick={toggleTimer}
                        style={{
                            background: 'white', color: 'black', border: 'none',
                            padding: '1rem 3rem', borderRadius: '8px', fontSize: '1.2rem',
                            fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase',
                            boxShadow: '0 0 20px rgba(255,255,255,0.2)'
                        }}
                    >
                        {isActive ? 'PAUSE' : (mode === 'idle' ? 'START FOCUS' : 'RESUME')}
                    </button>

                    <button
                        onClick={resetTimer}
                        style={{
                            background: 'transparent', color: 'white', border: '1px solid white',
                            padding: '1rem 2rem', borderRadius: '8px', fontSize: '1rem',
                            cursor: 'pointer', textTransform: 'uppercase', opacity: 0.7
                        }}
                    >
                        RESET
                    </button>
                </div>

                <div style={{ position: 'absolute', bottom: '2rem', fontSize: '0.7rem', opacity: 0.4, letterSpacing: '2px' }}>
                    ZONE.3D | IMMERSIVE FOCUS TIMER
                </div>
            </div>
        </div>
    );
}
