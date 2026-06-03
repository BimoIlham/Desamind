'use client';
/**
 * components/layout/Navbar.tsx
 * Modern sticky navbar — custom auth (no Clerk).
 */
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  MapPin, LayoutDashboard, MessageSquare, Bot, ShoppingBag,
  GraduationCap, Users, ShieldCheck,
  TrendingUp, Map, Briefcase, Activity, Plus, Menu, X, ChevronDown,
  LogIn, Instagram, Linkedin, Zap, Landmark, Newspaper, ShoppingCart,
  Store, LogOut, User, ChevronRight, Megaphone, Camera, PieChart, Settings
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { setLocaleCookie } from '@/app/actions/locale';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useCart } from '@/components/marketplace/CartContext';
import { useAuth } from '@/hooks/useAuth';

// ── Nav structure ──────────────────────────────────────────────
type NavItem = {
  label: string;
  href?: string;
  groups?: {
    titleKey?: string;
    items: { href: string; icon: any; label: string; desc: string }[];
  }[];
  children?: { href: string; icon: any; label: string; desc: string }[];
};

const NAV_ITEMS: NavItem[] = [
  { label: 'home', href: '/' },
  { label: 'report', href: '/laporan' },
  { label: 'map', href: '/peta' },
  { label: 'marketplace', href: '/umkm' },
  {
    label: 'services',
    groups: [
      {
        titleKey: 'Layanan Pintar',
        items: [
          { href: '/gotong-royong', icon: Users, label: 'gotong_royong', desc: 'gotong_royong_desc' },
          { href: '/asisten', icon: Bot, label: 'assistant', desc: 'assistant_desc' },
        ]
      },
      {
        titleKey: 'Analisis & Skor',
        items: [
          { href: '/skor-desa', icon: Activity, label: 'score', desc: 'score_desc' },
          { href: '/prediksi', icon: Zap, label: 'predictions', desc: 'predictions_desc' },
        ]
      }
    ],
  },
  {
    label: 'info',
    groups: [
      {
        titleKey: 'Informasi Publik',
        items: [
          { href: '/pengumuman', icon: Megaphone, label: 'pengumuman', desc: 'pengumuman_desc' },
          { href: '/galeri', icon: Camera, label: 'galeri', desc: 'galeri_desc' },
          { href: '/komunitas', icon: Newspaper, label: 'community', desc: 'community_desc' },
        ]
      },
      {
        titleKey: 'Transparansi',
        items: [
          { href: '/transparansi', icon: Landmark, label: 'transparency', desc: 'transparency_desc' },
          { href: '/apbdesa', icon: PieChart, label: 'apbdesa', desc: 'apbdesa_desc' },
        ]
      },
      {
        titleKey: 'Pengembangan',
        items: [
          { href: '/lowongan', icon: Briefcase, label: 'jobs', desc: 'jobs_desc' },
          { href: '/edukasi', icon: GraduationCap, label: 'education', desc: 'education_desc' },
        ]
      }
    ],
  },
];

// ── Language Switcher ──────────────────────────────────────────
function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const handleSwitch = async (newLocale: string) => {
    if (newLocale === locale) return;
    await setLocaleCookie(newLocale);
    router.refresh();
  };
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-2 border border-gray-200">
      <button onClick={() => handleSwitch('id')} className={cn('px-2 py-1 text-[9px] font-bold tracking-widest uppercase rounded-md transition-all', locale === 'id' ? 'bg-white shadow-sm text-primary-900 border border-gray-100' : 'text-gray-400 hover:text-gray-600')}>ID</button>
      <button onClick={() => handleSwitch('en')} className={cn('px-2 py-1 text-[9px] font-bold tracking-widest uppercase rounded-md transition-all', locale === 'en' ? 'bg-white shadow-sm text-primary-900 border border-gray-100' : 'text-gray-400 hover:text-gray-600')}>EN</button>
    </div>
  );
}

