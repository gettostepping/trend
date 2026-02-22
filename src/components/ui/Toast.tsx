'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import styles from './Toast.module.css';

export interface Toast {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
}

interface ToastProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, toast.duration || 3000);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onRemove]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return faCheck;
            case 'error':
                return faTimes;
            default:
                return faCheck;
        }
    };

    const getTypeClass = () => {
        switch (toast.type) {
            case 'success':
                return styles.success;
            case 'error':
                return styles.error;
            default:
                return styles.info;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`${styles.toast} ${getTypeClass()}`}
        >
            <div className={styles.toastContent}>
                <FontAwesomeIcon icon={getIcon()} className={styles.toastIcon} />
                <span className={styles.toastMessage}>{toast.message}</span>
            </div>
        </motion.div>
    );
}

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <div className={styles.toastContainer}>
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
                ))}
            </AnimatePresence>
        </div>
    );
}
