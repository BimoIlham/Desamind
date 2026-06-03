'use client';

/**
 * app/admin/layout.tsx
 * Admin sidebar layout — wraps all /admin pages.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  FileText,
  Store,
  MapPin,
  Settings,
  LogOut,
  Sparkles,
  Landmark,
  Briefcase,
  GraduationCap,
  Users,
  BookOpen,
  Menu,
  X,
  ChevronDown,
  Megaphone,
  Camera,
  PieChart,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin_layout');
  const tAdmin = useTranslations('admin_pages');
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMapSection = pathname.startsWith('/peta') || pathname.startsWith('/admin/pengaturan-peta');
  const isUmkmSection = pathname.startsWith('/admin/umkm');
  const [mapOpen, setMapOpen] = useState(isMapSection);
  const [umkmOpen, setUmkmOpen] = useState(isUmkmSection);

  const [groupsOpen, setGroupsOpen] = useState<Record<string, boolean>>({
    'utama': true,
    'info': true,
    'eco': true,
    'sosial': true,
  });
  const toggleGroup = (id: string) => setGroupsOpen(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Keep map group open when navigating within it
  useEffect(() => {
    if (isMapSection) setMapOpen(true);
    if (isUmkmSection) setUmkmOpen(true);
  }, [isMapSection, isUmkmSection]);

  const menuGroups = [
    {
      id: 'utama',
      title: tAdmin('group_utama'),
      items: [
        { href: '/admin', label: t('nav_dashboard'), icon: LayoutDashboard, exact: true },
        { href: '/admin/laporan', label: t('nav_laporan'), icon: FileText },
        { href: '/admin/warga', label: 'Kelola Warga', icon: Users },
        { href: '/admin/transparansi', label: t('nav_transparansi'), icon: Landmark },
      ],
    },
    {
      id: 'info',
      title: tAdmin('group_info'),
      items: [
        { href: '/admin/pengumuman', label: tAdmin('pengumuman_title'), icon: Megaphone },
        { href: '/admin/galeri', label: tAdmin('galeri_title'), icon: Camera },
        { href: '/admin/apbdesa', label: tAdmin('apbdesa_title'), icon: PieChart },
      ],
    },
    {
      id: 'eco',
      title: tAdmin('group_eco'),
      items: [
        { href: '/admin/lowongan', label: t('nav_lowongan'), icon: Briefcase },
        { href: '/admin/edukasi', label: t('nav_edukasi'), icon: GraduationCap },
      ],
      collapsible: {
        id: 'umkm',
        label: t('nav_umkm') || 'UMKM & Toko',
        icon: Store,
        isActive: isUmkmSection,
        isOpen: umkmOpen,
        toggle: () => setUmkmOpen(o => !o),
        subItems: [
          { href: '/admin/umkm', label: 'Produk UMKM', icon: Store },
          { href: '/admin/umkm/toko', label: 'Manajemen Toko', icon: Settings },
        ]
      }
    },
    {
      id: 'sosial',
      title: tAdmin('group_sosial'),
      items: [
        { href: '/admin/gotong-royong', label: t('nav_gotong_royong'), icon: Users },
        { href: '/admin/komunitas', label: t('nav_komunitas'), icon: BookOpen },
      ],
      collapsible: {
        id: 'map',
        label: t('nav_peta') || 'Pemetaan Desa',
        icon: MapPin,
        isActive: isMapSection,
        isOpen: mapOpen,
        toggle: () => setMapOpen(o => !o),
        subItems: [
          { href: '/peta', label: t('nav_peta'), icon: MapPin },
          { href: '/admin/pengaturan-peta', label: 'Pengaturan Peta', icon: Settings },
        ]
      }
    }
  ];

  // Redirect non-admins away once auth state is resolved.
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/auth/login');
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-3">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Memuat panel admin...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Akses Ditolak</h1>
        <p className="text-sm text-gray-500 max-w-sm">
          Halaman ini hanya untuk admin desa. Silakan masuk dengan akun admin.
        </p>
        <Link href="/auth/login" className="px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors">
          Masuk sebagai Admin
        </Link>
      </div>
    );
  }

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="px-6 py-6 border-b border-gray-200 flex flex-col gap-2 shrink-0">
        <Link href="/">
          <Image src="/logo.png" alt="DesaMind" width={140} height={36} className="h-8 w-auto object-contain mb-2" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 border border-primary-200 bg-primary-50 text-primary-800">
            <Sparkles className="w-3 h-3" />
          </span>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('admin_panel')}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto w-full overflow-x-hidden">
        {menuGroups.map((group, idx) => {
          const isOpen = groupsOpen[group.id];
          return (
            <div key={idx} className="space-y-1">
              <button 
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100/50 rounded-lg group/btn transition-colors mb-1"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover/btn:text-gray-600 transition-colors">{group.title}</span>
                <ChevronDown className={cn('w-3 h-3 text-gray-400 transition-transform duration-200', isOpen ? 'rotate-180' : '')} />
              </button>
              
              <div className={cn('space-y-1 overflow-hidden transition-all duration-300', isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0')}>
                {group.items.map((item) => {
                  const active = (item as any).exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-4 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg',
                        active
                          ? 'text-primary-950 bg-gray-50 border border-gray-200'
                          : 'text-gray-500 hover:text-primary-800 hover:bg-gray-50 border border-transparent'
                      )}
                    >
                      <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-primary-800' : 'text-gray-400')} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                
                {/* Collapsible if any */}
                {group.collapsible && (
                   <div className="pt-1">
                     <button
                       onClick={group.collapsible.toggle}
                       className={cn(
                         'w-full flex items-center gap-4 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg mb-1',
                         group.collapsible.isActive
                           ? 'text-primary-950 bg-gray-50 border border-gray-200'
                           : 'text-gray-500 hover:text-primary-800 hover:bg-gray-50 border border-transparent'
                       )}
                     >
                       <group.collapsible.icon className={cn('w-4 h-4 shrink-0', group.collapsible.isActive ? 'text-primary-800' : 'text-gray-400')} />
                       <span className="flex-1 text-left">{group.collapsible.label}</span>
                       <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', group.collapsible.isOpen ? 'rotate-180' : '')} />
                     </button>
           
                     <div className={cn('overflow-hidden transition-all duration-200 space-y-1', group.collapsible.isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0')}>
                       {group.collapsible.subItems.map((sub) => {
                         const exactActive = sub.href === '/admin/umkm' ? pathname === '/admin/umkm' : (sub.href === '/peta' ? pathname === '/peta' : pathname.startsWith(sub.href));
                         return (
                           <Link
                             key={sub.href}
                             href={sub.href}
                             className={cn(
                               'flex items-center gap-4 pl-12 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg',
                               exactActive
                                 ? 'text-primary-950 bg-primary-50/50 border-l-2 border-primary-600 rounded-l-none'
                                 : 'text-gray-400 hover:text-primary-800 hover:bg-gray-50 border-l-2 border-transparent rounded-l-none'
                             )}
                           >
                             <sub.icon className={cn('w-3.5 h-3.5 shrink-0', exactActive ? 'text-primary-800' : 'text-gray-400')} />
                             <span>{sub.label}</span>
                           </Link>
                         );
                       })}
                     </div>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-4 py-6 border-t border-gray-100 space-y-2 bg-gray-50/30 shrink-0">
        <Link href="/admin/pengaturan" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all border border-transparent">
          <Settings className="w-4.5 h-4.5 text-gray-400" />
          {t('settings')}
        </Link>
        <Link href="/akun/pengaturan" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all border border-transparent">
          <Settings className="w-4.5 h-4.5 text-gray-400" />
          Pengaturan Akun
        </Link>
        <button onClick={async () => { await logout(); router.replace('/auth/login'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
          <LogOut className="w-4.5 h-4.5 text-red-500" />
          {t('logout')}
        </button>
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
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 max-w-[80%] h-full flex flex-col shadow-2xl transition-transform animate-in slide-in-from-left">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 z-50 rounded-lg hover:bg-gray-100/50"
            >
              <X className="w-5 h-5" />
            </button>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main content */}
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
              <Sparkles className="w-3 h-3 text-primary-600" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-primary-700">Administrator</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-gray-800">{user?.name ?? 'Admin DesaMind'}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600">Administrator</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-white shadow-sm">{user?.avatar ?? 'AD'}</div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
