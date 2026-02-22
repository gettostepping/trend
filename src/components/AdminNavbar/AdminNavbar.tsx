"use client";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import styles from "./AdminNavbar.module.css";

interface AdminNavbarProps {
    onNavigate?: (path: string) => void;
}

export default function AdminNavbar({ onNavigate }: AdminNavbarProps) {
    const handleLogoClick = () => {
        if (onNavigate) {
            onNavigate('/admin/dashboard');
        }
    };

    return (
        <nav className={styles.navbar}>
            <Link href="/" className={styles.backToHome}>
                <FontAwesomeIcon icon={faArrowLeft} className={styles.arrowIcon} />
                <span>Back To Home</span>
            </Link>
            <div
                className={styles.logo}
                onClick={handleLogoClick}
                style={{ cursor: 'pointer' }}
            >
                TRENDS<span className={styles.logoSpan}>IGNITE</span>
            </div>
            <div className={styles.spacer}></div>
        </nav>
    );
}
