'use client';

import { usePathname } from 'next/navigation';
import styles from './MobileNav.module.css';
import { DockItemData } from '@/components/Dock/Dock';

interface MobileNavProps {
    items: DockItemData[];
}

export default function MobileNav({ items }: MobileNavProps) {
    const pathname = usePathname();

    // Map labels to route segments for active detection
    const routeMap: Record<string, string> = {
        'Dashboard': '/admin/dashboard',
        'Analytics': '/admin/analytics',
        'Admins': '/admin/users',
        'Tickets': '/admin/tickets',
        'Settings': '/admin/settings',
        'Logout': '',
    };

    return (
        <nav className={styles.mobileNav} role="navigation" aria-label="Mobile admin navigation">
            {items.map((item, index) => {
                const route = routeMap[item.label] ?? '';
                const isActive = route !== '' && pathname === route;
                return (
                    <button
                        key={index}
                        className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                        onClick={item.onClick}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <span className={styles.icon}>{item.icon}</span>
                        <span className={styles.label}>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
