import { NextResponse } from 'next/server';
import { getTickets } from '@/lib/tickets';
import { requireAuth } from '@/app/actions/auth';

export async function GET(request: Request) {
    try {
        await requireAuth();
        
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || undefined;
        const priority = searchParams.get('priority') || undefined;
        const search = searchParams.get('search') || undefined;
        
        const result = await getTickets({
            status,
            priority,
            search,
            limit: 1000, // Get all tickets for Kanban
        });
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error fetching tickets:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch tickets' },
            { status: 500 }
        );
    }
}
