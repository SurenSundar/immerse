import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Float } from '@react-three/drei';

function DigitalRain({ count = 200 }) {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Increase range to cover full screen
    const drops = useMemo(() => {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push({
                x: (Math.random() - 0.5) * 60,
                y: (Math.random() - 0.5) * 40,
                z: (Math.random() - 0.5) * 30 - 10,
                speed: 0.1 + Math.random() * 0.3,
                len: Math.random() * 2 + 1
            });
        }
        return data;
    }, [count]);

    useFrame(() => {
        if (!mesh.current) return;

        drops.forEach((drop, i) => {
            drop.y -= drop.speed;
            if (drop.y < -25) {
                drop.y = 25;
                drop.x = (Math.random() - 0.5) * 60;
            }

            dummy.position.set(drop.x, drop.y, drop.z);
            dummy.scale.set(0.08, drop.len, 0.08); // Thicker, more visible lines
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#00ffaa" transparent opacity={0.6} toneMapped={false} />
        </instancedMesh>
    );
}

function FloatingGeometry() {
    return (
        <Float speed={2} rotationIntensity={0.6} floatIntensity={1}>
            <group rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                {/* Main Crystal */}
                <mesh>
                    <octahedronGeometry args={[2.5, 0]} />
                    <meshBasicMaterial color="black" wireframe />
                </mesh>
                <mesh>
                    <octahedronGeometry args={[2.5, 0]} />
                    <meshBasicMaterial color="#00ffaa" transparent opacity={0.1} side={THREE.DoubleSide} />
                </mesh>

                {/* Inner Core */}
                <mesh scale={[0.5, 0.5, 0.5]}>
                    <icosahedronGeometry args={[2, 0]} />
                    <meshBasicMaterial color="#ff0055" wireframe transparent opacity={0.8} />
                </mesh>
            </group>
        </Float>
    )
}

function CameraRig() {
    useFrame(({ camera, mouse }) => {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 2, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.y * 2, 0.05);
        camera.lookAt(0, 0, 0);
    });
    return null;
}

function BackgroundGrid() {
    return (
        <group position={[0, -10, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <gridHelper args={[100, 40, "#111", "#050505"]} />
        </group>
    )
}

function SceneContent() {
    return (
        <>
            <color attach="background" args={['#050505']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00ffaa" />

            <DigitalRain count={400} />
            <FloatingGeometry />
            <BackgroundGrid />
            <CameraRig />

            <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={0} intensity={1.5} radius={0.8} />
                <Noise opacity={0.05} />
            </EffectComposer>
        </>
    );
}

export default function HeroScene() {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 15], fov: 40 }}>
                <SceneContent />
            </Canvas>
        </div>
    );
}
