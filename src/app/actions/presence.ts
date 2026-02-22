'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function checkPresenceAction() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('admin_session')?.value;

    if (!userId) {
        return { valid: false, reason: 'No session found' };
    }

    try {
        const user = await prisma.admin.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                isActive: true,
                passwordHash: true,
            }
        });

        // Check if user exists
        if (!user) {
            cookieStore.delete('admin_session');
            return { valid: false, reason: 'User not found' };
        }

        // Check if user is active
        if (!user.isActive) {
            cookieStore.delete('admin_session');
            return { valid: false, reason: 'Account disabled' };
        }

        // Check if user has completed setup
        if (!user.passwordHash) {
            cookieStore.delete('admin_session');
            return { valid: false, reason: 'Account not verified' };
        }

        // Stamp lastSeenAt on every successful presence check so the
        // new-email detection can determine what arrived while admin was away
        await prisma.admin.update({
            where: { id: userId },
            data: { lastSeenAt: new Date() },
        });

        return { valid: true, username: user.username };
    } catch (error) {
        console.error('Presence check error:', error);
        return { valid: false, reason: 'Server error' };
    }
}
