"use client";
import Link from "next/link";
import styles from "./Hero.module.css";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ui/ScrollReveal";
import RotatingText from "@/components/ui/RotatingText";

interface HeroProps {
    onLetterClick?: (letter: string, e: React.MouseEvent) => void;
    visualFeedback?: {
        type: 'corner' | 'logo' | 'letter';
        position?: 'top-left' | 'bottom-right';
        letter?: string;
    } | null;
    currentLetterIndex?: number;
}

export default function Hero({ onLetterClick, visualFeedback, currentLetterIndex = -1 }: HeroProps) {
    const LOGOS = [
        "/Logos/10k.png",
        "/Logos/bluechew.jpg",
        "/Logos/brandosaur.jpg",
        "/Logos/nova.png",
        "/Logos/novamen.png",
        "/Logos/republic.png",
        "/Logos/sony.png",
        "/Logos/superlive.webp",
        "/Logos/temu.png",
        "/Logos/the_system.webp",
        "/Logos/united.png",
        "/Logos/alamo.png",
        "/Logos/hallwood.jpg",
        "/Logos/orchard.png",
        "/Logos/tiktok.png",
    ];

    // Quadruple the logos to ensure enough content for seamless loop
    const EXTENDED_LOGOS = [...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS];

    const rotatingWords = ["Viral", "Global", "Mainstream", ];

    return (
        <section className={styles.hero}>
            <ScrollReveal delay={0} direction="up">
                <h1 className={styles.title}>
                    {onLetterClick ? (
                        <>
                            {'TRENDS'.split('').map((letter, index) => {
                                const isHighlighted = currentLetterIndex === index;
                                return (
                                    <span
                                        key={`trends-${index}`}
                                        className={`${styles.puzzleLetter} ${
                                            isHighlighted ? styles.letterHighlight : ''
                                        }`}
                                        onClick={(e) => onLetterClick(letter, e)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {letter}
                                    </span>
                                );
                            })}
                            <br />
                            {'IGNITE'.split('').map((letter, index) => {
                                const letterIndex = 6 + index; // "TRENDS" is 6 chars, so IGNITE starts at index 6
                                const isHighlighted = currentLetterIndex === letterIndex;
                                return (
                                    <span
                                        key={`ignite-${index}`}
                                        className={`${styles.puzzleLetter} ${
                                            isHighlighted ? styles.letterHighlight : ''
                                        }`}
                                        onClick={(e) => onLetterClick(letter, e)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {letter}
                                    </span>
                                );
                            })}
                            <span className={styles.gradientText}>.</span>
                        </>
                    ) : (
                        <>
                            TRENDS<br />
                            <span className={styles.gradientText}>IGNITE.</span>
                        </>
                    )}
                </h1>
            </ScrollReveal>
            
            <ScrollReveal delay={0.2} direction="up">
                <p className={styles.subtitle}>
                    We help brands and creators go{" "}
                    <RotatingText 
                        words={rotatingWords} 
                        interval={4500}
                        className={styles.rotatingText}
                        transitionType="scale"
                    />. Simplify your influencer marketing campaigns and reach millions.
                </p>
            </ScrollReveal>
            
            <ScrollReveal delay={0.4} direction="up">
                <Link href="/contact">
                    <motion.button 
                        className={styles.ctaButton}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Start Campaign
                    </motion.button>
                </Link>
            </ScrollReveal>

            <ScrollReveal delay={0.6} direction="up">
                <div className={styles.trustedWrapper}>
                    <div className={styles.trustedLabel}>Trusted by:</div>

                    <div className={styles.marqueeContainer}>
                        <div className={styles.marqueeTrack}>
                            {/* First complete set */}
                            {EXTENDED_LOGOS.map((logo, index) => (
                                <div key={`set1-${index}`} className={styles.logoItem}>
                                    <img src={logo} alt="Brand Logo" />
                                </div>
                            ))}
                            {/* Second complete set (duplicate for seamless loop) */}
                            {EXTENDED_LOGOS.map((logo, index) => (
                                <div key={`set2-${index}`} className={styles.logoItem}>
                                    <img src={logo} alt="Brand Logo" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollReveal>
        </section>
    );
}
