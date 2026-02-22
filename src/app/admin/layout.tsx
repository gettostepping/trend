'use client';

import "../globals.css";
import Dock from '@/components/Dock/Dock';
import MobileNav from '@/components/MobileNav/MobileNav';
import { VscHome, VscAccount, VscMail, VscSignOut, VscGraph, VscSettingsGear } from "react-icons/vsc";
import { useRouter, usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import AdminNavbar from '@/components/AdminNavbar/AdminNavbar';
import { PresenceCheck } from '@/components/PresenceCheck';
import AdminLoadingScreen from '@/components/AdminLoadingScreen/AdminLoadingScreen';
import AdminFooter from '@/components/AdminFooter/AdminFooter';
import { useEffect, useState, useRef } from 'react';
import styles from './admin.module.css';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const prevPathnameRef = useRef<string | null>(null);
    const isInitialMount = useRef(true);
    const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const loadingInstanceRef = useRef<number>(0);

    // Don't show Dock on login and setup pages
    const showDock = pathname !== '/admin' && pathname !== '/admin/setup';
    // Don't show AdminNavbar on pages that have their own header
    const showNavbar = showDock && pathname !== '/admin/analytics' && pathname !== '/admin/tickets';

    // Detect route changes (but not on initial mount)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            prevPathnameRef.current = pathname;

            // Check if we're navigating from outside (puzzle completion)
            const shouldShowLoading = sessionStorage.getItem('adminLoading') === 'true';
            if (shouldShowLoading) {
                // Clear the flag
                sessionStorage.removeItem('adminLoading');

                // Cancel any existing loading timer
                if (loadingTimerRef.current) {
                    clearTimeout(loadingTimerRef.current);
                }

                // Increment instance to force new animation
                loadingInstanceRef.current += 1;

                // Show loading animation
                setIsLoading(true);

                // Hide loading after animation completes
                loadingTimerRef.current = setTimeout(() => {
                    setIsLoading(false);
                    loadingTimerRef.current = null;
                }, 1000);
            }
            return;
        }

        if (pathname !== prevPathnameRef.current && prevPathnameRef.current !== null) {
            // Cancel any existing loading timer and reset
            if (loadingTimerRef.current) {
                clearTimeout(loadingTimerRef.current);
            }

            // Increment instance to force new animation
            loadingInstanceRef.current += 1;

            // Route changed, always show loading
            setIsLoading(true);

            // Hide loading after animation completes
            loadingTimerRef.current = setTimeout(() => {
                setIsLoading(false);
                loadingTimerRef.current = null;
            }, 1000);

            return () => {
                if (loadingTimerRef.current) {
                    clearTimeout(loadingTimerRef.current);
                    loadingTimerRef.current = null;
                }
            };
        }
        prevPathnameRef.current = pathname;
    }, [pathname]);

    const handleNavigation = (path: string) => {
        // Cancel any existing loading timer
        if (loadingTimerRef.current) {
            clearTimeout(loadingTimerRef.current);
            loadingTimerRef.current = null;
        }

        // Increment instance to force new animation
        loadingInstanceRef.current += 1;

        // Always show loading when navigating
        setIsLoading(true);

        // Small delay to ensure loading screen renders before navigation
        setTimeout(() => {
            router.push(path);
        }, 10);

        // Set timer to hide loading
        loadingTimerRef.current = setTimeout(() => {
            setIsLoading(false);
            loadingTimerRef.current = null;
        }, 1000);
    };

    const items = [
        {
            icon: <VscHome size={24} />,
            label: 'Dashboard',
            onClick: () => handleNavigation('/admin/dashboard')
        },
        {
            icon: <VscGraph size={24} />,
            label: 'Analytics',
            onClick: () => handleNavigation('/admin/analytics')
        },
        {
            icon: <VscAccount size={24} />,
            label: 'Admins',
            onClick: () => handleNavigation('/admin/users')
        },
        {
            icon: <VscMail size={24} />,
            label: 'Tickets',
            onClick: () => handleNavigation('/admin/tickets')
        },
        {
            icon: <VscSettingsGear size={24} />,
            label: 'Settings',
            onClick: () => handleNavigation('/admin/settings')
        },
        {
            icon: <VscSignOut size={24} />,
            label: 'Logout',
            onClick: () => logoutAction()
        },
    ];

    return (
        <>
            {/* Dark background wrapper for admin pages */}
            <div className={styles.adminWrapper}></div>
            {isLoading && <AdminLoadingScreen key={loadingInstanceRef.current} />}
            {showDock && <PresenceCheck />}
            {showNavbar && <AdminNavbar onNavigate={handleNavigation} />}
            <div className={styles.pageContainer}>
                {children}
                {showDock && <AdminFooter />}
            </div>
            {showDock && (
                <Dock
                    items={items}
                    panelHeight={68}
                    baseItemSize={50}
                    magnification={70}
                />
            )}
            {showDock && <MobileNav items={items} />}
        </>
    );
}
