import React from 'react';
import GlassCard from './GlassCard';
import AnimatedNumber from './AnimatedNumber';

const EnergyPanel = ({ savings = 0, delay = 0 }) => {
    return (
        <GlassCard
            delay={delay}
            variant="success"
            className="p-8 flex-1 min-h-[200px] relative overflow-hidden"
        >
            {/* Shimmer effect */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </div>

            <div className="relative z-10 flex items-center justify-between h-full">
                <div>
                    <div className="text-xs uppercase tracking-wider text-emerald-700 font-semibold mb-4">
                        Energy Saved
                    </div>
                    <div className="text-6xl font-display font-medium text-emerald-900 leading-none">
                        ₹<AnimatedNumber value={savings} decimals={0} />
                    </div>
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center text-emerald-600 shadow-lg">
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                </div>
            </div>
        </GlassCard>
    );
};

export default EnergyPanel;
