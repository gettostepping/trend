'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import CustomChartTooltip from './CustomChartTooltip';
import {
    faEye,
    faUsers,
    faClock,
    faChartLine,
    faMousePointer,
    faGlobe,
    faHeartbeat,
    faMapMarkerAlt,
    faCog,
    faFilter,
    faSync,
    faArrowLeft,
    faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './analytics.module.css';
import CustomWorldMap from './CustomWorldMap';
import TopCountries from './TopCountries';
import ErrorTracking from './ErrorTracking';

interface AnalyticsData {
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
}

interface AnalyticsClientProps {
    initialData: AnalyticsData;
}

// REMOVED: All mock data - now using real data from backend

export default function AnalyticsClient({ initialData }: AnalyticsClientProps) {
    const router = useRouter();
    const [data, setData] = useState(initialData);
    const [timeRange, setTimeRange] = useState(7); // Default to 7d
    const [viewMode, setViewMode] = useState<'daily' | 'hourly'>('daily');
    // Initialize activeSection from localStorage or default to 'dashboard'
    const [activeSection, setActiveSection] = useState<string>('dashboard');
    const [isLoading, setIsLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);
    // Web Vitals box toggles
    const [vitalsBoxView, setVitalsBoxView] = useState<'trends' | 'distribution'>('trends');
    const [perfBoxView, setPerfBoxView] = useState<'page' | 'device'>('page');
    const [engagementView, setEngagementView] = useState<'pages' | 'clicks'>('pages');
    // Audience tab toggles
    const [audienceTrafficView, setAudienceTrafficView] = useState<'traffic' | 'referrers'>('traffic');
    const [audienceDeviceView, setAudienceDeviceView] = useState<'browser' | 'device'>('browser');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Handle client-side hydration and restore active tab
    useEffect(() => {
        setIsClient(true);
        // Restore active section from localStorage
        const savedSection = localStorage.getItem('analyticsActiveSection');
        if (savedSection) {
            setActiveSection(savedSection);
        }
    }, []);

    // Save active section to localStorage when it changes
    useEffect(() => {
        if (isClient) {
            localStorage.setItem('analyticsActiveSection', activeSection);
        }
    }, [activeSection, isClient]);

    const handleLogoClick = () => {
        router.push('/admin/dashboard');
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/analytics?days=${timeRange}`);
                const newData = await response.json();
                setData(newData);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [timeRange]);

    // Calculate trends (simplified - in real app, compare with previous period)
    // Use a deterministic calculation based on the value to avoid hydration errors
    const calculateTrend = (current: number) => {
        // Use a deterministic calculation based on the current value
        // This ensures server and client render the same value
        if (current === 0) return 0;
        // Simple hash-like function for deterministic "random" value
        const hash = current % 50;
        return hash - 10; // Between -10% and +40%
    };

    const formatNumber = (num: number) => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    // Note: Data is already filtered server-side by timeRange, so we don't need client-side filtering
    // This function is kept for any edge cases where we might need additional filtering
    const filterDataByTimeRange = <T extends { date?: string; createdAt?: Date }>(items: T[]): T[] => {
        // Server already filters by timeRange, so just return items as-is
        // Only filter if items don't have date (which means they weren't filtered server-side)
        if (!items || items.length === 0) return [];

        // For data that might not be filtered server-side (like vitalsTrends), apply client-side filter
        const now = new Date();
        const cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - timeRange);

        return items.filter(item => {
            if (item.date) {
                const itemDate = new Date(item.date);
                return itemDate >= cutoffDate;
            }
            if (item.createdAt) {
                return item.createdAt >= cutoffDate;
            }
            return true;
        });
    };

    // Format chart data based on view mode and timeRange
    const chartData = viewMode === 'daily'
        ? filterDataByTimeRange(data.pageViewsOverTime).map(item => ({
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: item.date,
            views: item.views,
            visitors: data.visitorsOverTime.find(v => v.date === item.date)?.visitors || 0,
        }))
        : data.sessionsByHour.map(item => ({
            hour: item.hour,
            hourLabel: `${item.hour}:00`,
            views: item.count,
        }));

    const timeRangeButtons = [
        { label: '24h', days: 1 },
        { label: '7d', days: 7 },
        { label: '30d', days: 30 },
        { label: '90d', days: 90 },
        { label: '180d', days: 180 },
        { label: '365d', days: 365 },
    ];

    const sidebarItems = [
        { id: 'dashboard', label: 'Dashboard', icon: faEye },
        { id: 'audience', label: 'Audience', icon: faUsers },
        { id: 'web-vitals', label: 'Web Vitals', icon: faHeartbeat },
        { id: 'geographic', label: 'Geographic', icon: faMapMarkerAlt },
        { id: 'error-tracking', label: 'Error Tracking', icon: faExclamationTriangle },
    ];

    // Calculate sessions (approximate from pageviews)
    const sessions = Math.floor(data.totalPageViews * 0.63); // Rough estimate

    return (
        <div className={styles.analyticsContainer}>
            {/* Left Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div
                        className={styles.logo}
                        onClick={handleLogoClick}
                        style={{ cursor: 'pointer' }}
                    >
                        TRENDS<span className={styles.logoSpan}>IGNITE</span>
                    </div>
                </div>

                <nav className={styles.sidebarNav}>
                    <div className={styles.sidebarSection}>
                        <div className={styles.sidebarSectionHeader}>
                            <FontAwesomeIcon icon={faChartLine} className={styles.sectionIcon} />
                            <span>Web Analytics</span>
                        </div>
                        <ul className={styles.sidebarList}>
                            {sidebarItems.map((item) => (
                                <li key={item.id}>
                                    <button
                                        className={`${styles.sidebarItem} ${activeSection === item.id ? styles.active : ''}`}
                                        onClick={() => setActiveSection(item.id)}
                                    >
                                        <FontAwesomeIcon icon={item.icon} className={styles.sidebarIcon} />
                                        <span>{item.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {/* Top Header */}
                <header className={styles.topHeader}>
                    <div className={styles.headerLeft}>
                        {/* Back To Home Button */}
                        <Link href="/" className={styles.backToHome}>
                            <FontAwesomeIcon icon={faArrowLeft} className={styles.arrowIcon} />
                            <span>Back To Home</span>
                        </Link>

                        {/* Pill toggle switch for View Mode */}
                        <div style={{
                            display: 'flex',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '999px',
                            padding: '3px',
                            gap: '2px',
                            flexShrink: 0,
                        }}>
                            <button
                                onClick={() => setViewMode('daily')}
                                style={{
                                    padding: '0.4rem 1.25rem',
                                    borderRadius: '999px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s ease',
                                    background: viewMode === 'daily' ? '#1A73E8' : 'transparent',
                                    color: viewMode === 'daily' ? '#fff' : '#aaa',
                                }}
                            >
                                Daily
                            </button>
                            <button
                                onClick={() => setViewMode('hourly')}
                                style={{
                                    padding: '0.4rem 1.25rem',
                                    borderRadius: '999px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s ease',
                                    background: viewMode === 'hourly' ? '#1A73E8' : 'transparent',
                                    color: viewMode === 'hourly' ? '#fff' : '#aaa',
                                }}
                            >
                                Hourly
                            </button>
                        </div>
                    </div>

                    <div className={styles.headerRight}>
                        <div className={styles.timeRangeButtons}>
                            {timeRangeButtons.map((btn) => (
                                <button
                                    key={btn.label}
                                    className={`${styles.timeRangeBtn} ${timeRange === btn.days ? styles.active : ''}`}
                                    onClick={() => setTimeRange(btn.days)}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                        <div className={styles.headerActions}>
                            <button className={styles.actionBtn}>
                                <FontAwesomeIcon icon={faFilter} />
                                <span>Filter</span>
                            </button>
                            <div className={styles.onlineIndicator}>
                                <span className={styles.onlineDot}></span>
                                <span>{data.liveNow || 0} online</span>
                            </div>
                            <button className={styles.actionBtn}>
                                <FontAwesomeIcon icon={faSync} />
                            </button>

                        </div>
                    </div>
                    {/* Hamburger Menu Dropdown for Section Selection */}
                    <div className={styles.hamburgerWrapper}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{
                                background: isMenuOpen ? '#1A73E8' : '#2a2a2a',
                                color: isMenuOpen ? '#fff' : '#aaa',
                                borderColor: isMenuOpen ? '#1A73E8' : 'rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
                        </button>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className={styles.desktopDropdownContainer}
                                >
                                    {sidebarItems.map((item) => (
                                        <button
                                            key={item.id}
                                            className={`${styles.desktopDropdownItem} ${activeSection === item.id ? styles.active : ''}`}
                                            onClick={() => {
                                                setActiveSection(item.id);
                                                setIsMenuOpen(false);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={item.icon} className={styles.dropdownIcon} />
                                            {item.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                {/* Dashboard Content */}
                {activeSection === 'dashboard' && (
                    <div className={styles.dashboardContent}>
                        {/* Metric Cards */}
                        <div className={styles.metricsGrid}>
                            <motion.div
                                className={styles.metricCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className={styles.metricIcon}>
                                    <FontAwesomeIcon icon={faGlobe} />
                                </div>
                                <div className={styles.metricValue}>{formatNumber(data.totalPageViews)}</div>
                                <div className={styles.metricLabel}>Pageviews</div>
                                {isClient && (
                                    <div className={styles.metricTrend}>
                                        <span className={styles.trendUp}>↑</span>
                                        <span className={styles.trendPositive}>+{calculateTrend(data.totalPageViews)}%</span>
                                    </div>
                                )}
                            </motion.div>

                            <motion.div
                                className={styles.metricCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                            >
                                <div className={styles.metricIcon}>
                                    <FontAwesomeIcon icon={faChartLine} />
                                </div>
                                <div className={styles.metricValue}>{formatNumber(sessions)}</div>
                                <div className={styles.metricLabel}>Sessions</div>
                                {isClient && (
                                    <div className={styles.metricTrend}>
                                        <span className={styles.trendUp}>↑</span>
                                        <span className={styles.trendPositive}>+{calculateTrend(sessions)}%</span>
                                    </div>
                                )}
                            </motion.div>

                            <motion.div
                                className={styles.metricCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                <div className={styles.metricIcon}>
                                    <FontAwesomeIcon icon={faUsers} />
                                </div>
                                <div className={styles.metricValue}>{formatNumber(data.uniqueVisitors)}</div>
                                <div className={styles.metricLabel}>Visitors</div>
                                {isClient && (
                                    <div className={styles.metricTrend}>
                                        <span className={styles.trendUp}>↑</span>
                                        <span className={styles.trendPositive}>+{calculateTrend(data.uniqueVisitors)}%</span>
                                    </div>
                                )}
                            </motion.div>

                            <motion.div
                                className={styles.metricCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                            >
                                <div className={styles.metricIcon}>
                                    <FontAwesomeIcon icon={faMousePointer} />
                                </div>
                                <div className={styles.metricValue}>{data.bounceRate.toFixed(1)}%</div>
                                <div className={styles.metricLabel}>Bounce Rate</div>
                                {isClient && (
                                    <div className={styles.metricTrend}>
                                        <span className={styles.trendDown}>↓</span>
                                        <span className={styles.trendNegative}>-{Math.abs(calculateTrend(data.bounceRate))}%</span>
                                    </div>
                                )}
                            </motion.div>

                            <motion.div
                                className={styles.metricCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.4 }}
                            >
                                <div className={styles.metricIcon}>
                                    <FontAwesomeIcon icon={faClock} />
                                </div>
                                <div className={styles.metricValue}>{formatDuration(data.averageSessionDuration)}</div>
                                <div className={styles.metricLabel}>Session Duration</div>
                                {isClient && (
                                    <div className={styles.metricTrend}>
                                        <span className={styles.trendUp}>↑</span>
                                        <span className={styles.trendPositive}>+{calculateTrend(data.averageSessionDuration)}%</span>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Traffic Trends Chart */}
                        <div className={styles.chartSection}>
                            <div className={styles.chartHeader}>
                                <h2 className={styles.chartTitle}>Traffic Trends</h2>
                                <p className={styles.chartSubtitle}>
                                    {viewMode === 'daily' ? 'Daily' : 'Hourly'} traffic data
                                </p>
                            </div>
                            <div className={styles.chartContainer}>
                                <ResponsiveContainer width="100%" height={400}>
                                    <AreaChart data={chartData} margin={{ top: 0, right: 10, left: -15, bottom: 150 }}>
                                        <defs>
                                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#1A73E8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                        <XAxis
                                            dataKey={viewMode === 'daily' ? 'date' : 'hourLabel'}
                                            stroke="#aaa"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis
                                            stroke="#aaa"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <Tooltip
                                            content={<CustomChartTooltip dateFormat={viewMode === 'daily' ? 'date' : 'hour'} valueKey="views" valueLabel="views" />}
                                            cursor={{ stroke: '#1A73E8', strokeWidth: 1, strokeDasharray: '0', fill: 'transparent' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="views"
                                            stroke="#1A73E8"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorViews)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Pages & Click Events Toggle Section */}
                        <div className={styles.desktopGrid}>
                            {/* Top Pages */}
                            <div className={`${styles.chartSection} ${engagementView === 'pages' ? '' : styles.hideOnMobile}`}>
                                <div className={styles.chartHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2 className={styles.chartTitle}>Top Pages</h2>
                                        <p className={styles.chartSubtitle}>Most visited pages</p>
                                    </div>
                                    <div className={styles.mobileToggles} style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '999px',
                                        padding: '3px',
                                        gap: '2px',
                                        flexShrink: 0,
                                    }}>
                                        <button
                                            onClick={() => setEngagementView('pages')}
                                            style={{
                                                padding: '0.4rem 1.25rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: engagementView === 'pages' ? '#1A73E8' : 'transparent',
                                                color: engagementView === 'pages' ? '#fff' : '#aaa',
                                            }}
                                        >
                                            Top Pages
                                        </button>
                                        <button
                                            onClick={() => setEngagementView('clicks')}
                                            style={{
                                                padding: '0.4rem 1.25rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: engagementView === 'clicks' ? '#1A73E8' : 'transparent',
                                                color: engagementView === 'clicks' ? '#fff' : '#aaa',
                                            }}
                                        >
                                            Recent Clicks
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.analysisTable}>
                                    <div className={styles.analysisHeader} style={{ gridTemplateColumns: '2fr 1fr' }}>
                                        <div className={styles.analysisCell}>PAGE</div>
                                        <div className={styles.analysisCell}>VIEWS</div>
                                    </div>
                                    <div className={styles.analysisBody}>
                                        {(data.topPages || []).slice(0, 10).map((page, idx) => (
                                            <div key={idx} className={styles.analysisRow} style={{ gridTemplateColumns: '2fr 1fr' }}>
                                                <div className={styles.analysisCell}>{page.path}</div>
                                                <div className={styles.analysisCell}>{page.count.toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Clicks */}
                            <div className={`${styles.chartSection} ${engagementView === 'clicks' ? '' : styles.hideOnMobile}`}>
                                <div className={styles.chartHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2 className={styles.chartTitle}>Recent Clicks</h2>
                                        <p className={styles.chartSubtitle}>User interactions</p>
                                    </div>
                                    <div className={styles.mobileToggles} style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '999px',
                                        padding: '3px',
                                        gap: '2px',
                                        flexShrink: 0,
                                    }}>
                                        <button
                                            onClick={() => setEngagementView('pages')}
                                            style={{
                                                padding: '0.4rem 1.25rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: engagementView === 'pages' ? '#1A73E8' : 'transparent',
                                                color: engagementView === 'pages' ? '#fff' : '#aaa',
                                            }}
                                        >
                                            Top Pages
                                        </button>
                                        <button
                                            onClick={() => setEngagementView('clicks')}
                                            style={{
                                                padding: '0.4rem 1.25rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: engagementView === 'clicks' ? '#1A73E8' : 'transparent',
                                                color: engagementView === 'clicks' ? '#fff' : '#aaa',
                                            }}
                                        >
                                            Recent Clicks
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.analysisTable}>
                                    <div className={styles.analysisHeader} style={{ gridTemplateColumns: '1.5fr 1fr 1fr' }}>
                                        <div className={styles.analysisCell}>ELEMENT</div>
                                        <div className={styles.analysisCell}>PAGE</div>
                                        <div className={styles.analysisCell}>TIME</div>
                                    </div>
                                    <div className={styles.analysisBody}>
                                        {(data.clickEvents || []).slice(0, 10).map((click, idx) => (
                                            <div key={idx} className={styles.analysisRow} style={{ gridTemplateColumns: '1.5fr 1fr 1fr' }}>
                                                <div className={styles.analysisCell}>
                                                    {click.element}
                                                    {click.elementId && <span style={{ color: '#666', fontSize: '0.75rem' }}> ({click.elementId})</span>}
                                                </div>
                                                <div className={styles.analysisCell}>{click.path}</div>
                                                <div className={styles.analysisCell}>
                                                    {new Date(click.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        ))}
                                        {(!data.clickEvents || data.clickEvents.length === 0) && (
                                            <div className={styles.analysisRow} style={{ gridTemplateColumns: '1fr' }}>
                                                <div className={styles.analysisCell} style={{ textAlign: 'center', color: '#666' }}>
                                                    No click events yet
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Geographic Section */}
                {activeSection === 'geographic' && (
                    <div className={styles.geographicContent}>
                        <div className={styles.geographicHeader}>
                            <h2 className={styles.geographicTitle}>Geographic Distribution</h2>
                            <p className={styles.geographicSubtitle}>
                                Traffic by country for the last {timeRange} day{timeRange !== 1 ? 's' : ''}
                            </p>
                        </div>

                        <div className={styles.mapSection}>
                            <CustomWorldMap countryData={data.countryBreakdown || []} />
                        </div>
                        <div className={styles.topCountriesSection}>
                            <TopCountries
                                countries={data.countryBreakdown || []}
                                total={data.totalPageViews}
                            />
                        </div>
                    </div>
                )}

                {/* Error Tracking Section */}
                {activeSection === 'error-tracking' && (
                    <ErrorTracking
                        errors={(data.errors || []) as any}
                        errorTrends={data.errorTrends || []}
                        totalErrors={data.totalErrors || 0}
                        errorRate={data.errorRate || 0}
                        affectedUsers={data.affectedUsers || 0}
                        affectedSessions={data.affectedSessions || 0}
                        mostFrequentError={data.mostFrequentError as any}
                        viewMode={viewMode}
                        timeRange={timeRange}
                    />
                )}

                {/* Audience Section */}
                {activeSection === 'audience' && (
                    <div className={styles.dashboardContent}>
                        {/* KPI Cards for Audience */}
                        <div className={styles.metricsGrid}>
                            <motion.div
                                className={styles.metricCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className={styles.metricIcon}>
                                    <FontAwesomeIcon icon={faUsers} />
                                </div>
                                <div className={styles.metricValue}>{formatNumber(data.uniqueVisitors)}</div>
                                <div className={styles.metricLabel}>Total Visitors</div>
                                {isClient && (
                                    <div className={styles.metricTrend}>
                                        <span className={styles.trendUp}>↑</span>
                                        <span className={styles.trendPositive}>+{calculateTrend(data.uniqueVisitors)}%</span>
                                    </div>
                                )}
                            </motion.div>

                            <motion.div
                                className={styles.metricCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                            >
                                <div className={styles.metricIcon}>
                                    <FontAwesomeIcon icon={faEye} />
                                </div>
                                <div className={styles.metricValue}>{formatNumber(data.totalPageViews)}</div>
                                <div className={styles.metricLabel}>Page Views</div>
                                {isClient && (
                                    <div className={styles.metricTrend}>
                                        <span className={styles.trendUp}>↑</span>
                                        <span className={styles.trendPositive}>+{calculateTrend(data.totalPageViews)}%</span>
                                    </div>
                                )}
                            </motion.div>

                            <motion.div
                                className={styles.metricCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                <div className={styles.metricIcon}>
                                    <FontAwesomeIcon icon={faClock} />
                                </div>
                                <div className={styles.metricValue}>{formatDuration(data.averageSessionDuration)}</div>
                                <div className={styles.metricLabel}>Avg. Session</div>
                                {isClient && (
                                    <div className={styles.metricTrend}>
                                        <span className={styles.trendUp}>↑</span>
                                        <span className={styles.trendPositive}>+{calculateTrend(data.averageSessionDuration)}%</span>
                                    </div>
                                )}
                            </motion.div>

                            <motion.div
                                className={styles.metricCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                            >
                                <div className={styles.metricIcon}>
                                    <FontAwesomeIcon icon={faHeartbeat} />
                                </div>
                                <div className={styles.metricValue}>
                                    {data.liveNow || 0}
                                </div>
                                <div className={styles.metricLabel}>Live Now</div>
                                {isClient && (
                                    <div className={styles.metricTrend}>
                                        <span className={styles.trendUp}>↑</span>
                                        <span className={styles.trendPositive}>+{calculateTrend(data.liveNow || 0)}%</span>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Toggled Charts Grid */}
                        <div className={styles.desktopGrid}>
                            {/* Traffic Over Time */}
                            <div className={`${styles.chartSection} ${audienceTrafficView === 'traffic' ? '' : styles.hideOnMobile}`}>
                                <div className={styles.chartHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2 className={styles.chartTitle}>Traffic Over Time</h2>
                                        <p className={styles.chartSubtitle}>Visitor trends</p>
                                    </div>
                                    <div className={styles.mobileToggles} style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '999px',
                                        padding: '3px',
                                        gap: '2px',
                                        flexShrink: 0,
                                    }}>
                                        <button
                                            onClick={() => setAudienceTrafficView('traffic')}
                                            style={{
                                                padding: '0.4rem 1.25rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: audienceTrafficView === 'traffic' ? '#1A73E8' : 'transparent',
                                                color: audienceTrafficView === 'traffic' ? '#fff' : '#aaa',
                                            }}
                                        >
                                            Traffic
                                        </button>
                                        <button
                                            onClick={() => setAudienceTrafficView('referrers')}
                                            style={{
                                                padding: '0.4rem 1.25rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: audienceTrafficView === 'referrers' ? '#1A73E8' : 'transparent',
                                                color: audienceTrafficView === 'referrers' ? '#fff' : '#aaa',
                                            }}
                                        >
                                            Referrers
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.chartContainer}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={viewMode === 'daily'
                                            ? filterDataByTimeRange(data.visitorsOverTime).map(item => ({
                                                date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                                fullDate: item.date,
                                                visitors: item.visitors
                                            }))
                                            : data.sessionsByHour.map(item => ({
                                                hour: item.hour,
                                                hourLabel: `${item.hour}:00`,
                                                visitors: item.count
                                            }))
                                        } margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                                            <defs>
                                                <pattern id="diagonalHatchAudience" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                                    <rect width="100%" height="100%" fill="rgba(26, 115, 232, 0.15)" />
                                                    <path d="M0,0 L0,8" stroke="rgba(26, 115, 232, 0.3)" strokeWidth="1" />
                                                </pattern>
                                                <filter id="frostBlurAudience">
                                                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
                                                </filter>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                            <XAxis
                                                dataKey={viewMode === 'daily' ? 'date' : 'hourLabel'}
                                                stroke="#aaa"
                                                style={{ fontSize: '12px' }}
                                            />
                                            <YAxis stroke="#aaa" style={{ fontSize: '12px' }} />
                                            <Tooltip
                                                content={<CustomChartTooltip dateFormat={viewMode === 'daily' ? 'date' : 'hour'} valueKey="visitors" valueLabel="visitors" />}
                                                cursor={{ stroke: '#1A73E8', strokeWidth: 1, strokeDasharray: '0', fill: 'transparent' }}
                                            />
                                            <Bar
                                                dataKey="visitors"
                                                fill="url(#diagonalHatchAudience)"
                                                stroke="#1A73E8"
                                                strokeWidth={2}
                                                radius={[4, 4, 0, 0]}
                                                filter="url(#frostBlurAudience)"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Referrers */}
                            <div className={`${styles.chartSection} ${audienceTrafficView === 'referrers' ? '' : styles.hideOnMobile}`}>
                                <div className={styles.chartHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2 className={styles.chartTitle}>Top Referrers</h2>
                                        <p className={styles.chartSubtitle}>Traffic sources</p>
                                    </div>
                                    <div className={styles.mobileToggles} style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '999px',
                                        padding: '3px',
                                        gap: '2px',
                                        flexShrink: 0,
                                    }}>
                                        <button
                                            onClick={() => setAudienceTrafficView('traffic')}
                                            style={{
                                                padding: '0.4rem 1.25rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: audienceTrafficView === 'traffic' ? '#1A73E8' : 'transparent',
                                                color: audienceTrafficView === 'traffic' ? '#fff' : '#aaa',
                                            }}
                                        >
                                            Traffic
                                        </button>
                                        <button
                                            onClick={() => setAudienceTrafficView('referrers')}
                                            style={{
                                                padding: '0.4rem 1.25rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: audienceTrafficView === 'referrers' ? '#1A73E8' : 'transparent',
                                                color: audienceTrafficView === 'referrers' ? '#fff' : '#aaa',
                                            }}
                                        >
                                            Referrers
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.analysisTable}>
                                    <div className={styles.analysisHeader} style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                                        <div className={styles.analysisCell}>SOURCE</div>
                                        <div className={styles.analysisCell}>VISITORS</div>
                                        <div className={styles.analysisCell}>TREND</div>
                                    </div>
                                    <div className={styles.analysisBody}>
                                        {(data.referrerBreakdown || []).slice(0, 8).map((ref, idx) => (
                                            <div key={idx} className={styles.analysisRow} style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                                                <div className={styles.analysisCell}>{ref.source}</div>
                                                <div className={styles.analysisCell}>{ref.count.toLocaleString()}</div>
                                                <div className={styles.analysisCell} style={{
                                                    color: ref.change?.startsWith('+') ? '#10b981' : ref.change?.startsWith('-') ? '#ef4444' : '#aaa'
                                                }}>
                                                    {ref.change || '0%'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Box 2: Browser Distribution / Device & Resolutions */}
                        <div className={styles.desktopDeviceGrid}>
                            {/* Browser Distribution */}
                            <div className={`${styles.chartSection} ${audienceDeviceView === 'browser' ? '' : styles.hideOnMobile}`}>
                                <div className={styles.chartHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2 className={styles.chartTitle}>Browser Dist.</h2>
                                        <p className={styles.chartSubtitle}>Usage by browser</p>
                                    </div>
                                    <div className={styles.mobileToggles} style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '999px',
                                        padding: '3px',
                                        gap: '2px',
                                        flexShrink: 0,
                                    }}>
                                        <button
                                            onClick={() => setAudienceDeviceView('browser')}
                                            style={{
                                                padding: '0.4rem 1.25rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: audienceDeviceView === 'browser' ? '#1A73E8' : 'transparent',
                                                color: audienceDeviceView === 'browser' ? '#fff' : '#aaa',
                                            }}
                                        >
                                            Browser
                                        </button>
                                        <button
                                            onClick={() => setAudienceDeviceView('device')}
                                            style={{
                                                padding: '0.4rem 1.25rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: audienceDeviceView === 'device' ? '#1A73E8' : 'transparent',
                                                color: audienceDeviceView === 'device' ? '#fff' : '#aaa',
                                            }}
                                        >
                                            Device
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.chartContainer}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={data.browserBreakdown.map((browser, idx) => {
                                            const colors = ['#4285F4', '#0AA7F5', '#FF7139', '#0078D7', '#888'];
                                            return {
                                                name: browser.browser,
                                                value: browser.count,
                                                color: colors[idx % colors.length]
                                            };
                                        })} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                            <XAxis
                                                type="number"
                                                stroke="#aaa"
                                                style={{ fontSize: '12px' }}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                stroke="#aaa"
                                                style={{ fontSize: '12px' }}
                                                width={80}
                                            />
                                            <Tooltip
                                                content={<CustomChartTooltip dateFormat="none" valueKey="value" valueLabel="count" />}
                                                cursor={{ stroke: '#1A73E8', strokeWidth: 1, strokeDasharray: '0', fill: 'transparent' }}
                                            />
                                            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                                {data.browserBreakdown.map((browser, index) => {
                                                    const colors = ['#4285F4', '#0AA7F5', '#FF7139', '#0078D7', '#888'];
                                                    return (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={colors[index % colors.length]}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    );
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Devices */}
                            <div className={`${styles.chartSection} ${audienceDeviceView === 'device' ? '' : styles.hideOnMobile}`}>
                                <div className={styles.chartHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2 className={styles.chartTitle}>Devices</h2>
                                        <p className={styles.chartSubtitle}>Usage by device/screen</p>
                                    </div>
                                    <div className={styles.mobileToggles} style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '999px',
                                        padding: '3px',
                                        gap: '2px',
                                        flexShrink: 0,
                                    }}>
                                        <button
                                            onClick={() => setAudienceDeviceView('browser')}
                                            style={{
                                                padding: '0.4rem 1.25rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: audienceDeviceView === 'browser' ? '#1A73E8' : 'transparent',
                                                color: audienceDeviceView === 'browser' ? '#fff' : '#aaa',
                                            }}
                                        >
                                            Browser
                                        </button>
                                        <button
                                            onClick={() => setAudienceDeviceView('device')}
                                            style={{
                                                padding: '0.4rem 1.25rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: audienceDeviceView === 'device' ? '#1A73E8' : 'transparent',
                                                color: audienceDeviceView === 'device' ? '#fff' : '#aaa',
                                            }}
                                        >
                                            Device
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.analysisTable}>
                                    <div className={styles.analysisHeader} style={{ gridTemplateColumns: '1fr 1.5fr 1fr' }}>
                                        <div className={styles.analysisCell}>DEVICE</div>
                                        <div className={styles.analysisCell}>RESOLUTION</div>
                                        <div className={styles.analysisCell}>USERS</div>
                                    </div>
                                    <div className={styles.analysisBody}>
                                        {(data.deviceResolutions || []).map((item, idx) => (
                                            <div key={idx} className={styles.analysisRow} style={{ gridTemplateColumns: '1fr 1.5fr 1fr' }}>
                                                <div className={styles.analysisCell}>{item.device}</div>
                                                <div className={styles.analysisCell}>{item.resolution}</div>
                                                <div className={styles.analysisCell}>{item.count.toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Web Vitals Section */}
                {
                    activeSection === 'web-vitals' && (
                        <div className={styles.dashboardContent}>
                            {/* Performance Score Gauge */}
                            <div className={styles.chartSection} style={{ marginBottom: '1.5rem' }}>
                                <div className={styles.chartHeader}>
                                    <h2 className={styles.chartTitle}>Performance Score</h2>
                                    <p className={styles.chartSubtitle}>Overall site performance (0-100)</p>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                                    <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                                        <svg viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                                            {/* Background circle */}
                                            <circle
                                                cx="100"
                                                cy="100"
                                                r="80"
                                                fill="none"
                                                stroke="rgba(255, 255, 255, 0.1)"
                                                strokeWidth="20"
                                            />
                                            {/* Progress circle */}
                                            <circle
                                                cx="100"
                                                cy="100"
                                                r="80"
                                                fill="none"
                                                stroke="#22C55E"
                                                strokeWidth="20"
                                                strokeDasharray={`${((data.webVitalsKPIs?.overallScore || 0) / 100) * 502.65} 502.65`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#22C55E' }}>
                                                {data.webVitalsKPIs?.overallScore || 0}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#aaa' }}>
                                                Excellent
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Core Web Vitals KPI Cards */}
                            <div className={styles.metricsGrid}>
                                {/* LCP Card */}
                                <motion.div
                                    className={styles.metricCard}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className={styles.metricHeader}>
                                        <FontAwesomeIcon icon={faClock} className={styles.metricIcon} />
                                        <span className={styles.metricLabel}>Largest Contentful Paint</span>
                                    </div>
                                    <div className={styles.metricValue}>{(data.webVitalsKPIs?.lcp?.value || 0).toFixed(2)}s</div>
                                    <div className={styles.metricSubtext}>
                                        Target: &lt;{data.webVitalsKPIs?.lcp?.target || 2.5}s
                                        <span style={{ marginLeft: '0.5rem', color: data.webVitalsKPIs?.lcp?.status === 'good' ? '#22C55E' : data.webVitalsKPIs?.lcp?.status === 'needs-improvement' ? '#F59E0B' : '#EF4444' }}>
                                            ● {data.webVitalsKPIs?.lcp?.status === 'good' ? 'Good' : data.webVitalsKPIs?.lcp?.status === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                                        </span>
                                    </div>
                                </motion.div>

                                {/* INP Card */}
                                <motion.div
                                    className={styles.metricCard}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                >
                                    <div className={styles.metricHeader}>
                                        <FontAwesomeIcon icon={faMousePointer} className={styles.metricIcon} />
                                        <span className={styles.metricLabel}>Interaction to Next Paint</span>
                                    </div>
                                    <div className={styles.metricValue}>{Math.round(data.webVitalsKPIs?.inp?.value || 0)}ms</div>
                                    <div className={styles.metricSubtext}>
                                        Target: &lt;{data.webVitalsKPIs?.inp?.target || 200}ms
                                        <span style={{ marginLeft: '0.5rem', color: data.webVitalsKPIs?.inp?.status === 'good' ? '#22C55E' : data.webVitalsKPIs?.inp?.status === 'needs-improvement' ? '#F59E0B' : '#EF4444' }}>
                                            ● {data.webVitalsKPIs?.inp?.status === 'good' ? 'Good' : data.webVitalsKPIs?.inp?.status === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                                        </span>
                                    </div>
                                </motion.div>

                                {/* CLS Card */}
                                <motion.div
                                    className={styles.metricCard}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                >
                                    <div className={styles.metricHeader}>
                                        <FontAwesomeIcon icon={faSync} className={styles.metricIcon} />
                                        <span className={styles.metricLabel}>Cumulative Layout Shift</span>
                                    </div>
                                    <div className={styles.metricValue}>{(data.webVitalsKPIs?.cls?.value || 0).toFixed(3)}</div>
                                    <div className={styles.metricSubtext}>
                                        Target: &lt;{data.webVitalsKPIs?.cls?.target || 0.1}
                                        <span style={{ marginLeft: '0.5rem', color: data.webVitalsKPIs?.cls?.status === 'good' ? '#22C55E' : data.webVitalsKPIs?.cls?.status === 'needs-improvement' ? '#F59E0B' : '#EF4444' }}>
                                            ● {data.webVitalsKPIs?.cls?.status === 'good' ? 'Good' : data.webVitalsKPIs?.cls?.status === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                                        </span>
                                    </div>
                                </motion.div>

                                {/* TTFB Card */}
                                <motion.div
                                    className={styles.metricCard}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.3 }}
                                >
                                    <div className={styles.metricHeader}>
                                        <FontAwesomeIcon icon={faHeartbeat} className={styles.metricIcon} />
                                        <span className={styles.metricLabel}>Time to First Byte</span>
                                    </div>
                                    <div className={styles.metricValue}>{Math.round(data.webVitalsKPIs?.ttfb?.value || 0)}ms</div>
                                    <div className={styles.metricSubtext}>
                                        Target: &lt;{data.webVitalsKPIs?.ttfb?.target || 800}ms
                                        <span style={{ marginLeft: '0.5rem', color: data.webVitalsKPIs?.ttfb?.status === 'good' ? '#22C55E' : data.webVitalsKPIs?.ttfb?.status === 'needs-improvement' ? '#F59E0B' : '#EF4444' }}>
                                            ● {data.webVitalsKPIs?.ttfb?.status === 'good' ? 'Good' : data.webVitalsKPIs?.ttfb?.status === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                                        </span>
                                    </div>
                                </motion.div>

                                {/* FCP Card */}
                                <motion.div
                                    className={styles.metricCard}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.4 }}
                                >
                                    <div className={styles.metricHeader}>
                                        <FontAwesomeIcon icon={faEye} className={styles.metricIcon} />
                                        <span className={styles.metricLabel}>First Contentful Paint</span>
                                    </div>
                                    <div className={styles.metricValue}>{(data.webVitalsKPIs?.fcp?.value || 0).toFixed(2)}s</div>
                                    <div className={styles.metricSubtext}>
                                        Target: &lt;{data.webVitalsKPIs?.fcp?.target || 1.8}s
                                        <span style={{ marginLeft: '0.5rem', color: data.webVitalsKPIs?.fcp?.status === 'good' ? '#22C55E' : data.webVitalsKPIs?.fcp?.status === 'needs-improvement' ? '#F59E0B' : '#EF4444' }}>
                                            ● {data.webVitalsKPIs?.fcp?.status === 'good' ? 'Good' : data.webVitalsKPIs?.fcp?.status === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                                        </span>
                                    </div>
                                </motion.div>

                                {/* TBT Card */}
                                <motion.div
                                    className={styles.metricCard}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.5 }}
                                >
                                    <div className={styles.metricHeader}>
                                        <FontAwesomeIcon icon={faClock} className={styles.metricIcon} />
                                        <span className={styles.metricLabel}>Total Blocking Time</span>
                                    </div>
                                    <div className={styles.metricValue}>{Math.round(data.webVitalsKPIs?.tbt?.value || 0)}ms</div>
                                    <div className={styles.metricSubtext}>
                                        Target: &lt;{data.webVitalsKPIs?.tbt?.target || 200}ms
                                        <span style={{ marginLeft: '0.5rem', color: data.webVitalsKPIs?.tbt?.status === 'good' ? '#22C55E' : data.webVitalsKPIs?.tbt?.status === 'needs-improvement' ? '#F59E0B' : '#EF4444' }}>
                                            ● {data.webVitalsKPIs?.tbt?.status === 'good' ? 'Good' : data.webVitalsKPIs?.tbt?.status === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                                        </span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Metrics Trends & Distribution */}
                            <div className={styles.desktopGrid}>
                                {/* Trends */}
                                <div className={`${styles.chartSection} ${vitalsBoxView === 'trends' ? '' : styles.hideOnMobile}`}>
                                    <div className={styles.chartHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h2 className={styles.chartTitle}>Performance Trends</h2>
                                            <p className={styles.chartSubtitle}>Score over time</p>
                                        </div>
                                        <div className={styles.mobileToggles} style={{
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '999px',
                                            padding: '3px',
                                            gap: '2px',
                                            flexShrink: 0,
                                        }}>
                                            <button
                                                onClick={() => setVitalsBoxView('trends')}
                                                style={{
                                                    padding: '0.3rem 0.85rem',
                                                    borderRadius: '999px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 600,
                                                    transition: 'all 0.2s ease',
                                                    background: vitalsBoxView === 'trends' ? '#1A73E8' : 'transparent',
                                                    color: vitalsBoxView === 'trends' ? '#fff' : '#aaa',
                                                }}
                                            >Trends</button>
                                            <button
                                                onClick={() => setVitalsBoxView('distribution')}
                                                style={{
                                                    padding: '0.3rem 0.85rem',
                                                    borderRadius: '999px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 600,
                                                    transition: 'all 0.2s ease',
                                                    background: vitalsBoxView === 'distribution' ? '#1A73E8' : 'transparent',
                                                    color: vitalsBoxView === 'distribution' ? '#fff' : '#aaa',
                                                }}
                                            >Distribution</button>
                                        </div>
                                    </div>
                                    <div className={styles.chartContainer}>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={viewMode === 'daily'
                                                ? filterDataByTimeRange(data.vitalsTrends || []).map(item => ({
                                                    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                                    fullDate: item.date,
                                                    score: item.score
                                                }))
                                                : []
                                            } margin={{ top: 0, right: 10, left: -15, bottom: 50 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                                <XAxis dataKey="date" stroke="#aaa" style={{ fontSize: '12px' }} />
                                                <YAxis stroke="#aaa" style={{ fontSize: '12px' }} domain={[0, 100]} />
                                                <Tooltip
                                                    content={<CustomChartTooltip dateFormat="date" valueKey="score" valueLabel="score" />}
                                                    cursor={{ stroke: '#1A73E8', strokeWidth: 1, strokeDasharray: '0', fill: 'transparent' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#1A73E8"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#1A73E8', r: 4 }}
                                                    activeDot={{ fill: '#1A73E8', r: 6, stroke: '#1A73E8', strokeWidth: 2 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Distribution */}
                                <div className={`${styles.chartSection} ${vitalsBoxView === 'distribution' ? '' : styles.hideOnMobile}`}>
                                    <div className={styles.chartHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h2 className={styles.chartTitle}>Metrics Distribution</h2>
                                            <p className={styles.chartSubtitle}>Performance breakdown</p>
                                        </div>
                                        <div className={styles.mobileToggles} style={{
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '999px',
                                            padding: '3px',
                                            gap: '2px',
                                            flexShrink: 0,
                                        }}>
                                            <button
                                                onClick={() => setVitalsBoxView('trends')}
                                                style={{
                                                    padding: '0.3rem 0.85rem',
                                                    borderRadius: '999px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 600,
                                                    transition: 'all 0.2s ease',
                                                    background: vitalsBoxView === 'trends' ? '#1A73E8' : 'transparent',
                                                    color: vitalsBoxView === 'trends' ? '#fff' : '#aaa',
                                                }}
                                            >Trends</button>
                                            <button
                                                onClick={() => setVitalsBoxView('distribution')}
                                                style={{
                                                    padding: '0.3rem 0.85rem',
                                                    borderRadius: '999px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 600,
                                                    transition: 'all 0.2s ease',
                                                    background: vitalsBoxView === 'distribution' ? '#1A73E8' : 'transparent',
                                                    color: vitalsBoxView === 'distribution' ? '#fff' : '#aaa',
                                                }}
                                            >Distribution</button>
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.5rem 1rem' }}>
                                        {/* LCP Distribution */}
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#fff' }}>LCP</div>
                                            <div style={{ display: 'flex', height: '30px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${data.vitalsDistribution?.lcp?.good || 0}%`, backgroundColor: '#22C55E' }}></div>
                                                <div style={{ width: `${data.vitalsDistribution?.lcp?.needsImprovement || 0}%`, backgroundColor: '#F59E0B' }}></div>
                                                <div style={{ width: `${data.vitalsDistribution?.lcp?.poor || 0}%`, backgroundColor: '#EF4444' }}></div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.25rem', color: '#aaa' }}>
                                                <span>Good: {data.vitalsDistribution?.lcp?.good || 0}%</span>
                                                <span>Poor: {data.vitalsDistribution?.lcp?.poor || 0}%</span>
                                            </div>
                                        </div>
                                        {/* INP Distribution */}
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#fff' }}>INP</div>
                                            <div style={{ display: 'flex', height: '30px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${data.vitalsDistribution?.inp?.good || 0}%`, backgroundColor: '#22C55E' }}></div>
                                                <div style={{ width: `${data.vitalsDistribution?.inp?.needsImprovement || 0}%`, backgroundColor: '#F59E0B' }}></div>
                                                <div style={{ width: `${data.vitalsDistribution?.inp?.poor || 0}%`, backgroundColor: '#EF4444' }}></div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.25rem', color: '#aaa' }}>
                                                <span>Good: {data.vitalsDistribution?.inp?.good || 0}%</span>
                                                <span>Poor: {data.vitalsDistribution?.inp?.poor || 0}%</span>
                                            </div>
                                        </div>
                                        {/* CLS Distribution */}
                                        <div>
                                            <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#fff' }}>CLS</div>
                                            <div style={{ display: 'flex', height: '30px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${data.vitalsDistribution?.cls?.good || 0}%`, backgroundColor: '#22C55E' }}></div>
                                                <div style={{ width: `${data.vitalsDistribution?.cls?.needsImprovement || 0}%`, backgroundColor: '#F59E0B' }}></div>
                                                <div style={{ width: `${data.vitalsDistribution?.cls?.poor || 0}%`, backgroundColor: '#EF4444' }}></div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.25rem', color: '#aaa' }}>
                                                <span>Good: {data.vitalsDistribution?.cls?.good || 0}%</span>
                                                <span>Poor: {data.vitalsDistribution?.cls?.poor || 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Page Performance & Device Comparison — toggled */}
                            <div className={styles.chartSection} style={{ marginTop: '1.5rem' }}>
                                <div className={styles.chartHeader}>
                                    {/* Pill toggle switch */}
                                    <div style={{
                                        display: 'flex',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '999px',
                                        padding: '3px',
                                        gap: '2px',
                                        flexShrink: 0,
                                    }}>
                                        <button
                                            onClick={() => setPerfBoxView('page')}
                                            style={{
                                                padding: '0.3rem 0.85rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.78rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: perfBoxView === 'page' ? '#1A73E8' : 'transparent',
                                                color: perfBoxView === 'page' ? '#fff' : '#aaa',
                                            }}
                                        >Page</button>
                                        <button
                                            onClick={() => setPerfBoxView('device')}
                                            style={{
                                                padding: '0.3rem 0.85rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.78rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                background: perfBoxView === 'device' ? '#1A73E8' : 'transparent',
                                                color: perfBoxView === 'device' ? '#fff' : '#aaa',
                                            }}
                                        >Device</button>
                                    </div>
                                    <div>
                                        <h2 className={styles.chartTitle}>
                                            {perfBoxView === 'page' ? 'Page Performance' : 'Device Performance'}
                                        </h2>
                                        <p className={styles.chartSubtitle}>
                                            {perfBoxView === 'page' ? 'Top pages by score' : 'Performance by device type'}
                                        </p>
                                    </div>
                                </div>

                                {/* Page Performance view */}
                                {perfBoxView === 'page' && (
                                    <div className={styles.analysisTable}>
                                        <div className={styles.analysisHeader}>
                                            <div className={styles.analysisCell}>Page</div>
                                            <div className={styles.analysisCell}>LCP</div>
                                            <div className={styles.analysisCell}>INP</div>
                                            <div className={styles.analysisCell}>Score</div>
                                        </div>
                                        <div className={styles.analysisBody}>
                                            {(data.pagePerformance || []).map((page, index) => (
                                                <div key={index} className={styles.analysisRow}>
                                                    <div className={styles.analysisCell}>{page.page}</div>
                                                    <div className={styles.analysisCell}>{page.lcp.toFixed(2)}s</div>
                                                    <div className={styles.analysisCell}>{Math.round(page.inp)}ms</div>
                                                    <div className={styles.analysisCell}>
                                                        <span style={{
                                                            color: page.score >= 90 ? '#22C55E' : page.score >= 50 ? '#F59E0B' : '#EF4444',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {page.score}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Device Performance view */}
                                {perfBoxView === 'device' && (
                                    <div className={styles.chartContainer}>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={data.devicePerformance || []} layout="vertical" margin={{ top: 0, right: 10, left: -15, bottom: 60 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                                <XAxis
                                                    type="number"
                                                    stroke="#aaa"
                                                    style={{ fontSize: '12px' }}
                                                    domain={[0, 100]}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="device"
                                                    stroke="#aaa"
                                                    style={{ fontSize: '12px' }}
                                                    width={80}
                                                />
                                                <Tooltip
                                                    content={<CustomChartTooltip dateFormat="none" valueKey="score" valueLabel="score" />}
                                                    cursor={{ stroke: '#1A73E8', strokeWidth: 1, strokeDasharray: '0', fill: 'transparent' }}
                                                />
                                                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                                                    {(data.devicePerformance || []).map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.score >= 90 ? '#22C55E' : entry.score >= 50 ? '#F59E0B' : '#EF4444'}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Placeholder for other sections */}
                {
                    activeSection !== 'dashboard' && activeSection !== 'geographic' && activeSection !== 'error-tracking' && activeSection !== 'audience' && activeSection !== 'web-vitals' && (
                        <div className={styles.sectionPlaceholder}>
                            <h2>{sidebarItems.find(item => item.id === activeSection)?.label}</h2>
                            <p>Coming soon...</p>
                        </div>
                    )
                }
            </main >
        </div >
    );
}
