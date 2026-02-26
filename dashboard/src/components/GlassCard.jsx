import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const GlassCard = ({
    children,
    className = '',
    variant = 'default',
    hoverable = true,
    delay = 0,
    ...props
}) => {
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Parallax tilt effect
    const rotateX = useTransform(y, [-100, 100], [2, -2]);
    const rotateY = useTransform(x, [-100, 100], [-2, 2]);

    const handleMouseMove = (e) => {
        if (!ref.current || !hoverable) return;

        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        x.set((e.clientX - centerX) / 5);
        y.set((e.clientY - centerY) / 5);

        // Update CSS custom property for shimmer effect
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        ref.current.style.setProperty('--mouse-x', `${mouseX}px`);
        ref.current.style.setProperty('--mouse-y', `${mouseY}px`);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Variant styles
    const variants = {
        default: 'glass glass-border',
        alert: 'bg-red-50/40 backdrop-blur-[45px] backdrop-saturate-[160%] border border-red-200/40 border-t-red-100/60',
        success: 'bg-emerald-50/30 backdrop-blur-[45px] backdrop-saturate-[160%] border border-emerald-200/40 border-t-emerald-100/60',
    };

    const baseClasses = `
    rounded-[32px] 
    shadow-float
    relative 
    overflow-hidden
    transition-all 
    duration-300
    ${variants[variant]}
    ${className}
  `;

    return (
        <motion.div
            ref={ref}
            className={baseClasses}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={hoverable ? {
                y: -8,
                scale: 1.01,
                boxShadow: '0 20px 50px -12px rgba(14, 165, 233, 0.25), 0 8px 24px -6px rgba(14, 165, 233, 0.1)',
            } : {}}
            transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: delay,
            }}
            style={{
                rotateX: hoverable ? rotateX : 0,
                rotateY: hoverable ? rotateY : 0,
                transformStyle: 'preserve-3d',
            }}
            {...props}
        >
            {/* Inner light gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none rounded-[32px]" />

            {/* Shimmer effect on hover */}
            {hoverable && (
                <div
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-overlay rounded-[32px]"
                    style={{
                        background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.8), transparent 40%)',
                    }}
                />
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};

export default GlassCard;
