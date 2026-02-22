'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './gmail.module.css';

function GmailSetupContent() {
    const searchParams = useSearchParams();
    const [refreshToken, setRefreshToken] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const token = searchParams.get('refresh_token');
        const errorParam = searchParams.get('error');
        
        if (token) {
            setRefreshToken(token);
        }
        
        if (errorParam) {
            setError(decodeURIComponent(errorParam));
        }
    }, [searchParams]);

    const handleStartAuth = async () => {
        try {
            const response = await fetch('/api/auth/google/auth-url');
            const data = await response.json();
            window.location.href = data.authUrl;
        } catch (error) {
            setError('Failed to get authorization URL');
        }
    };

    const handleCopyToken = () => {
        navigator.clipboard.writeText(refreshToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Gmail API Setup</h1>
                <p className={styles.description}>
                    Complete the OAuth flow to enable Gmail API for sending contact form emails.
                </p>

                {error && (
                    <div className={styles.errorBox}>
                        <strong>Error:</strong> {error}
                        {error === 'no_refresh_token' && (
                            <p className={styles.errorHint}>
                                Make sure to grant all permissions when authorizing.
                            </p>
                        )}
                    </div>
                )}

                {!refreshToken ? (
                    <div className={styles.stepContainer}>
                        <h2 className={styles.stepTitle}>Step 1: Authorize Access</h2>
                        <p className={styles.stepDescription}>
                            Click the button below to authorize the application to send emails on your behalf.
                            You'll be redirected to Google to sign in and grant permissions.
                        </p>
                        <button onClick={handleStartAuth} className={styles.authButton}>
                            Authorize with Google
                        </button>
                    </div>
                ) : (
                    <div className={styles.stepContainer}>
                        <h2 className={styles.stepTitle}>Step 2: Add Refresh Token to Environment</h2>
                        <p className={styles.stepDescription}>
                            Copy the refresh token below and add it to your <code>.env.local</code> file:
                        </p>
                        <div className={styles.tokenBox}>
                            <code className={styles.token}>
                                GMAIL_REFRESH_TOKEN={refreshToken}
                            </code>
                            <button 
                                onClick={handleCopyToken}
                                className={styles.copyButton}
                            >
                                {copied ? '✓ Copied!' : 'Copy'}
                            </button>
                        </div>
                        <div className={styles.envExample}>
                            <p><strong>Your .env.local should include:</strong></p>
                            <pre>
{`GMAIL_CLIENT_ID=1012781705604-p8t6ucvv8sgrnvt1eh0g4jcnl9aik7v9.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=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
GMAIL_REFRESH_TOKEN=${refreshToken}
GMAIL_USER=your-email@trendsignite.com`}
                            </pre>
                        </div>
                        <div className={styles.successBox}>
                            <p>✓ Refresh token obtained successfully!</p>
                            <p className={styles.note}>
                                After adding the token to your .env.local file, restart your dev server
                                and test the contact form.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function GmailSetupPage() {
    return (
        <Suspense fallback={<div className={styles.container}>Loading...</div>}>
            <GmailSetupContent />
        </Suspense>
    );
}
