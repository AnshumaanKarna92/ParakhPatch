import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SkyBackground from './components/SkyBackground';
import IndustrialMachine from './components/IndustrialMachine';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 200, damping: 20 }
    }
};

function Homepage({ onEnter }) {
    const [machineCount, setMachineCount] = useState(0);

    useEffect(() => {
        // Fetch machine count
        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
        fetch(`${apiUrl}/machines`)
            .then(res => res.json())
            .then(data => setMachineCount(data.length))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col justify-center items-start px-20 py-16">
            {/* 3D Sky Background with Parallax & Breathing Clouds */}
            <SkyBackground enableParallax={true} />

            {/* Main Content (Left Aligned) */}
            <motion.div
                className="relative z-10 max-w-2xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    variants={itemVariants}
                    className="inline-block px-5 py-2.5 rounded-full glass glass-border text-sky-600 text-xs font-semibold tracking-wider uppercase mb-8"
                >
                    System Online • {machineCount} Machine{machineCount !== 1 ? 's' : ''} Connected
                </motion.div>

                <h1 className="text-8xl font-display font-semibold mb-8 leading-tight">
                    <motion.span variants={itemVariants} className="block text-slate-900">
                        Predictive AI for
                    </motion.span>
                    <motion.span variants={itemVariants} className="block bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">
                        Industrial IoT.
                    </motion.span>
                </h1>

                <motion.p
                    variants={itemVariants}
                    className="text-xl text-slate-600 font-medium mb-14 max-w-xl leading-relaxed"
                >
                    Monitor your critical infrastructure with enterprise-grade anomaly detection.
                    Reduce downtime by 40% with real-time liquid intelligence.
                </motion.p>

                <motion.button
                    variants={itemVariants}
                    onClick={onEnter}
                    whileHover={{ x: 5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass glass-border px-12 py-6 rounded-full font-display font-semibold text-lg text-sky-600 shadow-float hover:shadow-float-hover transition-all flex items-center gap-3"
                >
                    <span>Launch Dashboard</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </motion.button>

                <motion.div
                    variants={itemVariants}
                    className="flex gap-6 mt-16"
                >
                    {[
                        { label: 'Neural Core', color: 'bg-sky-500' },
                        { label: 'Real-Time Sync', color: 'bg-emerald-500' },
                        { label: 'Auto-Scaling', color: 'bg-amber-500' }
                    ].map((feature, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -3 }}
                            className="glass glass-border px-8 py-4 rounded-full flex items-center gap-3 cursor-default text-sm font-medium text-slate-900"
                        >
                            <span className={`w-2 h-2 rounded-full ${feature.color} shadow-lg`} />
                            {feature.label}
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>

            {/* Large Centered 3D Industrial Machine (Right Half) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 100, damping: 20 }}
                className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block"
            >
                <div className="w-full h-full">
                    <IndustrialMachine />
                </div>
            </motion.div>
        </div>
    );
}

export default Homepage;
