import { Suspense } from 'react';
import { getTickets } from '@/lib/tickets';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/app/actions/auth';
import TicketsKanban from './TicketsKanban';

export default async function TicketsPage() {
    await requireAuth();

    // Fetch tickets and admins
    const [ticketsResult, adminsResult] = await Promise.all([
        getTickets({ limit: 1000 }),
        prisma.admin.findMany({
            where: { isActive: true },
            select: {
                id: true,
                username: true,
                isActive: true,
            },
            orderBy: { username: 'asc' },
        }),
    ]);

    // Serialize dates
    const tickets = ticketsResult.tickets.map(ticket => ({
        ...ticket,
        createdAt: ticket.createdAt.toISOString(),
        lastCustomerEmail: ticket.lastCustomerEmail?.toISOString(),
        lastTeamReply: ticket.lastTeamReply?.toISOString(),
        closedAt: ticket.closedAt?.toISOString(),
        expiresAt: ticket.expiresAt.toISOString(),
        emailThread: ticket.emailThread?.map(email => ({
            ...email,
            createdAt: email.createdAt.toISOString(),
        })),
    }));

    return (
        <Suspense fallback={<div style={{ padding: '2rem', color: '#fff' }}>Loading tickets...</div>}>
            <TicketsKanban initialTickets={tickets as any} admins={adminsResult} />
        </Suspense>
    );
}
