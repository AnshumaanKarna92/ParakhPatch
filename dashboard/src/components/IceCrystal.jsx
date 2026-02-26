import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

function Crystal({ mousePosition }) {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            // Rotate based on mouse position
            meshRef.current.rotation.x = THREE.MathUtils.lerp(
                meshRef.current.rotation.x,
                mousePosition.y * 0.5,
                0.05
            );
            meshRef.current.rotation.y = THREE.MathUtils.lerp(
                meshRef.current.rotation.y,
                mousePosition.x * 0.5,
                0.05
            );

            // Gentle floating animation
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;

            // Scale on hover
            const targetScale = hovered ? 1.15 : 1;
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }
    });

    return (
        <mesh
            ref={meshRef}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <icosahedronGeometry args={[1.2, 1]} />
            <MeshTransmissionMaterial
                backside
                samples={16}
                resolution={512}
                transmission={0.95}
                roughness={0.1}
                thickness={0.5}
                ior={1.5}
                chromaticAberration={0.5}
                anisotropy={1}
                distortion={0.3}
                distortionScale={0.2}
                temporalDistortion={0.1}
                color="#38bdf8"
                attenuationDistance={0.5}
                attenuationColor="#0ea5e9"
            />
        </mesh>
    );
}

function ParticleField() {
    const particlesRef = useRef();
    const particleCount = 100;

    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    useFrame((state) => {
        if (particlesRef.current) {
            particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                color="#0ea5e9"
                transparent
                opacity={0.6}
                sizeAttenuation
            />
        </points>
    );
}

export default function IceCrystal() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: -(e.clientY / window.innerHeight) * 2 + 1,
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="w-full h-full"
            style={{ cursor: 'grab' }}
        >
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                dpr={[1, 2]}
                gl={{ alpha: true, antialias: true }}
            >
                <color attach="background" args={['transparent']} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#0ea5e9" />

                <Crystal mousePosition={mousePosition} />
                <ParticleField />

                <Environment preset="city" />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.5}
                />
            </Canvas>
        </motion.div>
    );
}
