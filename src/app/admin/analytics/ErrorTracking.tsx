'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faExclamationTriangle, 
    faInfoCircle, 
    faUsers, 
    faChartLine,
    faCopy,
    faLink,
    faHashtag,
    faUser,
    faGlobe,
    faMobile,
    faDesktop,
    faTablet,
    faTimes,
    faCalendar
} from '@fortawesome/free-solid-svg-icons';
import {
    faChrome,
    faFirefox,
    faSafari,
    faEdge,
    faOpera,
    faInternetExplorer
} from '@fortawesome/free-brands-svg-icons';
import styles from './errorTracking.module.css';
import ErrorDetailPanel from './ErrorDetailPanel';
import DateRangePicker from './DateRangePicker';

interface ErrorData {
    id: string;
    message: string;
    stackTrace?: string;
    sourceFile?: string;
    sourceLine?: number;
    sourceColumn?: number;
    errorType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
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
}

interface ErrorTrackingProps {
    errors: ErrorData[];
    errorTrends: { date: string; totalErrors: number; affectedUsers: number }[];
    totalErrors: number;
    errorRate: number;
    affectedUsers: number;
    affectedSessions: number;
    mostFrequentError?: ErrorData;
    viewMode?: 'daily' | 'hourly';
    timeRange?: number;
}

