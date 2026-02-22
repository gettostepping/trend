import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

/**
 * POST /api/admin/mark-submissions-seen
 * Sets emailsLastViewedAt = now() for the current admin.
 * Called when the admin clicks "Mark as seen" on the dashboard.
 */
export async function POST() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('admin_session')?.value;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = await prisma.admin.findUnique({
            where: { id: userId },
            select: { isActive: true, passwordHash: true },
        });

        if (!admin?.isActive || !admin?.passwordHash) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        await (prisma.admin as any).update({
            where: { id: userId },
            data: { emailsLastViewedAt: now },
        });

        return NextResponse.json({ emailsLastViewedAt: now.toISOString() });
    } catch (error) {
        console.error('mark-submissions-seen error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
