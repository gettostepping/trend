"use client";
import Link from "next/link";
import styles from "./CallToAction.module.css";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ui/ScrollReveal";
import RotatingText from "@/components/ui/RotatingText";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function CallToAction() {
    const actionWords = ["Market Your Brand", "Become A Influencer", "Ignite Your Trend", "Get Started", "Promote Your Business"];
    const { trackClick } = useAnalytics();

    return (
        <section className={styles.section}>
            {/* Static CONNECT text with continuous pulse */}
            <div className={styles.bgText}>
                CONNECT
            </div>

            {/* New animated TRENDSIGNITE marquee */}
            <div className={styles.marqueeWrapper}>
                <div className={styles.marqueeTrack}>
                    <span className={styles.marqueeText}>TRENDSIGNITE</span>
                    <span className={styles.marqueeText}>TRENDSIGNITE</span>
                    <span className={styles.marqueeText}>TRENDSIGNITE</span>
                    <span className={styles.marqueeText}>TRENDSIGNITE</span>
                </div>
            </div>

            <ScrollReveal delay={0} direction="up">
                <div className={styles.content}>
                    <h2 className={styles.heading}>
                        Ready to{" "}
                        <span style={{ position: "relative", display: "inline-block", isolation: "isolate" }}>
                            <RotatingText words={actionWords} interval={2500} className={styles.rotatingText} transitionType="reactbits" />
                        </span>
                        ?
                    </h2>
                    <p className={styles.subheading}>Ready To Go Viral? Contact Us For Pricing.</p>
                    <Link href="/contact">
                        <motion.button
                            className={styles.contactBtn}
                            whileHover={{ scale: 1.05, boxShadow: "0 15px 40px rgba(0, 0, 0, 0.3)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => trackClick('button', 'cta-contact')}
                        >
                            CONTACT US
                        </motion.button>
                    </Link>
                </div>
            </ScrollReveal>
        </section>
    );
}
