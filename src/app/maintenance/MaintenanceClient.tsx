'use client';

import { useEffect, useState } from 'react';
import styles from './maintenance.module.css';

interface MaintenanceData {
  maintenance: boolean;
  eta: string | null;
  message: string | null;
}

export default function MaintenanceClient() {
  const [data, setData] = useState<MaintenanceData | null>(null);

  useEffect(() => {
    fetch('/api/maintenance-status')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ maintenance: true, eta: null, message: null }));
  }, []);

  const etaFormatted = data?.eta
    ? new Date(data.eta).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className={styles.wrapper}>
      {/* Background: CONNECT text with subtle pulse */}
      <div className={styles.bgText}>CONNECT</div>

      {/* Scrolling TRENDSIGNITE marquee (right to left) */}
      <div className={styles.marqueeWrapper}>
        <div className={styles.marqueeTrack}>
          <span className={styles.marqueeText}>TRENDSIGNITE</span>
          <span className={styles.marqueeText}>TRENDSIGNITE</span>
          <span className={styles.marqueeText}>TRENDSIGNITE</span>
          <span className={styles.marqueeText}>TRENDSIGNITE</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.logo}>
          TRENDS<span className={styles.logoGradient}>IGNITE</span>
        </div>
        <h1 className={styles.title}>We&apos;ll Be Back Soon</h1>
        <p className={styles.subtitle}>
          We&apos;re performing scheduled maintenance to improve your experience.
        </p>
        {data?.message && (
          <p className={styles.message}>{data.message}</p>
        )}
        {etaFormatted && (
          <p className={styles.eta}>
            Estimated return: <strong className={styles.etaStrong}>{etaFormatted}</strong>
          </p>
        )}
        <p className={styles.contact}>
          Questions? Reach us at{' '}
          <a href="mailto:team@trendsignite.com" className={styles.contactLink}>
            team@trendsignite.com
          </a>
        </p>
      </div>
    </div>
  );
}
