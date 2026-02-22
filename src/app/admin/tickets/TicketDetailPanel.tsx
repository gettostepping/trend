'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faUser,
    faEnvelope,
    faClock,
    faExclamationCircle,
    faCheckCircle,
    faArchive,
    faReply,
    faPaperPlane,
    faArrowUp,
    faArrowDown,
    faCircle,
    faFlag
} from '@fortawesome/free-solid-svg-icons';
import styles from './ticketsKanban.module.css';
import CustomDropdown from './CustomDropdown';

interface Ticket {
    id: string;
    ticketNumber: string;
    status: string;
    priority: string;
    customerName: string;
    customerEmail: string;
    initialMessage: string;
    assignedTo?: string;
    assignedToUser?: {
        id: string;
        username: string;
    };
    lastCustomerEmail?: string;
    lastTeamReply?: string;
    createdAt: string;
    emailThread?: any[];
}

interface Admin {
    id: string;
    username: string;
}

interface TicketDetailPanelProps {
    ticket: Ticket;
    admins: Admin[];
    onClose: () => void;
    onStatusChange: (ticketId: string, newStatus: string) => void;
    onAssign: (ticketId: string, adminId: string | null) => void;
    onUpdate: (ticket: Ticket) => void;
}

export default function TicketDetailPanel({
    ticket,
    admins,
    onClose,
    onStatusChange,
    onAssign,
    onUpdate,
}: TicketDetailPanelProps) {
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isChangingPriority, setIsChangingPriority] = useState(false);

    const handlePriorityChange = async (newPriority: string) => {
        if (!newPriority || newPriority === ticket.priority) return;
        setIsChangingPriority(true);
        try {
            const response = await fetch(`/api/tickets/${ticket.id}/priority`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: newPriority }),
            });
            if (response.ok) {
                const updatedTicket = await response.json();
                onUpdate(updatedTicket);
            } else {
                const error = await response.json();
                console.error('Error updating priority:', error);
            }
        } catch (error) {
            console.error('Error updating priority:', error);
        } finally {
            setIsChangingPriority(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return '#3b82f6';
            case 'replied': return '#f59e0b';
            case 'closed': return '#6b7280';
            case 'archived': return '#9ca3af';
            default: return '#6b7280';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return '#ef4444';
            case 'high': return '#f59e0b';
            case 'normal': return '#3b82f6';
            case 'low': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;

        setIsReplying(true);
        try {
            const response = await fetch(`/api/tickets/${ticket.id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: replyText }),
            });

            if (response.ok) {
                const updatedTicket = await response.json();
                onUpdate(updatedTicket);
                setReplyText('');
            } else {
                const error = await response.json();
                console.error('Error sending reply:', error);
                alert('Failed to send reply: ' + (error.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error sending reply:', error);
            alert('Failed to send reply. Please try again.');
        } finally {
            setIsReplying(false);
        }
    };

    const handleCloseTicket = async () => {
        if (!confirm('Are you sure you want to close this ticket?')) {
            return;
        }

        setIsClosing(true);
        try {
            const response = await fetch(`/api/tickets/${ticket.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'closed' }),
            });

            if (response.ok) {
                const updatedTicket = await response.json();
                onUpdate(updatedTicket);
                onStatusChange(ticket.id, 'closed');
            } else {
                const error = await response.json();
                console.error('Error closing ticket:', error);
                alert('Failed to close ticket: ' + (error.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error closing ticket:', error);
            alert('Failed to close ticket. Please try again.');
        } finally {
            setIsClosing(false);
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
            <div className={styles.detailHeader}>
                <div className={styles.detailTitle}>
                    <span className={styles.detailTicketNumber}>{ticket.ticketNumber}</span>
                    <div className={styles.detailBadges}>
                        <span
                            className={styles.statusBadge}
                            style={{ backgroundColor: getStatusColor(ticket.status) }}
                        >
                            {ticket.status}
                        </span>
                        <span
                            className={styles.priorityBadge}
                            style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                        >
                            {ticket.priority}
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className={styles.closeButton}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            <div className={styles.detailContent}>
                {/* Customer Info */}
                <div className={styles.detailSection}>
                    <h3 className={styles.sectionTitle}>Customer</h3>
                    <div className={styles.customerInfo}>
                        <div className={styles.infoRow}>
                            <FontAwesomeIcon icon={faUser} />
                            <span>{ticket.customerName}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <FontAwesomeIcon icon={faEnvelope} />
                            <a href={`mailto:${ticket.customerEmail}`}>{ticket.customerEmail}</a>
                        </div>
                        <div className={styles.infoRow}>
                            <FontAwesomeIcon icon={faClock} />
                            <span>Created {new Date(ticket.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Assignment */}
                <div className={styles.detailSection}>
                    <h3 className={styles.sectionTitle}>Assignment</h3>
                    <CustomDropdown
                        value={ticket.assignedTo || ''}
                        onChange={(value) => onAssign(ticket.id, value || null)}
                        placeholder="Unassigned"
                        options={[
                            { value: '', label: 'Unassigned' },
                            ...admins.map(admin => ({
                                value: admin.id,
                                label: admin.username,
                                icon: faUser,
                            })),
                        ]}
                    />

                    {/* Priority */}
                    <h3 className={styles.sectionTitle} style={{ marginTop: '1.25rem' }}>Priority</h3>
                    <CustomDropdown
                        value={ticket.priority}
                        onChange={handlePriorityChange}
                        placeholder="Select priority"
                        options={[
                            { value: 'urgent', label: 'Urgent', icon: faExclamationCircle },
                            { value: 'high', label: 'High', icon: faArrowUp },
                            { value: 'normal', label: 'Normal', icon: faCircle },
                            { value: 'low', label: 'Low', icon: faArrowDown },
                        ]}
                    />
                    {isChangingPriority && (
                        <span style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.4rem', display: 'block' }}>
                            Updating…
                        </span>
                    )}
                </div>

                {/* Status Actions */}
                <div className={styles.detailSection}>
                    <h3 className={styles.sectionTitle}>Status</h3>
                    <div className={styles.statusButtons}>
                        <button
                            onClick={() => onStatusChange(ticket.id, 'open')}
                            className={`${styles.statusButton} ${ticket.status === 'open' ? styles.active : ''}`}
                        >
                            <FontAwesomeIcon icon={faEnvelope} />
                            Open
                        </button>
                        <button
                            onClick={() => onStatusChange(ticket.id, 'replied')}
                            className={`${styles.statusButton} ${ticket.status === 'replied' ? styles.active : ''}`}
                        >
                            <FontAwesomeIcon icon={faReply} />
                            Replied
                        </button>
                        <button
                            onClick={() => onStatusChange(ticket.id, 'closed')}
                            className={`${styles.statusButton} ${ticket.status === 'closed' ? styles.active : ''}`}
                        >
                            <FontAwesomeIcon icon={faCheckCircle} />
                            Close
                        </button>
                        <button
                            onClick={() => onStatusChange(ticket.id, 'archived')}
                            className={`${styles.statusButton} ${ticket.status === 'archived' ? styles.active : ''}`}
                        >
                            <FontAwesomeIcon icon={faArchive} />
                            Archive
                        </button>
                    </div>
                    {ticket.status !== 'closed' && (
                        <button
                            className={styles.closeTicketButton}
                            onClick={handleCloseTicket}
                            disabled={isClosing}
                        >
                            <FontAwesomeIcon icon={faCheckCircle} />
                            {isClosing ? 'Closing...' : 'Close Ticket'}
                        </button>
                    )}
                </div>

                {/* Initial Message */}
                <div className={styles.detailSection}>
                    <h3 className={styles.sectionTitle}>Initial Message</h3>
                    <div className={styles.messageContent}>
                        {ticket.initialMessage}
                    </div>
                </div>

                {/* Email Thread - hide Support/system emails (support@, noreply@) - should never appear */}
                {ticket.emailThread && ticket.emailThread.length > 0 && (() => {
                    const isSupportEmail = (from: string) => {
                        const f = from.toLowerCase().trim();
                        return f === 'support@trendsignite.com' || f === 'noreply@trendsignite.com';
                    };
                    const displayThread = ticket.emailThread.filter((email: { from?: string }) => !isSupportEmail(email.from || ''));
                    return displayThread.length > 0 ? (
                        <div className={styles.detailSection}>
                            <h3 className={styles.sectionTitle}>Email Thread</h3>
                            <div className={styles.emailThread}>
                                {displayThread.map((email: { id: string; from?: string; createdAt: string; body?: string; isFromCustomer?: boolean }) => (
                                    <div key={email.id} className={styles.emailItem}>
                                        <div className={styles.emailHeader}>
                                            <span className={styles.emailFrom}>
                                                {email.isFromCustomer
                                                    ? ticket.customerName
                                                    : (() => {
                                                        // Extract team member name from email address
                                                        // Handle formats like:
                                                        // - "izuru@trendsignite.com"
                                                        // - "Izuru b <izuru@trendsignite.com>"
                                                        let emailAddress = email.from || '';

                                                        // Extract email from angle brackets if present
                                                        const angleBracketMatch = emailAddress.match(/<(.+?)>/);
                                                        if (angleBracketMatch) {
                                                            emailAddress = angleBracketMatch[1];
                                                        } else {
                                                            // Extract email from the string
                                                            const emailMatch = emailAddress.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                                                            if (emailMatch) {
                                                                emailAddress = emailMatch[1];
                                                            }
                                                        }

                                                        // Extract username from email
                                                        if (emailAddress.includes('@trendsignite.com')) {
                                                            const emailParts = emailAddress.split('@')[0];
                                                            return emailParts
                                                                .split(/[._-]/)
                                                                .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                                                                .join(' ');
                                                        }
                                                        return 'Team';
                                                    })()}
                                            </span>
                                            <span className={styles.emailDate}>
                                                {new Date(email.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className={styles.emailBody}>
                                            {(() => {
                                                // Clean HTML from email body - extract just the text content while preserving formatting
                                                let cleanBody = email.body || '';

                                                // If it contains HTML, extract the content div
                                                if (cleanBody.includes('<') && cleanBody.includes('>')) {
                                                    // First, remove ALL style and script tags completely (including content)
                                                    cleanBody = cleanBody
                                                        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                                                        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

                                                    // Remove head section entirely
                                                    cleanBody = cleanBody.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');

                                                    // Try to extract content from the .content div (where the actual message is)
                                                    // Look for the content div and extract everything until footer or body end
                                                    const contentMatch = cleanBody.match(/<div[^>]*class="content"[^>]*>([\s\S]*?)(?:<\/div>\s*<div[^>]*class="footer"|<\/div>\s*<\/body>|<\/div>\s*<\/html>)/i);
                                                    if (contentMatch && contentMatch[1]) {
                                                        cleanBody = contentMatch[1];
                                                    } else {
                                                        // Fallback: remove header and footer sections
                                                        cleanBody = cleanBody
                                                            .replace(/<div[^>]*class="header"[^>]*>[\s\S]*?<\/div>/gi, '')
                                                            .replace(/<div[^>]*class="footer"[^>]*>[\s\S]*?<\/div>/gi, '');
                                                    }

                                                    // Remove any remaining template wrapper elements
                                                    cleanBody = cleanBody
                                                        .replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '') // Remove logo
                                                        .replace(/<p[^>]*class="tagline"[^>]*>[\s\S]*?<\/p>/gi, ''); // Remove tagline

                                                    // Convert HTML to text while preserving structure
                                                    // Replace block elements with line breaks
                                                    cleanBody = cleanBody
                                                        .replace(/<div[^>]*class="greeting"[^>]*>/gi, '')
                                                        .replace(/<div[^>]*class="ticket-badge"[^>]*>/gi, '')
                                                        .replace(/<div[^>]*class="section-title"[^>]*>/gi, '\n\n')
                                                        .replace(/<div[^>]*class="message-content"[^>]*>/gi, '\n')
                                                        .replace(/<div[^>]*class="reply-content"[^>]*>/gi, '\n')
                                                        .replace(/<div[^>]*class="reply-notice"[^>]*>/gi, '\n')
                                                        .replace(/<div[^>]*class="signature"[^>]*>/gi, '\n\n')
                                                        .replace(/<ul[^>]*class="service-list"[^>]*>/gi, '\n')
                                                        .replace(/<\/ul>/gi, '\n')
                                                        .replace(/<li[^>]*>/gi, '• ')
                                                        .replace(/<\/li>/gi, '\n')
                                                        .replace(/<div[^>]*dir="ltr"[^>]*>/gi, '\n')
                                                        .replace(/<div[^>]*>/gi, '\n')
                                                        .replace(/<\/div>/gi, '')
                                                        .replace(/<br\s*\/?>/gi, '\n')
                                                        .replace(/<p[^>]*>/gi, '\n')
                                                        .replace(/<\/p>/gi, '')
                                                        .replace(/<strong[^>]*>/gi, '')
                                                        .replace(/<\/strong>/gi, '')
                                                        .replace(/<em[^>]*>/gi, '')
                                                        .replace(/<\/em>/gi, '')
                                                        .replace(/<span[^>]*>/gi, '')
                                                        .replace(/<\/span>/gi, '')
                                                        .replace(/<a[^>]*>/gi, '')
                                                        .replace(/<\/a>/gi, '')
                                                        .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
                                                        .replace(/&nbsp;/g, ' ')
                                                        .replace(/&amp;/g, '&')
                                                        .replace(/&lt;/g, '<')
                                                        .replace(/&gt;/g, '>')
                                                        .replace(/&quot;/g, '"')
                                                        .replace(/&#39;/g, "'")
                                                        .replace(/&#x27;/g, "'")
                                                        .replace(/&#x2F;/g, '/');

                                                    // Clean up excessive newlines but preserve paragraph breaks
                                                    cleanBody = cleanBody
                                                        .replace(/\n{4,}/g, '\n\n\n') // Max 3 newlines
                                                        .replace(/\n\s*\n\s*\n+/g, '\n\n') // Clean up spacing
                                                        .trim();
                                                }

                                                // Remove any lines that look like CSS (contain { or } or CSS properties)
                                                const lines = cleanBody.split('\n');
                                                const cleanedLines: string[] = [];
                                                let inQuotedSection = false;

                                                for (const line of lines) {
                                                    const trimmed = line.trim();

                                                    // Skip lines that are clearly CSS
                                                    if (trimmed.includes('{') || trimmed.includes('}') ||
                                                        trimmed.match(/^[a-zA-Z-]+\s*:\s*[^;]+;?\s*$/) ||
                                                        trimmed.startsWith('.') && trimmed.includes('{') ||
                                                        trimmed.includes('margin:') || trimmed.includes('padding:') ||
                                                        trimmed.includes('font-size:') || trimmed.includes('color:') ||
                                                        trimmed.includes('background-color:') || trimmed.includes('border:')) {
                                                        continue;
                                                    }

                                                    // Remove TRENDSIGNITE header text
                                                    if (trimmed === 'TRENDSIGNITE' ||
                                                        trimmed === 'Influencer Marketing & Management' ||
                                                        (trimmed.includes('TRENDSIGNITE') && trimmed.length < 50)) {
                                                        continue;
                                                    }

                                                    // Skip template footer content
                                                    if (trimmed.includes('Reply to this email') ||
                                                        trimmed.includes('www.trendsignite.com')) {
                                                        break; // Stop at footer
                                                    }

                                                    // Skip quoted sections
                                                    if (trimmed.startsWith('>') ||
                                                        (trimmed.startsWith('On ') && trimmed.includes('wrote:')) ||
                                                        (trimmed.includes('From:') && trimmed.includes('trendsignite.com')) ||
                                                        trimmed.includes('Sent:') ||
                                                        (trimmed.includes('To:') && trimmed.includes('trendsignite.com'))) {
                                                        inQuotedSection = true;
                                                        continue;
                                                    }
                                                    if (inQuotedSection && (trimmed === '---' || trimmed.startsWith('━━'))) {
                                                        break;
                                                    }

                                                    if (!inQuotedSection) {
                                                        cleanedLines.push(line);
                                                    }
                                                }

                                                cleanBody = cleanedLines.join('\n').trim();

                                                return cleanBody || '(No message content)';
                                            })()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null
                })()}

                {/* Reply Section */}
                <div className={styles.detailSection}>
                    <h3 className={styles.sectionTitle}>Reply</h3>
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className={styles.replyTextarea}
                        rows={6}
                    />
                    <button
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || isReplying}
                        className={styles.sendButton}
                    >
                        <FontAwesomeIcon icon={faPaperPlane} />
                        {isReplying ? 'Sending...' : 'Send Reply'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
