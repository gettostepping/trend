import { NextRequest, NextResponse } from 'next/server';
import { checkSession } from '@/app/actions/auth';
import { getSettings, updateSettings } from '@/lib/settings';

export async function GET() {
  const user = await checkSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const settings = await getSettings();
    return NextResponse.json({
      maintenanceEnabled: settings.maintenanceEnabled,
      maintenanceEta: settings.maintenanceEta?.toISOString() ?? null,
      maintenanceMessage: settings.maintenanceMessage,
      contactEmail: settings.contactEmail,
      announcementEnabled: settings.announcementEnabled,
      announcementText: settings.announcementText,
      contactFormDisabled: settings.contactFormDisabled,
      faqsDisabled: settings.faqsDisabled,
      bulkArchiveDays: settings.bulkArchiveDays,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await checkSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const settings = await updateSettings({
      ...(body.maintenanceEnabled !== undefined && { maintenanceEnabled: body.maintenanceEnabled }),
      ...(body.maintenanceEta !== undefined && {
        maintenanceEta: body.maintenanceEta ? new Date(body.maintenanceEta) : null,
      }),
      ...(body.maintenanceMessage !== undefined && { maintenanceMessage: body.maintenanceMessage }),
      ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
      ...(body.announcementEnabled !== undefined && { announcementEnabled: body.announcementEnabled }),
      ...(body.announcementText !== undefined && { announcementText: body.announcementText }),
      ...(body.contactFormDisabled !== undefined && { contactFormDisabled: body.contactFormDisabled }),
      ...(body.faqsDisabled !== undefined && { faqsDisabled: body.faqsDisabled }),
      ...(body.bulkArchiveDays !== undefined && { bulkArchiveDays: body.bulkArchiveDays }),
    });
    return NextResponse.json({
      maintenanceEnabled: settings.maintenanceEnabled,
      maintenanceEta: settings.maintenanceEta?.toISOString() ?? null,
      maintenanceMessage: settings.maintenanceMessage,
      contactEmail: settings.contactEmail,
      announcementEnabled: settings.announcementEnabled,
      announcementText: settings.announcementText,
      contactFormDisabled: settings.contactFormDisabled,
      faqsDisabled: settings.faqsDisabled,
      bulkArchiveDays: settings.bulkArchiveDays,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
