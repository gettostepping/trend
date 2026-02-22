'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useMotionValueEvent } from 'framer-motion';

interface CustomCursorProps {
    children: React.ReactNode;
    showCursor?: boolean;
}

export function CustomCursorProvider({ children, showCursor = true }: CustomCursorProps) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Always update mouse position when mouse moves
            setMousePosition({
                x: e.clientX,
                y: e.clientY,
            });
        };

        const handleMouseEnter = (e: MouseEvent) => {
            setIsHovering(true);
            // Initialize position on enter
            setMousePosition({
                x: e.clientX,
                y: e.clientY,
            });
        };

        const handleMouseLeave = () => {
            setIsHovering(false);
        };

        // Use capture phase to ensure we catch all events
        container.addEventListener('mousemove', handleMouseMove, { passive: true });
        container.addEventListener('mouseenter', handleMouseEnter as any, { passive: true });
        container.addEventListener('mouseleave', handleMouseLeave, { passive: true });

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseenter', handleMouseEnter as any);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
            {children}
            {showCursor && isHovering && (
                <CustomCursor mouseX={mousePosition.x} mouseY={mousePosition.y} />
            )}
        </div>
    );
}

interface CustomCursorComponentProps {
    mouseX: number;
    mouseY: number;
}

function CustomCursor({ mouseX, mouseY }: CustomCursorComponentProps) {
    const x = useMotionValue(mouseX);
    const y = useMotionValue(mouseY);
    // More responsive spring - higher stiffness, lower damping for fast movement
    const springConfig = { damping: 20, stiffness: 500 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    // Update motion values when mouse position changes - use requestAnimationFrame for smooth updates
    useEffect(() => {
        const rafId = requestAnimationFrame(() => {
            x.set(mouseX);
            y.set(mouseY);
        });
        return () => cancelAnimationFrame(rafId);
    }, [mouseX, mouseY, x, y]);

    return (
        <motion.div
            style={{
                position: 'fixed',
                left: springX,
                top: springY,
                pointerEvents: 'none',
                zIndex: 10000,
                transform: 'translate(-2px, -4px)', // Offset so tip aligns with mouse
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 40 40"
                width="24"
                height="24"
                style={{
                    pointerEvents: 'none',
                    fill: 'white',
                    filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))',
                }}
            >
                <path
                    fill="white"
                    d="M1.8 4.4 7 36.2c.3 1.8 2.6 2.3 3.6.8l3.9-5.7c1.7-2.5 4.5-4.1 7.5-4.3l6.9-.5c1.8-.1 2.5-2.4 1.1-3.5L5 2.5c-1.4-1.1-3.5 0-3.3 1.9Z"
                />
            </svg>
        </motion.div>
    );
}

interface CustomCursorFollowProps {
    children: React.ReactNode;
    mouseX: number;
    mouseY: number;
    isHovering: boolean;
    sideOffset?: number;
    alignOffset?: number;
}

export function CustomCursorFollow({
    children,
    mouseX,
    mouseY,
    isHovering,
    sideOffset = 20,
    alignOffset = 0,
}: CustomCursorFollowProps) {
    const springConfig = { damping: 50, stiffness: 500 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    if (!isHovering) return null;

    return (
        <motion.div
            style={{
                position: 'fixed',
                left: x,
                top: y,
                pointerEvents: 'none',
                zIndex: 9999,
                transform: `translate(calc(-50% + ${alignOffset}px), calc(-50% + ${sideOffset}px))`,
            }}
        >
            {children}
        </motion.div>
    );
}

// Hook to get cursor position and hover state
export function useCustomCursor() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY,
            });
        };

        const handleMouseEnter = () => {
            setIsHovering(true);
        };

        const handleMouseLeave = () => {
            setIsHovering(false);
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseenter', handleMouseEnter);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return {
        mouseX: mousePosition.x,
        mouseY: mousePosition.y,
        isHovering,
        containerRef,
    };
}
