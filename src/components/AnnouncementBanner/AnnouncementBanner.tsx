'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import styles from './AnnouncementBanner.module.css';

const BANNER_HEIGHT = 48;
const POPUP_DELAY_MS = 3000;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function AnnouncementBanner() {
  const pathname = usePathname();
  const [banner, setBanner] = useState<{ enabled: boolean; text: string | null } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  const fetchBanner = useCallback(() => {
    if (pathname?.startsWith('/admin') || pathname === '/maintenance') {
      setBanner({ enabled: false, text: null });
      document.body.classList.remove('announcement-banner-visible');
      document.documentElement.style.removeProperty('--announcement-banner-height');
      return;
    }
    fetch(`/api/settings/public?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        const enabled = data.announcementEnabled === true;
        const text = data.announcementText?.trim() || null;
        const show = enabled && !!text;
        setBanner({ enabled: show, text: show ? text : null });
        if (show) {
          document.body.classList.add('announcement-banner-visible');
          document.documentElement.style.setProperty('--announcement-banner-height', `${BANNER_HEIGHT}px`);
        } else {
          document.body.classList.remove('announcement-banner-visible');
          document.documentElement.style.removeProperty('--announcement-banner-height');
        }
      })
      .catch(() => {
        setBanner({ enabled: false, text: null });
        document.body.classList.remove('announcement-banner-visible');
        document.documentElement.style.removeProperty('--announcement-banner-height');
      });
  }, [pathname]);

  useEffect(() => {
    fetchBanner();
  }, [fetchBanner]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchBanner();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.body.classList.remove('announcement-banner-visible');
      document.documentElement.style.removeProperty('--announcement-banner-height');
    };
  }, [fetchBanner]);

  // Start popup logic when banner becomes active on mobile
  useEffect(() => {
    if (isMobile && banner?.enabled && banner.text && !dismissed) {
      // Small delay before appearing so page loads first
      const showTimer = setTimeout(() => setVisible(true), 300);
      // Start countdown — close button appears after POPUP_DELAY_MS
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => setCanClose(true), POPUP_DELAY_MS + 300);
      return () => {
        clearTimeout(showTimer);
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      };
    }
  }, [isMobile, banner, dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    // Wait for exit animation before fully unmounting
    setTimeout(() => setDismissed(true), 350);
  };

  if (!banner?.enabled || !banner.text?.trim()) return null;

  // ── MOBILE: Popup ──────────────────────────────────────────────
  if (isMobile) {
    if (dismissed) return null;
    return (
      <>
        {/* Backdrop */}
        <div
          className={`${styles.backdrop} ${visible ? styles.backdropVisible : ''}`}
          onClick={canClose ? handleDismiss : undefined}
          aria-hidden="true"
        />
        {/* Popup card */}
        <div
          className={`${styles.popup} ${visible ? styles.popupVisible : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Announcement"
        >
          {/* Header */}
          <div className={styles.popupHeader}>
            <div className={styles.popupIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11l19-9-9 19-2-8-8-2z" />
              </svg>
            </div>
            <p className={styles.popupLabel}>Announcement</p>
          </div>

          {/* Body */}
          <div className={styles.popupBody}>
            <p className={styles.popupText}>{banner.text}</p>
          </div>

          {/* Footer */}
          <div className={styles.popupFooter}>
            {/* Countdown ring — disappears when canClose is true */}
            {!canClose && (
              <div className={styles.countdown} aria-hidden="true">
                <svg viewBox="0 0 36 36" className={styles.countdownSvg}>
                  <circle cx="18" cy="18" r="15" className={styles.countdownTrack} />
                  <circle cx="18" cy="18" r="15" className={styles.countdownRing} />
                </svg>
              </div>
            )}
            {/* Close button — fades in after countdown */}
            <button
              className={`${styles.popupClose} ${canClose ? styles.popupCloseVisible : ''}`}
              onClick={handleDismiss}
              disabled={!canClose}
              aria-label="Dismiss announcement"
            >
              Got it
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── DESKTOP: Original banner ────────────────────────────────────
  return (
    <div className={styles.banner} data-role="announcement-banner">
      <span className={styles.text}>{banner.text}</span>
    </div>
  );
}
