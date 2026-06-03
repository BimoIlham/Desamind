'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Store, LayoutDashboard, Package, PlusSquare, ShoppingBag,
  LogOut, Menu, X, Loader2, Clock, XCircle, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchJson } from '@/lib/api-client';


export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [store, setStore] = useState<any | null>(null);
  const [checkingStore, setCheckingStore] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    if (loading) return;
    if (!isSignedIn) {
      setStore(null);
      setCheckingStore(false);
      return;
    }

    const loadStore = () => fetchJson('/api/stores?owner=me', [] as any[]).then((stores) => {
      if (!mounted) return;
      setStore(stores[0] ?? null);
      setCheckingStore(false);
    });

    setCheckingStore(true);
    loadStore();
    window.addEventListener('store-change', loadStore);

    return () => {
      mounted = false;
      window.removeEventListener('store-change', loadStore);
    };
  }, [isSignedIn, loading]);

  if (loading || checkingStore) {
    return (
      <div className="min-h-screen bg-gray-50 pt-14 lg:pt-16 pb-16 px-4 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary-700" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 pt-14 lg:pt-16 pb-16 px-4">
        <div className="max-w-md mx-auto text-center bg-white border border-gray-200 p-10 mt-10 shadow-sm">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-primary-900 mb-3">Login Diperlukan</h1>
          <p className="text-sm text-gray-500 mb-6">Silakan login untuk mengakses dashboard toko.</p>
          <Link href="/auth/login" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 pt-14 lg:pt-16 pb-16 px-4">
        <div className="max-w-md mx-auto text-center bg-white border border-gray-200 p-10 mt-10 shadow-sm">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-primary-900 mb-3">Belum Ada Toko</h1>
          <p className="text-sm text-gray-500 mb-6">Daftarkan toko terlebih dahulu. Dashboard akan aktif setelah admin memverifikasi pendaftaran Anda.</p>
          <Link href="/umkm/daftar" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors">
            Daftar Toko
          </Link>
        </div>
      </div>
    );
  }

  if (store.status !== 'active') {
    const isPending = store.status === 'pending';
    const StatusIcon = isPending ? Clock : XCircle;
    return (
      <div className="min-h-screen bg-gray-50 pt-14 lg:pt-16 pb-16 px-4">
        <div className="max-w-md mx-auto text-center bg-white border border-gray-200 p-10 mt-10 shadow-sm">
          <StatusIcon className={cn('w-12 h-12 mx-auto mb-4', isPending ? 'text-amber-500' : 'text-red-500')} />
          <h1 className="text-xl font-bold text-primary-900 mb-3">
            {isPending ? 'Toko Menunggu Verifikasi' : 'Toko Belum Aktif'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {isPending
              ? 'Pendaftaran toko Anda sudah masuk dan sedang menunggu persetujuan admin.'
              : 'Toko Anda belum aktif. Hubungi admin desa untuk informasi lebih lanjut.'}
          </p>
          <Link href="/umkm" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">
            Kembali ke UMKM
          </Link>
        </div>
      </div>
    );
  }

  // Active Store Dashboard Layout
  const navItems = [
    { label: 'Dashboard', href: '/umkm/toko', icon: LayoutDashboard },
    { label: 'Tambah Produk', href: '/umkm/toko/produk/tambah', icon: PlusSquare },
    { label: 'Kelola Produk', href: '/umkm/toko/produk', icon: Package },
    { label: 'Pesanan', href: '/umkm/toko/pesanan', icon: ShoppingBag },
    { label: 'Pengaturan', href: '/umkm/toko/pengaturan', icon: Settings },
  ];

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="px-6 py-6 border-b border-gray-200 flex flex-col gap-2 shrink-0">
        <Link href="/umkm">
          <Image src="/logo.png" alt="DesaMind" width={140} height={36} className="h-8 w-auto object-contain mb-2" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden border border-primary-200 bg-primary-50 text-primary-800">
            {store?.logo_url ? (
              <Image src={store.logo_url} alt={store.name} width={20} height={20} className="w-full h-full object-cover" unoptimized />
            ) : (
              <Store className="w-3 h-3" />
            )}
          </span>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">DASHBOARD TOKO</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/umkm/toko' ? pathname === '/umkm/toko' : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-4 px-4 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all',
                isActive
                  ? 'text-primary-950 bg-gray-50 border border-gray-200'
                  : 'text-gray-500 hover:text-primary-800 hover:bg-gray-50 border border-transparent'
              )}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary-800' : 'text-gray-400')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-6 border-t border-gray-100 space-y-2 bg-gray-50/30 shrink-0">
        <Link href="/akun/pengaturan" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] uppercase tracking-widest font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent transition-all">
          <Settings className="w-4 h-4 text-gray-400 shrink-0" />
          Pengaturan Akun
        </Link>
        <Link href="/umkm" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] uppercase tracking-widest font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
          <LogOut className="w-4 h-4 text-red-500 shrink-0" />
          Keluar Ke UMKM
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div className={cn('fixed inset-0 z-50 md:hidden flex transition-opacity duration-300', mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
         <div className={cn('relative w-64 max-w-[80%] h-full flex flex-col shadow-2xl transition-transform duration-300 bg-white', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 z-50 rounded-lg hover:bg-gray-100/50">
               <X className="w-5 h-5" />
            </button>
            {SidebarContent}
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile & Desktop Header with Profile */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 md:px-8 py-3 shrink-0 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden">
              <Image src="/logo.png" alt="DesaMind" width={110} height={28} className="h-6 w-auto object-contain" />
            </div>
            {/* Desktop breadcrumb/title */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-primary-50 rounded-full border border-primary-100">
              {store?.logo_url ? (
                <span className="relative w-4 h-4 rounded-full overflow-hidden bg-white border border-primary-100">
                  <Image src={store.logo_url} alt={store.name} fill className="object-cover" unoptimized />
                </span>
              ) : (
                <Store className="w-3 h-3 text-primary-600" />
              )}
              <span className="text-[10px] uppercase tracking-widest font-bold text-primary-700">{store?.name || 'Toko UMKM'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-gray-800">{user?.name || 'Demo User'}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600">Pemilik Toko</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-white shadow-sm">
               {user?.avatar || 'DU'}
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
