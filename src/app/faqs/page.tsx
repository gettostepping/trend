"use client";
import React, { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import styles from "./faqs.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";

const FAQ_ITEMS = [
    {
        question: "How does Trendsignite work?",
        answer: "We streamline the entire influencer marketing process. You provide your campaign goals (brand awareness, conversions, content creation), and our platform matches you with vetted creators from our network who align with your brand values and target audience."
    },
    {
        question: "Are the followers and engagement real?",
        answer: "Absolutely. We have a rigorous vetting process that analyzes audience quality, engagement authenticity, and growth patterns. We strictly prohibit bots and engagement pods. When you work with us, you reach real people."
    },
    {
        question: "How can I track my results?",
        answer: "Our dashboard provides comprehensive real-time analytics. You can track impressions, reach, engagement rates, clicks, and conversions. We also provide post-campaign reports with actionable insights for future strategies."
    },
    {
        question: "What platforms do you support?",
        answer: "We specialize in the most high-impact platforms for creator marketing: Instagram, TikTok, YouTube, and Twitch. Our creators are experts in tailoring content specifically for these channels."
    },
    {
        question: "What is the minimum budget to get started?",
        answer: "We work with brands of various sizes. While we recommend a minimum monthly spend to see significant results, our team can help tailor a package that maximizes ROI for your specific budget constraints."
    }
];

export default function FAQs() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [pageDisabled, setPageDisabled] = useState<boolean | null>(null);

    useEffect(() => {
        fetch('/api/settings/public', { cache: 'no-store' })
            .then((r) => r.json())
            .then((data) => setPageDisabled(data.faqsDisabled === true))
            .catch(() => setPageDisabled(false));
    }, []);

    if (pageDisabled) {
        return (
            <main>
                <Navbar />
                <div className={styles.container}>
                    <div className={styles.disabledMessage}>
                        <h1 className={styles.title}>FAQs</h1>
                        <p>This page is temporarily unavailable.</p>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main>
            <Navbar />
            <div className={styles.container}>
                <ScrollReveal delay={0} direction="up">
                    <div className={styles.header}>
                        <h1 className={styles.title}>
                            Frequently Asked <span className={styles.gradientText}>Questions</span>
                        </h1>
                        <p className={styles.subtitle}>
                            Everything you need to know about starting your next viral campaign.
                        </p>
                    </div>
                </ScrollReveal>

                <div className={styles.faqGrid}>
                    {FAQ_ITEMS.map((item, index) => (
                        <ScrollReveal key={index} delay={index * 0.1} direction="up">
                            <motion.div
                                className={styles.faqItem}
                                data-open={openIndex === index}
                                whileHover={{ scale: 1.02, y: -2 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            >
                            <div className={styles.question}>
                                {item.question}
                                <div className={styles.icon}>
                                    <ChevronDown size={20} />
                                </div>
                            </div>
                            <div className={styles.answer}>
                                <p>{item.answer}</p>
                            </div>
                            </motion.div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
            <Footer />
        </main>
    );
}
