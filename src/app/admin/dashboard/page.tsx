import prisma from '@/lib/prisma';
import styles from './dashboard.module.css';
import StatCard from './StatCard';
import ActionCard from './ActionCard';
import DashboardRecentSubmissions from './DashboardRecentSubmissions';
import { requireAuth } from '@/app/actions/auth';
import {
    faEnvelope,
    faCalendarDay,
    faChartLine,
    faUsers,
    faUserPlus,
    faMailBulk
} from '@fortawesome/free-solid-svg-icons';

export default async function DashboardPage() {
    const admin = await requireAuth();

    // ── Read emailsLastViewedAt — never auto-update it; the admin updates it
    //   explicitly by clicking "Mark as seen". ────────────────────────────
    let emailsLastViewedAt: Date | null = null;
    try {
        const adminRecord = await (prisma.admin as any).findUnique({
            where: { id: admin.id },
            select: { emailsLastViewedAt: true },
        });
        emailsLastViewedAt = adminRecord?.emailsLastViewedAt ?? null;
    } catch (err) {
        console.error('emailsLastViewedAt read error:', err);
    }

    // ── Fetch stats ───────────────────────────────────────────────────────
    let totalEmails = 0;
    let totalAdmins = 0;
    let emailsToday = 0;
    let emailsThisWeek = 0;
    let recentRaw: Array<{
        id: string;
        customerName: string;
        customerEmail: string;
        createdAt: Date;
    }> = [];

    try {
        if (process.env.DATABASE_URL) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            [totalEmails, totalAdmins, emailsToday, emailsThisWeek, recentRaw] = await Promise.all([
                prisma.ticket.count(),
                prisma.admin.count(),
                prisma.ticket.count({ where: { createdAt: { gte: today } } }),
                prisma.ticket.count({ where: { createdAt: { gte: weekAgo } } }),
                prisma.ticket.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        customerName: true,
                        customerEmail: true,
                        createdAt: true,
                    }
                })
            ]);
        }
    } catch (error) {
        console.error('Database error:', error);
    }

    // ── Tag each recent submission as new (arrived after last mark-as-seen) ─
    const recentEmails = recentRaw.map((t) => ({
        id: t.id,
        name: t.customerName,
        email: t.customerEmail,
        createdAt: t.createdAt.toISOString(),
        // isNew: true if it arrived after the admin last clicked "Mark as seen"
        // If emailsLastViewedAt is null (never marked), all are new
        isNew: emailsLastViewedAt ? t.createdAt > emailsLastViewedAt : true,
    }));

    const newCount = recentEmails.filter((e) => e.isNew).length;

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.content}>
                <h1 className={styles.title}>
                    Admin <span className={styles.gradientText}>Dashboard</span>
                </h1>

                <div className={styles.statsGrid}>
                    <StatCard icon={faEnvelope} value={totalEmails} label="Total Emails" />
                    <StatCard icon={faCalendarDay} value={emailsToday} label="Emails Today" />
                    <StatCard icon={faChartLine} value={emailsThisWeek} label="Emails This Week" />
                    <StatCard icon={faUsers} value={totalAdmins} label="Admin Users" />
                </div>

                <DashboardRecentSubmissions
                    emails={recentEmails}
                    emailsLastViewedAt={emailsLastViewedAt ? emailsLastViewedAt.toISOString() : null}
                    newCount={newCount}
                />

                <div className={styles.quickActions}>
                    <h2 className={styles.sectionTitle}>Quick Actions</h2>
                    <div className={styles.grid}>
                        <ActionCard
                            icon={faUserPlus}
                            title="Add Admin"
                            description="Create a new admin user"
                            href="/admin/users"
                        />
                        <ActionCard
                            icon={faMailBulk}
                            title="View Emails"
                            description="Check contact submissions"
                            href="/admin/tickets"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
