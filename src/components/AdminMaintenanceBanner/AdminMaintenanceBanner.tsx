'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWrench } from '@fortawesome/free-solid-svg-icons';
import styles from './AdminMaintenanceBanner.module.css';

export default function AdminMaintenanceBanner() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  const checkAndShow = () => {
    if (pathname?.startsWith('/admin')) {
      setShow(false);
      return;
    }
    Promise.all([
      fetch('/api/maintenance-status', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/auth/check', { cache: 'no-store' }).then((r) => r.json()),
    ]).then(([status, auth]) => {
      setShow(status?.maintenance === true && auth?.admin === true);
    }).catch(() => setShow(false));
  };

  useEffect(() => {
    checkAndShow();
  }, [pathname]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkAndShow();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pathname]);

  if (!show) return null;

  return (
    <div className={styles.banner}>
      <span className={styles.icon}>
        <FontAwesomeIcon icon={faWrench} />
      </span>
      <span className={styles.text}>Maintenance mode — Viewing as admin</span>
    </div>
  );
}
