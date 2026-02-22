'use client';

import { useState, useCallback } from 'react';
import ToastContainer, { Toast } from '@/components/ui/Toast';

let toastIdCounter = 0;

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', duration?: number) => {
        const id = `toast-${++toastIdCounter}`;
        const newToast: Toast = {
            id,
            message,
            type,
            duration: duration || 3000,
        };

        setToasts((prev) => [...prev, newToast]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const ToastComponent = () => (
        <ToastContainer toasts={toasts} onRemove={removeToast} />
    );

    return { showToast, ToastComponent };
}
