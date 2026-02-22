'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import styles from './dashboard.module.css';

interface StatCardProps {
    icon: IconDefinition;
    value: number;
    label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
    return (
        <div className={styles.statCard}>
            <div className={styles.statIcon}>
                <FontAwesomeIcon icon={icon} />
            </div>
            <div className={styles.statContent}>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
            </div>
        </div>
    );
}
