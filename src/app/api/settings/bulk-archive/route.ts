import { NextRequest, NextResponse } from 'next/server';
import { checkSession } from '@/app/actions/auth';
import { getSettings, bulkArchiveClosedTickets } from '@/lib/settings';

export async function POST(request: NextRequest) {
  const user = await checkSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const settings = await getSettings();
    const body = await request.json().catch(() => ({}));
    const daysOld = body.daysOld ?? settings.bulkArchiveDays;
    const result = await bulkArchiveClosedTickets(daysOld);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error bulk archiving:', error);
    return NextResponse.json({ error: 'Failed to bulk archive' }, { status: 500 });
  }
}
