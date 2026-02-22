"use client";
import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

interface CountUpProps {
    end: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
    className?: string;
    decimals?: number;
}

export default function CountUp({ 
    end, 
    duration,
    suffix = "",
    prefix = "",
    className = "",
    decimals = 0
}: CountUpProps) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });
    const hasAnimated = useRef(false);

    // Calculate duration based on end value if not provided
    // Smaller numbers finish faster, larger numbers take longer
    // But all should feel smooth and finish at reasonable times
    const calculatedDuration = duration ?? Math.min(2 + (end / 1000), 3);

    useEffect(() => {
        if (isInView && !hasAnimated.current) {
            hasAnimated.current = true;
            const startTime = Date.now();
            const startValue = 0;

            const animate = () => {
                const now = Date.now();
                const elapsed = (now - startTime) / 1000;
                const progress = Math.min(elapsed / calculatedDuration, 1);

                // Easing function for smooth animation
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                const current = startValue + (end - startValue) * easeOutQuart;

                setCount(current);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    setCount(end);
                }
            };

            animate();
        }
    }, [isInView, end, calculatedDuration]);

    const formatNumber = (num: number): string => {
        if (decimals > 0) {
            return num.toFixed(decimals);
        }
        return Math.floor(num).toLocaleString();
    };

    return (
        <span 
            ref={ref} 
            className={className}
            style={{ 
                display: "inline-block",
                fontVariantNumeric: "tabular-nums",
                minWidth: "fit-content"
            }}
        >
            {prefix}{formatNumber(count)}{suffix}
        </span>
    );
}
