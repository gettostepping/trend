'use client';

import * as React from 'react';
import { motion, useMotionValue, useSpring, HTMLMotionProps } from 'framer-motion';

// Cursor Provider Context
interface CursorContextValue {
    mouseX: ReturnType<typeof useMotionValue<number>>;
    mouseY: ReturnType<typeof useMotionValue<number>>;
    isHovering: boolean;
    setIsHovering: (value: boolean) => void;
}

const CursorContext = React.createContext<CursorContextValue | null>(null);

export function useCursor() {
    const context = React.useContext(CursorContext);
    if (!context) {
        throw new Error('useCursor must be used within CursorProvider');
    }
    return context;
}

// Cursor Provider
export interface CursorProviderProps {
    children: React.ReactNode;
    global?: boolean;
}

export function CursorProvider({ children, global = false }: CursorProviderProps) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [isHovering, setIsHovering] = React.useState(false);

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        if (global) {
            window.addEventListener('mousemove', handleMouseMove);
            return () => window.removeEventListener('mousemove', handleMouseMove);
        }
    }, [global, mouseX, mouseY]);

    return (
        <CursorContext.Provider value={{ mouseX, mouseY, isHovering, setIsHovering }}>
            {children}
        </CursorContext.Provider>
    );
}

// Cursor Container
export interface CursorContainerProps extends HTMLMotionProps<'div'> {
    children: React.ReactNode;
}

export function CursorContainer({ children, ...props }: CursorContainerProps) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [isHovering, setIsHovering] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Always track mouse position
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
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
    }, [mouseX, mouseY]);

    return (
        <CursorContext.Provider value={{ mouseX, mouseY, isHovering, setIsHovering }}>
            <motion.div ref={containerRef} {...props}>{children}</motion.div>
        </CursorContext.Provider>
    );
}

// Cursor
export interface CursorProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    asChild?: boolean;
    children?: React.ReactNode;
}

export function Cursor({ asChild, children, ...props }: CursorProps) {
    const { mouseX, mouseY, isHovering } = useCursor();
    const springConfig = { damping: 30, stiffness: 300 }; // Smoother, less bouncy
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    // Only show cursor when hovering
    if (!isHovering && !asChild) {
        return null;
    }

    if (asChild && children) {
        return (
            <motion.div
                style={{
                    position: 'fixed',
                    left: x,
                    top: y,
                    pointerEvents: 'none',
                    zIndex: 10000,
                    transform: 'translate(0, 0)', // No centering - tip should be at mouse position
                    opacity: isHovering ? 1 : 0,
                }}
                {...props}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <motion.div
            style={{
                position: 'fixed',
                left: x,
                top: y,
                pointerEvents: 'none',
                zIndex: 10000,
                transform: 'translate(0, 0)', // No centering - tip should be at mouse position
                opacity: isHovering ? 1 : 0,
                display: isHovering ? 'block' : 'none',
            }}
            {...props}
        >
            {children}
        </motion.div>
    );
}

// Cursor Follow
export type CursorFollowSide = 'top' | 'bottom' | 'left' | 'right';
export type CursorFollowAlign = 'start' | 'center' | 'end';

export interface CursorFollowProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    asChild?: boolean;
    children: React.ReactNode;
    side?: CursorFollowSide;
    sideOffset?: number;
    align?: CursorFollowAlign;
    alignOffset?: number;
    transition?: {
        stiffness?: number;
        damping?: number;
        bounce?: number;
    };
}

export function CursorFollow({
    asChild,
    children,
    side = 'bottom',
    sideOffset = 15,
    align = 'end',
    alignOffset = 5,
    transition = { stiffness: 500, damping: 50, bounce: 0 },
    ...props
}: CursorFollowProps) {
    const { mouseX, mouseY, isHovering } = useCursor();
    const springConfig = {
        damping: transition.damping ?? 50,
        stiffness: transition.stiffness ?? 500,
    };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    // Only show tooltip when hovering
    if (!isHovering) {
        return null;
    }

    const getTransform = () => {
        let translateX = '0px';
        let translateY = '0px';

        if (side === 'bottom') {
            translateY = `${sideOffset}px`;
        } else if (side === 'top') {
            translateY = `-${sideOffset}px`;
        } else if (side === 'right') {
            translateX = `${sideOffset}px`;
        } else if (side === 'left') {
            translateX = `-${sideOffset}px`;
        }

        if (align === 'start') {
            if (side === 'top' || side === 'bottom') {
                translateX = `-${alignOffset}px`;
            } else {
                translateY = `-${alignOffset}px`;
            }
        } else if (align === 'end') {
            if (side === 'top' || side === 'bottom') {
                translateX = `${alignOffset}px`;
            } else {
                translateY = `${alignOffset}px`;
            }
        }

        return `translate(calc(-50% + ${translateX}), calc(-50% + ${translateY}))`;
    };

    if (asChild && React.isValidElement(children)) {
        return (
            <motion.div
                style={{
                    position: 'fixed',
                    left: x,
                    top: y,
                    pointerEvents: 'none',
                    zIndex: 9999,
                    transform: getTransform(),
                }}
            >
                {React.cloneElement(children as React.ReactElement, {
                    ...props,
                })}
            </motion.div>
        );
    }

    return (
        <motion.div
            style={{
                position: 'fixed',
                left: x,
                top: y,
                pointerEvents: 'none',
                zIndex: 9999,
                transform: getTransform(),
            }}
            {...props}
        >
            {children}
        </motion.div>
    );
}
