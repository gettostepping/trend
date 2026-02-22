"use client";
import { useState, useEffect } from "react";
import styles from "./LoadingScreen.module.css";
import Image from "next/image";

export default function LoadingScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        // Trigger fade out after 2 seconds
        const fadeTimer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

        // Remove from DOM after fade animation completes
        const removeTimer = setTimeout(() => {
            setShouldRender(false);
        }, 3000); // 2s display + 1s fade

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    if (!shouldRender) return null;

    return (
        <div className={`${styles.overlay} ${!isLoading ? styles.fadeOut : ''}`}>
            {/* Ambient glow background */}
            <div className={styles.ambientGlow}></div>

            {/* Logo container */}
            <div className={styles.logoContainer}>
                <div className={styles.logoGlow}></div>
                <Image
                    src="/Logos/logo1.webp"
                    alt="TRENDSIGNITE"
                    width={300}
                    height={300}
                    className={styles.logo}
                    priority
                />
            </div>
        </div>
    );
}
