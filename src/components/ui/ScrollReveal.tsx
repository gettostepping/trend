"use client";
import { motion } from "framer-motion";
import { useRef, ReactNode, useEffect, useState } from "react";

interface ScrollRevealProps {
    children: ReactNode;
    delay?: number;
    direction?: "up" | "down" | "left" | "right";
    className?: string;
}

export default function ScrollReveal({ 
    children, 
    delay = 0,
    direction = "up",
    className = "" 
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    const directionMap = {
        up: { y: 50, x: 0 },
        down: { y: -50, x: 0 },
        left: { x: 50, y: 0 },
        right: { x: -50, y: 0 }
    };

    const initial = directionMap[direction];

    // Check visibility on mount and when scrolling
    useEffect(() => {
        const checkVisibility = () => {
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect();
                const windowHeight = window.innerHeight || document.documentElement.clientHeight;
                const isInView = rect.top < windowHeight * 0.9 && rect.bottom > windowHeight * 0.1;
                
                if (isInView && !isVisible) {
                    setIsVisible(true);
                }
            }
        };

        // Check immediately
        checkVisibility();
        
        // Check after a short delay for navigation cases
        const timeout = setTimeout(checkVisibility, 200);
        
        // Also listen to scroll
        window.addEventListener('scroll', checkVisibility, { passive: true });
        window.addEventListener('resize', checkVisibility);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('scroll', checkVisibility);
            window.removeEventListener('resize', checkVisibility);
        };
    }, [isVisible]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, ...initial }}
            animate={isVisible ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...initial }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ 
                duration: 0.8, 
                delay,
                ease: [0.22, 1, 0.36, 1]
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
