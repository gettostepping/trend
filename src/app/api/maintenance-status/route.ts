import { NextResponse } from 'next/server';
import { getMaintenanceStatus } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getMaintenanceStatus();
    const response = NextResponse.json(status);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return NextResponse.json({ maintenance: false, eta: null, message: null });
  }
}
