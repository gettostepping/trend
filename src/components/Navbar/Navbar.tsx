"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useState } from "react";
import { Menu, X } from "lucide-react";

interface NavbarProps {
    currentSection?: number;
    onLogoClick?: (e?: React.MouseEvent) => void;
}

export default function Navbar({ currentSection = 0, onLogoClick }: NavbarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { trackClick } = useAnalytics();

    const isContactPage = pathname === '/contact';

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <nav className={styles.navbar} data-role="public-navbar">
            <div className={styles.logoWrapper}>
                <Link
                    href="/"
                    className={styles.logo}
                    onClick={(e) => {
                        if (pathname === '/') {
                            e.preventDefault();
                        }
                        trackClick('logo', 'navbar-logo');
                        if (onLogoClick) onLogoClick(e as unknown as React.MouseEvent);
                        closeMobileMenu();
                    }}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    TRENDS<span className={styles.logoSpan}>IGNITE</span>
                </Link>
            </div>

            <div className={styles.desktopLinks}>
                <Link href="/" className={styles.link} onClick={() => trackClick('link', 'nav-home')}>Home</Link>
                <Link href="/about" className={styles.link} onClick={() => trackClick('link', 'nav-about')}>About us</Link>
                <Link href="/faqs" className={styles.link} onClick={() => trackClick('link', 'nav-faqs')}>FAQ'S</Link>
            </div>

            <div className={styles.actionsWrapper}>
                {!isContactPage && (
                    <Link href="/contact" className={styles.contactBtn} onClick={() => trackClick('button', 'nav-contact')}>
                        CONTACT US
                    </Link>
                )}
                <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu} aria-label="Toggle menu">
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className={styles.mobileDropdown}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Link href="/" className={styles.mobileLink} onClick={() => { trackClick('link', 'nav-home-mobile'); closeMobileMenu(); }}>Home</Link>
                        <Link href="/about" className={styles.mobileLink} onClick={() => { trackClick('link', 'nav-about-mobile'); closeMobileMenu(); }}>About us</Link>
                        <Link href="/faqs" className={styles.mobileLink} onClick={() => { trackClick('link', 'nav-faqs-mobile'); closeMobileMenu(); }}>FAQ'S</Link>
                        <Link href="/contact" className={styles.mobileContactBtn} onClick={() => { trackClick('button', 'nav-contact-mobile'); closeMobileMenu(); }}>
                            Contact Us
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
