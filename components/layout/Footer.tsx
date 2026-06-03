'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  MapPin, Phone, Mail, Facebook, Twitter, Instagram,
  Youtube, ArrowRight, Heart
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const pathname = usePathname();
  const t = useTranslations('navbar');

  if (pathname.startsWith('/admin') || pathname.startsWith('/umkm/toko')) {
    return null;
  }

  return (
    <footer className="bg-[#0A100D] text-gray-300 mt-auto pt-14 lg:pt-16 pb-10 border-t border-gray-800/50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 mb-10">
          
          {/* Brand & Visi */}
          <div className="lg:col-span-4 flex flex-col items-start pr-0 lg:pr-12">
            <Link href="/" className="inline-block mb-6">
              <Image 
                src="/Logo-putih.webp" 
                alt="DesaMind Logo" 
                width={150} 
                height={40} 
                className="h-9 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="text-[13px] leading-relaxed text-gray-400 mb-8 font-light">
              Platform desa cerdas terintegrasi untuk mendorong kemajuan sosial, transparansi, dan ekonomi lokal melalui teknologi berkelanjutan.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white hover:border-primary-500 transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white hover:border-primary-500 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white hover:border-primary-500 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white hover:border-primary-500 transition-all">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links 1 */}
          <div className="lg:col-span-2 lg:col-start-6 flex flex-col">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-3.5 text-[13px]">
              <li>
                <Link href="/laporan" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  {t('report')}
                </Link>
              </li>
              <li>
                <Link href="/peta" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  {t('map')}
                </Link>
              </li>
              <li>
                <Link href="/umkm" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  {t('marketplace')}
                </Link>
              </li>
              <li>
                <Link href="/pengumuman" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  {t('pengumuman')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links 2 */}
          <div className="lg:col-span-2 flex flex-col">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-widest mb-6">Layanan</h4>
            <ul className="space-y-3.5 text-[13px]">
              <li>
                <Link href="/asisten" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  {t('assistant')}
                </Link>
              </li>
              <li>
                <Link href="/transparansi" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  {t('transparency')}
                </Link>
              </li>
              <li>
                <Link href="/gotong-royong" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  {t('gotong_royong')}
                </Link>
              </li>
              <li>
                <Link href="/edukasi" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  {t('education')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3 flex flex-col">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-widest mb-6">Hubungi Kami</h4>
            <div className="space-y-5 text-[13px] text-gray-400 font-light">
              <div className="flex items-start gap-4 hover:text-gray-200 transition-colors">
                <MapPin className="w-4 h-4 mt-0.5 text-primary-500 shrink-0" />
                <p className="leading-relaxed">
                  DesaMind Center, Gedung Inovasi Lt.3<br />
                  Jl. Teknologi Desa No. 1<br />
                  Jakarta Selatan, DKI Jakarta 12345
                </p>
              </div>
              <a href="tel:02112345678" className="flex items-center gap-4 hover:text-primary-400 transition-colors">
                <Phone className="w-4 h-4 text-primary-500 shrink-0" />
                <span>021-1234-5678</span>
              </a>
              <a href="mailto:info@desamind.id" className="flex items-center gap-4 hover:text-primary-400 transition-colors">
                <Mail className="w-4 h-4 text-primary-500 shrink-0" />
                <span>info@desamind.id</span>
              </a>
            </div>
          </div>
          
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-500 tracking-wide font-light gap-4">
          <p>© 2026 DesaMind Indonesia. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary-400 transition-colors">Terms of Service</Link>
            <div className="flex items-center gap-1.5 opacity-60">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
              <span>in Indonesia</span>
            </div>
          </div>
        </div>
        
      </div>
    </footer>
  );
}
