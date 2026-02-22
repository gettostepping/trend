"use client";

import { useEffect, useRef, useState } from 'react';
import styles from './GridMotion.module.css';

interface GridMotionProps {
    items?: (string | React.ReactNode)[];
    gradientColor?: string;
}

const GridMotion = ({ items = [], gradientColor = 'black' }: GridMotionProps) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [gridRows, setGridRows] = useState<any[][]>([]);
    const [isClient, setIsClient] = useState(false);

    // Ensure this only runs on client
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient || items.length === 0) return;

        const newGridRows = [];
        const itemsPerRow = 15; // Enough items to scroll smoothly

        for (let i = 0; i < 4; i++) {
            const row: any[] = [];
            let lastItem: any = null;

            for (let j = 0; j < itemsPerRow; j++) {
                // Filter out the last selected item to prevent duplicates next to each other
                const availableItems = items.filter(item => item !== lastItem);
                // If for some reason available is empty (e.g. only 1 item total), fallback to all items
                const pool = availableItems.length > 0 ? availableItems : items;

                const randomItem = pool[Math.floor(Math.random() * pool.length)];
                row.push(randomItem);
                lastItem = randomItem;
            }
            // Duplicate the row for infinite marquee effect
            newGridRows.push([...row, ...row]);
        }

        setGridRows(newGridRows);
    }, [items, isClient]);

    useEffect(() => {
        if (!isClient || gridRows.length === 0) return;

        // Dynamically import GSAP only on client side
        import('gsap').then(({ gsap }) => {
            gsap.ticker.lagSmoothing(0);

            rowRefs.current.forEach((row, index) => {
                if (row) {
                    // Compute random duration/speed
                    const duration = 25 + Math.random() * 15; // Slower, more varying speeds
                    const direction = index % 2 === 0 ? 1 : -1; // Alternate direction

                    // Set initial position
                    gsap.set(row, {
                        xPercent: direction === 1 ? -50 : 0
                    });

                    // Animate
                    gsap.to(row, {
                        xPercent: direction === 1 ? 0 : -50,
                        duration: duration,
                        ease: "none",
                        repeat: -1
                    });
                }
            });
        }).catch((error) => {
            console.error('Failed to load GSAP:', error);
        });

    }, [gridRows, isClient]);

    if (!isClient || gridRows.length === 0) return null;

    return (
        <div className={`${styles.noscroll} loading`} ref={gridRef}>
            <section
                className={styles.intro}
                style={{
                    background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`
                }}
            >
                <div className={styles.gridMotionContainer}>
                    {gridRows.map((row, rowIndex) => (
                        <div key={rowIndex} className={styles.row} ref={el => { rowRefs.current[rowIndex] = el; }}>
                            {row.map((content, itemIndex) => (
                                <div key={itemIndex} className={styles.rowItem}>
                                    <div className={styles.rowItemInner} style={{ backgroundColor: '#111' }}>
                                        {typeof content === 'string' && content.startsWith('http') ? (
                                            <div
                                                className={styles.rowItemImg}
                                                style={{
                                                    backgroundImage: `url(${content})`
                                                }}
                                            ></div>
                                        ) : (
                                            <div className={styles.rowItemContent}>{content}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className={styles.fullview}></div>
            </section>
        </div>
    );
};

export default GridMotion;