// ── Custom Profile Button (replaces Clerk UserButton) ─────────
function ProfileButton() {
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 group"
        title={user.name}
      >
        <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-white group-hover:ring-primary-200 transition-all shadow-sm">
          {initials}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden z-50">
          {/* User info header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="w-9 h-9 rounded-full bg-primary-800 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {isAdmin && (
              <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
                <LayoutDashboard className="w-4 h-4 text-primary-600" />
                <span>Dashboard Admin</span>
              </Link>
            )}
            <Link href="/umkm/toko" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
              <Store className="w-4 h-4 text-gray-400" />
              <span>Toko Saya</span>
            </Link>
            <Link href="/umkm/pesanan" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
              <ShoppingBag className="w-4 h-4 text-gray-400" />
              <span>Pesanan Saya</span>
            </Link>
            <Link href="/akun/pengaturan" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
              <Settings className="w-4 h-4 text-gray-400" />
              <span>Pengaturan Akun</span>
            </Link>
            <Link href="/laporan" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span>Laporan Saya</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={async () => { await logout(); setOpen(false); router.push('/'); router.refresh(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dropdown & Link component ──────────────────────────────────
function NavItemComponent({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const t = useTranslations('navbar');

  const getNavStyle = (active: boolean) => cn(
    'group/nav relative flex items-center gap-1.5 h-full text-[11px] font-bold tracking-widest uppercase transition-colors duration-300 cursor-pointer',
    active ? 'text-primary-900' : 'text-gray-500 hover:text-primary-900'
  );
  const getUnderlineStyle = (active: boolean) => cn(
    'absolute bottom-6 left-0 h-[2px] bg-primary-900 transition-all duration-300 ease-out',
    active ? 'w-full' : 'w-0 group-hover/nav:w-full'
  );

  if (item.href) {
    const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
    return (
      <Link href={item.href} className={getNavStyle(isActive)}>
        {t(item.label as any)}
        <div className={getUnderlineStyle(isActive)} />
      </Link>
    );
  }

  const hasDropdown = item.children || item.groups;
  const isActive = hasDropdown ? (
    (item.children?.some((c) => pathname.startsWith(c.href)) ?? false) ||
    (item.groups?.some(g => g.items.some(c => pathname.startsWith(c.href))) ?? false)
  ) : false;

  return (
    <div className="group/nav h-full flex items-center cursor-pointer">
      <div className={getNavStyle(isActive)}>
        {t(item.label as any)}
        <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover/nav:rotate-180" />
        <div className={getUnderlineStyle(isActive)} />
      </div>

      {hasDropdown && (
        <div className="absolute top-full left-0 right-0 pt-0 opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-300 z-50">
          <div className="bg-white shadow-md border-t border-b border-gray-100 py-6 px-12 relative overflow-hidden flex justify-center w-full">
            <div className="flex gap-8 w-full max-w-[1400px]">
              {item.groups ? (
                // MEGA MENU
                item.groups.map((group, gIdx) => (
                  <div key={gIdx} className={cn("w-64 relative z-10 flex flex-col", gIdx > 0 && "pl-8 border-l border-gray-100")}>
                    {group.titleKey && (
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-50 flex flex-col">
                        {group.titleKey}
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      {group.items.map((child) => (
                         <Link key={child.href} href={child.href} className="group/link block py-2.5 px-3 -mx-3 rounded hover:bg-gray-50 transition-colors">
                            <p className="text-[13px] font-bold text-gray-800 mb-1 group-hover/link:text-primary-700 transition-colors">
                              {t(child.label as any)}
                            </p>
                            <p className="text-[11px] text-gray-500 leading-tight">{t(child.desc as any)}</p>
                         </Link>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // STANDARD DROPDOWN
                <div className="w-64 relative z-10 flex flex-col gap-2">
                  {item.children?.map((child) => (
                     <Link key={child.href} href={child.href} className="group/link block py-2.5 px-3 -mx-3 rounded hover:bg-gray-50 transition-colors">
                        <p className="text-[13px] font-bold text-gray-800 mb-1 group-hover/link:text-primary-700 transition-colors">
                          {t(child.label as any)}
                        </p>
                        <p className="text-[11px] text-gray-500 leading-tight">{t(child.desc as any)}</p>
                     </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Navbar ────────────────────────────────────────────────
export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpenGroup, setMobileOpenGroup] = useState<string | null>(null);
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const t = useTranslations('navbar');
  const { count } = useCart();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (pathname.startsWith('/admin') || pathname.startsWith('/umkm/toko')) {
    return null;
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-white border-b',
          scrolled ? 'shadow-md border-gray-200' : 'border-gray-100'
        )}
      >
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center shrink-0 w-[260px]">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="DesaMind Logo" width={260} height={72} className="h-14 sm:h-16 w-auto object-contain" priority />
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center justify-center gap-8 flex-1 h-full">
            {NAV_ITEMS.map((item) => <NavItemComponent key={item.label} item={item} />)}
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center justify-end gap-5 w-[320px]">
            <LanguageSwitcher />

            <Link href="/laporan/baru" className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-primary-900 hover:text-primary-600 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              <span>{t('create_report')}</span>
            </Link>

            <div className="w-px h-3 bg-gray-300 hidden xl:block" />

            {/* Cart icon */}
            <Link href="/umkm/checkout" className="relative flex items-center text-gray-500 hover:text-primary-900 transition-colors" title="Keranjang">
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">{count}</span>
              )}
            </Link>

            <div className="w-px h-3 bg-gray-300 hidden xl:block" />

            {/* Auth: show profile button if logged in, else login link */}
            {isSignedIn ? (
              <ProfileButton />
            ) : (
              <Link href="/auth/login">
                <button className="text-[11px] font-bold tracking-widest uppercase text-gray-400 hover:text-primary-900 transition-colors">
                  {t('login')}
                </button>
              </Link>
            )}
          </div>

          {/* Mobile actions */}
          <div className="lg:hidden flex items-center gap-3 ml-auto">
            {isSignedIn && <ProfileButton />}
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 transition" aria-label="Toggle menu">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={cn('fixed inset-0 z-50 w-full bg-white lg:hidden flex flex-col transition-transform duration-300 ease-in-out', mobileOpen ? 'translate-x-0' : 'translate-x-full')}>
        <div className="flex items-center justify-between px-6 h-20 border-b border-gray-100">
          <Image src="/logo.png" alt="DesaMind" width={180} height={48} className="h-11 w-auto object-contain" />
          <div className="flex items-center justify-end gap-4">
            <LanguageSwitcher />
            <button onClick={() => setMobileOpen(false)} className="text-gray-800 hover:text-red-600 transition-colors">
              <X className="w-7 h-7" strokeWidth={1} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-8 px-6 pb-12 lg:pb-14 flex flex-col">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((group) => (
              <div key={group.label} className="border-b border-gray-100 pb-2 mb-2">
                {group.href ? (
                  <Link href={group.href} onClick={() => setMobileOpen(false)} className="flex items-center py-4 text-[13px] font-bold tracking-widest uppercase text-gray-800 hover:text-primary-700 transition-colors">
                    {t(group.label as any)}
                  </Link>
                ) : (
                  <>
                    <button onClick={() => setMobileOpenGroup(mobileOpenGroup === group.label ? null : group.label)} className="w-full flex items-center justify-between py-4 text-[13px] font-bold tracking-widest uppercase text-gray-800 hover:text-primary-700 transition-colors">
                      <span>{t(group.label as any)}</span>
                      {mobileOpenGroup === group.label ? <X className="w-4 h-4 text-gray-500" strokeWidth={1.5} /> : <Plus className="w-4 h-4 text-gray-500" strokeWidth={1.5} />}
                    </button>
                    {mobileOpenGroup === group.label && (group.groups || group.children) && (
                      <div className="flex flex-col gap-4 pt-2 pb-6 pl-4 border-l-2 border-gray-100 ml-2">
                        {group.groups?.map((subGroup, subGroupIndex) => (
                          <div key={subGroup.titleKey || `${group.label}-${subGroupIndex}`} className="flex flex-col gap-2 mb-2">
                            {subGroup.titleKey && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subGroup.titleKey}</span>}
                            <div className="flex flex-col gap-4 pl-2">
                               {subGroup.items.map(child => (
                                 <Link key={child.href} href={child.href} onClick={() => setMobileOpen(false)} className="text-[13px] text-gray-600 hover:text-primary-700 font-medium tracking-wide flex items-center gap-2">
                                   <child.icon className="w-4 h-4 text-gray-400" />
                                   {t(child.label as any)}
                                 </Link>
                               ))}
                            </div>
                          </div>
                        ))}
                        {group.children?.map(child => (
                          <Link key={child.href} href={child.href} onClick={() => setMobileOpen(false)} className="text-[13px] text-gray-600 hover:text-primary-700 font-medium tracking-wide flex items-center gap-2">
                            {child.icon && <child.icon className="w-4 h-4 text-gray-400" />}
                            {t(child.label as any)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            <div className="border-b border-gray-100 pb-2 mb-2">
              <Link href="/laporan/baru" onClick={() => setMobileOpen(false)} className="flex items-center py-4 text-[13px] font-bold tracking-widest uppercase text-gray-800 hover:text-primary-700 transition-colors">
                {t('create_report')}
              </Link>
            </div>

            {!isSignedIn && (
              <div className="border-b border-gray-100 pb-2 mb-2">
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex items-center py-4 text-[13px] font-bold tracking-widest uppercase text-gray-800 hover:text-primary-700 transition-colors">
                  {t('login')}
                </Link>
              </div>
            )}
          </div>

          <div className="mt-auto pt-10 flex flex-col gap-4">
            <Image src="/logo.png" alt="DesaMind" width={100} height={24} className="h-6 w-auto object-contain opacity-50 grayscale" />
            <div className="flex items-center gap-5 text-gray-400">
              <Instagram className="w-5 h-5 hover:text-primary-600 transition-colors" strokeWidth={1.5} />
              <Linkedin className="w-5 h-5 hover:text-primary-600 transition-colors" strokeWidth={1.5} />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-2">© 2026 DesaMind</p>
          </div>
        </div>
      </div>

      <div className="h-20" />
    </>
  );
}
