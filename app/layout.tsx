import type { Metadata } from 'next';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'DesaMind - Platform Desa Cerdas',
  description: 'Platform AI terpadu untuk warga desa: laporkan masalah, temukan UMKM lokal, akses lowongan kerja, dan dapatkan bantuan dari asisten AI kami.',
  keywords: ['desa cerdas', 'smart village', 'laporan warga', 'UMKM', 'AI desa', 'gotong royong'],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col bg-bg font-sans" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AppShell>{children}</AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
