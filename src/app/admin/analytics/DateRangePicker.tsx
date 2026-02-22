'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faChevronLeft, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';
import styles from './dateRangePicker.module.css';

interface DateRangePickerProps {
    onDateRangeSelect: (startDate: Date, endDate: Date) => void;
    onClose: () => void;
    currentStartDate?: Date;
    currentEndDate?: Date;
}

export default function DateRangePicker({ 
    onDateRangeSelect, 
    onClose,
    currentStartDate,
    currentEndDate 
}: DateRangePickerProps) {
    const [startDate, setStartDate] = useState<Date | null>(currentStartDate || null);
    const [endDate, setEndDate] = useState<Date | null>(currentEndDate || null);
    const [currentMonth, setCurrentMonth] = useState(currentStartDate || new Date());
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentStartDate) {
            setStartDate(currentStartDate);
            setCurrentMonth(new Date(currentStartDate));
        }
        if (currentEndDate) {
            setEndDate(currentEndDate);
        }
    }, [currentStartDate, currentEndDate]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const isDateInRange = (date: Date) => {
        if (!startDate || !endDate) return false;
        const dateTime = date.getTime();
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();
        return dateTime >= startTime && dateTime <= endTime;
    };

    const isDateSelected = (date: Date) => {
        if (!startDate && !endDate) return false;
        const dateStr = date.toDateString();
        if (startDate && startDate.toDateString() === dateStr) return true;
        if (endDate && endDate.toDateString() === dateStr) return true;
        return false;
    };

    const isDateHovered = (date: Date) => {
        if (!hoverDate || !startDate || endDate) return false;
        const dateTime = date.getTime();
        const startTime = startDate.getTime();
        const hoverTime = hoverDate.getTime();
        return (dateTime >= startTime && dateTime <= hoverTime) || (dateTime >= hoverTime && dateTime <= startTime);
    };

    const handleDateClick = (date: Date) => {
        if (!startDate || (startDate && endDate)) {
            // Start new selection
            setStartDate(date);
            setEndDate(null);
            setIsSelecting(true);
        } else if (startDate && !endDate) {
            // Complete selection
            if (date < startDate) {
                setEndDate(startDate);
                setStartDate(date);
            } else {
                setEndDate(date);
            }
            setIsSelecting(false);
        }
    };

    const handleDateHover = (date: Date) => {
        if (isSelecting && startDate && !endDate) {
            setHoverDate(date);
        }
    };

    const handleQuickSelect = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        setStartDate(start);
        setEndDate(end);
        setIsSelecting(false);
    };

    const handleApply = () => {
        if (startDate && endDate) {
            onDateRangeSelect(startDate, endDate);
            onClose();
        }
    };

    const handleCancel = () => {
        onClose();
    };

    const renderCalendar = (monthDate: Date, offset: number = 0) => {
        const daysInMonth = getDaysInMonth(monthDate);
        const firstDay = getFirstDayOfMonth(monthDate);
        const days = [];
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
        }

        return (
            <div className={styles.calendar}>
                <div className={styles.calendarHeader}>
                    <button 
                        className={styles.navButton}
                        onClick={() => {
                            const newDate = new Date(monthDate);
                            newDate.setMonth(newDate.getMonth() - 1);
                            setCurrentMonth(newDate);
                        }}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <h3 className={styles.monthTitle}>
                        {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button 
                        className={styles.navButton}
                        onClick={() => {
                            const newDate = new Date(monthDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setCurrentMonth(newDate);
                        }}
                    >
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
                <div className={styles.dayHeaders}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className={styles.dayHeader}>{day}</div>
                    ))}
                </div>
                <div className={styles.daysGrid}>
                    {days.map((date, index) => {
                        if (!date) {
                            return <div key={`empty-${index}`} className={styles.dayCell} />;
                        }
                        
                        const isSelected = isDateSelected(date);
                        const inRange = isDateInRange(date) || (isSelecting && startDate && isDateHovered(date));
                        const isStart = startDate && date.toDateString() === startDate.toDateString();
                        const isEnd = endDate && date.toDateString() === endDate.toDateString();
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                            <div
                                key={date.toDateString()}
                                className={`${styles.dayCell} ${isSelected ? styles.selected : ''} ${inRange ? styles.inRange : ''} ${isStart ? styles.startDate : ''} ${isEnd ? styles.endDate : ''} ${isToday ? styles.today : ''}`}
                                onClick={() => handleDateClick(date)}
                                onMouseEnter={() => handleDateHover(date)}
                            >
                                {date.getDate()}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const formatDateRange = () => {
        if (startDate && endDate) {
            const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return { start, end, days };
        }
        return null;
    };

    const range = formatDateRange();

    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                className={styles.backdrop}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    ref={pickerRef}
                    className={styles.dateRangePicker}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                >
                <div className={styles.pickerHeader}>
                    <h3 className={styles.pickerTitle}>Select Date Range</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className={styles.pickerContent}>
                    <div className={styles.quickSelect}>
                        <h4 className={styles.quickSelectTitle}>QUICK SELECT</h4>
                        <div className={styles.quickSelectOptions}>
                            <button onClick={() => handleQuickSelect(0)}>Today</button>
                            <button onClick={() => handleQuickSelect(1)}>Yesterday</button>
                            <button onClick={() => handleQuickSelect(6)}>Last 7 days</button>
                            <button onClick={() => handleQuickSelect(13)}>Last 14 days</button>
                            <button onClick={() => handleQuickSelect(29)}>Last 30 days</button>
                            <button onClick={() => handleQuickSelect(89)}>Last 90 days</button>
                        </div>
                    </div>

                    <div className={styles.calendarSection}>
                        {range && (
                            <div className={styles.dateRangeDisplay}>
                                <div className={styles.datePill}>{range.start}</div>
                                <span className={styles.dateArrow}>→</span>
                                <div className={styles.datePill}>{range.end}</div>
                                <span className={styles.dateDuration}>{range.days} days</span>
                            </div>
                        )}

                        <div className={styles.calendarsContainer}>
                            {renderCalendar(currentMonth, 0)}
                            {renderCalendar(nextMonth, 1)}
                        </div>
                    </div>
                </div>

                <div className={styles.pickerFooter}>
                    <button className={styles.cancelButton} onClick={handleCancel}>
                        Cancel
                    </button>
                    <button 
                        className={styles.applyButton} 
                        onClick={handleApply}
                        disabled={!startDate || !endDate}
                    >
                        Apply
                    </button>
                </div>
            </motion.div>
        </motion.div>
        </AnimatePresence>,
        document.body
    );
}
