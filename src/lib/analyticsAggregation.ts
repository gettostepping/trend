'use server';

import prisma from '@/lib/prisma';

/**
 * Create daily analytics summary for a specific date
 */
export async function createDailySummary(date: Date) {
    try {
        if (!process.env.DATABASE_URL) {
            return { success: false, error: 'Database not configured' };
        }

        // Set time to start of day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Get page views for the day
        const pageViews = await prisma.pageView.findMany({
            where: {
                createdAt: { gte: startOfDay, lte: endOfDay }
            }
        });

        // Get web vitals for the day
        const webVitals = await prisma.webVital.findMany({
            where: {
                createdAt: { gte: startOfDay, lte: endOfDay }
            }
        });

        // Get contact submissions for the day
        const contactSubmissions = await prisma.contactSubmission.findMany({
            where: {
                createdAt: { gte: startOfDay, lte: endOfDay }
            }
        });

        // Calculate metrics
        const totalPageViews = pageViews.length;
        const uniqueSessions = new Set(pageViews.map(pv => pv.sessionId));
        const uniqueVisitors = uniqueSessions.size;

        // Calculate session durations (simplified)
        const sessionPageCounts = new Map<string, number>();
        pageViews.forEach(pv => {
            sessionPageCounts.set(pv.sessionId, (sessionPageCounts.get(pv.sessionId) || 0) + 1);
        });
        const avgPagesPerSession = uniqueVisitors > 0 ? totalPageViews / uniqueVisitors : 0;
        const avgSessionDuration = Math.round(avgPagesPerSession * 30);

        // Bounce rate
        const bouncedSessions = Array.from(sessionPageCounts.values()).filter(count => count === 1).length;
        const bounceRate = uniqueVisitors > 0 ? (bouncedSessions / uniqueVisitors) * 100 : 0;

        // Conversion rate
        const conversionRate = uniqueVisitors > 0 ? (contactSubmissions.length / uniqueVisitors) * 100 : 0;

        // Web Vitals averages
        const lcpVitals = webVitals.filter(v => v.metric === 'lcp');
        const inpVitals = webVitals.filter(v => v.metric === 'inp');
        const clsVitals = webVitals.filter(v => v.metric === 'cls');
        const ttfbVitals = webVitals.filter(v => v.metric === 'ttfb');
        const fcpVitals = webVitals.filter(v => v.metric === 'fcp');
        const tbtVitals = webVitals.filter(v => v.metric === 'tbt');

        const avgLCP = lcpVitals.length > 0 
            ? lcpVitals.reduce((sum, v) => sum + v.value, 0) / lcpVitals.length 
            : null;
        const avgINP = inpVitals.length > 0 
            ? inpVitals.reduce((sum, v) => sum + v.value, 0) / inpVitals.length 
            : null;
        const avgCLS = clsVitals.length > 0 
            ? clsVitals.reduce((sum, v) => sum + v.value, 0) / clsVitals.length 
            : null;
        const avgTTFB = ttfbVitals.length > 0 
            ? ttfbVitals.reduce((sum, v) => sum + v.value, 0) / ttfbVitals.length 
            : null;
        const avgFCP = fcpVitals.length > 0 
            ? fcpVitals.reduce((sum, v) => sum + v.value, 0) / fcpVitals.length 
            : null;
        const avgTBT = tbtVitals.length > 0 
            ? tbtVitals.reduce((sum, v) => sum + v.value, 0) / tbtVitals.length 
            : null;

        // Distributions
        const lcpGood = lcpVitals.filter(v => v.rating === 'good').length;
        const lcpNeedsImprovement = lcpVitals.filter(v => v.rating === 'needs-improvement').length;
        const lcpPoor = lcpVitals.filter(v => v.rating === 'poor').length;

        const inpGood = inpVitals.filter(v => v.rating === 'good').length;
        const inpNeedsImprovement = inpVitals.filter(v => v.rating === 'needs-improvement').length;
        const inpPoor = inpVitals.filter(v => v.rating === 'poor').length;

        const clsGood = clsVitals.filter(v => v.rating === 'good').length;
        const clsNeedsImprovement = clsVitals.filter(v => v.rating === 'needs-improvement').length;
        const clsPoor = clsVitals.filter(v => v.rating === 'poor').length;

        // Create or update summary
        await prisma.dailyAnalyticsSummary.upsert({
            where: { date: startOfDay },
            update: {
                totalPageViews,
                uniqueVisitors,
                avgSessionDuration,
                bounceRate: Math.round(bounceRate * 10) / 10,
                conversionRate: Math.round(conversionRate * 10) / 10,
                avgLCP,
                avgINP,
                avgCLS,
                avgTTFB,
                avgFCP,
                avgTBT,
                lcpGood,
                lcpNeedsImprovement,
                lcpPoor,
                inpGood,
                inpNeedsImprovement,
                inpPoor,
                clsGood,
                clsNeedsImprovement,
                clsPoor,
            },
            create: {
                date: startOfDay,
                totalPageViews,
                uniqueVisitors,
                avgSessionDuration,
                bounceRate: Math.round(bounceRate * 10) / 10,
                conversionRate: Math.round(conversionRate * 10) / 10,
                avgLCP,
                avgINP,
                avgCLS,
                avgTTFB,
                avgFCP,
                avgTBT,
                lcpGood,
                lcpNeedsImprovement,
                lcpPoor,
                inpGood,
                inpNeedsImprovement,
                inpPoor,
                clsGood,
                clsNeedsImprovement,
                clsPoor,
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Error creating daily summary:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Delete raw analytics data older than specified days
 */
export async function cleanupOldAnalyticsData(days: number) {
    try {
        if (!process.env.DATABASE_URL) {
            return { success: false, error: 'Database not configured' };
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);

        // Delete old page views
        const deletedPageViews = await prisma.pageView.deleteMany({
            where: {
                createdAt: { lt: cutoffDate }
            }
        });

        // Delete old click events
        const deletedClickEvents = await prisma.clickEvent.deleteMany({
            where: {
                createdAt: { lt: cutoffDate }
            }
        });

        // Delete old web vitals
        const deletedWebVitals = await prisma.webVital.deleteMany({
            where: {
                createdAt: { lt: cutoffDate }
            }
        });

        // Delete old IP cache entries (keep for 90 days)
        const ipCacheCutoff = new Date();
        ipCacheCutoff.setDate(ipCacheCutoff.getDate() - 90);
        const deletedIPCache = await prisma.iPCountryCache.deleteMany({
            where: {
                updatedAt: { lt: ipCacheCutoff }
            }
        });

        return {
            success: true,
            deleted: {
                pageViews: deletedPageViews.count,
                clickEvents: deletedClickEvents.count,
                webVitals: deletedWebVitals.count,
                ipCache: deletedIPCache.count,
            }
        };
    } catch (error) {
        console.error('Error cleaning up old analytics data:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Full wipe of analytics data older than specified days (including summaries)
 */
export async function fullWipeAnalyticsData(days: number) {
    try {
        if (!process.env.DATABASE_URL) {
            return { success: false, error: 'Database not configured' };
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);

        // Delete old summaries
        const deletedSummaries = await prisma.dailyAnalyticsSummary.deleteMany({
            where: {
                date: { lt: cutoffDate }
            }
        });

        // Also delete raw data
        const cleanupResult = await cleanupOldAnalyticsData(days);

        return {
            success: true,
            deleted: {
                summaries: deletedSummaries.count,
                ...cleanupResult.deleted,
            }
        };
    } catch (error) {
        console.error('Error performing full wipe:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Clear ALL analytics data (PageView, ClickEvent, WebVital, Error, DailyAnalyticsSummary)
 */
export async function clearAllAnalyticsData() {
    try {
        if (!process.env.DATABASE_URL) {
            return { success: false, error: 'Database not configured' };
        }

        const [pv, ce, wv, err, das] = await Promise.all([
            prisma.pageView.deleteMany({}),
            prisma.clickEvent.deleteMany({}),
            prisma.webVital.deleteMany({}),
            prisma.error.deleteMany({}),
            prisma.dailyAnalyticsSummary.deleteMany({}),
        ]);

        return {
            success: true,
            deleted: {
                pageViews: pv.count,
                clickEvents: ce.count,
                webVitals: wv.count,
                errors: err.count,
                dailySummaries: das.count,
            },
        };
    } catch (error) {
        console.error('Error clearing all analytics:', error);
        return { success: false, error: String(error) };
    }
}
