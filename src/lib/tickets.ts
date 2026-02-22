import prisma from './prisma';

/**
 * Generate a unique ticket number
 * Format: TKT-YYYY-XXXXXX
 */
export function generateTicketNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TKT-${year}-${random}`;
}

/**
 * Create a new ticket from contact form submission
 */
export async function createTicket(
    customerName: string,
    customerEmail: string,
    initialMessage: string,
    automatedReplyMessageId?: string
) {
    const ticketNumber = generateTicketNumber();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const ticket = await prisma.ticket.create({
        data: {
            ticketNumber,
            customerName,
            customerEmail,
            initialMessage,
            automatedReplyMessageId,
            expiresAt,
            status: 'open',
            priority: 'normal',
        },
    });

    return ticket;
}

/**
 * Find ticket by ticket number
 */
export async function findTicketByNumber(ticketNumber: string) {
    return await prisma.ticket.findUnique({
        where: { ticketNumber },
        include: {
            assignedToUser: {
                select: {
                    id: true,
                    username: true,
                },
            },
            emailThread: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });
}

/**
 * Find ticket by customer email (for matching replies)
 */
export async function findOpenTicketByEmail(customerEmail: string) {
    return await prisma.ticket.findFirst({
        where: {
            customerEmail,
            status: {
                in: ['open', 'replied'],
            },
            expiresAt: {
                gt: new Date(), // Not expired
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            emailThread: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });
}

/**
 * Update ticket status and last customer email time
 */
export async function updateTicketOnCustomerReply(
    ticketId: string,
    expiresAt: Date
) {
    return await prisma.ticket.update({
        where: { id: ticketId },
        data: {
            status: 'replied',
            lastCustomerEmail: new Date(),
            expiresAt, // Reset expiration to 7 days from now
        },
    });
}

/**
 * Add email message to ticket thread
 */
export async function addEmailToTicket(
    ticketId: string,
    gmailMessageId: string,
    threadId: string | null,
    from: string,
    to: string,
    subject: string,
    body: string,
    isFromCustomer: boolean
) {
    return await prisma.emailMessage.create({
        data: {
            ticketId,
            gmailMessageId,
            threadId,
            from,
            to,
            subject,
            body,
            isFromCustomer,
        },
    });
}

/**
 * Mark email as forwarded
 */
export async function markEmailAsForwarded(
    emailMessageId: string,
    forwardedTo: string[]
) {
    return await prisma.emailMessage.update({
        where: { id: emailMessageId },
        data: {
            forwardedToTeam: true,
            forwardedTo,
        },
    });
}

/**
 * Get tickets that need to be auto-closed (expired)
 */
export async function getExpiredTickets() {
    return await prisma.ticket.findMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
            status: {
                not: 'closed',
            },
        },
    });
}

/**
 * Close a ticket
 */
export async function closeTicket(ticketId: string) {
    return await prisma.ticket.update({
        where: { id: ticketId },
        data: {
            status: 'closed',
            closedAt: new Date(),
        },
    });
}

/**
 * Get all tickets with filters
 */
export async function getTickets(filters?: {
    status?: string;
    priority?: string;
    search?: string;
    limit?: number;
    offset?: number;
}) {
    const where: any = {};

    if (filters?.status) {
        where.status = filters.status;
    }

    if (filters?.priority) {
        where.priority = filters.priority;
    }

    if (filters?.search) {
        where.OR = [
            { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
            { customerName: { contains: filters.search, mode: 'insensitive' } },
            { customerEmail: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
            where,
            include: {
                assignedToUser: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                emailThread: {
                    orderBy: { createdAt: 'desc' },
                    take: 1, // Just get the latest message for preview
                },
            },
            orderBy: { createdAt: 'desc' },
            take: filters?.limit || 50,
            skip: filters?.offset || 0,
        }),
        prisma.ticket.count({ where }),
    ]);

    return { tickets, total };
}

/**
 * Get ticket by ID with full email thread
 */
export async function getTicketById(ticketId: string) {
    return await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
            emailThread: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });
}

/**
 * Update ticket with automated reply message ID
 */
export async function updateTicketAutomatedReply(
    ticketId: string,
    automatedReplyMessageId: string
) {
    return await prisma.ticket.update({
        where: { id: ticketId },
        data: { automatedReplyMessageId },
    });
}

/**
 * Assign a ticket to an admin
 */
export async function assignTicket(ticketId: string, adminId: string | null) {
    return await prisma.ticket.update({
        where: { id: ticketId },
        data: {
            assignedTo: adminId,
        },
        include: {
            assignedToUser: {
                select: {
                    id: true,
                    username: true,
                },
            },
            emailThread: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(ticketId: string, status: string) {
    const updateData: any = {
        status,
    };

    if (status === 'closed') {
        updateData.closedAt = new Date();
    }

    return await prisma.ticket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
            assignedToUser: {
                select: {
                    id: true,
                    username: true,
                },
            },
            emailThread: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });
}
