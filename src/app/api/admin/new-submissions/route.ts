import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

async function isAuthenticated() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('admin_session')?.value;
    if (!userId) return false;

    const admin = await prisma.admin.findUnique({
        where: { id: userId },
        select: { isActive: true, passwordHash: true },
    });

    return !!(admin?.isActive && admin?.passwordHash);
}

/**
 * GET /api/admin/new-submissions?since=<ISO timestamp>
 * Returns contact submissions created after the given timestamp.
 * Used by the emails page to determine which submissions are "new" since admin was last online.
 */
export async function GET(request: NextRequest) {
    try {
        const authed = await isAuthenticated();
        if (!authed) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const since = searchParams.get('since');

        const whereClause = since
            ? { createdAt: { gt: new Date(since) } }
            : undefined;

        const submissions = await prisma.contactSubmission.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            select: { id: true },
        });

        return NextResponse.json({
            count: submissions.length,
            ids: submissions.map((s) => s.id),
        });
    } catch (error) {
        console.error('New submissions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
