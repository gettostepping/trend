'use server';

import { getTickets, getTicketById, findTicketByNumber } from '@/lib/tickets';

export async function getTicketsAction(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
}) {
    try {
        return await getTickets(filters);
    } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch tickets');
    }
}

export async function getTicketAction(ticketNumber: string) {
    try {
        const ticket = await findTicketByNumber(ticketNumber);
        if (!ticket) {
            throw new Error('Ticket not found');
        }
        return ticket;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch ticket');
    }
}
