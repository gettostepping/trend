'use client';

import { useState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminLoginPage() {
    const [error, setError] = useState('');
    const [needSetup, setNeedSetup] = useState(false);
    const [username, setUsername] = useState('');
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setError('');
        const res = await loginAction(formData);

        if (res?.error) {
            setError(res.error);
            if (res.needSetup && res.username) {
                setNeedSetup(true);
                setUsername(res.username);
                router.push(`/admin/setup?username=${res.username}`);
            }
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <h1 className={styles.title}>
                    Admin <span className={styles.gradientText}>Login</span>
                </h1>

                <form action={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Username</label>
                        <input
                            type="text"
                            name="username"
                            required
                            className={styles.input}
                            placeholder="Enter your username"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            name="password"
                            className={styles.input}
                            placeholder="Leave empty for first-time setup"
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" className={styles.submitBtn}>
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
