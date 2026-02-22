import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

async function getAdminFromSession() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('admin_session')?.value;
    if (!userId) return null;

    const admin = await prisma.admin.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true, passwordHash: true, lastSeenAt: true },
    });

    if (!admin || !admin.isActive || !admin.passwordHash) return null;
    return admin;
}

/**
 * POST /api/admin/heartbeat
 * Records the admin as "online now" by updating lastSeenAt.
 * Called by PresenceCheck every 60 seconds and by the emails page mark-as-seen button.
 */
export async function POST() {
    try {
        const admin = await getAdminFromSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        await prisma.admin.update({
            where: { id: admin.id },
            data: { lastSeenAt: now },
        });

        return NextResponse.json({ lastSeenAt: now.toISOString() });
    } catch (error) {
        console.error('Heartbeat error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * GET /api/admin/heartbeat
 * Returns the current admin's lastSeenAt timestamp without updating it.
 * Used for initial page loads.
 */
export async function GET() {
    try {
        const admin = await getAdminFromSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({
            lastSeenAt: admin.lastSeenAt ? admin.lastSeenAt.toISOString() : null,
        });
    } catch (error) {
        console.error('Heartbeat GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
