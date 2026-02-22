'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import styles from './maintenanceModal.module.css';

type EtaOption = '30min' | '1hr' | '2hr' | 'few' | 'none' | 'custom';

interface MaintenanceModalProps {
  onConfirm: (eta: Date | null, message: string) => void;
  onCancel: () => void;
}

export default function MaintenanceModal({ onConfirm, onCancel }: MaintenanceModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<EtaOption | null>(null);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [customTime, setCustomTime] = useState<string>('14:00');
  const [message, setMessage] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  const getEtaFromPreset = (preset: EtaOption): Date | null => {
    const now = new Date();
    switch (preset) {
      case '30min':
        return new Date(now.getTime() + 30 * 60 * 1000);
      case '1hr':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '2hr':
        return new Date(now.getTime() + 2 * 60 * 60 * 1000);
      case 'few':
        return new Date(now.getTime() + 4 * 60 * 60 * 1000);
      case 'none':
        return null;
      case 'custom':
        if (customDate) {
          const [h, m] = customTime.split(':').map(Number);
          const d = new Date(customDate);
          d.setHours(h, m, 0, 0);
          return d;
        }
        return null;
      default:
        return null;
    }
  };

  const handleEnable = () => {
    let eta: Date | null = null;
    if (selectedPreset === 'custom' && customDate) {
      const [h, m] = customTime.split(':').map(Number);
      const d = new Date(customDate);
      d.setHours(h, m, 0, 0);
      eta = d;
    } else if (selectedPreset && selectedPreset !== 'none' && selectedPreset !== 'custom') {
      eta = getEtaFromPreset(selectedPreset);
    }
    onConfirm(eta, message.trim());
  };

  const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDay(currentMonth);
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return (
      <div className={styles.calendar}>
        <div className={styles.calendarHeader}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className={styles.monthTitle}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
        <div className={styles.dayHeaders}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className={styles.dayHeader}>{d}</div>
          ))}
        </div>
        <div className={styles.daysGrid}>
          {days.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} className={styles.dayCell} />;
            const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isSelected = customDate?.toDateString() === d.toDateString();
            const isToday = d.toDateString() === new Date().toDateString();
            const isPast = d < new Date() && !isToday;
            return (
              <button
                key={d.toISOString()}
                type="button"
                className={`${styles.dayCell} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''} ${isPast ? styles.past : ''}`}
                onClick={() => setCustomDate(d)}
                disabled={isPast}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const presets: { id: EtaOption; label: string }[] = [
    { id: '30min', label: '30 minutes' },
    { id: '1hr', label: '1 hour' },
    { id: '2hr', label: '2 hours' },
    { id: 'few', label: 'A few hours' },
    { id: 'none', label: 'No ETA' },
    { id: 'custom', label: 'Custom date & time' },
  ];

  const canEnable = selectedPreset === 'none' || selectedPreset === '30min' || selectedPreset === '1hr' || selectedPreset === '2hr' || selectedPreset === 'few' || (selectedPreset === 'custom' && customDate);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          ref={pickerRef}
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h3 className={styles.title}>Enable Maintenance Mode</h3>
            <button type="button" className={styles.closeBtn} onClick={onCancel}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Expected return time</h4>
              <div className={styles.presets}>
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.presetBtn} ${selectedPreset === p.id ? styles.presetActive : ''}`}
                    onClick={() => setSelectedPreset(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedPreset === 'custom' && (
              <div className={styles.customSection}>
                <h4 className={styles.sectionTitle}>Pick date & time</h4>
                <div className={styles.customRow}>
                  {renderCalendar()}
                  <div className={styles.timePicker}>
                    <label className={styles.timeLabel}>Time</label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className={styles.timeInput}
                    />
                    {customDate && (
                      <p className={styles.preview}>
                        {new Date(
                          customDate.getFullYear(),
                          customDate.getMonth(),
                          customDate.getDate(),
                          ...customTime.split(':').map(Number)
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Custom message (optional)</h4>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. We're upgrading our systems..."
                className={styles.messageInput}
                rows={3}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleEnable}
              disabled={!canEnable}
            >
              Enable Maintenance
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
