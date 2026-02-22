import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trendsignite - Influencer Marketing Platform",
  description: "Simplifying Influencer Marketing. Get noticed, get 20M+ followers reached.",
};

import AnalyticsProvider from '@/components/AnalyticsProvider';
import AdminMaintenanceBanner from '@/components/AdminMaintenanceBanner/AdminMaintenanceBanner';
import AnnouncementBanner from '@/components/AnnouncementBanner/AnnouncementBanner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=aspekta@700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AnalyticsProvider>
          <AnnouncementBanner />
          {children}
          <AdminMaintenanceBanner />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
