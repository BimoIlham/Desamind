import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { SOSButton } from '@/components/ui/SOSButton';
import { CartProvider } from '@/components/marketplace/CartContext';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'DesaMind — Platform Desa Cerdas',
  description: 'Platform AI terpadu untuk warga desa: laporkan masalah, temukan UMKM lokal, akses lowongan kerja, dan dapatkan bantuan dari asisten AI kami.',
  keywords: ['desa cerdas', 'smart village', 'laporan warga', 'UMKM', 'AI desa', 'gotong royong'],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="flex flex-col min-h-screen bg-bg font-sans" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            {/* Global floating SOS emergency button — visible on all pages */}
            <SOSButton />
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
