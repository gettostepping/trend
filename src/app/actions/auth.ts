'use server';

import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

// Cache the session check for the duration of the request
export const checkSession = cache(async () => {
    const cookieStore = await cookies();
    const userId = cookieStore.get('admin_session')?.value;

    if (!userId) return null;

    try {
        // Check if DATABASE_URL is configured
        if (!process.env.DATABASE_URL) {
            console.warn('DATABASE_URL not configured');
            return null;
        }

        const user = await prisma.admin.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                isActive: true,
                passwordHash: true
            }
        });

        // If user doesn't exist, is disabled, or hasn't set up password, return null
        // The presence check will handle clearing the session
        if (!user || !user.isActive || !user.passwordHash) {
            return null;
        }

        return user;
    } catch (error) {
        // If there's any error, return null
        // The presence check will handle clearing the session
        console.error('Session check error:', error);
        return null;
    }
});

// Verify user is authenticated, throw if not
export async function requireAuth() {
    const user = await checkSession();
    if (!user) {
        redirect('/admin');
    }
    return user;
}

export async function loginAction(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username) return { error: 'Username required' };

    const user = await prisma.admin.findUnique({ where: { username } });

    if (!user) {
        return { error: 'User not found' };
    }

    // Check if user is active
    if (!user.isActive) {
        return { error: 'Your account has been disabled. Please contact a super admin.' };
    }

    // If no password set, this is a first-time login attempted without setup
    if (!user.passwordHash) {
        // Check if they need to setup
        return { error: 'Please set up your password first', needSetup: true, username };
    }

    if (!password) return { error: 'Password required' };

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
        return { error: 'Invalid password' };
    }

    // Create session
    const cookieStore = await cookies();
    cookieStore.set('admin_session', user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    // Stamp lastSeenAt on login so new-email detection knows when admin last visited
    await prisma.admin.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() },
    });

    redirect('/admin/dashboard');
}

export async function setupPasswordAction(formData: FormData) {
    const username = formData.get('username') as string;
    const authCode = formData.get('authCode') as string;
    const password = formData.get('password') as string;

    if (!username || !authCode || !password) {
        return { error: 'All fields required' };
    }

    const user = await prisma.admin.findUnique({ where: { username } });

    if (!user) return { error: 'User not found' };
    if (user.passwordHash) return { error: 'Password already set' };

    if (user.authCode !== authCode) {
        return { error: 'Invalid Authorization Code' };
    }

    const hashedPassword = await hashPassword(password);

    await prisma.admin.update({
        where: { id: user.id },
        data: {
            passwordHash: hashedPassword,
            authCode: null, // Clear code after use
        },
    });

    const cookieStore = await cookies();
    cookieStore.set('admin_session', user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    redirect('/admin/dashboard');
}

export async function createAdminAction(formData: FormData) {
    // Only authenticated admins can create new admins (implied check later or middleware)
    const username = formData.get('username') as string;
    const authCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        const newUser = await prisma.admin.create({
            data: {
                username,
                authCode,
            },
        });
        return { success: true, authCode, username };
    } catch (e) {
        return { error: 'Username already exists or error creating user' };
    }
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    redirect('/admin');
}

// Get all admins
export async function getAdminsAction() {
    try {
        const admins = await prisma.admin.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                createdAt: true,
                isActive: true,
                isSuperAdmin: true,
                passwordHash: true, // To check if setup is complete
            }
        });
        return { success: true, admins };
    } catch (error) {
        return { success: false, error: 'Failed to fetch admins' };
    }
}

// Delete admin
export async function deleteAdminAction(adminId: string) {
    const currentUser = await requireAuth();

    try {
        // Get current user's full details
        const currentAdmin = await prisma.admin.findUnique({
            where: { id: currentUser.id },
            select: { isSuperAdmin: true }
        });

        if (!currentAdmin?.isSuperAdmin) {
            return { success: false, error: 'Only super admins can delete users' };
        }

        // Prevent self-deletion
        if (currentUser.id === adminId) {
            return { success: false, error: 'You cannot delete yourself' };
        }

        await prisma.admin.delete({
            where: { id: adminId }
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete admin' };
    }
}

// Toggle admin status
export async function toggleAdminStatusAction(adminId: string) {
    const currentUser = await requireAuth();

    try {
        // Get current user's full details
        const currentAdmin = await prisma.admin.findUnique({
            where: { id: currentUser.id },
            select: { isSuperAdmin: true }
        });

        if (!currentAdmin?.isSuperAdmin) {
            return { success: false, error: 'Only super admins can change user status' };
        }

        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            select: { isActive: true }
        });

        if (!admin) {
            return { success: false, error: 'Admin not found' };
        }

        // Prevent self-disabling
        if (currentUser.id === adminId && admin.isActive) {
            return { success: false, error: 'You cannot disable yourself' };
        }

        await prisma.admin.update({
            where: { id: adminId },
            data: { isActive: !admin.isActive }
        });

        return { success: true, isActive: !admin.isActive };
    } catch (error) {
        return { success: false, error: 'Failed to toggle admin status' };
    }
}
