'use client';

import styles from './analytics.module.css';

interface CustomChartTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    dateFormat?: 'date' | 'hour' | 'none';
    valueKey?: string;
    valueLabel?: string;
}

export default function CustomChartTooltip({ 
    active, 
    payload, 
    label,
    dateFormat = 'date',
    valueKey = 'views',
    valueLabel = 'views'
}: CustomChartTooltipProps) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const value = data[valueKey] || payload[0].value;
        
        // Format date if needed
        let displayDate = label;
        if (dateFormat === 'date') {
            if (data.fullDate) {
                const date = new Date(data.fullDate);
                displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else if (data.date) {
                // Try to parse if it's already formatted or a date string
                const date = new Date(data.date);
                if (!isNaN(date.getTime())) {
                    displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } else {
                    displayDate = data.date; // Use as-is if already formatted
                }
            } else if (label) {
                displayDate = label;
            }
        } else if (dateFormat === 'hour') {
            if (data.hourLabel) {
                displayDate = data.hourLabel;
            } else if (data.hour !== undefined) {
                displayDate = `${data.hour}:00`;
            } else if (label) {
                displayDate = label;
            }
        } else if (dateFormat === 'none') {
            displayDate = undefined;
        }
        
        return (
            <div className={styles.customChartTooltip}>
                {displayDate && dateFormat !== 'none' && (
                    <div className={styles.tooltipDate}>{displayDate}</div>
                )}
                <div className={styles.tooltipValue}>
                    {valueLabel} : <span className={styles.tooltipNumber}>{value.toLocaleString()}</span>
                </div>
            </div>
        );
    }
    
    return null;
}
