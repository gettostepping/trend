'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser, 
    faClock, 
    faExclamationCircle,
    faEnvelope,
    faReply,
    faCheckCircle,
    faArchive
} from '@fortawesome/free-solid-svg-icons';
import styles from './ticketsKanban.module.css';

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
    createdAt: string;
}

interface Admin {
    id: string;
    username: string;
}

interface TicketCardProps {
    ticket: Ticket;
    onClick: () => void;
    onStatusChange: (ticketId: string, newStatus: string) => void;
    onAssign: (ticketId: string, adminId: string | null) => void;
    admins: Admin[];
    priorityColor: string;
}

export default function TicketCard({ 
    ticket, 
    onClick, 
    priorityColor 
}: TicketCardProps) {
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open': return faEnvelope;
            case 'replied': return faReply;
            case 'closed': return faCheckCircle;
            case 'archived': return faArchive;
            default: return faEnvelope;
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

    return (
        <div className={styles.ticketCard} onClick={onClick}>
            <div className={styles.ticketCardHeader}>
                <div className={styles.ticketNumber}>{ticket.ticketNumber}</div>
                <div className={styles.ticketBadges}>
                    <div 
                        className={styles.statusBadge}
                        style={{ backgroundColor: getStatusColor(ticket.status) }}
                    >
                        <FontAwesomeIcon icon={getStatusIcon(ticket.status)} />
                        {ticket.status}
                    </div>
                    <div 
                        className={styles.priorityBadge}
                        style={{ backgroundColor: priorityColor }}
                    >
                        <FontAwesomeIcon icon={faExclamationCircle} />
                        {ticket.priority}
                    </div>
                </div>
            </div>
            
            <div className={styles.ticketCustomer}>
                <FontAwesomeIcon icon={faUser} />
                <span>{ticket.customerName}</span>
            </div>
            
            <div className={styles.ticketMessage}>
                {ticket.initialMessage.substring(0, 100)}
                {ticket.initialMessage.length > 100 ? '...' : ''}
            </div>
            
            <div className={styles.ticketFooter}>
                <div className={styles.ticketMeta}>
                    <FontAwesomeIcon icon={faClock} />
                    <span>{formatTimeAgo(ticket.createdAt)}</span>
                </div>
                {ticket.assignedToUser && (
                    <div className={styles.assignedTo}>
                        <span>{ticket.assignedToUser.username}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
