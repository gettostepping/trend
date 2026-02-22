import { NextResponse } from 'next/server';
import { checkSession } from '@/app/actions/auth';
import { clearIPCache } from '@/lib/settings';

export async function POST() {
  const user = await checkSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await clearIPCache();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
