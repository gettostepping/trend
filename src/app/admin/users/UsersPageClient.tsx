'use client';

import CreateAdminForm from './CreateAdminForm';
import AdminList from './AdminList';
import styles from './users.module.css';

export default function UsersPageClient() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                <span className={styles.glitchText} data-text="Admin Users">Admin <span className={styles.gradientText} data-text="Users">Users</span></span>
            </h1>

            <div className={styles.content}>
                <CreateAdminForm />
                <AdminList />
            </div>
        </div>
    );
}
