"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function PresenceCheck() {
    const router = useRouter();

    useEffect(() => {
        // ── 1. Session-validity check (every 5 minutes) ─────────────────────
        checkPresence();
        const presenceInterval = setInterval(checkPresence, 300000);

        // ── 2. Heartbeat ping (every 60 seconds) ────────────────────────────
        // Keeps lastSeenAt current while the admin is actively browsing.
        // We fire immediately so the first page-load also records activity.
        sendHeartbeat();
        const heartbeatInterval = setInterval(sendHeartbeat, 60000);

        return () => {
            clearInterval(presenceInterval);
            clearInterval(heartbeatInterval);
        };
    }, []);

    async function checkPresence() {
        try {
            const { checkPresenceAction } = await import('@/app/actions/presence');
            const result = await checkPresenceAction();

            if (!result.valid) {
                console.log('Session invalid:', result.reason);
                router.push('/admin');
            }
        } catch (error) {
            console.error('Presence check failed:', error);
        }
    }

    async function sendHeartbeat() {
        try {
            await fetch('/api/admin/heartbeat', { method: 'POST' });
        } catch (error) {
            // Heartbeat failures are non-critical; swallow silently
            console.warn('Heartbeat failed:', error);
        }
    }

    return null; // This component doesn't render anything
}
