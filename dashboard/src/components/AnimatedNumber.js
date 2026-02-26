import React, { useEffect } from 'react';
import { useMotionValue, useTransform, animate } from 'framer-motion';

/**
 * AnimatedNumber - Smoothly animates number changes with spring physics
 * @param {number} value - Target value to animate to
 * @param {string} suffix - Optional suffix (e.g., "°C", "%", "g")
 * @param {number} decimals - Number of decimal places (default: 0)
 */
function AnimatedNumber({ value, suffix = '', decimals = 0, className = '' }) {
    const motionValue = useMotionValue(0);
    const rounded = useTransform(motionValue, (latest) => {
        return typeof latest === 'number' ? latest.toFixed(decimals) : '0';
    });

    useEffect(() => {
        const controls = animate(motionValue, value, {
            type: 'spring',
            stiffness: 100,
            damping: 15,
            mass: 0.5
        });

        return controls.stop;
    }, [motionValue, value]);

    return (
        <span className={className}>
            {rounded.get()}{suffix}
        </span>
    );
}

export default AnimatedNumber;
