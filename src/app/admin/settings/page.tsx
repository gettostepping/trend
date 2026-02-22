import { requireAuth } from '@/app/actions/auth';
import SettingsPageClient from './SettingsPageClient';

export default async function SettingsPage() {
  await requireAuth();
  return <SettingsPageClient />;
}
