import { NextRequest, NextResponse } from 'next/server';
import { updateTicketStatus } from '@/lib/tickets';
import { requireAuth } from '@/app/actions/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        
        const { id } = await params;
        const { status } = await request.json();
        
        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            );
        }
        
        const ticket = await updateTicketStatus(id, status);
        
        return NextResponse.json(ticket);
    } catch (error: any) {
        console.error('Error updating ticket status:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update ticket status' },
            { status: 500 }
        );
    }
}
