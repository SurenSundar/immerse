import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Sparkles, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function RotatingGrid() {
    const mesh = useRef();
    useFrame((state) => {
        mesh.current.rotation.z = state.clock.getElapsedTime() * 0.05;
        mesh.current.rotation.x = Math.PI / 4;
    });

    return (
        <group>
            {/* Hexagonal grid feel */}
            <mesh ref={mesh} position={[0, -2, -10]}>
                <planeGeometry args={[100, 100, 64, 64]} />
                <meshBasicMaterial
                    color="#006655"
                    wireframe
                    transparent opacity={0.1}
                />
            </mesh>
            <mesh rotation={[-Math.PI / 4, 0, 0]} position={[0, 2, -10]}>
                <planeGeometry args={[100, 100, 64, 64]} />
                <meshBasicMaterial
                    color="#441166"
                    wireframe
                    transparent opacity={0.05}
                />
            </mesh>
        </group>
    )
}

function FloatingOrbs() {
    const group = useRef();

    // Abstract shapes floating slowly
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (group.current) {
            group.current.children.forEach((child, i) => {
                child.position.y = Math.sin(t * 0.5 + i) * 2;
                child.rotation.x = t * 0.2 + i;
            });
            group.current.rotation.y = t * 0.05;
        }
    });

    return (
        <group ref={group}>
            <mesh position={[5, 0, -5]}>
                <icosahedronGeometry args={[1, 0]} />
                <meshBasicMaterial color="#00ff9d" wireframe transparent opacity={0.2} />
            </mesh>
            <mesh position={[-5, 2, -8]}>
                <octahedronGeometry args={[2, 0]} />
                <meshBasicMaterial color="#7f00ff" wireframe transparent opacity={0.1} />
            </mesh>
            <mesh position={[0, -4, -2]}>
                <sphereGeometry args={[0.5, 16, 16]} />
                <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.1} />
            </mesh>
        </group>
    )
}

export default function BackgroundScene() {
    return (
        <>
            <color attach="background" args={['#050508']} />
            <fog attach="fog" args={['#050508', 5, 25]} />

            <RotatingGrid />
            <FloatingOrbs />
            <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
            <Sparkles count={200} size={2} opacity={0.5} scale={[20, 10, 20]} />

            <ambientLight intensity={0.5} />

            {/* Camera subtle movement */}
            <OrbitControls enableZoom={false} enableRotate={false} autoRotate autoRotateSpeed={0.2} />
        </>
    );
}
