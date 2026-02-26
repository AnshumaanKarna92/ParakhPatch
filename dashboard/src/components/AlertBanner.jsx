import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AlertBanner = ({ alerts = [] }) => {
    if (alerts.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="mb-12 flex items-center gap-6 p-6 rounded-3xl bg-red-50/40 backdrop-blur-[40px] backdrop-saturate-[140%] border border-red-200/50 shadow-[0_12px_36px_-8px_rgba(225,29,72,0.15),inset_0_0_20px_rgba(255,255,255,0.4)]"
            >
                {/* Alert Icon */}
                <motion.div
                    className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/60 flex items-center justify-center text-red-600"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </motion.div>

                {/* Alert Text */}
                <div className="flex-1">
                    <h3 className="text-red-700 font-display font-semibold text-base mb-1">
                        System Anomaly Detected
                    </h3>
                    <p className="text-red-600 text-sm font-medium">
                        {alerts.length} machine{alerts.length !== 1 ? 's' : ''} showing critical risk patterns. Immediate review required.
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AlertBanner;
