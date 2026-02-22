import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSettings();
    const response = NextResponse.json({
      contactFormDisabled: settings.contactFormDisabled,
      faqsDisabled: settings.faqsDisabled,
      announcementEnabled: settings.announcementEnabled,
      announcementText: settings.announcementText,
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json({
      contactFormDisabled: false,
      faqsDisabled: false,
      announcementEnabled: false,
      announcementText: null,
    });
  }
}
