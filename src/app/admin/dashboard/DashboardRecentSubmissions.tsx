'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox } from '@fortawesome/free-solid-svg-icons';
import styles from './dashboard.module.css';

interface RecentEmail {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    isNew: boolean;
}

interface DashboardRecentSubmissionsProps {
    emails: RecentEmail[];
    emailsLastViewedAt: string | null;
    newCount: number;
}

function formatRelative(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardRecentSubmissions({
    emails,
    emailsLastViewedAt,
    newCount: initialNewCount,
}: DashboardRecentSubmissionsProps) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [newCount, setNewCount] = useState(initialNewCount);
    const [isMarkingDone, setIsMarkingDone] = useState(false);

    async function handleMarkAsSeen() {
        setIsMarkingDone(true);
        try {
            // Call the dedicated endpoint that stamps emailsLastViewedAt = now
            await fetch('/api/admin/mark-submissions-seen', { method: 'POST' });
            setNewCount(0);
            // Refresh so the server re-reads the new timestamp
            startTransition(() => router.refresh());
        } catch (err) {
            console.error('Mark as seen failed:', err);
        } finally {
            setIsMarkingDone(false);
        }
    }

    return (
        <div className={styles.recentActivity}>
            <div className={styles.recentActivityHeader}>
                <h2 className={styles.sectionTitle}>
                    Recent Contact Submissions
                    {newCount > 0 && (
                        <span className={styles.newBadge} style={{ marginLeft: '0.75rem', fontSize: '0.6rem' }}>
                            <span className={styles.newBadgeDot} />
                            {newCount} New
                        </span>
                    )}
                </h2>

                {newCount > 0 && (
                    <div className={styles.inlineBanner}>
                        <span className={styles.inlineBannerText}>
                            📬 {newCount} new submission{newCount !== 1 ? 's' : ''} since you last checked
                            {emailsLastViewedAt && (
                                <> · last seen {formatRelative(emailsLastViewedAt)}</>
                            )}
                        </span>
                        <button
                            className={styles.markSeenBtn}
                            onClick={handleMarkAsSeen}
                            disabled={isMarkingDone}
                        >
                            {isMarkingDone ? 'Updating…' : '✓ Mark as seen'}
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.activityList}>
                {emails.length === 0 ? (
                    <p className={styles.emptyState}>No recent activity</p>
                ) : (
                    emails.map((email) => (
                        <Link
                            href={`/admin/tickets?open=${email.id}`}
                            key={email.id}
                            className={`${styles.activityItem} ${styles.clickableActivityItem} ${email.isNew && newCount > 0 ? styles.activityItemNew : ''}`}
                        >
                            <div className={styles.activityIcon}>
                                <FontAwesomeIcon icon={faInbox} />
                            </div>
                            <div className={styles.activityContent}>
                                <div className={styles.activityTitle}>
                                    {email.name}
                                    {email.isNew && newCount > 0 && (
                                        <span className={styles.newBadge} style={{ marginLeft: '0.5rem', fontSize: '0.58rem' }}>
                                            <span className={styles.newBadgeDot} />
                                            New
                                        </span>
                                    )}
                                </div>
                                <div className={styles.activityMeta}>{email.email}</div>
                            </div>
                            <div className={styles.activityTime}>
                                {formatRelative(email.createdAt)}
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
