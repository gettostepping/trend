import { requireAuth } from '@/app/actions/auth';
import { getAnalyticsData } from '@/app/actions/analytics';
import AnalyticsClient from './AnalyticsClient';
import styles from './analytics.module.css';

export default async function AnalyticsPage() {
    await requireAuth();

    const analytics = await getAnalyticsData(30);

    return (
        <div className={styles.analyticsLayout}>
            <AnalyticsClient initialData={analytics} />
        </div>
    );
}
