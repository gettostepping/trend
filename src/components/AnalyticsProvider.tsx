'use client';

import { useAnalytics, useWebVitals } from '@/hooks/useAnalytics';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    // Initialize analytics tracking
    useAnalytics();
    useWebVitals();

    return <>{children}</>;
}
