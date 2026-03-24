import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshDistortMaterial, Float, Environment, Text, useCursor, SoftShadows, ContactShadows, SpotLight } from '@react-three/drei';
import { EffectComposer, Noise, Vignette, HueSaturation } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Link } from 'react-router-dom';

function LiquidMirror() {
    const mesh = useRef();
    const [hovered, setHover] = useState(false);

    useCursor(hovered);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (mesh.current) {
            // Dramatic distortion animation
            mesh.current.distort = THREE.MathUtils.lerp(mesh.current.distort, hovered ? 0.6 : 0.3, 0.05);
            mesh.current.speed = hovered ? 4 : 2;

            // Gentle Rotation
            mesh.current.rotation.x = Math.sin(t * 0.2) * 0.2;
            mesh.current.rotation.y = Math.cos(t * 0.3) * 0.2;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
            <mesh
                ref={mesh}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
                scale={2.5}
            >
                <sphereGeometry args={[1, 64, 64]} />
                <MeshDistortMaterial
                    distort={0.4}
                    speed={2}
                    color="#000"
                    roughness={0}
                    metalness={1}
                    envMapIntensity={2} // Chrome reflection
                    clearcoat={1}
                    clearcoatRoughness={0}
                />
            </mesh>
        </Float>
    );
}

function FloatingOrbs() {
    const orb = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        orb.current.position.x = Math.sin(t * 0.5) * 4;
        orb.current.position.y = Math.cos(t * 0.3) * 3;
        orb.current.position.z = Math.sin(t * 0.2) * 2 - 2;
    });

    return (
        <mesh ref={orb}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial
                color="#ff0055"
                emissive="#ff0055"
                emissiveIntensity={2}
                roughness={0.2}
                metalness={0.8}
            />
        </mesh>
    )
}

function Scene() {
    return (
        <>
            <color attach="background" args={['#dcdcdc']} />
            {/* Using a light grey background for stark contrast with black chrome heavily inspired by fashion sites */}

            {/* Complex Lighting Setup */}
            <ambientLight intensity={0.5} />
            <SpotLight position={[10, 10, 10]} angle={0.3} penumbra={1} castShadow intensity={2} shadow-mapSize={2048} />
            <Environment preset="studio" /> {/* Studio lighting for perfect reflections */}

            <LiquidMirror />
            <FloatingOrbs />

            <ContactShadows position={[0, -3, 0]} opacity={0.5} scale={20} blur={2} far={4.5} />

            <EffectComposer disableNormalPass>
                <Noise opacity={0.05} />
                <Vignette eskil={false} offset={0.1} darkness={0.5} />
                {/* Desaturate everything slightly except the red orb */}
                <HueSaturation saturation={-0.2} />
            </EffectComposer>
        </>
    );
}

export default function Home() {
    return (
        <>
            {/* Avant-Garde UI */}
            <h1 className="art-title">
                VOID
                <span>REFLECTION</span>
            </h1>

            {/* Vertical Artist Menu */}
            <nav className="nav-vertical">
                <Link to="/about" className="nav-link-art">MANIFESTO</Link>
                <Link to="/timer" className="nav-link-art">SYSTEM</Link>
                <a href="#" className="nav-link-art">SOURCE</a>
            </nav>

            {/* Floating CTA Badge */}
            <Link to="/timer" className="btn-blob">
                ENTER<br />ZONE
            </Link>

            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 35 }}>
                <Scene />
            </Canvas>
        </>
    );
}
