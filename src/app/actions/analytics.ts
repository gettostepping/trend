'use server';

import prisma from '@/lib/prisma';
import { requireAuth } from './auth';
import { getCountryFromIP } from '@/lib/ipGeolocation';
import { parseUserAgent } from '@/lib/userAgentParser';

// Track a page view
export async function trackPageView(data: {
    path: string;
    referrer?: string;
    userAgent?: string;
    ip?: string;
    country?: string; // Can be provided directly (e.g., from Cloudflare header)
    device?: string;
    browser?: string;
    os?: string;
    screenResolution?: string;
    sessionId: string;
    // Cloudflare headers (if available)
    cloudflareCountry?: string;
    cloudflareConnectingIP?: string;
}) {
    try {
        if (!process.env.DATABASE_URL) {
            return { success: false };
        }

        // Use Cloudflare connecting IP if available, otherwise use provided IP
        const realIP = data.cloudflareConnectingIP || data.ip;

        // Get country (prioritize Cloudflare header, then geolocation API)
        let country: string | null = data.country || null;
        if (!country && realIP) {
            const geoResult = await getCountryFromIP(realIP, data.cloudflareCountry);
            country = geoResult.country;
        }

        // Parse user agent if not already parsed
        let device = data.device;
        let browser = data.browser;
        let os = data.os;

        if (data.userAgent && (!device || !browser || !os)) {
            const parsed = parseUserAgent(data.userAgent);
            device = device || parsed.device;
            browser = browser || parsed.browser;
            os = os || parsed.os;
        }

        await prisma.pageView.create({
            data: {
                path: data.path,
                referrer: data.referrer || null,
                userAgent: data.userAgent || null,
                ip: realIP || null,
                country: country || null,
                device: device || null,
                browser: browser || null,
                os: os || null,
                screenResolution: data.screenResolution || null,
                sessionId: data.sessionId,
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Error tracking page view:', error);
        return { success: false };
    }
}

// Track a click event
export async function trackClickEvent(data: {
    element: string;
    elementId?: string;
    path: string;
    sessionId: string;
}) {
    try {
        if (!process.env.DATABASE_URL) {
            return { success: false };
        }

        await prisma.clickEvent.create({
            data: {
                element: data.element,
                elementId: data.elementId || null,
                path: data.path,
                sessionId: data.sessionId,
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Error tracking click event:', error);
        return { success: false };
    }
}

// Track Web Vitals
export async function trackWebVital(data: {
    sessionId: string;
    path: string;
    metric: 'lcp' | 'inp' | 'cls' | 'ttfb' | 'fcp' | 'tbt';
    value: number;
    device?: string;
    browser?: string;
    country?: string;
}) {
    try {
        if (!process.env.DATABASE_URL) {
            return { success: false };
        }

        // Determine rating based on metric thresholds
        let rating: 'good' | 'needs-improvement' | 'poor' = 'good';
        
        switch (data.metric) {
            case 'lcp':
                rating = data.value <= 2.5 ? 'good' : data.value <= 4.0 ? 'needs-improvement' : 'poor';
                break;
            case 'inp':
                rating = data.value <= 200 ? 'good' : data.value <= 500 ? 'needs-improvement' : 'poor';
                break;
            case 'cls':
                rating = data.value <= 0.1 ? 'good' : data.value <= 0.25 ? 'needs-improvement' : 'poor';
                break;
            case 'ttfb':
                rating = data.value <= 800 ? 'good' : data.value <= 1800 ? 'needs-improvement' : 'poor';
                break;
            case 'fcp':
                rating = data.value <= 1.8 ? 'good' : data.value <= 3.0 ? 'needs-improvement' : 'poor';
                break;
            case 'tbt':
                rating = data.value <= 200 ? 'good' : data.value <= 600 ? 'needs-improvement' : 'poor';
                break;
        }

        await prisma.webVital.create({
            data: {
                sessionId: data.sessionId,
                path: data.path,
                metric: data.metric,
                value: data.value,
                rating: rating,
                device: data.device || null,
                browser: data.browser || null,
                country: data.country || null,
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Error tracking web vital:', error);
        return { success: false };
    }
}

// Get analytics data for admin panel
export async function getAnalyticsData(days: number = 30): Promise<{
    totalPageViews: number;
    uniqueVisitors: number;
    averageSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
    pageViewsOverTime: { date: string; views: number }[];
    visitorsOverTime: { date: string; visitors: number }[];
    sessionsByHour: { hour: number; count: number }[];
    trafficByDay: { day: number; count: number }[];
    referrerBreakdown: { source: string; count: number; change?: string }[];
    topPages: { path: string; count: number }[];
    deviceBreakdown: { device: string; count: number }[];
    browserBreakdown: { browser: string; count: number }[];
    countryBreakdown: { country: string; count: number }[];
    clickEvents: { element: string; elementId: string | null; path: string; createdAt: Date }[];
    // Error tracking data
    errors: {
        id: string;
        message: string;
        stackTrace?: string;
        sourceFile?: string;
        sourceLine?: number;
        sourceColumn?: number;
        errorType: string;
        severity: string;
        pageUrl: string;
        sessionId: string;
        userId?: string;
        ipAddress?: string;
        browser?: string;
        os?: string;
        device?: string;
        country?: string;
        occurrences: number;
        affectedUsers: number;
        firstSeen: Date;
        lastSeen: Date;
        createdAt: Date;
    }[];
    errorTrends: { date: string; totalErrors: number; affectedUsers: number }[];
    totalErrors: number;
    errorRate: number;
    affectedUsers: number;
    affectedSessions: number;
    mostFrequentError?: {
        id: string;
        message: string;
        stackTrace?: string;
        sourceFile?: string;
        sourceLine?: number;
        sourceColumn?: number;
        errorType: string;
        severity: string;
        pageUrl: string;
        sessionId: string;
        userId?: string;
        ipAddress?: string;
        browser?: string;
        os?: string;
        device?: string;
        country?: string;
        occurrences: number;
        affectedUsers: number;
        firstSeen: Date;
        lastSeen: Date;
        createdAt: Date;
    };
    // New fields for Audience section
    liveNow: number;
    deviceResolutions: { device: string; resolution: string; count: number }[];
    // New fields for Web Vitals section
    webVitalsKPIs: {
        lcp: { value: number; status: string; target: number };
        inp: { value: number; status: string; target: number };
        cls: { value: number; status: string; target: number };
        ttfb: { value: number; status: string; target: number };
        fcp: { value: number; status: string; target: number };
        tbt: { value: number; status: string; target: number };
        overallScore: number;
    };
    vitalsTrends: { date: string; lcp: number; inp: number; cls: number; score: number }[];
    vitalsDistribution: {
        lcp: { good: number; needsImprovement: number; poor: number };
        inp: { good: number; needsImprovement: number; poor: number };
        cls: { good: number; needsImprovement: number; poor: number };
    };
    pagePerformance: { page: string; lcp: number; inp: number; cls: number; score: number }[];
    devicePerformance: { device: string; lcp: number; inp: number; cls: number; score: number }[];
}> {
    await requireAuth();

    try {
        const emptyReturn = {
            totalPageViews: 0,
            uniqueVisitors: 0,
            averageSessionDuration: 0,
            bounceRate: 0,
            conversionRate: 0,
            pageViewsOverTime: [],
            visitorsOverTime: [],
            sessionsByHour: [],
            trafficByDay: [],
            referrerBreakdown: [],
            topPages: [],
            deviceBreakdown: [],
            browserBreakdown: [],
            countryBreakdown: [],
            clickEvents: [],
            liveNow: 0,
            deviceResolutions: [],
            webVitalsKPIs: {
                lcp: { value: 0, status: 'good', target: 2.5 },
                inp: { value: 0, status: 'good', target: 200 },
                cls: { value: 0, status: 'good', target: 0.1 },
                ttfb: { value: 0, status: 'good', target: 800 },
                fcp: { value: 0, status: 'good', target: 1.8 },
                tbt: { value: 0, status: 'good', target: 200 },
                overallScore: 0,
            },
            vitalsTrends: [],
            vitalsDistribution: {
                lcp: { good: 0, needsImprovement: 0, poor: 0 },
                inp: { good: 0, needsImprovement: 0, poor: 0 },
                cls: { good: 0, needsImprovement: 0, poor: 0 },
            },
            pagePerformance: [],
            devicePerformance: [],
            errors: [],
            errorTrends: [],
            totalErrors: 0,
            errorRate: 0,
            affectedUsers: 0,
            affectedSessions: 0,
            mostFrequentError: undefined,
        };

        if (!process.env.DATABASE_URL) {
            return emptyReturn;
        }

        // Check if PageView model exists in Prisma client
        if (!prisma.pageView) {
            console.warn('PageView model not available. Please run: npx prisma generate');
            return emptyReturn;
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Determine if we need to use summaries (for data older than 180 days)
        const summaryCutoffDate = new Date();
        summaryCutoffDate.setDate(summaryCutoffDate.getDate() - 180);
        summaryCutoffDate.setHours(0, 0, 0, 0);
        
        const useSummaries = startDate < summaryCutoffDate;
        const rawDataStartDate = useSummaries ? summaryCutoffDate : startDate;

        // Get page views (from raw data for recent, summaries for old)
        let pageViews: any[] = [];
        let summaries: any[] = [];
        
        if (useSummaries) {
            // Get summaries for old data
            summaries = await prisma.dailyAnalyticsSummary.findMany({
                where: {
                    date: { gte: startDate, lt: summaryCutoffDate }
                },
                orderBy: { date: 'asc' }
            });
        }
        
        // Get raw page views for recent data
        pageViews = await prisma.pageView.findMany({
            where: {
                createdAt: { gte: rawDataStartDate }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Get all click events in date range
        const clickEvents = await prisma.clickEvent.findMany({
            where: {
                createdAt: { gte: rawDataStartDate }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        // Get all errors in date range
        const errors = await prisma.error.findMany({
            where: {
                createdAt: { gte: rawDataStartDate }
            },
            orderBy: { lastSeen: 'desc' }
        });

        // Get contact submissions for conversion rate
        const contactSubmissions = await prisma.contactSubmission.findMany({
            where: {
                createdAt: { gte: startDate }
            }
        });

        // Get Web Vitals in date range (only from raw data, summaries handle old data)
        const webVitals = await prisma.webVital.findMany({
            where: {
                createdAt: { gte: rawDataStartDate }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Calculate Live Now (sessions with activity in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentPageViews = await prisma.pageView.findMany({
            where: {
                createdAt: { gte: fiveMinutesAgo }
            },
            select: { sessionId: true }
        });
        const liveNow = new Set(recentPageViews.map(pv => pv.sessionId)).size;

        // Calculate metrics (combine raw data + summaries)
        const summaryPageViews = summaries.reduce((sum, s) => sum + s.totalPageViews, 0);
        const summaryUniqueVisitors = summaries.reduce((sum, s) => sum + s.uniqueVisitors, 0);
        const summarySessionDuration = summaries.length > 0 
            ? summaries.reduce((sum, s) => sum + s.avgSessionDuration, 0) / summaries.length 
            : 0;
        const summaryBounceRate = summaries.length > 0
            ? summaries.reduce((sum, s) => sum + s.bounceRate, 0) / summaries.length
            : 0;
        const summaryConversionRate = summaries.length > 0
            ? summaries.reduce((sum, s) => sum + s.conversionRate, 0) / summaries.length
            : 0;

        const totalPageViews = pageViews.length + summaryPageViews;
        const uniqueSessions = new Set(pageViews.map(pv => pv.sessionId));
        const uniqueVisitors = uniqueSessions.size + summaryUniqueVisitors;

        // Page views over time (grouped by day) - combine raw + summaries
        const pageViewsByDay = new Map<string, number>();
        const visitorsByDay = new Map<string, number>();
        
        // Add summary data
        summaries.forEach(summary => {
            const date = summary.date.toISOString().split('T')[0];
            pageViewsByDay.set(date, (pageViewsByDay.get(date) || 0) + summary.totalPageViews);
            visitorsByDay.set(date, (visitorsByDay.get(date) || 0) + summary.uniqueVisitors);
        });
        
        // Add raw page view data
        pageViews.forEach(pv => {
            const date = pv.createdAt.toISOString().split('T')[0];
            pageViewsByDay.set(date, (pageViewsByDay.get(date) || 0) + 1);
            
            if (!visitorsByDay.has(date)) {
                visitorsByDay.set(date, 0);
            }
            // For raw data, we need to count unique sessions per day
            // This is approximate - we'll increment by 1 for each page view
            // In practice, summaries handle this better
        });

        // For raw data days, calculate unique visitors properly
        const rawVisitorsByDay = new Map<string, Set<string>>();
        pageViews.forEach(pv => {
            const date = pv.createdAt.toISOString().split('T')[0];
            if (!rawVisitorsByDay.has(date)) {
                rawVisitorsByDay.set(date, new Set());
            }
            rawVisitorsByDay.get(date)!.add(pv.sessionId);
        });
        
        // Merge raw unique visitors with summaries
        rawVisitorsByDay.forEach((sessions, date) => {
            visitorsByDay.set(date, sessions.size);
        });

        const pageViewsOverTime = Array.from(pageViewsByDay.entries())
            .map(([date, count]) => ({ date, views: count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const visitorsOverTime = Array.from(visitorsByDay.entries())
            .map(([date, count]) => ({ date, visitors: count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Sessions by hour
        const sessionsByHour = new Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
        pageViews.forEach(pv => {
            const hour = pv.createdAt.getHours();
            sessionsByHour[hour].count++;
        });

        // Traffic by day of week
        const trafficByDay = new Array(7).fill(0).map((_, i) => ({ day: i, count: 0 }));
        pageViews.forEach(pv => {
            const day = pv.createdAt.getDay();
            trafficByDay[day].count++;
        });

        // Referrer breakdown with trends (compare to previous period)
        const referrerMap = new Map<string, number>();
        pageViews.forEach(pv => {
            const ref = pv.referrer || 'Direct';
            try {
                const domain = ref === 'Direct' ? 'Direct' : new URL(ref).hostname.replace('www.', '');
                referrerMap.set(domain, (referrerMap.get(domain) || 0) + 1);
            } catch {
                referrerMap.set('Direct', (referrerMap.get('Direct') || 0) + 1);
            }
        });

        // Get previous period data for trends
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - days);
        const previousPageViews = await prisma.pageView.findMany({
            where: {
                createdAt: { gte: previousStartDate, lt: startDate }
            }
        });
        const previousReferrerMap = new Map<string, number>();
        previousPageViews.forEach(pv => {
            const ref = pv.referrer || 'Direct';
            try {
                const domain = ref === 'Direct' ? 'Direct' : new URL(ref).hostname.replace('www.', '');
                previousReferrerMap.set(domain, (previousReferrerMap.get(domain) || 0) + 1);
            } catch {
                previousReferrerMap.set('Direct', (previousReferrerMap.get('Direct') || 0) + 1);
            }
        });

        const referrerBreakdown = Array.from(referrerMap.entries())
            .map(([source, count]) => {
                const previousCount = previousReferrerMap.get(source) || 0;
                const change = previousCount > 0 
                    ? ((count - previousCount) / previousCount * 100).toFixed(1)
                    : '0';
                return { 
                    source, 
                    count,
                    change: change === '0' ? '0%' : `${change.startsWith('-') ? '' : '+'}${change}%`
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Top pages
        const pageMap = new Map<string, number>();
        pageViews.forEach(pv => {
            pageMap.set(pv.path, (pageMap.get(pv.path) || 0) + 1);
        });
        const topPages = Array.from(pageMap.entries())
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Device breakdown
        const deviceMap = new Map<string, number>();
        pageViews.forEach(pv => {
            const device = pv.device || 'Unknown';
            deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
        });
        const deviceBreakdown = Array.from(deviceMap.entries())
            .map(([device, count]) => ({ device, count }));

        // Browser breakdown
        const browserMap = new Map<string, number>();
        pageViews.forEach(pv => {
            const browser = pv.browser || 'Unknown';
            browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
        });
        const browserBreakdown = Array.from(browserMap.entries())
            .map(([browser, count]) => ({ browser, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Country breakdown - convert codes to full names
        const CODE_TO_NAME: Record<string, string> = {
            'US': 'United States',
            'CA': 'Canada',
            'MX': 'Mexico',
            'BR': 'Brazil',
            'AR': 'Argentina',
            'GB': 'United Kingdom',
            'FR': 'France',
            'DE': 'Germany',
            'IT': 'Italy',
            'ES': 'Spain',
            'CN': 'China',
            'IN': 'India',
            'JP': 'Japan',
            'KR': 'South Korea',
            'ID': 'Indonesia',
            'TH': 'Thailand',
            'ZA': 'South Africa',
            'NG': 'Nigeria',
            'EG': 'Egypt',
            'AU': 'Australia',
            'NZ': 'New Zealand',
            'NL': 'Netherlands',
            'BE': 'Belgium',
            'CH': 'Switzerland',
            'SE': 'Sweden',
            'NO': 'Norway',
            'DK': 'Denmark',
            'PL': 'Poland',
            'RU': 'Russia',
            'TR': 'Turkey',
            'SA': 'Saudi Arabia',
            'AE': 'United Arab Emirates',
            'PH': 'Philippines',
            'MY': 'Malaysia',
            'SG': 'Singapore',
            'VN': 'Vietnam',
            'CL': 'Chile',
            'CO': 'Colombia',
            'PE': 'Peru',
            'KE': 'Kenya',
            'IL': 'Israel',
        };
        
        const countryMap = new Map<string, number>();
        pageViews.forEach(pv => {
            if (!pv.country) return; // Skip null/undefined countries
            // Convert code to name if it's a code, otherwise use as-is
            const countryName = CODE_TO_NAME[pv.country] || pv.country;
            countryMap.set(countryName, (countryMap.get(countryName) || 0) + 1);
        });
        const countryBreakdown = Array.from(countryMap.entries())
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count)
            .filter(item => item.country !== 'Unknown'); // Filter out Unknown


        // Average session duration (combine raw + summaries)
        let averageSessionDuration = 0;
        if (useSummaries && summaries.length > 0) {
            // Use summary data for old period
            const rawAvgPagesPerSession = pageViews.length > 0 && uniqueSessions.size > 0 
                ? pageViews.length / uniqueSessions.size 
                : 0;
            const rawDuration = Math.round(rawAvgPagesPerSession * 30);
            const summaryDuration = Math.round(summarySessionDuration);
            // Weighted average
            averageSessionDuration = Math.round(
                (rawDuration * pageViews.length + summaryDuration * summaryPageViews) / 
                (pageViews.length + summaryPageViews) || summaryDuration
            );
        } else {
            // Raw data only
            const avgPagesPerSession = uniqueVisitors > 0 ? totalPageViews / uniqueVisitors : 0;
            averageSessionDuration = Math.round(avgPagesPerSession * 30);
        }
        
        // Bounce rate (combine raw + summaries)
        let bounceRate = 0;
        if (useSummaries && summaries.length > 0) {
            bounceRate = summaryBounceRate; // Use summary bounce rate for old data
        } else {
            const sessionPageCounts = new Map<string, number>();
            pageViews.forEach(pv => {
                sessionPageCounts.set(pv.sessionId, (sessionPageCounts.get(pv.sessionId) || 0) + 1);
            });
            const bouncedSessions = Array.from(sessionPageCounts.values()).filter(count => count === 1).length;
            bounceRate = uniqueVisitors > 0 ? (bouncedSessions / uniqueVisitors) * 100 : 0;
        }
        
        // Conversion rate (combine raw + summaries)
        let conversionRate = 0;
        if (useSummaries && summaries.length > 0) {
            conversionRate = summaryConversionRate;
        } else {
            conversionRate = uniqueVisitors > 0 ? (contactSubmissions.length / uniqueVisitors) * 100 : 0;
        }

        // Device resolutions breakdown
        const resolutionMap = new Map<string, { device: string; count: number }>();
        pageViews.forEach(pv => {
            if (pv.screenResolution && pv.device) {
                const key = `${pv.device}:${pv.screenResolution}`;
                const existing = resolutionMap.get(key);
                if (existing) {
                    existing.count++;
                } else {
                    resolutionMap.set(key, { device: pv.device, count: 1 });
                }
            }
        });
        const deviceResolutions = Array.from(resolutionMap.entries())
            .map(([key, data]) => {
                const [device, resolution] = key.split(':');
                return { device, resolution, count: data.count };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Web Vitals calculations (combine raw + summaries)
        const lcpVitals = webVitals.filter(v => v.metric === 'lcp');
        const inpVitals = webVitals.filter(v => v.metric === 'inp');
        const clsVitals = webVitals.filter(v => v.metric === 'cls');
        const ttfbVitals = webVitals.filter(v => v.metric === 'ttfb');
        const fcpVitals = webVitals.filter(v => v.metric === 'fcp');
        const tbtVitals = webVitals.filter(v => v.metric === 'tbt');
        
        // Get summary vitals for old data
        const summaryLCP = summaries.filter(s => s.avgLCP !== null).map(s => s.avgLCP!);
        const summaryINP = summaries.filter(s => s.avgINP !== null).map(s => s.avgINP!);
        const summaryCLS = summaries.filter(s => s.avgCLS !== null).map(s => s.avgCLS!);
        const summaryTTFB = summaries.filter(s => s.avgTTFB !== null).map(s => s.avgTTFB!);
        const summaryFCP = summaries.filter(s => s.avgFCP !== null).map(s => s.avgFCP!);
        const summaryTBT = summaries.filter(s => s.avgTBT !== null).map(s => s.avgTBT!);
        
        // Calculate averages (combine raw + summaries)
        const totalLCP = [...lcpVitals.map(v => v.value), ...summaryLCP];
        const totalINP = [...inpVitals.map(v => v.value), ...summaryINP];
        const totalCLS = [...clsVitals.map(v => v.value), ...summaryCLS];
        const totalTTFB = [...ttfbVitals.map(v => v.value), ...summaryTTFB];
        const totalFCP = [...fcpVitals.map(v => v.value), ...summaryFCP];
        const totalTBT = [...tbtVitals.map(v => v.value), ...summaryTBT];
        
        const avgLCP = totalLCP.length > 0 
            ? totalLCP.reduce((sum, v) => sum + v, 0) / totalLCP.length 
            : 0;
        const avgINP = totalINP.length > 0 
            ? totalINP.reduce((sum, v) => sum + v, 0) / totalINP.length 
            : 0;
        const avgCLS = totalCLS.length > 0 
            ? totalCLS.reduce((sum, v) => sum + v, 0) / totalCLS.length 
            : 0;
        const avgTTFB = totalTTFB.length > 0 
            ? totalTTFB.reduce((sum, v) => sum + v, 0) / totalTTFB.length 
            : 0;
        const avgFCP = totalFCP.length > 0 
            ? totalFCP.reduce((sum, v) => sum + v, 0) / totalFCP.length 
            : 0;
        const avgTBT = totalTBT.length > 0 
            ? totalTBT.reduce((sum, v) => sum + v, 0) / totalTBT.length 
            : 0;

        // Calculate distributions (combine raw + summaries)
        const lcpGood = lcpVitals.filter(v => v.rating === 'good').length + summaries.reduce((sum, s) => sum + s.lcpGood, 0);
        const lcpNeedsImprovement = lcpVitals.filter(v => v.rating === 'needs-improvement').length + summaries.reduce((sum, s) => sum + s.lcpNeedsImprovement, 0);
        const lcpPoor = lcpVitals.filter(v => v.rating === 'poor').length + summaries.reduce((sum, s) => sum + s.lcpPoor, 0);
        const lcpTotal = lcpGood + lcpNeedsImprovement + lcpPoor;

        const inpGood = inpVitals.filter(v => v.rating === 'good').length + summaries.reduce((sum, s) => sum + s.inpGood, 0);
        const inpNeedsImprovement = inpVitals.filter(v => v.rating === 'needs-improvement').length + summaries.reduce((sum, s) => sum + s.inpNeedsImprovement, 0);
        const inpPoor = inpVitals.filter(v => v.rating === 'poor').length + summaries.reduce((sum, s) => sum + s.inpPoor, 0);
        const inpTotal = inpGood + inpNeedsImprovement + inpPoor;

        const clsGood = clsVitals.filter(v => v.rating === 'good').length + summaries.reduce((sum, s) => sum + s.clsGood, 0);
        const clsNeedsImprovement = clsVitals.filter(v => v.rating === 'needs-improvement').length + summaries.reduce((sum, s) => sum + s.clsNeedsImprovement, 0);
        const clsPoor = clsVitals.filter(v => v.rating === 'poor').length + summaries.reduce((sum, s) => sum + s.clsPoor, 0);
        const clsTotal = clsGood + clsNeedsImprovement + clsPoor;

        // Calculate overall performance score (0-100)
        const lcpScore = lcpTotal > 0 ? (lcpGood / lcpTotal) * 100 : 0;
        const inpScore = inpTotal > 0 ? (inpGood / inpTotal) * 100 : 0;
        const clsScore = clsTotal > 0 ? (clsGood / clsTotal) * 100 : 0;
        const overallScore = Math.round((lcpScore + inpScore + clsScore) / 3);

        // Web Vitals trends (grouped by day)
        const vitalsByDay = new Map<string, { lcp: number[]; inp: number[]; cls: number[] }>();
        webVitals.forEach(v => {
            const date = v.createdAt.toISOString().split('T')[0];
            if (!vitalsByDay.has(date)) {
                vitalsByDay.set(date, { lcp: [], inp: [], cls: [] });
            }
            const dayData = vitalsByDay.get(date)!;
            if (v.metric === 'lcp') dayData.lcp.push(v.value);
            if (v.metric === 'inp') dayData.inp.push(v.value);
            if (v.metric === 'cls') dayData.cls.push(v.value);
        });

        const vitalsTrends = Array.from(vitalsByDay.entries())
            .map(([date, data]) => {
                const avgLCP = data.lcp.length > 0 ? data.lcp.reduce((a, b) => a + b, 0) / data.lcp.length : 0;
                const avgINP = data.inp.length > 0 ? data.inp.reduce((a, b) => a + b, 0) / data.inp.length : 0;
                const avgCLS = data.cls.length > 0 ? data.cls.reduce((a, b) => a + b, 0) / data.cls.length : 0;
                // Calculate daily score
                const lcpScore = avgLCP <= 2.5 ? 100 : avgLCP <= 4.0 ? 50 : 0;
                const inpScore = avgINP <= 200 ? 100 : avgINP <= 500 ? 50 : 0;
                const clsScore = avgCLS <= 0.1 ? 100 : avgCLS <= 0.25 ? 50 : 0;
                const score = Math.round((lcpScore + inpScore + clsScore) / 3);
                return { date, lcp: avgLCP, inp: avgINP, cls: avgCLS, score };
            })
            .sort((a, b) => a.date.localeCompare(b.date));

        // Page performance
        const pageVitalsMap = new Map<string, { lcp: number[]; inp: number[]; cls: number[] }>();
        webVitals.forEach(v => {
            if (!pageVitalsMap.has(v.path)) {
                pageVitalsMap.set(v.path, { lcp: [], inp: [], cls: [] });
            }
            const pageData = pageVitalsMap.get(v.path)!;
            if (v.metric === 'lcp') pageData.lcp.push(v.value);
            if (v.metric === 'inp') pageData.inp.push(v.value);
            if (v.metric === 'cls') pageData.cls.push(v.value);
        });

        const pagePerformance = Array.from(pageVitalsMap.entries())
            .map(([page, data]) => {
                const avgLCP = data.lcp.length > 0 ? data.lcp.reduce((a, b) => a + b, 0) / data.lcp.length : 0;
                const avgINP = data.inp.length > 0 ? data.inp.reduce((a, b) => a + b, 0) / data.inp.length : 0;
                const avgCLS = data.cls.length > 0 ? data.cls.reduce((a, b) => a + b, 0) / data.cls.length : 0;
                const lcpScore = avgLCP <= 2.5 ? 100 : avgLCP <= 4.0 ? 50 : 0;
                const inpScore = avgINP <= 200 ? 100 : avgINP <= 500 ? 50 : 0;
                const clsScore = avgCLS <= 0.1 ? 100 : avgCLS <= 0.25 ? 50 : 0;
                const score = Math.round((lcpScore + inpScore + clsScore) / 3);
                return { page, lcp: avgLCP, inp: avgINP, cls: avgCLS, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        // Device performance
        const deviceVitalsMap = new Map<string, { lcp: number[]; inp: number[]; cls: number[] }>();
        webVitals.forEach(v => {
            const device = v.device || 'Unknown';
            if (!deviceVitalsMap.has(device)) {
                deviceVitalsMap.set(device, { lcp: [], inp: [], cls: [] });
            }
            const deviceData = deviceVitalsMap.get(device)!;
            if (v.metric === 'lcp') deviceData.lcp.push(v.value);
            if (v.metric === 'inp') deviceData.inp.push(v.value);
            if (v.metric === 'cls') deviceData.cls.push(v.value);
        });

        const devicePerformance = Array.from(deviceVitalsMap.entries())
            .map(([device, data]) => {
                const avgLCP = data.lcp.length > 0 ? data.lcp.reduce((a, b) => a + b, 0) / data.lcp.length : 0;
                const avgINP = data.inp.length > 0 ? data.inp.reduce((a, b) => a + b, 0) / data.inp.length : 0;
                const avgCLS = data.cls.length > 0 ? data.cls.reduce((a, b) => a + b, 0) / data.cls.length : 0;
                const lcpScore = avgLCP <= 2.5 ? 100 : avgLCP <= 4.0 ? 50 : 0;
                const inpScore = avgINP <= 200 ? 100 : avgINP <= 500 ? 50 : 0;
                const clsScore = avgCLS <= 0.1 ? 100 : avgCLS <= 0.25 ? 50 : 0;
                const score = Math.round((lcpScore + inpScore + clsScore) / 3);
                return { device, lcp: avgLCP, inp: avgINP, cls: avgCLS, score };
            })
            .sort((a, b) => b.score - a.score);

        // Process error data
        const totalErrors = errors.reduce((sum, e) => sum + e.occurrences, 0);
        const affectedUserSet = new Set<string>();
        const affectedSessionSet = new Set<string>();
        errors.forEach(e => {
            if (e.userId) affectedUserSet.add(e.userId);
            affectedSessionSet.add(e.sessionId);
        });
        const affectedUsers = affectedUserSet.size;
        const affectedSessions = affectedSessionSet.size;
        
        // Calculate error rate (errors per 100 page views)
        const errorRate = totalPageViews > 0 ? (totalErrors / totalPageViews) * 100 : 0;

        // Get most frequent error
        const mostFrequentError = errors.length > 0 
            ? errors.reduce((prev, current) => 
                current.occurrences > prev.occurrences ? current : prev
            )
            : undefined;

        // Error trends (grouped by day)
        const errorTrendsByDay = new Map<string, { totalErrors: number; affectedUsers: Set<string> }>();
        errors.forEach(error => {
            const date = error.createdAt.toISOString().split('T')[0];
            if (!errorTrendsByDay.has(date)) {
                errorTrendsByDay.set(date, { totalErrors: 0, affectedUsers: new Set() });
            }
            const dayData = errorTrendsByDay.get(date)!;
            dayData.totalErrors += error.occurrences;
            if (error.userId) dayData.affectedUsers.add(error.userId);
        });

        const errorTrends = Array.from(errorTrendsByDay.entries())
            .map(([date, data]) => ({
                date,
                totalErrors: data.totalErrors,
                affectedUsers: data.affectedUsers.size
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Format errors for frontend
        const formattedErrors = errors.map(error => ({
            id: error.id,
            message: error.message,
            stackTrace: error.stackTrace || undefined,
            sourceFile: error.sourceFile || undefined,
            sourceLine: error.sourceLine || undefined,
            sourceColumn: error.sourceColumn || undefined,
            errorType: error.errorType,
            severity: error.severity as 'low' | 'medium' | 'high' | 'critical',
            pageUrl: error.pageUrl,
            sessionId: error.sessionId,
            userId: error.userId || undefined,
            ipAddress: error.ip || undefined,
            browser: error.browser || undefined,
            os: error.os || undefined,
            device: error.device || undefined,
            country: error.country || undefined,
            occurrences: error.occurrences,
            affectedUsers: error.affectedUsers,
            firstSeen: error.firstSeen,
            lastSeen: error.lastSeen,
            createdAt: error.createdAt,
        }));

        // Format most frequent error
        const formattedMostFrequentError = mostFrequentError ? {
            id: mostFrequentError.id,
            message: mostFrequentError.message,
            stackTrace: mostFrequentError.stackTrace || undefined,
            sourceFile: mostFrequentError.sourceFile || undefined,
            sourceLine: mostFrequentError.sourceLine || undefined,
            sourceColumn: mostFrequentError.sourceColumn || undefined,
            errorType: mostFrequentError.errorType,
            severity: mostFrequentError.severity as 'low' | 'medium' | 'high' | 'critical',
            pageUrl: mostFrequentError.pageUrl,
            sessionId: mostFrequentError.sessionId,
            userId: mostFrequentError.userId || undefined,
            ipAddress: mostFrequentError.ip || undefined,
            browser: mostFrequentError.browser || undefined,
            os: mostFrequentError.os || undefined,
            device: mostFrequentError.device || undefined,
            country: mostFrequentError.country || undefined,
            occurrences: mostFrequentError.occurrences,
            affectedUsers: mostFrequentError.affectedUsers,
            firstSeen: mostFrequentError.firstSeen,
            lastSeen: mostFrequentError.lastSeen,
            createdAt: mostFrequentError.createdAt,
        } : undefined;

        return {
            totalPageViews,
            uniqueVisitors,
            averageSessionDuration,
            bounceRate: Math.round(bounceRate * 10) / 10,
            conversionRate: Math.round(conversionRate * 10) / 10,
            pageViewsOverTime,
            visitorsOverTime,
            sessionsByHour,
            trafficByDay,
            referrerBreakdown,
            topPages,
            deviceBreakdown,
            browserBreakdown,
            countryBreakdown,
            clickEvents: clickEvents.map(ce => ({
                element: ce.element,
                elementId: ce.elementId,
                path: ce.path,
                createdAt: ce.createdAt,
            })),
            errors: formattedErrors,
            errorTrends,
            totalErrors,
            errorRate: Math.round(errorRate * 100) / 100,
            affectedUsers,
            affectedSessions,
            mostFrequentError: formattedMostFrequentError,
            liveNow,
            deviceResolutions,
            webVitalsKPIs: {
                lcp: { value: avgLCP, status: avgLCP <= 2.5 ? 'good' : avgLCP <= 4.0 ? 'needs-improvement' : 'poor', target: 2.5 },
                inp: { value: avgINP, status: avgINP <= 200 ? 'good' : avgINP <= 500 ? 'needs-improvement' : 'poor', target: 200 },
                cls: { value: avgCLS, status: avgCLS <= 0.1 ? 'good' : avgCLS <= 0.25 ? 'needs-improvement' : 'poor', target: 0.1 },
                ttfb: { value: avgTTFB, status: avgTTFB <= 800 ? 'good' : avgTTFB <= 1800 ? 'needs-improvement' : 'poor', target: 800 },
                fcp: { value: avgFCP, status: avgFCP <= 1.8 ? 'good' : avgFCP <= 3.0 ? 'needs-improvement' : 'poor', target: 1.8 },
                tbt: { value: avgTBT, status: avgTBT <= 200 ? 'good' : avgTBT <= 600 ? 'needs-improvement' : 'poor', target: 200 },
                overallScore,
            },
            vitalsTrends,
            vitalsDistribution: {
                lcp: {
                    good: lcpTotal > 0 ? Math.round((lcpGood / lcpTotal) * 100) : 0,
                    needsImprovement: lcpTotal > 0 ? Math.round((lcpNeedsImprovement / lcpTotal) * 100) : 0,
                    poor: lcpTotal > 0 ? Math.round((lcpPoor / lcpTotal) * 100) : 0,
                },
                inp: {
                    good: inpTotal > 0 ? Math.round((inpGood / inpTotal) * 100) : 0,
                    needsImprovement: inpTotal > 0 ? Math.round((inpNeedsImprovement / inpTotal) * 100) : 0,
                    poor: inpTotal > 0 ? Math.round((inpPoor / inpTotal) * 100) : 0,
                },
                cls: {
                    good: clsTotal > 0 ? Math.round((clsGood / clsTotal) * 100) : 0,
                    needsImprovement: clsTotal > 0 ? Math.round((clsNeedsImprovement / clsTotal) * 100) : 0,
                    poor: clsTotal > 0 ? Math.round((clsPoor / clsTotal) * 100) : 0,
                },
            },
            pagePerformance,
            devicePerformance,
        };
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return {
            totalPageViews: 0,
            uniqueVisitors: 0,
            averageSessionDuration: 0,
            bounceRate: 0,
            conversionRate: 0,
            pageViewsOverTime: [],
            visitorsOverTime: [],
            sessionsByHour: [],
            trafficByDay: [],
            referrerBreakdown: [],
            topPages: [],
            deviceBreakdown: [],
            browserBreakdown: [],
            countryBreakdown: [],
            clickEvents: [],
            liveNow: 0,
            deviceResolutions: [],
            webVitalsKPIs: {
                lcp: { value: 0, status: 'good', target: 2.5 },
                inp: { value: 0, status: 'good', target: 200 },
                cls: { value: 0, status: 'good', target: 0.1 },
                ttfb: { value: 0, status: 'good', target: 800 },
                fcp: { value: 0, status: 'good', target: 1.8 },
                tbt: { value: 0, status: 'good', target: 200 },
                overallScore: 0,
            },
            vitalsTrends: [],
            vitalsDistribution: {
                lcp: { good: 0, needsImprovement: 0, poor: 0 },
                inp: { good: 0, needsImprovement: 0, poor: 0 },
                cls: { good: 0, needsImprovement: 0, poor: 0 },
            },
            pagePerformance: [],
            devicePerformance: [],
            errors: [],
            errorTrends: [],
            totalErrors: 0,
            errorRate: 0,
            affectedUsers: 0,
            affectedSessions: 0,
            mostFrequentError: undefined,
        };
    }
}
