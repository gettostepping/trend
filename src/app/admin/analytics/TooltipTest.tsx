'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import styles from './geographic.module.css';

export default function TooltipTest() {
    const [isHovering, setIsHovering] = useState(false);
    
    // Smooth spring animation for tooltip following cursor
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    // More stable spring config - lower stiffness, higher damping for smoother motion
    const smoothX = useSpring(mouseX, { stiffness: 400, damping: 60, mass: 0.8 });
    const smoothY = useSpring(mouseY, { stiffness: 400, damping: 60, mass: 0.8 });
    const rafRef = useRef<number | null>(null);
    const lastUpdateTime = useRef<number>(0);
    const pendingUpdate = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const updatePosition = () => {
            const now = performance.now();
            // Throttle to max 60fps (16.67ms between updates)
            if (now - lastUpdateTime.current >= 16) {
                if (pendingUpdate.current) {
                    mouseX.set(pendingUpdate.current.x);
                    mouseY.set(pendingUpdate.current.y);
                    pendingUpdate.current = null;
                    lastUpdateTime.current = now;
                }
            }
            rafRef.current = null;
        };

        const handleMouseMove = (e: MouseEvent) => {
            // Store the latest position
            pendingUpdate.current = {
                x: e.clientX + 20,
                y: e.clientY + 20,
            };

            // Only schedule one RAF at a time
            if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(updatePosition);
            }
        };

        if (isHovering) {
            window.addEventListener('mousemove', handleMouseMove, { passive: true });
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            pendingUpdate.current = null;
        };
    }, [isHovering, mouseX, mouseY]);

    return (
        <div
            style={{
                padding: '2rem',
                background: '#2a2a2a',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '2rem',
            }}
        >
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Tooltip Test Area</h3>
            <p style={{ color: '#aaa', marginBottom: '1rem' }}>Hover over the box below to see the tooltip</p>
            <div
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                style={{
                    width: '100%',
                    height: '150px',
                    background: '#1a1a1a',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#aaa',
                    cursor: 'pointer',
                }}
            >
                <span>Hover here to see tooltip</span>
            </div>

            {/* Tooltip */}
            {isHovering && (
                <motion.div
                    style={{
                        position: 'fixed',
                        left: smoothX,
                        top: smoothY,
                        pointerEvents: 'none',
                        zIndex: 9999,
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                        opacity: 1, 
                        scale: 1,
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                        duration: 0.2,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                >
                    <div className={styles.tooltipContent}>
                        <div className={styles.tooltipCountry}>Test Country</div>
                        <div className={styles.tooltipCount}>
                            1,234 requests
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
