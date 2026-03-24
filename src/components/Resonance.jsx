import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

const PHASE_COLORS = {
    INHALE: '#00ff9d', // Bright Teal
    HOLD: '#ffffff',   // Pure White
    EXHALE: '#0088ff', // Deep Blue
};

const PATTERNS = {
    BOX: {
        id: 'BOX',
        label: 'BOX BREATHING',
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
        label: '4-7-8 RELAX',
        desc: 'Inhale 4s • Hold 7s • Exhale 8s',
        phases: [
            { name: 'INHALE', duration: 4, scale: 2 },
            { name: 'HOLD', duration: 7, scale: 2 },
            { name: 'EXHALE', duration: 8, scale: 0.5 },
        ]
    },
    ENERGY: {
        id: 'ENERGY',
        label: 'ENERGY AWAKE',
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
    if (!particles.current) {
        particles.current = new Float32Array(count * 3);
        speeds.current = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const r = 1 + Math.random() * 0.5;

            particles.current[i * 3] = r * Math.sin(phi) * Math.cos(theta); // x
            particles.current[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
            particles.current[i * 3 + 2] = r * Math.cos(phi); // z
            speeds.current[i] = Math.random();
        }
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
    const [startTime, setStartTime] = useState(Date.now());
    const groupRef = useRef();

    const pattern = PATTERNS[currentPatternKey];

    useEffect(() => {
        setPhaseIndex(0);
        setStartTime(Date.now());
    }, [currentPatternKey]);

    useFrame(() => {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const currentPhase = pattern.phases[phaseIndex];

        if (elapsed > currentPhase.duration) {
            setPhaseIndex((prev) => (prev + 1) % pattern.phases.length);
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

    const currentPhaseName = pattern.phases[phaseIndex].name;
    const currentColor = PHASE_COLORS[currentPhaseName];

    return (
        <>
            <ambientLight intensity={0.5} />

            {/* 3D CONTENT */}
            <group ref={groupRef} position={[0, 1.5, 0]}>
                <ParticleLung color={currentColor} phaseName={currentPhaseName} />
            </group>

            {/* HTML OVERLAY */}
            <Html center position={[0, -2.5, 0]} style={{ width: '100vw' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>

                    {/* Big Phase Indicator */}
                    <div style={{
                        fontFamily: 'Inter', fontWeight: 800, fontSize: '5rem',
                        color: currentColor, textAlign: 'center',
                        textShadow: `0 0 40px ${currentColor}`,
                        lineHeight: 1, marginBottom: '0.5rem',
                        transition: 'color 0.5s'
                    }}>
                        {currentPhaseName}
                    </div>

                    {/* Pattern Info */}
                    <div style={{
                        textAlign: 'center', color: '#888',
                        fontFamily: 'JetBrains Mono', fontSize: '1rem',
                        maxWidth: '500px', lineHeight: 1.6, marginBottom: '2rem'
                    }}>
                        <strong style={{ color: '#fff', fontSize: '1.2rem', display: 'block', marginBottom: '0.2rem' }}>{pattern.label}</strong>
                        {pattern.desc}
                    </div>

                    {/* Controls */}
                    <div style={{ pointerEvents: 'auto', display: 'flex', gap: '1rem' }}>
                        {Object.values(PATTERNS).map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setCurrentPatternKey(p.id)}
                                style={{
                                    background: currentPatternKey === p.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                                    color: currentPatternKey === p.id ? '#fff' : '#888',
                                    border: `1px solid ${currentPatternKey === p.id ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    fontFamily: 'JetBrains Mono',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textTransform: 'uppercase',
                                    fontSize: '0.8rem',
                                    letterSpacing: '1px'
                                }}
                            >
                                {p.label.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>
            </Html>

            <EffectComposer>
                <Bloom luminanceThreshold={0} intensity={1} radius={0.8} />
            </EffectComposer>
        </>
    )
}

export default function Resonance() {
    return (
        <div style={{ width: '100%', height: '100vh', background: '#050505' }}>
            <Canvas camera={{ position: [0, 0, 8] }}>
                <ResonanceScene />
                <OrbitControls enableZoom={false} enableRotate={false} />
            </Canvas>
        </div>
    )
}
