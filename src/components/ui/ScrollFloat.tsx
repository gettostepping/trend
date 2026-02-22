"use client";
import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";

interface ScrollFloatProps {
    children: ReactNode;
    stagger?: number;
    duration?: number;
    className?: string;
    amount?: number;
}

export default function ScrollFloat({ 
    children, 
    stagger = 0.04, 
    duration = 4,
    className = "",
    amount = 0.3
}: ScrollFloatProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { amount, once: false });

    return (
        <motion.div
            ref={ref}
            animate={isInView ? { 
                y: [0, -3, 0],
            } : { y: 0 }}
            transition={{ 
                duration: duration,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
