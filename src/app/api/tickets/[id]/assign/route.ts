import { NextRequest, NextResponse } from 'next/server';
import { assignTicket } from '@/lib/tickets';
import { requireAuth } from '@/app/actions/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        
        const { id } = await params;
        const { assignedTo } = await request.json();
        
        const ticket = await assignTicket(id, assignedTo || null);
        
        return NextResponse.json(ticket);
    } catch (error: any) {
        console.error('Error assigning ticket:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to assign ticket' },
            { status: 500 }
        );
    }
}
