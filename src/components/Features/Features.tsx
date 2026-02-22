'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Users, Zap, BarChart3, Globe } from "lucide-react";
import styles from "./Features.module.css";
import { motion, useInView } from "framer-motion";
import ScrollFloat from "@/components/ui/ScrollFloat";
import ScrollReveal from "@/components/ui/ScrollReveal";
import GridMotion from "@/components/GridMotion/GridMotion";

const items = [
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/zoe1.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/mila3.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/geek1.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/thai4.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/jel3.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/mila5.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/sana2.jpg"
];

const items2 = [
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/zoe2.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/mila4.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/geek5.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/thai5.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/jel4.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/mila1.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/sana1.jpg"
];

const items3 = [
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/zoe3.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/mila2.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/geek3.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/thai2.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/jel2.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/geek2.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/sana3.jpg"
];

const items4 = [
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/zoe5.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/meek1.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/geek4.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/thai1.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/jel5.jpg",
    "https://pub-09a3d4a436de4b728479a7fe450ab37f.r2.dev/images/sana4.jpg"
];

const features = [
    {
        icon: Users,
        title: "20M+ Followers",
        description: "Tap into our massive network of influencers and creators to get your brand seen by millions instantly.",
        bg: "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)",
        videoSrc: "/TrendsIgnite Tile Videos/video.mp4",
        gridItems: items,
    },
    {
        icon: Zap,
        title: "GET NOTICED!",
        description: "Viral strategies that put your content in front of the right audience at the right time. Don't just post, ignite.",
        bg: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
        videoSrc: "/TrendsIgnite Tile Videos/video1.mp4",
        gridItems: items2,
    },
    {
        icon: BarChart3,
        title: "Analytics",
        description: "Track your campaign performance with real-time insights and detailed reporting to maximize ROI.",
        bg: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
        videoSrc: "/TrendsIgnite Tile Videos/video4.mp4",
        gridItems: items3,
    },
    {
        icon: Globe,
        title: "Global Reach",
        description: "Scale your campaigns across borders with our international network of creators.",
        bg: "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
        videoSrc: "/TrendsIgnite Tile Videos/video3.mp4",
        gridItems: items4,
    }
];

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isMobile;
}

export default function Features() {
    const [activeindex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isInView = useInView(containerRef, { amount: 0.5 });
    const isMobile = useIsMobile();

    // Touch swipe state
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);

    useEffect(() => {
        if (isInView) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                setActiveIndex((prev) => (prev + 1) % features.length);
            }, 4000);
            return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
        }
    }, [isInView]);

    const handleCardClick = (index: number) => {
        setActiveIndex(index);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (isInView) {
            intervalRef.current = setInterval(() => {
                setActiveIndex((prev) => (prev + 1) % features.length);
            }, 4000);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        // Only trigger if horizontal swipe is dominant
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
            if (dx < 0) {
                // Swipe left → next
                handleCardClick((activeindex + 1) % features.length);
            } else {
                // Swipe right → prev
                handleCardClick((activeindex - 1 + features.length) % features.length);
            }
        }
    };

    // ─── MOBILE LAYOUT ───────────────────────────────────────────────────────
    if (isMobile) {
        const feature = features[activeindex];
        return (
            <section className={styles.mobileSection} ref={containerRef}>
                {/* Card */}
                <motion.div
                    key={activeindex}
                    className={styles.mobileCard}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* GridMotion background */}
                    <div className={styles.mobileGridBg}>
                        <GridMotion items={feature.gridItems} />
                    </div>
                    {/* Light overlay */}
                    <div className={styles.mobileOverlay} />

                    {/* Content */}
                    <div className={styles.mobileContent}>
                        <div className={styles.iconWrapper}>
                            <feature.icon size={30} />
                        </div>
                        <h3 className={styles.mobileTitle}>{feature.title}</h3>
                        <p className={styles.mobileDesc}>{feature.description}</p>
                        <Link href="/about">
                            <motion.button
                                className={styles.learnBtn}
                                whileTap={{ scale: 0.95 }}
                            >
                                Learn More
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>

                {/* Dot indicators */}
                <div className={styles.mobileDots}>
                    {features.map((_, i) => (
                        <button
                            key={i}
                            className={`${styles.mobileDot} ${i === activeindex ? styles.mobileDotActive : ''}`}
                            onClick={() => handleCardClick(i)}
                            aria-label={`Go to ${features[i].title}`}
                        />
                    ))}
                </div>

                {/* Swipe hint */}
                <p className={styles.mobileHint}>Swipe to explore</p>
            </section>
        );
    }

    // ─── DESKTOP LAYOUT (unchanged) ──────────────────────────────────────────
    return (
        <section className={styles.section} ref={containerRef}>
            <motion.div
                className={styles.accordionContainer}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ amount: 0.3 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                {features.map((feature, index) => {
                    const isActive = index === activeindex;

                    return (
                        <div
                            key={index}
                            className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
                            onClick={() => handleCardClick(index)}
                            style={{
                                flex: isActive ? 3 : 0.5,
                                transition: 'flex 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            {/* Video Background for inactive cards */}
                            {!isActive && (
                                <>
                                    <video
                                        src={feature.videoSrc}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            zIndex: 0
                                        }}
                                    />
                                    <div className={styles.videoOverlay} />
                                </>
                            )}

                            {/* GridMotion for Active State */}
                            {isActive && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    zIndex: 0,
                                    opacity: 0.6,
                                    overflow: 'hidden',
                                    borderRadius: '2rem'
                                }}>
                                    <GridMotion items={feature.gridItems} />
                                </div>
                            )}

                            {/* Active Content */}
                            <div className={styles.content}>
                                <div style={{ position: 'relative', zIndex: 2 }}>
                                    <div className={styles.iconWrapper}>
                                        <feature.icon size={36} />
                                    </div>
                                    <ScrollReveal delay={0} direction="up">
                                        <h3 className={styles.title}>
                                            {feature.title}
                                        </h3>
                                    </ScrollReveal>

                                    <motion.div
                                        animate={{ opacity: isActive ? 1 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                                    >
                                        <ScrollFloat stagger={0.02} duration={2}>
                                            <p className={styles.desc}>{feature.description}</p>
                                        </ScrollFloat>
                                        <Link href="/about">
                                            <motion.button
                                                className={styles.learnBtn}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                Learn More
                                            </motion.button>
                                        </Link>
                                    </motion.div>
                                </div>

                                {/* Decorative BG for active */}
                                <div
                                    className={styles.bgImage}
                                    style={{ background: feature.bg, opacity: isActive ? 0.15 : 0, transition: 'opacity 0.5s' }}
                                />
                            </div>

                            {/* Inactive Strip Content */}
                            <div
                                className={styles.strip}
                                style={{ opacity: isActive ? 0 : 1, transition: 'opacity 0.3s' }}
                            >
                                <div
                                    className={styles.stripIconWrapper}
                                    style={{
                                        '--hover-bg': feature.bg
                                    } as React.CSSProperties}
                                >
                                    <feature.icon size={32} color="#ccc" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </motion.div>
        </section>
    );
}
