"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import styles from "./AdminFooter.module.css";

export default function AdminFooter() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <span className={styles.creditsText}>Created By</span>
                <Link 
                    href="https://www.instagram.com/prod.izuru/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.creditLink}
                >
                    <FontAwesomeIcon icon={faInstagram} className={styles.instagramIcon} />
                    <span>Izuru</span>
                </Link>
                <span className={styles.andText}>&</span>
                <Link 
                    href="https://www.instagram.com/mistawhothat/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.creditLink}
                >
                    <FontAwesomeIcon icon={faInstagram} className={styles.instagramIcon} />
                    <span>mistafried</span>
                </Link>
            </div>
        </footer>
    );
}
