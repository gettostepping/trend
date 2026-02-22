'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWrench,
  faTrash,
  faDatabase,
  faArchive,
  faCheck,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import MaintenanceModal from './MaintenanceModal';
import { useToast } from '@/hooks/useToast';
import styles from './settings.module.css';

interface Settings {
  maintenanceEnabled: boolean;
  maintenanceEta: string | null;
  maintenanceMessage: string | null;
  contactEmail: string | null;
  announcementEnabled: boolean;
  announcementText: string | null;
  contactFormDisabled: boolean;
  faqsDisabled: boolean;
  bulkArchiveDays: number;
}

function toPatch(s: Settings) {
  return {
    maintenanceEnabled: s.maintenanceEnabled,
    maintenanceEta: s.maintenanceEta,
    maintenanceMessage: s.maintenanceMessage,
    contactEmail: s.contactEmail ?? null,
    announcementEnabled: s.announcementEnabled,
    announcementText: s.announcementText ?? null,
    contactFormDisabled: s.contactFormDisabled,
    faqsDisabled: s.faqsDisabled,
    bulkArchiveDays: s.bulkArchiveDays,
  };
}

export default function SettingsPageClient() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const settingsRef = useRef<Settings | null>(null);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    if (settings) settingsRef.current = settings;
  }, [settings]);

  const fetchSettings = useCallback(async () => {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const patch = useCallback(async (updates: Partial<Settings>, label: string) => {
    const current = settingsRef.current;
    if (!current) return;
    setSavingKeys((prev) => new Set(prev).add(label));
    const body = { ...toPatch(current), ...updates };
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        showToast('Settings saved', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save', 'error');
      }
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete(label);
        return next;
      });
    }
  }, [showToast]);

  const handleMaintenanceToggle = useCallback((enabled: boolean) => {
    if (enabled) {
      setShowMaintenanceModal(true);
    } else {
      patch({ maintenanceEnabled: false, maintenanceEta: null, maintenanceMessage: null }, 'maintenance');
    }
  }, [patch]);

  const handleMaintenanceConfirm = useCallback(async (eta: Date | null, message: string) => {
    setSavingKeys((prev) => new Set(prev).add('maintenance'));
    const current = settingsRef.current;
    if (!current) return;
    const body = {
      ...toPatch(current),
      maintenanceEnabled: true,
      maintenanceEta: eta?.toISOString() ?? null,
      maintenanceMessage: message || null,
    };
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        showToast('Maintenance mode enabled', 'success');
      } else {
        showToast('Failed to enable maintenance', 'error');
      }
    } catch {
      showToast('Failed to enable maintenance', 'error');
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete('maintenance');
        return next;
      });
      setShowMaintenanceModal(false);
    }
  }, [showToast]);

  const handleAnnouncementToggle = useCallback((enabled: boolean) => {
    if (enabled) {
      patch({ announcementEnabled: true }, 'announcement');
    } else {
      patch({ announcementEnabled: false, announcementText: null }, 'announcement');
    }
  }, [patch]);

  const handleAnnouncementTextBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.trim() || null;
    const current = settingsRef.current?.announcementText ?? null;
    const curTrimmed = (current ?? '').trim() || null;
    if (text === curTrimmed) return;
    patch({ announcementText: text }, 'announcement');
  }, [patch]);

  const handleClearAnalytics = async () => {
    setConfirmAction(null);
    setSavingKeys((prev) => new Set(prev).add('analytics'));
    try {
      const res = await fetch('/api/settings/clear-analytics', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(`Cleared: ${data.deleted?.pageViews ?? 0} page views, ${data.deleted?.clickEvents ?? 0} clicks`, 'success');
      } else showToast(data.error || 'Failed', 'error');
    } catch {
      showToast('Failed', 'error');
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete('analytics');
        return next;
      });
    }
  };

  const handleClearCache = async () => {
    setConfirmAction(null);
    setSavingKeys((prev) => new Set(prev).add('cache'));
    try {
      const res = await fetch('/api/settings/clear-cache', { method: 'POST' });
      const data = await res.json();
      if (res.ok) showToast(`Cleared ${data.deleted ?? 0} cache entries`, 'success');
      else showToast(data.error || 'Failed', 'error');
    } catch {
      showToast('Failed', 'error');
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete('cache');
        return next;
      });
    }
  };

  const handleBulkArchive = async () => {
    setConfirmAction(null);
    setSavingKeys((prev) => new Set(prev).add('archive'));
    try {
      const res = await fetch('/api/settings/bulk-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysOld: settingsRef.current?.bulkArchiveDays ?? 90 }),
      });
      const data = await res.json();
      if (res.ok) showToast(`Archived ${data.archived ?? 0} tickets`, 'success');
      else showToast(data.error || 'Failed', 'error');
    } catch {
      showToast('Failed', 'error');
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete('archive');
        return next;
      });
    }
  };

  const isSaving = (key: string) => savingKeys.has(key);

  if (loading || !settings) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.content}><p className={styles.loading}>Loading...</p></div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ToastComponent />
      <div className={styles.content}>
        <h1 className={styles.title}>
          <FontAwesomeIcon icon={faWrench} style={{ color: '#1A73E8', marginRight: '0.5rem' }} />
          Website <span className={styles.gradientText}>Settings</span>
        </h1>

        <div className={styles.sections}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Maintenance</h2>
            <div className={styles.setting}>
              <span className={styles.label}>Maintenance mode</span>
              <div className={styles.segSwitch}>
                <button
                  type="button"
                  className={`${styles.segBtn} ${settings.maintenanceEnabled ? styles.segBtnActive : ''}`}
                  onClick={() => handleMaintenanceToggle(true)}
                  disabled={isSaving('maintenance')}
                >
                  <FontAwesomeIcon icon={faCheck} /> On
                </button>
                <button
                  type="button"
                  className={`${styles.segBtn} ${!settings.maintenanceEnabled ? styles.segBtnActive : ''}`}
                  onClick={() => handleMaintenanceToggle(false)}
                  disabled={isSaving('maintenance')}
                >
                  <FontAwesomeIcon icon={faXmark} /> Off
                </button>
              </div>
            </div>
            {settings.maintenanceEnabled && <p className={styles.hint}>Visitors see maintenance page. Admins bypass.</p>}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Feature flags</h2>
            <div className={styles.setting}>
              <span className={styles.label}>Disable contact form</span>
              <div className={styles.segSwitch}>
                <button
                  type="button"
                  className={`${styles.segBtn} ${settings.contactFormDisabled ? styles.segBtnActive : ''}`}
                  onClick={() => patch({ contactFormDisabled: true }, 'contactForm')}
                  disabled={isSaving('contactForm')}
                >
                  <FontAwesomeIcon icon={faCheck} /> On
                </button>
                <button
                  type="button"
                  className={`${styles.segBtn} ${!settings.contactFormDisabled ? styles.segBtnActive : ''}`}
                  onClick={() => patch({ contactFormDisabled: false }, 'contactForm')}
                  disabled={isSaving('contactForm')}
                >
                  <FontAwesomeIcon icon={faXmark} /> Off
                </button>
              </div>
            </div>
            <div className={styles.setting}>
              <span className={styles.label}>Disable FAQs page</span>
              <div className={styles.segSwitch}>
                <button
                  type="button"
                  className={`${styles.segBtn} ${settings.faqsDisabled ? styles.segBtnActive : ''}`}
                  onClick={() => patch({ faqsDisabled: true }, 'faqs')}
                  disabled={isSaving('faqs')}
                >
                  <FontAwesomeIcon icon={faCheck} /> On
                </button>
                <button
                  type="button"
                  className={`${styles.segBtn} ${!settings.faqsDisabled ? styles.segBtnActive : ''}`}
                  onClick={() => patch({ faqsDisabled: false }, 'faqs')}
                  disabled={isSaving('faqs')}
                >
                  <FontAwesomeIcon icon={faXmark} /> Off
                </button>
              </div>
            </div>
          </section>

          <section className={`${styles.section} ${styles.sectionFull}`}>
            <h2 className={styles.sectionTitle}>Announcement banner</h2>
            <div className={styles.setting}>
              <span className={styles.label}>Show announcement</span>
              <div className={styles.segSwitch}>
                <button
                  type="button"
                  className={`${styles.segBtn} ${settings.announcementEnabled ? styles.segBtnActive : ''}`}
                  onClick={() => handleAnnouncementToggle(true)}
                  disabled={isSaving('announcement')}
                >
                  <FontAwesomeIcon icon={faCheck} /> On
                </button>
                <button
                  type="button"
                  className={`${styles.segBtn} ${!settings.announcementEnabled ? styles.segBtnActive : ''}`}
                  onClick={() => handleAnnouncementToggle(false)}
                  disabled={isSaving('announcement')}
                >
                  <FontAwesomeIcon icon={faXmark} /> Off
                </button>
              </div>
            </div>
            <p className={styles.hint}>Turning off clears the text. Changes auto-save on blur.</p>
            <textarea
              value={settings.announcementText ?? ''}
              onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
              onBlur={handleAnnouncementTextBlur}
              placeholder="Announcement text shown at top of public pages..."
              className={styles.textarea}
              rows={3}
            />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Tickets</h2>
            <div className={styles.setting}>
              <label className={styles.label} htmlFor="bulkArchiveDays">Bulk archive closed tickets older than (days)</label>
              <input
                id="bulkArchiveDays"
                type="number"
                min={1}
                max={365}
                value={settings.bulkArchiveDays}
                onChange={(e) => setSettings({ ...settings, bulkArchiveDays: parseInt(e.target.value, 10) || 90 })}
                onBlur={(e) => {
                  const v = parseInt((e.target as HTMLInputElement).value, 10) || 90;
                  if (v !== settingsRef.current?.bulkArchiveDays) {
                    patch({ bulkArchiveDays: v }, 'tickets');
                  }
                }}
                className={`${styles.input} ${styles.numberInput}`}
              />
            </div>
          </section>

          <section className={`${styles.section} ${styles.sectionFull}`}>
            <h2 className={styles.sectionTitle}>Data & cache</h2>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setConfirmAction('analytics')}
                disabled={isSaving('analytics') || isSaving('cache') || isSaving('archive')}
              >
                <FontAwesomeIcon icon={faDatabase} /> Clear analytics
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setConfirmAction('cache')}
                disabled={isSaving('analytics') || isSaving('cache') || isSaving('archive')}
              >
                <FontAwesomeIcon icon={faTrash} /> Clear IP cache
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setConfirmAction('archive')}
                disabled={isSaving('analytics') || isSaving('cache') || isSaving('archive')}
              >
                <FontAwesomeIcon icon={faArchive} /> Bulk archive
              </button>
            </div>
            {confirmAction === 'analytics' && (
              <div className={styles.confirmBlock}>
                <p>Clear ALL analytics data? This cannot be undone.</p>
                <div className={styles.confirmBtns}>
                  <button type="button" onClick={() => setConfirmAction(null)}>Cancel</button>
                  <button type="button" className={styles.dangerBtn} onClick={handleClearAnalytics}>Clear</button>
                </div>
              </div>
            )}
            {confirmAction === 'cache' && (
              <div className={styles.confirmBlock}>
                <p>Clear IP geolocation cache?</p>
                <div className={styles.confirmBtns}>
                  <button type="button" onClick={() => setConfirmAction(null)}>Cancel</button>
                  <button type="button" className={styles.dangerBtn} onClick={handleClearCache}>Clear</button>
                </div>
              </div>
            )}
            {confirmAction === 'archive' && (
              <div className={styles.confirmBlock}>
                <p>Archive closed tickets older than {settings.bulkArchiveDays} days?</p>
                <div className={styles.confirmBtns}>
                  <button type="button" onClick={() => setConfirmAction(null)}>Cancel</button>
                  <button type="button" className={styles.dangerBtn} onClick={handleBulkArchive}>Archive</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {showMaintenanceModal && (
        <MaintenanceModal
          onConfirm={handleMaintenanceConfirm}
          onCancel={() => setShowMaintenanceModal(false)}
        />
      )}
    </div>
  );
}
