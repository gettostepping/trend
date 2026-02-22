"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./AdminLoadingScreen.module.css";

export default function AdminLoadingScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);
    const mountedRef = useRef(true);

    useEffect(() => {
        // Reset state when component mounts
        mountedRef.current = true;
        setIsLoading(true);
        setShouldRender(true);

        // Trigger fade out after 0.5 seconds
        const fadeTimer = setTimeout(() => {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }, 500);

        // Remove from DOM after fade animation completes (total ~1 second)
        const removeTimer = setTimeout(() => {
            if (mountedRef.current) {
                setShouldRender(false);
            }
        }, 1000); // 0.5s display + 0.5s fade

        return () => {
            mountedRef.current = false;
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
                <div className={styles.logo}>
                    TRENDS<span className={styles.logoSpan}>IGNITE</span>
                </div>
            </div>
        </div>
    );
}
