import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, ContactShadows, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function TurbineBlade({ index, count, radius, length, color, rough, metal }) {
    const angle = (index / count) * Math.PI * 2;
    return (
        <mesh position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]} rotation={[0, 0, angle + 0.5]}>
            <boxGeometry args={[0.08, length, 0.4]} />
            <meshStandardMaterial color={color} roughness={rough} metalness={metal} side={THREE.DoubleSide} />
        </mesh>
    );
}

function TurbineStage({ count, radius, length, zPos, speed, color, rough = 0.2, metal = 0.9, mousePosition }) {
    const group = useRef();
    useFrame((state, delta) => {
        if (group.current) {
            group.current.rotation.z -= delta * speed * (1 + Math.abs(mousePosition.y));
        }
    });
    const blades = useMemo(() => new Array(count).fill(0).map((_, i) => (
        <TurbineBlade key={i} index={i} count={count} radius={radius} length={length} color={color} rough={rough} metal={metal} />
    )), [count, radius, length, color, rough, metal]);

    return (
        <group ref={group} position={[0, 0, zPos]}>
            {blades}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[radius * 0.8, radius * 0.8, 0.5, 32]} />
                <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.4} />
            </mesh>
        </group>
    );
}

function JetEngineCore({ mousePosition, temperature, rpm }) {
    const groupRef = useRef();
    useFrame((state) => {
        const time = state.clock.elapsedTime;
        if (groupRef.current) {
            groupRef.current.position.y = Math.sin(time * 0.5) * 0.2;
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mousePosition.x * 0.8, 0.05);
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mousePosition.y * 0.5, 0.05);
        }
    });

    const coreColor = temperature > 80 ? "#ef4444" : temperature > 60 ? "#f97316" : "#3b82f6";
    const emissiveInt = temperature > 80 ? 4.0 : 2.0;

    return (
        <group ref={groupRef} rotation={[0, Math.PI / 2, 0]} scale={0.65}>
            <TurbineStage count={24} radius={1.8} length={1.2} zPos={2.5} speed={rpm / 5000} color="#e2e8f0" rough={0.1} mousePosition={mousePosition} />
            <TurbineStage count={32} radius={1.4} length={0.9} zPos={1.5} speed={rpm / 4000} color="#94a3b8" mousePosition={mousePosition} />
            <TurbineStage count={40} radius={1.1} length={0.7} zPos={0.8} speed={rpm / 3000} color="#fbbf24" metal={1.0} mousePosition={mousePosition} />
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.9, 1.2, 1.5, 32]} />
                <meshStandardMaterial color="#000000" emissive={coreColor} emissiveIntensity={emissiveInt} toneMapped={false} />
            </mesh>
            <TurbineStage count={32} radius={1.3} length={0.8} zPos={-1.2} speed={rpm / 2500} color="#64748b" mousePosition={mousePosition} />
            <mesh position={[0, 0, -2.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1.0, 1.4, 1.5, 32, 1, true]} />
                <meshStandardMaterial color="#1e293b" roughness={0.5} side={THREE.DoubleSide} emissive={coreColor} emissiveIntensity={0.5} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.5]}>
                <cylinderGeometry args={[2.0, 2.0, 6.0, 64, 1, true]} />
                <meshPhysicalMaterial color="#ffffff" transmission={0.95} opacity={0.3} transparent roughness={0} metalness={0.1} thickness={0.5} ior={1.5} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0, 2.6]}>
                <ringGeometry args={[2.0, 2.05, 64]} />
                <meshBasicMaterial color="#38bdf8" toneMapped={false} />
            </mesh>
        </group>
    );
}

function useFluctuation(baseValue, intensity = 0.5) {
    const [value, setValue] = useState(baseValue);
    useEffect(() => {
        setValue(baseValue);
        if (!baseValue || isNaN(baseValue)) return;
        const interval = setInterval(() => {
            setValue(v => Number((Number(v) + (Math.random() - 0.5) * intensity).toFixed(3)));
        }, 100);
        return () => clearInterval(interval);
    }, [baseValue, intensity]);
    return value;
}

function InfoCard({ label, value, unit, position, color = "#fff" }) {
    const [hover, setHover] = useState(false);
    return (
        <Html position={position} distanceFactor={8} transform>
            <div
                className={`transition-all duration-300 ${hover ? 'scale-110' : 'scale-100'}`}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${color}`,
                    color: '#0f172a',
                    fontFamily: 'Inter, sans-serif',
                    minWidth: '140px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 600, color: '#64748b' }}>{label}</div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ boxShadow: `0 0 6px ${color}` }} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
                    {value}<span style={{ fontSize: '12px', color: '#64748b', marginLeft: '2px' }}>{unit}</span>
                </div>
            </div>
        </Html>
    );
}

export default function HolographicMachine() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [machineData, setMachineData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/machines`);
                const data = await res.json();
                if (data && data.length > 0) setMachineData(data[0]);
            } catch (e) { console.error(e); }
        };
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    const baseRpm = machineData ? (12000 - ((machineData.vibration || machineData.avg_vibration || 0) * 1000)) : 12450;
    const baseTemp = machineData ? (machineData.temperature || machineData.avg_temp || 45.2) : 45.2;
    const baseVib = machineData ? (machineData.vibration || machineData.avg_vibration || 0.012) : 0.012;

    const liveRpm = Number(useFluctuation(baseRpm, 15) || 0).toFixed(0);
    const liveTemp = Number(useFluctuation(baseTemp, 0.1) || 0).toFixed(1);
    const liveVib = Number(useFluctuation(baseVib, 0.002) || 0).toFixed(3);

    const status = machineData && machineData.failure_risk > 0.5 ? "WARNING" : "OPTIMAL";
    const statusColor = status === "WARNING" ? "#f97316" : "#10b981";

    useEffect(() => {
        const handleMouseMove = (e) => setMousePosition({ x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 });
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="w-full h-full bg-transparent">
            <Canvas
                camera={{ position: [8, 2, 8], fov: 35 }}
                dpr={[1, 2]}
                gl={{ antialias: false, alpha: true, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
                onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
            >
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#cbd5e1" />
                <pointLight position={[-10, -10, -5]} intensity={2.0} color="#38bdf8" />
                <spotLight position={[5, 5, 5]} angle={0.5} penumbra={1} intensity={4.0} castShadow color="#ffffff" />
                <JetEngineCore mousePosition={mousePosition} temperature={parseFloat(liveTemp)} rpm={parseFloat(liveRpm)} />
                <group position={[0, -0.5, 0]}>
                    <InfoCard position={[1.6, 1.0, 0]} label="Turbine RPM" value={liveRpm} unit="RPM" color="#38bdf8" />
                    <InfoCard position={[-1.6, -0.6, 0.8]} label="Avg Temp" value={liveTemp} unit="°C" color="#f97316" />
                    <InfoCard position={[0, -1.5, 1.0]} label="Vibration" value={liveVib} unit=" G" color={statusColor} />
                </group>
                <Sparkles count={200} scale={15} size={3} speed={0.2} opacity={0.3} color="#94a3b8" />
                <Sparkles count={150} scale={10} size={6} speed={1.5} opacity={0.6} color="#38bdf8" noise={0.5} />
                <Sparkles count={50} scale={6} size={10} speed={2.0} opacity={1.0} color="#ffffff" />
                <ContactShadows resolution={1024} scale={40} blur={2.5} opacity={0.5} far={10} color="#000000" />
                <Environment preset="city" />
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
}
