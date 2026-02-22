import { NextRequest, NextResponse } from 'next/server';
import { getTicketById } from '@/lib/tickets';
import { requireAuth } from '@/app/actions/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        
        const { id } = await params;
        const ticket = await getTicketById(id);
        
        if (!ticket) {
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            );
        }
        
        // Serialize dates
        const serializedTicket = {
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
        };
        
        return NextResponse.json(serializedTicket);
    } catch (error: any) {
        console.error('Error fetching ticket:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch ticket' },
            { status: 500 }
        );
    }
}
