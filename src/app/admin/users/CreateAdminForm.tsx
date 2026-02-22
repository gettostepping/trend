'use client';

import { createAdminAction } from '@/app/actions/auth';
import { useState } from 'react';
import styles from '../dashboard/dashboard.module.css';

export default function CreateAdminForm() {
    const [result, setResult] = useState<{ success?: boolean; error?: string; authCode?: string; username?: string } | null>(null);

    async function handleSubmit(formData: FormData) {
        const res = await createAdminAction(formData);
        setResult(res);
    }

    return (
        <div className={styles.formCard} style={{ background: '#2a2a2a', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h2 className={styles.cardTitle}>Add New Admin</h2>
            <form action={handleSubmit}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Username</label>
                    <input
                        type="text"
                        name="username"
                        required
                        placeholder="Enter new admin username"
                        className={styles.input}
                    />
                </div>
                <button type="submit" className={styles.submitBtn}>
                    Create Auth Code
                </button>
            </form>

            {result?.error && (
                <div className={styles.errorBox}>
                    {result.error}
                </div>
            )}

            {result?.success && (
                <div className={styles.successBox}>
                    <p><strong>Admin Created Successfully!</strong></p>
                    <p>Username: <strong>{result.username}</strong></p>
                    <p>Auth Code: <span className={styles.authCode}>{result.authCode}</span></p>
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#aaa' }}>
                        Give this code to the new admin to set up their password.
                    </p>
                </div>
            )}
        </div>
    );
}
