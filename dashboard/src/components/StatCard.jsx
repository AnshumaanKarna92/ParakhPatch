import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import AnimatedNumber from './AnimatedNumber';

const StatCard = ({ label, value, unit = '', status, icon, delay = 0 }) => {
    const statusConfig = {
        success: {
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500',
            text: 'System All Clear',
        },
        info: {
            color: 'text-sky-500',
            bgColor: 'bg-sky-500',
            text: 'Optimal Range',
        },
        warning: {
            color: 'text-amber-500',
            bgColor: 'bg-amber-500',
            text: 'Monitoring',
        },
        danger: {
            color: 'text-red-500',
            bgColor: 'bg-red-500',
            text: 'Critical Alerts',
        },
    };

    const config = statusConfig[status] || statusConfig.info;

    return (
        <GlassCard delay={delay} className="p-8 flex-1 min-h-[200px] flex flex-col justify-between">
            <div>
                <div className="text-xs uppercase tracking-wider text-slate-600 font-semibold mb-4">
                    {label}
                </div>
                <div className="text-6xl font-display font-medium text-slate-900 leading-none">
                    {typeof value === 'number' ? (
                        <>
                            <AnimatedNumber value={value} decimals={label.includes('Temp') ? 1 : 0} />
                            {unit}
                        </>
                    ) : (
                        <span>{value}</span>
                    )}
                </div>
            </div>

            <div className={`flex items-center gap-2 text-sm font-semibold ${config.color} mt-4`}>
                <span className={`w-2 h-2 rounded-full ${config.bgColor} shadow-lg animate-pulse-glow`} />
                {config.text}
            </div>

            {icon && (
                <div className="absolute top-6 right-6 opacity-10">
                    {icon}
                </div>
            )}
        </GlassCard>
    );
};

export default StatCard;
