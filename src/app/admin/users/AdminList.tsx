"use client";

import { useEffect, useState } from 'react';
import { getAdminsAction } from '@/app/actions/auth';
import { ContextMenu } from '@/components/ContextMenu/ContextMenu';
import { Pencil, Trash2, Eye, Shield, CheckCircle, Clock, LockKeyhole } from 'lucide-react';
import styles from '../dashboard/dashboard.module.css';

interface Admin {
    id: string;
    username: string;
    createdAt: Date;
    isActive: boolean;
    isSuperAdmin: boolean;
    passwordHash: string | null;
}

const MENU_ITEMS = [
    { id: 'disable', label: 'Disable', icon: LockKeyhole },
    { id: 'delete', label: 'Delete', icon: Trash2 },
];

export default function AdminList() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAdmins();
    }, []);

    async function loadAdmins() {
        setLoading(true);
        const result = await getAdminsAction();
        if (result.success && result.admins) {
            setAdmins(result.admins);
        }
        setLoading(false);
    }

    const handleMenuSelect = async (actionId: string | number, admin: Admin) => {
        if (actionId === 'delete') {
            const confirmed = window.confirm(
                `Are you sure you want to delete ${admin.username}?\n\nThis action cannot be undone.`
            );

            if (!confirmed) return;

            const { deleteAdminAction } = await import('@/app/actions/auth');
            const result = await deleteAdminAction(admin.id);

            if (result.success) {
                alert(`Successfully deleted ${admin.username}`);
                loadAdmins(); // Reload the list
            } else {
                alert(`Error: ${result.error}`);
            }
        } else if (actionId === 'disable') {
            const action = admin.isActive ? 'disable' : 'enable';
            const confirmed = window.confirm(
                `Are you sure you want to ${action} ${admin.username}?`
            );

            if (!confirmed) return;

            const { toggleAdminStatusAction } = await import('@/app/actions/auth');
            const result = await toggleAdminStatusAction(admin.id);

            if (result.success) {
                alert(`Successfully ${action}d ${admin.username}`);
                loadAdmins(); // Reload the list
            } else {
                alert(`Error: ${result.error}`);
            }
        }
    };

    if (loading) {
        return <div className={styles.formCard}>Loading admins...</div>;
    }

        return (
            <div className={styles.formCard} style={{ background: '#2a2a2a', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h2 className={styles.cardTitle}>Existing Admins</h2>
            {admins.length === 0 ? (
                <p style={{ color: '#aaa', fontStyle: 'italic' }}>No admins found</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {admins.map((admin) => (
                        <ContextMenu
                            key={admin.id}
                            id={`context-menu-${admin.id}`}
                            menuItems={[
                                { id: 'disable', label: admin.isActive ? 'Disable' : 'Enable', icon: LockKeyhole },
                                { id: 'delete', label: 'Delete', icon: Trash2 },
                            ]}
                            onSelect={(item) => handleMenuSelect(item.id, admin)}
                        >
                            <div style={{
                                padding: '18px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(26, 115, 232, 0.3)';
                                        e.currentTarget.style.borderColor = '#1A73E8';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    }}>
                                {/* Gradient accent line */}
                                <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: '4px',
                                    background: admin.isActive
                                        ? 'linear-gradient(180deg, #1A73E8 0%, #93C5FD 100%)'
                                        : 'linear-gradient(180deg, #9ca3af 0%, #d1d5db 100%)',
                                    borderRadius: '12px 0 0 12px',
                                }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {/* Icon badge */}
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: admin.isSuperAdmin
                                                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                                                : 'linear-gradient(135deg, #1A73E8 0%, #93C5FD 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: admin.isSuperAdmin
                                                ? '0 4px 12px rgba(251, 191, 36, 0.3)'
                                                : '0 4px 12px rgba(26, 115, 232, 0.25)',
                                        }}>
                                            <Shield size={20} color="#aaa" strokeWidth={2.5} />
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'white' }}>
                                                    {admin.username}
                                                </span>
                                                {admin.isSuperAdmin && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        color: '#d97706',
                                                        backgroundColor: '#fef3c7',
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        fontWeight: '700',
                                                        letterSpacing: '0.5px',
                                                        textTransform: 'uppercase',
                                                    }}>
                                                        Super
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} color="#aaa" />
                                                Joined {new Date(admin.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {/* Status badges */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                backgroundColor: admin.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                                border: `1px solid ${admin.isActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
                                            }}>
                                                <div style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    backgroundColor: admin.isActive ? '#10b981' : '#9ca3af',
                                                    boxShadow: admin.isActive ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none',
                                                }} />
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: admin.isActive ? '#10b981' : '#aaa',
                                                    fontWeight: '600',
                                                }}>
                                                    {admin.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                    backgroundColor: admin.passwordHash ? 'rgba(26, 115, 232, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                                                    border: `1px solid ${admin.passwordHash ? 'rgba(26, 115, 232, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`,
                                            }}>
                                                <CheckCircle size={12} color={admin.passwordHash ? '#1A73E8' : '#f59e0b'} />
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: admin.passwordHash ? '#93C5FD' : '#fbbf24',
                                                    fontWeight: '600',
                                                }}>
                                                    {admin.passwordHash ? 'Verified' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ContextMenu>
                    ))}
                </div>
            )}
        </div>
    );
}
