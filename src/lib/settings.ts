import prisma from '@/lib/prisma';

async function getOrCreateSettings() {
  let settings = await prisma.siteSettings.findFirst();
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {},
    });
  }
  return settings;
}

export async function getSettings() {
  return getOrCreateSettings();
}

export async function updateSettings(data: {
  maintenanceEnabled?: boolean;
  maintenanceEta?: Date | null;
  maintenanceMessage?: string | null;
  contactEmail?: string | null;
  announcementEnabled?: boolean;
  announcementText?: string | null;
  contactFormDisabled?: boolean;
  faqsDisabled?: boolean;
  bulkArchiveDays?: number;
}) {
  const settings = await getOrCreateSettings();
  return prisma.siteSettings.update({
    where: { id: settings.id },
    data: {
      ...(data.maintenanceEnabled !== undefined && { maintenanceEnabled: data.maintenanceEnabled }),
      ...(data.maintenanceEta !== undefined && { maintenanceEta: data.maintenanceEta }),
      ...(data.maintenanceMessage !== undefined && { maintenanceMessage: data.maintenanceMessage }),
      ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
      ...(data.announcementEnabled !== undefined && { announcementEnabled: data.announcementEnabled }),
      ...(data.announcementText !== undefined && { announcementText: data.announcementText }),
      ...(data.contactFormDisabled !== undefined && { contactFormDisabled: data.contactFormDisabled }),
      ...(data.faqsDisabled !== undefined && { faqsDisabled: data.faqsDisabled }),
      ...(data.bulkArchiveDays !== undefined && { bulkArchiveDays: data.bulkArchiveDays }),
    },
  });
}

export async function getMaintenanceStatus() {
  const settings = await getOrCreateSettings();
  return {
    maintenance: settings.maintenanceEnabled,
    eta: settings.maintenanceEta,
    message: settings.maintenanceMessage,
  };
}

export async function clearIPCache() {
  const result = await prisma.iPCountryCache.deleteMany({});
  return { success: true, deleted: result.count };
}

export async function bulkArchiveClosedTickets(daysOld: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  const result = await prisma.ticket.updateMany({
    where: {
      status: 'closed',
      closedAt: { not: null, lt: cutoff },
    },
    data: { status: 'archived' },
  });
  return { success: true, archived: result.count };
}
