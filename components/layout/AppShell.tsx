'use client';

import { usePathname } from 'next/navigation';
import { CartProvider } from '@/components/marketplace/CartContext';
import { Navbar } from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { SOSButton } from '@/components/ui/SOSButton';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth') || pathname === '/sso-callback';

  return (
    <CartProvider>
      {!isAuthPage && <Navbar />}
      <main className="flex-1">{children}</main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <SOSButton />}
    </CartProvider>
  );
}