export default function ErrorTracking({
    errors,
    errorTrends,
    totalErrors,
    errorRate,
    affectedUsers,
    affectedSessions,
    mostFrequentError,
    viewMode = 'daily',
    timeRange = 30
}: ErrorTrackingProps) {
    const [selectedError, setSelectedError] = useState<ErrorData | null>(null);
    const [activeTab, setActiveTab] = useState<'types' | 'pages'>('types');
    const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Filter error trends based on viewMode and timeRange
    const filteredErrorTrends = errorTrends.filter(trend => {
        const trendDate = new Date(trend.date);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - trendDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= timeRange;
    });

    // Format chart data based on view mode
    const chartData = filteredErrorTrends.map(trend => {
        const date = new Date(trend.date);
        if (viewMode === 'daily') {
            return {
                ...trend,
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: date.toISOString()
            };
        } else {
            return {
                ...trend,
                date: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                fullDate: date.toISOString()
            };
        }
    });

    // Get the data array currently being displayed (either full or zoomed)
    const displayedData = zoomRange ? chartData.slice(zoomRange.start, zoomRange.end) : chartData;

    // Handle date range selection from calendar
    const handleDateRangeSelect = (startDate: Date, endDate: Date) => {
        // Normalize dates to start of day for comparison
        const startTime = new Date(startDate).setHours(0, 0, 0, 0);
        const endTime = new Date(endDate).setHours(23, 59, 59, 999);
        
        // Find indices in chartData that fall within the selected date range
        let startIndex = -1;
        let endIndex = -1;
        
        chartData.forEach((d, index) => {
            const dataDate = new Date(d.fullDate || d.date);
            const dataTime = dataDate.getTime();
            
            if (dataTime >= startTime && dataTime <= endTime) {
                if (startIndex === -1) {
                    startIndex = index;
                }
                endIndex = index;
            }
        });

        if (startIndex !== -1 && endIndex !== -1) {
            // For single day selection, add context days before and after
            if (startIndex === endIndex) {
                const zoomStart = Math.max(0, startIndex - 1);
                const zoomEnd = Math.min(chartData.length, endIndex + 2);
                setZoomRange({ start: zoomStart, end: zoomEnd });
            } else {
                setZoomRange({ start: startIndex, end: endIndex + 1 });
            }
        } else if (startIndex !== -1) {
            // If only start found, select that day plus context
            setZoomRange({ start: Math.max(0, startIndex - 1), end: Math.min(chartData.length, startIndex + 2) });
        }
    };

    // Format date range for button display
    const formatDateRangeButton = () => {
        if (!zoomRange) return 'Select Date Range';
        
        const startData = chartData[zoomRange.start];
        const endData = chartData[zoomRange.end - 1];
        
        if (!startData || !endData) return 'Select Date Range';
        
        const startDate = new Date(startData.fullDate || startData.date);
        const endDate = new Date(endData.fullDate || endData.date);
        
        const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // If same day, just show the date
        if (startDate.toDateString() === endDate.toDateString()) {
            return startFormatted;
        }
        
        return `${startFormatted} - ${endFormatted}`;
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        return 'Just now';
    };

    const getBrowserIcon = (browser?: string) => {
        if (!browser) return null;
        const lower = browser.toLowerCase();
        // Remove "Mobile" prefix for icon matching but keep it for device detection
        const browserName = lower.replace('mobile ', '').replace('mobile', '');
        if (browserName.includes('chrome')) {
            return <FontAwesomeIcon icon={faChrome} className={styles.browserIcon} style={{ color: '#4285F4' }} />;
        }
        if (browserName.includes('safari')) {
            return <FontAwesomeIcon icon={faSafari} className={styles.browserIcon} style={{ color: '#000000' }} />;
        }
        if (browserName.includes('firefox')) {
            return <FontAwesomeIcon icon={faFirefox} className={styles.browserIcon} style={{ color: '#FF7139' }} />;
        }
        if (browserName.includes('edge')) {
            return <FontAwesomeIcon icon={faEdge} className={styles.browserIcon} style={{ color: '#0078D4' }} />;
        }
        if (browserName.includes('opera')) {
            return <FontAwesomeIcon icon={faOpera} className={styles.browserIcon} style={{ color: '#FF1B2D' }} />;
        }
        if (browserName.includes('ie') || browserName.includes('internet explorer')) {
            return <FontAwesomeIcon icon={faInternetExplorer} className={styles.browserIcon} style={{ color: '#0076D6' }} />;
        }
        return <FontAwesomeIcon icon={faGlobe} className={styles.browserIcon} />;
    };

    const getDeviceIcon = (device?: string, browser?: string) => {
        // Check browser name first for mobile indicators
        const browserLower = browser?.toLowerCase() || '';
        if (browserLower.includes('mobile')) {
            return <FontAwesomeIcon icon={faMobile} />;
        }
        
        if (!device) return <FontAwesomeIcon icon={faDesktop} />;
        const lower = device.toLowerCase();
        if (lower.includes('mobile')) return <FontAwesomeIcon icon={faMobile} />;
        if (lower.includes('tablet')) return <FontAwesomeIcon icon={faTablet} />;
        return <FontAwesomeIcon icon={faDesktop} />;
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#ef4444';
            case 'high': return '#f59e0b';
            case 'medium': return '#3b82f6';
            case 'low': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getSeverityBadge = (severity: string) => {
        const color = getSeverityColor(severity);
        return (
            <span className={styles.severityBadge} style={{ backgroundColor: color }}>
                {severity.toUpperCase()}
            </span>
        );
    };

    // Group errors by type and page for analysis
    const errorsByType = new Map<string, { count: number; users: number; lastSeen: Date }>();
    const errorsByPage = new Map<string, { count: number; users: number; lastSeen: Date }>();

    errors.forEach(error => {
        // By type
        const typeKey = error.errorType;
        if (!errorsByType.has(typeKey)) {
            errorsByType.set(typeKey, { count: 0, users: 0, lastSeen: error.lastSeen });
        }
        const typeData = errorsByType.get(typeKey)!;
        typeData.count += error.occurrences;
        typeData.users += error.affectedUsers;
        if (new Date(error.lastSeen) > new Date(typeData.lastSeen)) {
            typeData.lastSeen = error.lastSeen;
        }

        // By page
        const pageKey = error.pageUrl;
        if (!errorsByPage.has(pageKey)) {
            errorsByPage.set(pageKey, { count: 0, users: 0, lastSeen: error.lastSeen });
        }
        const pageData = errorsByPage.get(pageKey)!;
        pageData.count += error.occurrences;
        pageData.users += error.affectedUsers;
        if (new Date(error.lastSeen) > new Date(pageData.lastSeen)) {
            pageData.lastSeen = error.lastSeen;
        }
    });

    return (
        <div className={styles.errorTrackingContainer}>
            {/* Error Trends Chart */}
            <div className={styles.errorTrendsCard}>
                <div className={styles.cardHeader}>
                    <div>
                        <h3 className={styles.cardTitle}>Error Trends</h3>
                        <p className={styles.cardSubtitle}>Error occurrences over time</p>
                    </div>
                    <div className={styles.cardHeaderActions}>
                        <button 
                            className={styles.calendarButton}
                            onClick={() => setShowDatePicker(true)}
                        >
                            <FontAwesomeIcon icon={faCalendar} />
                            <span>{formatDateRangeButton()}</span>
                        </button>
                        {zoomRange && (
                            <button 
                                className={styles.resetZoomButton}
                                onClick={() => setZoomRange(null)}
                            >
                                <span>Reset Zoom</span>
                            </button>
                        )}
                    </div>
                </div>
                <div className={styles.trendsSummary}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>TOTAL ERRORS</span>
                        <span className={styles.summaryValue}>{totalErrors}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>AFFECTED USERS</span>
                        <span className={styles.summaryValue}>{affectedUsers}</span>
                    </div>
                </div>
                <div className={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart 
                            data={displayedData}
                        >
                            <defs>
                                <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                            <XAxis 
                                dataKey="date" 
                                stroke="#666"
                                tick={{ fill: '#999' }}
                                style={{ fontSize: '12px' }}
                                domain={['dataMin', 'dataMax']}
                            />
                            <YAxis 
                                stroke="#666"
                                tick={{ fill: '#999' }}
                                style={{ fontSize: '12px' }}
                                domain={[0, 'dataMax']}
                            />
                            <Tooltip 
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        const date = new Date(data.fullDate || data.date);
                                        return (
                                            <div className={styles.customTooltip}>
                                                <div className={styles.tooltipDate}>
                                                    {viewMode === 'daily' 
                                                        ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                        : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                                    }
                                                </div>
                                                <div className={styles.tooltipValue}>
                                                    errors : <span className={styles.tooltipNumber}>{data.totalErrors}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                                cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '0' }}
                            />
                            <Legend />
                            <Area 
                                type="monotone" 
                                dataKey="totalErrors" 
                                stroke="#f59e0b" 
                                fillOpacity={1} 
                                fill="url(#colorErrors)"
                                name="Total Errors"
                            />
                            <Area 
                                type="monotone" 
                                dataKey="affectedUsers" 
                                stroke="#ef4444" 
                                fillOpacity={1} 
                                fill="url(#colorUsers)"
                                name="Affected Users"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Summary Statistics */}
            <div className={styles.summaryStats}>
                <div className={styles.statCard}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{totalErrors}</div>
                        <div className={styles.statLabel}>Total Errors</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <FontAwesomeIcon icon={faChartLine} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{errorRate.toFixed(2)}%</div>
                        <div className={styles.statLabel}>Error Rate</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <FontAwesomeIcon icon={faUsers} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{affectedUsers}</div>
                        <div className={styles.statLabel}>Affected Users</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <FontAwesomeIcon icon={faInfoCircle} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{affectedSessions}</div>
                        <div className={styles.statLabel}>Affected Sessions</div>
                    </div>
                </div>
            </div>

            {/* Most Frequent Error */}
            {mostFrequentError && (
                <div className={styles.mostFrequentCard}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3 className={styles.cardTitle}>Most Frequent Error</h3>
                            <p className={styles.cardSubtitle}>Top occurring error</p>
                        </div>
                        {getSeverityBadge(mostFrequentError.severity)}
                    </div>
                    <div className={styles.errorMessage}>
                        {mostFrequentError.message}
                    </div>
                    <div className={styles.errorMeta}>
                        <span>Last seen: {new Date(mostFrequentError.lastSeen).toLocaleString()}</span>
                    </div>
                    <div className={styles.errorStats}>
                        <div className={styles.errorStatItem}>
                            <FontAwesomeIcon icon={faInfoCircle} />
                            <span>{mostFrequentError.occurrences} occurrences</span>
                        </div>
                        <div className={styles.errorStatItem}>
                            <FontAwesomeIcon icon={faUsers} />
                            <span>{mostFrequentError.affectedUsers} users affected</span>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.bottomSection}>
                {/* Recent Errors */}
                <div className={styles.recentErrorsCard}>
                    <h3 className={styles.cardTitle}>Recent Errors</h3>
                    <div className={styles.errorsTable}>
                        <div className={styles.tableHeader}>
                            <div className={styles.tableCell}>ERROR</div>
                            <div className={styles.tableCell}>PAGE</div>
                            <div className={styles.tableCell}>ENVIRONMENT</div>
                            <div className={styles.tableCell}>LOCATION</div>
                            <div className={styles.tableCell}>TIME</div>
                        </div>
                        <div className={styles.tableBody}>
                            {errors.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>No errors found</p>
                                </div>
                            ) : (
                                errors.slice(0, 10).map((error) => (
                                <div 
                                    key={error.id} 
                                    className={styles.tableRow}
                                    onClick={() => setSelectedError(error)}
                                >
                                    <div className={styles.tableCell}>
                                        <div className={styles.errorType}>{error.errorType}</div>
                                        <div className={styles.errorMessagePreview}>
                                            {error.message.substring(0, 60)}...
                                        </div>
                                    </div>
                                    <div className={styles.tableCell}>{error.pageUrl}</div>
                                    <div className={styles.tableCell}>
                                        <div className={styles.environmentIcons}>
                                            {getBrowserIcon(error.browser)}
                                            {getDeviceIcon(error.device, error.browser)}
                                        </div>
                                    </div>
                                    <div className={styles.tableCell}>
                                        {error.country || 'Unknown'}
                                    </div>
                                    <div className={styles.tableCell}>
                                        {formatTimeAgo(error.lastSeen)}
                                    </div>
                                </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Error Analysis */}
                <div className={styles.errorAnalysisCard}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3 className={styles.cardTitle}>Error Analysis</h3>
                            <p className={styles.cardSubtitle}>Error breakdown by type and page</p>
                        </div>
                        <div className={styles.tabs}>
                            <button 
                                className={`${styles.tab} ${activeTab === 'types' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('types')}
                            >
                                Error Types ({errorsByType.size})
                            </button>
                            <button 
                                className={`${styles.tab} ${activeTab === 'pages' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('pages')}
                            >
                                By Page ({errorsByPage.size})
                            </button>
                        </div>
                    </div>
                    <div className={styles.analysisTable}>
                        <div className={styles.analysisHeader}>
                            <div className={styles.analysisCell}>ERROR MESSAGE</div>
                            <div className={styles.analysisCell}>OCCURRENCES</div>
                            <div className={styles.analysisCell}>AFFECTED USERS</div>
                            <div className={styles.analysisCell}>LAST OCCURRENCE</div>
                        </div>
                        <div className={styles.analysisBody}>
                            {errors.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>No error data available</p>
                                </div>
                            ) : activeTab === 'types' 
                                ? Array.from(errorsByType.entries())
                                    .sort((a, b) => b[1].count - a[1].count)
                                    .map(([type, data]) => (
                                        <div key={type} className={styles.analysisRow}>
                                            <div className={styles.analysisCell}>{type}</div>
                                            <div className={styles.analysisCell}>{data.count}</div>
                                            <div className={styles.analysisCell}>{data.users}</div>
                                            <div className={styles.analysisCell}>
                                                {formatTimeAgo(data.lastSeen)}
                                            </div>
                                        </div>
                                    ))
                                : Array.from(errorsByPage.entries())
                                    .sort((a, b) => b[1].count - a[1].count)
                                    .map(([page, data]) => (
                                        <div key={page} className={styles.analysisRow}>
                                            <div className={styles.analysisCell}>{page}</div>
                                            <div className={styles.analysisCell}>{data.count}</div>
                                            <div className={styles.analysisCell}>{data.users}</div>
                                            <div className={styles.analysisCell}>
                                                {formatTimeAgo(data.lastSeen)}
                                            </div>
                                        </div>
                                    ))
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Detail Panel */}
            <AnimatePresence>
                {selectedError && (
                    <ErrorDetailPanel
                        error={selectedError}
                        onClose={() => setSelectedError(null)}
                    />
                )}
            </AnimatePresence>

            {/* Date Range Picker */}
            {showDatePicker && (
                <DateRangePicker
                    onDateRangeSelect={handleDateRangeSelect}
                    onClose={() => setShowDatePicker(false)}
                    currentStartDate={zoomRange ? new Date(chartData[zoomRange.start]?.fullDate || chartData[zoomRange.start]?.date) : undefined}
                    currentEndDate={zoomRange ? new Date(chartData[zoomRange.end - 1]?.fullDate || chartData[zoomRange.end - 1]?.date) : undefined}
                />
            )}
        </div>
    );
}
