'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Store, LayoutDashboard, Package, PlusSquare, ShoppingBag,
  LogOut, Menu, X, Loader2, Clock, XCircle, Settings, ChevronDown, Home, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchJson } from '@/lib/api-client';


export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [store, setStore] = useState<any | null>(null);
  const [checkingStore, setCheckingStore] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div className="px-8 h-20 border-b border-gray-200 flex items-center shrink-0">
        <Link href="/umkm" className="flex items-center">
          <Image src="/logo.png" alt="DesaMind" width={260} height={76} className="h-16 w-auto object-contain" priority />
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto w-full overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = item.href === '/umkm/toko' ? pathname === '/umkm/toko' : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-4 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg',
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
      <aside className="hidden md:flex flex-col w-72 shrink-0 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div className={cn('fixed inset-0 z-50 md:hidden flex transition-opacity duration-300', mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
         <div className={cn('relative w-72 max-w-[86%] h-full flex flex-col shadow-2xl transition-transform duration-300 bg-white', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 z-50 rounded-lg hover:bg-gray-100/50">
               <X className="w-5 h-5" />
            </button>
            {SidebarContent}
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile & Desktop Header with Profile */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 md:px-8 h-20 shrink-0 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden">
              <Image src="/logo.png" alt="DesaMind" width={150} height={44} className="h-10 w-auto object-contain" />
            </div>
          </div>
          
          <div ref={profileRef} className="relative flex items-center gap-3 md:gap-4">
             <button
               type="button"
               onClick={() => setProfileOpen((open) => !open)}
               className="flex items-center gap-3 md:gap-4 rounded-2xl px-2 py-1.5 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
               aria-haspopup="menu"
               aria-expanded={profileOpen}
             >
               <span className="hidden sm:flex flex-col items-end">
                  <span className="text-sm md:text-[15px] font-bold text-gray-800 leading-tight">{user?.name || 'Demo User'}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600">Pemilik Toko</span>
               </span>
               <span className="w-10 h-10 rounded-full bg-primary-800 flex items-center justify-center text-white text-[12px] font-bold ring-2 ring-white shadow-sm">
                 {user?.avatar || 'DU'}
               </span>
               <ChevronDown className={cn('hidden sm:block w-4 h-4 text-gray-400 transition-transform duration-200', profileOpen ? 'rotate-180' : '')} />
             </button>

             {profileOpen && (
               <div className="absolute right-0 top-14 w-64 bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden z-50" role="menu">
                 <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-gray-50">
                   <div className="w-10 h-10 rounded-full bg-primary-800 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                     {user?.avatar || 'DU'}
                   </div>
                   <div className="min-w-0">
                     <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Demo User'}</p>
                     <p className="text-[11px] text-gray-500 truncate">{user?.email || store?.name || 'Pemilik Toko'}</p>
                   </div>
                 </div>

                 <div className="py-2">
                   <Link href="/akun/pengaturan" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" role="menuitem">
                     <User className="w-4 h-4 text-gray-400" />
                     Profil Akun
                   </Link>
                   <Link href="/umkm/toko/pengaturan" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" role="menuitem">
                     <Settings className="w-4 h-4 text-gray-400" />
                     Pengaturan Toko
                   </Link>
                   <Link href="/umkm/toko/pesanan" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" role="menuitem">
                     <ShoppingBag className="w-4 h-4 text-gray-400" />
                     Pesanan
                   </Link>
                   <Link href="/umkm" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" role="menuitem">
                     <Home className="w-4 h-4 text-gray-400" />
                     Lihat UMKM
                   </Link>
                 </div>

                 <div className="border-t border-gray-100 py-2">
                   <button
                     type="button"
                     onClick={async () => {
                       await logout();
                       setProfileOpen(false);
                       router.replace('/auth/login');
                     }}
                     className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                     role="menuitem"
                   >
                     <LogOut className="w-4 h-4" />
                     Keluar
                   </button>
                 </div>
               </div>
             )}
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
