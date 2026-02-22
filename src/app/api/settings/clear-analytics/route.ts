import { NextResponse } from 'next/server';
import { checkSession } from '@/app/actions/auth';
import { clearAllAnalyticsData } from '@/lib/analyticsAggregation';

export async function POST() {
  const user = await checkSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await clearAllAnalyticsData();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, deleted: result.deleted });
  } catch (error) {
    console.error('Error clearing analytics:', error);
    return NextResponse.json({ error: 'Failed to clear analytics' }, { status: 500 });
  }
}
