'use client';

import { useState, Suspense } from 'react';
import { setupPasswordAction } from '@/app/actions/auth';
import { useSearchParams } from 'next/navigation';
import styles from '../admin.module.css';

function SetupPasswordForm() {
    const [error, setError] = useState('');
    const searchParams = useSearchParams();

    const initialUsername = searchParams.get('username') || '';

    async function handleSubmit(formData: FormData) {
        const res = await setupPasswordAction(formData);
        if (res?.error) {
            setError(res.error);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <h1 className={styles.title}>
                    Welcome, <span className={styles.glitchText} data-text={initialUsername}>{initialUsername}</span>
                </h1>
                <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
                    Set up your password to continue.
                </p>

                <form action={handleSubmit} className={styles.form}>
                    <input type="hidden" name="username" value={initialUsername} />

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Authorization Code</label>
                        <input
                            type="text"
                            name="authCode"
                            required
                            placeholder="Enter your auth code"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>New Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            className={styles.input}
                            placeholder="Create a strong password"
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" className={styles.submitBtn}>
                        Set Password & Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function SetupPasswordPage() {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <div className={styles.loginCard}>
                    <h1 className={styles.title}>Loading...</h1>
                </div>
            </div>
        }>
            <SetupPasswordForm />
        </Suspense>
    );
}
