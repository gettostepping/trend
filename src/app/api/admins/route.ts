import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/app/actions/auth';

export async function GET() {
    try {
        await requireAuth();
        
        const admins = await prisma.admin.findMany({
            where: {
                isActive: true,
            },
            select: {
                id: true,
                username: true,
                isActive: true,
            },
            orderBy: {
                username: 'asc',
            },
        });
        
        return NextResponse.json({ admins });
    } catch (error: any) {
        console.error('Error fetching admins:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch admins' },
            { status: 500 }
        );
    }
}
