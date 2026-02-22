import { requireAuth } from '@/app/actions/auth';
import UsersPageClient from './UsersPageClient';

export default async function UsersPage() {
    await requireAuth();
    return <UsersPageClient />;
}
