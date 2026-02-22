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
    const textRef = useRef<HTMLSpanElement>(null);
    const boxRef = useRef<HTMLSpanElement>(null);
    const [boxWidth, setBoxWidth] = useState<number | "auto">("auto");

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

    // Measure box width for smooth animation
    useEffect(() => {
        // Use a small delay to ensure text is rendered
        const timeout = setTimeout(() => {
            if (textRef.current && boxRef.current) {
                // Measure the text width
                const textWidth = textRef.current.offsetWidth;

                // Get computed padding from the box
                const box = boxRef.current;
                const computedStyle = window.getComputedStyle(box);
                const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
                const paddingRight = parseFloat(computedStyle.paddingRight) || 0;

                // Calculate total width including padding
                const totalWidth = textWidth + paddingLeft + paddingRight;

                // Add a small buffer to ensure text doesn't get cut off
                setBoxWidth(totalWidth + 2);
            }
        }, 100);

        return () => clearTimeout(timeout);
    }, [currentIndex, words, currentWord]);

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
                ref={boxRef}
                className="rotating-text-box"
                animate={{
                    width: boxWidth === "auto" ? "auto" : `${boxWidth}px`
                }}
                style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #1A73E8 0%, #93C5FD 90%)",
                    color: "white",
                    padding: "0.2rem 0.65rem",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 12px rgba(26, 115, 232, 0.3)",
                    margin: "0 0.25rem",
                    textAlign: "left",
                    position: "relative",
                    overflow: "hidden",
                    transform: "translateY(-1px)",
                    whiteSpace: "nowrap"
                }}
                transition={{
                    width: {
                        duration: 1.0,
                        ease: [0.4, 0, 0.2, 1]
                    }
                }}
            >
                <span
                    ref={textRef}
                    style={{
                        display: "inline-block",
                        whiteSpace: "nowrap",
                        color: "white",
                        background: "transparent",
                        WebkitTextFillColor: "white",
                        position: "absolute",
                        visibility: "hidden",
                        top: 0,
                        left: 0
                    }}
                >
                    {currentWord}
                </span>
                <span style={{
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    color: "white",
                    background: "transparent",
                    WebkitTextFillColor: "white",
                    position: "relative"
                }}>
                    <AnimatePresence mode="wait" initial={false}>
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
                                duration: transitionType === "reactbits" ? 0.4 : 0.5,
                                ease: [0.4, 0, 0.2, 1],
                                opacity: { duration: 0.2 },
                                y: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
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
