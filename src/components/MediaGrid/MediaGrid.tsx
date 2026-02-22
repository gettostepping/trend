"use client";
import styles from "./MediaGrid.module.css";
import { Play, Heart } from "lucide-react";
import { motion } from "framer-motion";

const posts = [
    { user: "@thainadoitbest", views: "1.2M", color: "linear-gradient(45deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)" },
    { user: "@elmo_love_u2", views: "850K", color: "linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%)" },
    { user: "@rulaempire", views: "2.5M", color: "linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)" },
    { user: "@viral_creator", views: "500K", color: "linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)" },
];

export default function MediaGrid() {
    return (
        <section className={styles.section}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.3 }}
                transition={{ duration: 1.0 }}
            >
                <h2 className={styles.heading}>Trending Creators</h2>
                <p className={styles.subheading}>
                    See what's trending. Our network creates content that engages and converts.
                </p>
            </motion.div>

            <div className={styles.grid}>
                {posts.map((post, index) => (
                    <motion.div
                        key={index}
                        className={styles.mediaCard}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: index * 0.2 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                    >
                        <div
                            className={styles.placeholder}
                            style={{ background: post.color }}
                        >
                            <div className={styles.playIcon}>
                                <Play fill="white" size={24} />
                            </div>
                        </div>
                        <div className={styles.overlay}>
                            <span className={styles.username}>{post.user}</span>
                            <div className={styles.stats}>
                                <Heart size={14} fill="white" /> {post.views} Views
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
