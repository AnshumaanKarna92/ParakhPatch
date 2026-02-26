import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Enhanced Particle Cloud System with Parallax
function Particles({ count = 120, mouseX = 0, mouseY = 0 }) {
    const mesh = useRef();
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const time = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.001 + Math.random() * 0.002;
            const x = (Math.random() - 0.5) * 50;
            const y = (Math.random() - 0.5) * 50;
            const z = (Math.random() - 0.5) * 50;
            temp.push({ time, factor, speed, x, y, z });
        }
        return temp;
    }, [count]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(() => {
        particles.forEach((particle, i) => {
            let { time, factor, speed, x, y, z } = particle;
            time = particle.time += speed;

            const s = Math.cos(time) * 0.5 + 0.5;

            // Parallax effect based on mouse position
            const parallaxX = mouseX * 0.5;
            const parallaxY = mouseY * 0.5;

            dummy.position.set(
                x + Math.cos(time / 10) * 3 + parallaxX,
                y + Math.sin(time / 10) * 3 + parallaxY,
                z + Math.cos(time / 10) * 3
            );
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <circleGeometry args={[0.15, 8]} />
            <meshBasicMaterial color="#ffffff" opacity={0.4} transparent />
        </instancedMesh>
    );
}

// Volumetric Cloud Sphere with Breathing Effect
function CloudSphere({ mouseX = 0, mouseY = 0 }) {
    const meshRef = useRef();

    const vertexShader = `
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

    const fragmentShader = `
    uniform float time;
    uniform vec2 mouse;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    // Improved noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      // Sky gradient colors
      vec3 topColor = vec3(0.81, 0.91, 1.0);
      vec3 midColor = vec3(0.73, 0.90, 1.0);
      vec3 bottomColor = vec3(0.97, 0.98, 1.0);
      
      // Gradient based on vertical position
      float gradientFactor = vUv.y;
      vec3 skyColor;
      if (gradientFactor > 0.5) {
        skyColor = mix(midColor, topColor, (gradientFactor - 0.5) * 2.0);
      } else {
        skyColor = mix(bottomColor, midColor, gradientFactor * 2.0);
      }
      
      // Volumetric cloud noise with breathing effect
      vec2 cloudCoord = vUv * 2.5 + vec2(time * 0.015, time * 0.008);
      
      // Multi-layer noise for depth
      float noise1 = snoise(cloudCoord);
      float noise2 = snoise(cloudCoord * 2.0 + vec2(time * 0.01));
      float noise3 = snoise(cloudCoord * 4.0 - vec2(time * 0.005));
      
      // Combine noise layers
      float cloudNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
      
      // Breathing effect (subtle pulsing)
      float breathe = sin(time * 0.3) * 0.15 + 0.85;
      cloudNoise *= breathe;
      
      // Mouse parallax influence
      vec2 mouseInfluence = mouse * 0.3;
      cloudNoise += snoise(cloudCoord + mouseInfluence) * 0.1;
      
      cloudNoise = smoothstep(0.2, 0.8, cloudNoise);
      
      // Soft cloud blending
      vec3 cloudColor = vec3(1.0, 1.0, 1.0);
      skyColor = mix(skyColor, cloudColor, cloudNoise * 0.25);
      
      // Sun glow at top-center
      vec2 sunPos = vec2(0.5, 0.85);
      float sunDist = distance(vUv, sunPos);
      float sunGlow = smoothstep(0.5, 0.0, sunDist);
      vec3 sunColor = vec3(1.0, 1.0, 0.94);
      skyColor = mix(skyColor, sunColor, sunGlow * 0.5);
      
      // Add subtle shimmer
      float shimmer = snoise(vUv * 10.0 + time * 0.5) * 0.02;
      skyColor += shimmer;
      
      gl_FragColor = vec4(skyColor, 1.0);
    }
  `;

    const uniforms = useMemo(
        () => ({
            time: { value: 0 },
            mouse: { value: new THREE.Vector2(0, 0) },
        }),
        []
    );

    useFrame((state) => {
        meshRef.current.material.uniforms.time.value = state.clock.elapsedTime;
        meshRef.current.material.uniforms.mouse.value.set(mouseX * 0.5, mouseY * 0.5);
    });

    return (
        <Sphere ref={meshRef} args={[50, 64, 64]}>
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                side={THREE.BackSide}
            />
        </Sphere>
    );
}

// Main Enhanced Sky Background Component with Mouse Tracking
export default function SkyBackground({ enableParallax = false }) {
    const [mouse, setMouse] = React.useState({ x: 0, y: 0 });

    React.useEffect(() => {
        if (!enableParallax) return;

        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            setMouse({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [enableParallax]);

    return (
        <div className="fixed inset-0 -z-10">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <CloudSphere mouseX={mouse.x} mouseY={mouse.y} />
                <Particles count={enableParallax ? 150 : 100} mouseX={mouse.x} mouseY={mouse.y} />
            </Canvas>
        </div>
    );
}
