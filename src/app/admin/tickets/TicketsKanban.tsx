'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faClock,
    faEnvelope,
    faExclamationCircle,
    faCheckCircle,
    faArchive,
    faReply,
    faEllipsisV,
    faArrowUp,
    faCircle,
    faArrowDown,
    faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import styles from './ticketsKanban.module.css';
import TicketCard from './TicketCard';
import TicketDetailPanel from './TicketDetailPanel';
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
    isActive: boolean;
}

interface TicketsKanbanProps {
    initialTickets: Ticket[];
    admins: Admin[];
}

const COLUMNS = [
    { id: 'open', label: 'Open', icon: faEnvelope, color: '#3b82f6' },
    { id: 'replied', label: 'Replied', icon: faReply, color: '#f59e0b' },
    { id: 'closed', label: 'Closed', icon: faCheckCircle, color: '#6b7280' },
    { id: 'archived', label: 'Archived', icon: faArchive, color: '#9ca3af' },
];

export default function TicketsKanban({ initialTickets, admins }: TicketsKanbanProps) {
    const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const searchParams = useSearchParams();

    // Auto-open ticket from URL if present
    useEffect(() => {
        const ticketIdToOpen = searchParams?.get('open');
        if (ticketIdToOpen) {
            const ticketInList = tickets.find(t => t.id === ticketIdToOpen);
            if (ticketInList) {
                // Instantly open the partial ticket while we fetch the full one
                setSelectedTicket(ticketInList);
                // Fetch full ticket details (with email thread)
                fetch(`/api/tickets/${ticketIdToOpen}`)
                    .then(res => res.ok ? res.json() : null)
                    .then(fullTicket => {
                        if (fullTicket) {
                            setSelectedTicket(fullTicket);
                        }
                    })
                    .catch(err => console.error('Error fetching auto-open ticket:', err));
            }
        }
    }, [searchParams, tickets]);

    // Poll for updates every 30 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch('/api/tickets');
                const data = await response.json();
                if (data.tickets) {
                    setTickets(data.tickets);
                }
            } catch (error) {
                console.error('Error polling tickets:', error);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Filter tickets
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.initialMessage.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
        const matchesStatus = !statusFilter || ticket.status === statusFilter;

        return matchesSearch && matchesPriority && matchesStatus;
    });

    // Priority sort order: urgent first, low last
    const PRIORITY_ORDER: Record<string, number> = {
        urgent: 0,
        high: 1,
        normal: 2,
        low: 3,
    };

    const sortByPriorityThenTime = (a: Ticket, b: Ticket) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 99;
        const pb = PRIORITY_ORDER[b.priority] ?? 99;
        if (pa !== pb) return pa - pb;
        // Within the same priority: newest ticket first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };

    // Group tickets by status then sort each column
    const ticketsByStatus = COLUMNS.reduce((acc, column) => {
        acc[column.id] = filteredTickets
            .filter(t => t.status === column.id)
            .sort(sortByPriorityThenTime);
        return acc;
    }, {} as Record<string, Ticket[]>);


    const handleStatusChange = async (ticketId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/tickets/${ticketId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                setTickets(prev => prev.map(t =>
                    t.id === ticketId ? { ...t, status: newStatus } : t
                ));
                if (selectedTicket?.id === ticketId) {
                    setSelectedTicket({ ...selectedTicket, status: newStatus });
                }
            }
        } catch (error) {
            console.error('Error updating ticket status:', error);
        }
    };

    const handleAssignTicket = async (ticketId: string, adminId: string | null) => {
        try {
            const response = await fetch(`/api/tickets/${ticketId}/assign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedTo: adminId }),
            });

            if (response.ok) {
                const updatedTicket = await response.json();
                setTickets(prev => prev.map(t =>
                    t.id === ticketId ? updatedTicket : t
                ));
                if (selectedTicket?.id === ticketId) {
                    setSelectedTicket(updatedTicket);
                }
            }
        } catch (error) {
            console.error('Error assigning ticket:', error);
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

    return (
        <div className={styles.kanbanContainer}>
            {/* Tickets Header */}
            <header className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                    <Link href="/" className={styles.backToHome}>
                        <FontAwesomeIcon icon={faArrowLeft} className={styles.arrowIcon} />
                        <span>Back To Home</span>
                    </Link>
                    <div className={styles.stats}>
                        <span className={styles.statItem}>
                            <FontAwesomeIcon icon={faEnvelope} />
                            {tickets.filter(t => t.status === 'open').length} Open
                        </span>
                        <span className={styles.statItem}>
                            <FontAwesomeIcon icon={faReply} />
                            {tickets.filter(t => t.status === 'replied').length} Replied
                        </span>
                        <span className={styles.statItem}>
                            <FontAwesomeIcon icon={faCheckCircle} />
                            {tickets.filter(t => t.status === 'closed').length} Closed
                        </span>
                        <span className={styles.statItem}>
                            <FontAwesomeIcon icon={faArchive} />
                            {tickets.filter(t => t.status === 'archived').length} Archived
                        </span>
                        <span className={styles.statItem}>
                            <FontAwesomeIcon icon={faExclamationCircle} />
                            {tickets.filter(t => t.priority === 'urgent').length} Urgent
                        </span>
                    </div>
                </div>

                <Link href="/admin/dashboard" className={styles.pageHeaderLogo}>
                    TRENDS<span className={styles.logoSpan}>IGNITE</span>
                </Link>

                <div className={styles.pageHeaderRight}>
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    <div className={styles.filtersWrapper}>
                        <CustomDropdown
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="All Statuses"
                            options={[
                                { value: '', label: 'All Statuses' },
                                { value: 'open', label: 'Open', icon: faEnvelope },
                                { value: 'replied', label: 'Replied', icon: faReply },
                                { value: 'closed', label: 'Closed', icon: faCheckCircle },
                                { value: 'archived', label: 'Archived', icon: faArchive },
                            ]}
                        />
                        <CustomDropdown
                            value={priorityFilter}
                            onChange={setPriorityFilter}
                            placeholder="All Priorities"
                            options={[
                                { value: '', label: 'All Priorities' },
                                { value: 'urgent', label: 'Urgent', icon: faExclamationCircle },
                                { value: 'high', label: 'High', icon: faArrowUp },
                                { value: 'normal', label: 'Normal', icon: faCircle },
                                { value: 'low', label: 'Low', icon: faArrowDown },
                            ]}
                        />
                    </div>
                </div>
            </header>

            {/* Kanban Board */}
            <div className={styles.kanbanBoard}>
                {COLUMNS.map((column) => {
                    const columnTickets = ticketsByStatus[column.id] ?? [];
                    if (columnTickets.length === 0) return null;
                    return (
                        <div key={column.id} className={styles.column}>
                            <div className={styles.columnHeader}>
                                <div className={styles.columnTitle}>
                                    <FontAwesomeIcon icon={column.icon} style={{ color: column.color }} />
                                    <span>{column.label}</span>
                                    <span className={styles.columnCount}>
                                        ({ticketsByStatus[column.id]?.length || 0})
                                    </span>
                                </div>
                            </div>
                            <div className={styles.columnContent}>
                                <AnimatePresence>
                                    {ticketsByStatus[column.id]?.map((ticket) => (
                                        <motion.div
                                            key={ticket.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <TicketCard
                                                ticket={ticket}
                                                onClick={async () => {
                                                    // Fetch full ticket details with complete email thread
                                                    try {
                                                        const response = await fetch(`/api/tickets/${ticket.id}`);
                                                        if (response.ok) {
                                                            const fullTicket = await response.json();
                                                            setSelectedTicket(fullTicket);
                                                        } else {
                                                            // Fallback to the ticket we have
                                                            setSelectedTicket(ticket);
                                                        }
                                                    } catch (error) {
                                                        console.error('Error fetching ticket details:', error);
                                                        setSelectedTicket(ticket);
                                                    }
                                                }}
                                                onStatusChange={handleStatusChange}
                                                onAssign={handleAssignTicket}
                                                admins={admins}
                                                priorityColor={getPriorityColor(ticket.priority)}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Ticket Detail Panel */}
            <AnimatePresence>
                {selectedTicket && (
                    <TicketDetailPanel
                        ticket={selectedTicket}
                        admins={admins}
                        onClose={() => setSelectedTicket(null)}
                        onStatusChange={handleStatusChange}
                        onAssign={handleAssignTicket}
                        onUpdate={(updatedTicket) => {
                            setTickets(prev => prev.map(t =>
                                t.id === updatedTicket.id ? updatedTicket : t
                            ));
                            setSelectedTicket(updatedTicket);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
