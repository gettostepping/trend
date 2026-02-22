'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox } from '@fortawesome/free-solid-svg-icons';
import styles from './dashboard.module.css';

interface ActivityItemProps {
    name: string;
    email: string;
    createdAt: Date;
}

export default function ActivityItem({ name, email, createdAt }: ActivityItemProps) {
    return (
        <div className={styles.activityItem}>
            <div className={styles.activityIcon}>
                <FontAwesomeIcon icon={faInbox} />
            </div>
            <div className={styles.activityContent}>
                <div className={styles.activityTitle}>{name}</div>
                <div className={styles.activityMeta}>{email}</div>
            </div>
            <div className={styles.activityTime}>
                {new Date(createdAt).toLocaleDateString()} {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    );
}
