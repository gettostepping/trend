"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RotatingTextProps {
    words: string[];
    className?: string;
    interval?: number;
    baseText?: string;
    separator?: string;
    transitionType?: "reactbits" | "scale" | "slide-left" | "slide-right" | "fade";
}

export default function RotatingText({
    words,
    className = "",
    interval = 4000,
    baseText = "",
    separator = " ",
    transitionType = "reactbits"
}: RotatingTextProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (words.length === 0) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % words.length);
        }, interval);

        return () => clearInterval(timer);
    }, [words.length, interval]);

    // Transition state helpers
    const getInitialState = (type: string) => {
        switch (type) {
            case "reactbits":
                return { opacity: 0, y: 8, x: 0 };
            case "scale":
                return { opacity: 0, scale: 0.8 };
            case "slide-left":
                return { opacity: 0, x: -20 };
            case "slide-right":
                return { opacity: 0, x: 20 };
            case "fade":
                return { opacity: 0 };
            default:
                return { opacity: 0, y: 8, x: 0 };
        }
    };

    const getExitState = (type: string) => {
        switch (type) {
            case "reactbits":
                return { opacity: 0, y: -8, x: 0 };
            case "scale":
                return { opacity: 0, scale: 0.8 };
            case "slide-left":
                return { opacity: 0, x: 20 };
            case "slide-right":
                return { opacity: 0, x: -20 };
            case "fade":
                return { opacity: 0 };
            default:
                return { opacity: 0, y: -8, x: 0 };
        }
    };

    if (words.length === 0) return null;

    const currentWord = words[currentIndex];

    return (
        <span
            ref={containerRef}
            className={className}
            style={{
                display: "inline-flex",
                alignItems: "center",
                position: "relative",
                verticalAlign: "baseline",
                isolation: "isolate",
                willChange: "transform"
            }}
        >
            {baseText && <span>{baseText}{separator}</span>}
            <motion.span
                layout="size"
                className="rotating-text-box"
                style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #1A73E8 0%, #93C5FD 90%)",
                    color: "white",
                    padding: "0.2rem 0.65rem",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 12px rgba(26, 115, 232, 0.3)",
                    margin: "0 0.25rem",
                    textAlign: "center",
                    position: "relative",
                    overflow: "hidden",
                    transform: "translateZ(0)", /* Force GPU acceleration */
                    willChange: "width, transform",
                    whiteSpace: "nowrap"
                }}
                transition={{
                    layout: { type: "spring", stiffness: 300, damping: 30 }
                }}
            >
                <span style={{
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    color: "white",
                    background: "transparent",
                    WebkitTextFillColor: "white",
                    position: "relative",
                    transform: "translateZ(0)" /* Force GPU acceleration */
                }}>
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={currentIndex}
                            initial={transitionType === "reactbits" ? { opacity: 0 } : getInitialState(transitionType)}
                            animate={{
                                opacity: 1,
                                scale: transitionType === "scale" ? 1 : 1,
                                x: 0,
                                y: 0
                            }}
                            exit={transitionType === "reactbits" ? { opacity: 0 } : getExitState(transitionType)}
                            transition={{
                                duration: transitionType === "reactbits" ? 0.3 : 0.4, /* Sped up slightly for mobile */
                                ease: "easeOut"
                            }}
                        >
                            {currentWord}
                        </motion.span>
                    </AnimatePresence>
                </span>
            </motion.span>
        </span>
    );
}
