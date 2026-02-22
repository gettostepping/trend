"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar/Navbar";
import Hero from "@/components/Hero/Hero";
import Features from "@/components/Features/Features";
import MediaGrid from "@/components/MediaGrid/MediaGrid";
import CallToAction from "@/components/CallToAction/CallToAction";
import Footer from "@/components/Footer/Footer";
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen";
import { useAdminPuzzle } from "@/hooks/useAdminPuzzle";
import styles from "./snap.module.css";

const SECTIONS = [
  Hero,
  Features,
  //MediaGrid,
  CallToAction,
  //Footer
];

export default function Home() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const touchStartY = useRef(0);
  const { handleLogoClick, handleLetterClick, visualFeedback, currentLetterIndex } = useAdminPuzzle();

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent creating a new scroll if already scrolling
      if (isScrolling) return;

      if (e.deltaY > 0) {
        // Scroll Down
        if (currentSection < SECTIONS.length - 1) {
          setIsScrolling(true);
          setCurrentSection((prev) => prev + 1);
          setTimeout(() => setIsScrolling(false), 1500); // Lock for animation duration
        }
      } else {
        // Scroll Up
        if (currentSection > 0) {
          setIsScrolling(true);
          setCurrentSection((prev) => prev - 1);
          setTimeout(() => setIsScrolling(false), 1500);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY.current - touchEndY;

      // Threshold for swipe
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          // Swipe Up -> Scroll Down
          if (currentSection < SECTIONS.length - 1) {
            setIsScrolling(true);
            setCurrentSection((prev) => prev + 1);
            setTimeout(() => setIsScrolling(false), 1500);
          }
        } else {
          // Swipe Down -> Scroll Up
          if (currentSection > 0) {
            setIsScrolling(true);
            setCurrentSection((prev) => prev - 1);
            setTimeout(() => setIsScrolling(false), 1500);
          }
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentSection, isScrolling]);

  const scrollToHero = (e?: React.MouseEvent) => {
    if (e) {
      handleLogoClick(e);
    }
    setCurrentSection(0);
  };

  return (
    <>
      <LoadingScreen />
      <main className={styles.snapContainer}>
        <Navbar currentSection={currentSection} onLogoClick={scrollToHero} />

        <motion.div
          animate={{ y: `-${currentSection * 100}vh` }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} // Custom Bezier for smooth "slower" feel
          style={{ width: "100%", height: "100%" }}
        >
          {SECTIONS.map((Component, index) => (
            <section key={index} className={styles.sectionWrapper}>
              {index === 0 ? (
                <Hero onLetterClick={handleLetterClick} visualFeedback={visualFeedback} currentLetterIndex={currentLetterIndex} />
              ) : (
                <Component />
              )}
            </section>
          ))}
        </motion.div>
        
        {/* Visual feedback overlays */}
        {visualFeedback?.type === 'corner' && (
          <div 
            className={styles.cornerFeedback}
            style={{
              position: 'fixed',
              [visualFeedback.position === 'top-left' ? 'top' : 'bottom']: '0',
              [visualFeedback.position === 'top-left' ? 'left' : 'right']: '0',
              width: '100px',
              height: '100px',
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          />
        )}
      </main>
    </>
  );
}
