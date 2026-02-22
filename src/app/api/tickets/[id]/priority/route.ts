import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/app/actions/auth';

const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();

        const { id } = await params;
        const { priority } = await request.json();

        if (!priority || !VALID_PRIORITIES.includes(priority)) {
            return NextResponse.json(
                { error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` },
                { status: 400 }
            );
        }

        const ticket = await prisma.ticket.update({
            where: { id },
            data: { priority },
            include: {
                assignedToUser: { select: { id: true, username: true } },
                emailThread: true,
            },
        });

        return NextResponse.json(ticket);
    } catch (error: any) {
        console.error('Error updating ticket priority:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update ticket priority' },
            { status: 500 }
        );
    }
}
