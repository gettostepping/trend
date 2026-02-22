import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.content}>
                <div className={styles.logo}>TRENDSIGNITE</div>
                <div className={styles.links}>
                    <Link href="/" className={styles.link}>Home</Link>
                    <Link href="/about" className={styles.link}>About us</Link>
                    <Link href="/faqs" className={styles.link}>FAQ'S</Link>
                    <Link href="/contact" className={styles.link}>Contact</Link>
                </div>
                <div className={styles.copyright}>
                    © {new Date().getFullYear()} Trendsignite. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
