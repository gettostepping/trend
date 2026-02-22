'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCopy,
    faLink,
    faHashtag,
    faUser,
    faTimes,
    faCode,
    faLayerGroup,
    faGlobe
} from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/hooks/useToast';
import styles from './errorTracking.module.css';

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

interface ErrorDetailPanelProps {
    error: ErrorData;
    onClose: () => void;
}

export default function ErrorDetailPanel({ error, onClose }: ErrorDetailPanelProps) {
    const { showToast, ToastComponent } = useToast();

    const copyToClipboard = async (text: string, message: string) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast(message, 'success');
        } catch (err) {
            console.error('Failed to copy:', err);
            showToast('Failed to copy to clipboard', 'error');
        }
    };

    const copyUrl = () => copyToClipboard(error.pageUrl, 'URL copied to clipboard');
    const copySession = () => copyToClipboard(error.sessionId, 'Session ID copied to clipboard');
    const copyStack = () => copyToClipboard(error.stackTrace || '', 'Stack trace copied to clipboard');
    const copySource = () => {
        const source = error.sourceFile 
            ? `${error.sourceFile}:${error.sourceLine || ''}:${error.sourceColumn || ''}`
            : '';
        copyToClipboard(source, 'Source location copied to clipboard');
    };

    const copyAll = () => {
        const errorText = `Error: ${error.message}

Stack Trace:
${error.stackTrace || 'No stack trace available'}

Context:
• URL: ${error.pageUrl}
• Session: ${error.sessionId}
• User: ${error.userId || 'Unknown'}
• Time: ${new Date(error.lastSeen).toLocaleString()}
• Browser: ${error.browser || 'Unknown'}
• OS: ${error.os || 'Unknown'}
• Device: ${error.device || 'Unknown'}
• Location: ${error.country || 'Unknown'}`;
        copyToClipboard(errorText, 'Error details copied to clipboard');
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        const minutes = Math.floor(diff / (1000 * 60));
        if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        return 'Just now';
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#ef4444';
            case 'high': return '#3b82f6';
            case 'medium': return '#f59e0b';
            case 'low': return '#6b7280';
            default: return '#6b7280';
        }
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={styles.detailPanel}
        >
            <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                    <FontAwesomeIcon icon={faCode} className={styles.titleIcon} />
                    <span>{error.errorType}</span>
                    <span 
                        className={styles.severityBadge}
                        style={{ backgroundColor: getSeverityColor(error.severity) }}
                    >
                        {error.severity}
                    </span>
                </div>
                <button className={styles.closeButton} onClick={onClose}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            <div className={styles.panelTime}>
                {formatTimeAgo(error.lastSeen)} • {new Date(error.lastSeen).toLocaleString()}
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <h4 className={styles.sectionTitle}>QUICK ACTIONS</h4>
                <div className={styles.actionButtons}>
                    <button className={styles.actionButton} onClick={copyUrl}>
                        <FontAwesomeIcon icon={faLink} />
                        Copy URL
                    </button>
                    <button className={styles.actionButton} onClick={copySession}>
                        <FontAwesomeIcon icon={faHashtag} />
                        Copy Session
                    </button>
                    <button className={styles.actionButton} onClick={copyStack}>
                        <FontAwesomeIcon icon={faLayerGroup} />
                        Copy Stack
                    </button>
                </div>
            </div>

            {/* Error Message */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h4 className={styles.sectionTitle}>
                        <FontAwesomeIcon icon={faCode} />
                        Error Message
                    </h4>
                    <button 
                        className={styles.copyButton}
                        onClick={() => copyToClipboard(error.message, 'Error message copied to clipboard')}
                    >
                        <FontAwesomeIcon icon={faCopy} />
                    </button>
                </div>
                <div className={styles.errorMessageBox}>
                    {error.message}
                </div>
            </div>

            {/* Stack Trace */}
            {error.stackTrace && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>
                            <FontAwesomeIcon icon={faLayerGroup} />
                            Stack Trace
                        </h4>
                        <button 
                            className={styles.copyButton}
                            onClick={copyStack}
                        >
                            <FontAwesomeIcon icon={faCopy} />
                        </button>
                    </div>
                    <div className={styles.stackTraceBox}>
                        {error.stackTrace.split('\n').map((line, index) => (
                            <div key={index} className={styles.stackLine}>
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Source Location */}
            {error.sourceFile && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>
                            <FontAwesomeIcon icon={faCode} />
                            Source Location
                        </h4>
                        <button 
                            className={styles.copyButton}
                            onClick={copySource}
                        >
                            <FontAwesomeIcon icon={faCopy} />
                        </button>
                    </div>
                    <div className={styles.sourceLocationBox}>
                        <a 
                            href={error.sourceFile} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={styles.sourceLink}
                        >
                            {error.sourceFile}
                        </a>
                        {error.sourceLine && (
                            <span className={styles.sourceLocation}>
                                : {error.sourceLine}:{error.sourceColumn || ''}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Context */}
            <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Context</h4>
                <div className={styles.contextList}>
                    <div className={styles.contextItem}>
                        <div className={styles.contextLabel}>
                            <FontAwesomeIcon icon={faLink} />
                            Page URL
                        </div>
                        <div className={styles.contextValue}>
                            {error.pageUrl}
                            <button 
                                className={styles.inlineCopyButton}
                                onClick={copyUrl}
                            >
                                <FontAwesomeIcon icon={faCopy} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.contextItem}>
                        <div className={styles.contextLabel}>
                            <FontAwesomeIcon icon={faHashtag} />
                            Session ID
                        </div>
                        <div className={styles.contextValue}>
                            {error.sessionId}
                            <button 
                                className={styles.inlineCopyButton}
                                onClick={copySession}
                            >
                                <FontAwesomeIcon icon={faCopy} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.contextItem}>
                        <div className={styles.contextLabel}>
                            <FontAwesomeIcon icon={faUser} />
                            IP Address
                        </div>
                        <div className={styles.contextValue}>
                            {error.ipAddress || 'Unknown'}
                            {error.country && (
                                <span className={styles.geoLocation}>
                                    <FontAwesomeIcon icon={faGlobe} style={{ marginLeft: '8px', marginRight: '4px' }} />
                                    {error.country}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Environment */}
            <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Environment</h4>
                <div className={styles.environmentGrid}>
                    <div className={styles.envItem}>
                        <div className={styles.envLabel}>Browser</div>
                        <div className={styles.envValue}>{error.browser || '-'}</div>
                    </div>
                    <div className={styles.envItem}>
                        <div className={styles.envLabel}>Operating System</div>
                        <div className={styles.envValue}>{error.os || '-'}</div>
                    </div>
                    <div className={styles.envItem}>
                        <div className={styles.envLabel}>Device</div>
                        <div className={styles.envValue}>{error.device || '-'}</div>
                    </div>
                    <div className={styles.envItem}>
                        <div className={styles.envLabel}>Location</div>
                        <div className={styles.envValue}>{error.country || 'Unknown'}</div>
                    </div>
                </div>
            </div>

            {/* Severity Level */}
            <div className={styles.severitySection}>
                <div className={styles.severityLabel}>Severity Level</div>
                <div 
                    className={styles.severityLevel}
                    style={{ color: getSeverityColor(error.severity) }}
                >
                    <span 
                        className={styles.severityDot}
                        style={{ backgroundColor: getSeverityColor(error.severity) }}
                    />
                    {error.severity.charAt(0).toUpperCase() + error.severity.slice(1)} Severity
                </div>
            </div>

            {/* Footer Actions */}
            <div className={styles.panelFooter}>
                <button className={styles.closeFooterButton} onClick={onClose}>
                    Close
                </button>
                <button 
                    className={styles.copyAllButton}
                    onClick={copyAll}
                >
                    <FontAwesomeIcon icon={faCopy} />
                    Copy All
                </button>
            </div>
            <ToastComponent />
        </motion.div>
    );
}
