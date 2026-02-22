"use client";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import styles from "./about.module.css";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ui/ScrollReveal";
import CountUp from "@/components/ui/CountUp";

export default function About() {
    return (
        <main>
            <Navbar />
            <div className={styles.container}>
                <ScrollReveal delay={0} direction="up">
                    <div className={styles.heroSection}>
                        <h1 className={styles.title}>
                            We Are <br />
                            <span className={styles.gradientText}>Trendsignite.</span>
                        </h1>
                        <p className={styles.subtitle}>
                            Bridging the gap between innovative brands and creative influencers through authentic storytelling and data-driven strategies.
                        </p>
                    </div>
                </ScrollReveal>

                <div className={styles.contentSection}>
                    <ScrollReveal delay={0.1} direction="left">
                        <div className={styles.textBlock}>
                            <h2>Our Mission</h2>
                            <p>
                                To empower creators and brands to grow together. We believe in the power of organic reach and meaningful connections that go beyond simple metrics.
                            </p>
                            <p>
                                In a world of noise, we help you find your signal. Our platform streamlines the complex landscape of influencer marketing into a simple, effective workflow.
                            </p>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.2} direction="right">
                        <div className={styles.statGrid}>
                            <motion.div 
                                className={styles.statCard}
                                whileHover={{ scale: 1.05, y: -5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <span className={styles.statNumber}>
                                    <CountUp end={20} suffix="M+" />
                                </span>
                                <span className={styles.statLabel}>Total Reach</span>
                            </motion.div>
                            <motion.div 
                                className={styles.statCard}
                                whileHover={{ scale: 1.05, y: -5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <span className={styles.statNumber}>
                                    <CountUp end={500} suffix="+" />
                                </span>
                                <span className={styles.statLabel}>Brand Partners</span>
                            </motion.div>
                            <motion.div 
                                className={styles.statCard}
                                whileHover={{ scale: 1.05, y: -5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <span className={styles.statNumber}>
                                    <CountUp end={2000} suffix="+" />
                                </span>
                                <span className={styles.statLabel}>Active Creators</span>
                            </motion.div>
                            <motion.div 
                                className={styles.statCard}
                                whileHover={{ scale: 1.05, y: -5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <span className={styles.statNumber}>
                                    <CountUp end={98} suffix="%" />
                                </span>
                                <span className={styles.statLabel}>Client Satisfaction</span>
                            </motion.div>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
            <Footer />
        </main>
    );
}
