/**
 * app/page.tsx — Homepage (Server Component)
 *
 * Tidak ada 'use client' — seluruh halaman di-render di server.
 * Data (laporan & stats) di-fetch langsung via Supabase server client,
 * menghilangkan round-trip browser → API → browser.
 *
 * Komponen interaktif (animasi Framer Motion) sudah di-encapsulate
 * sebagai Client Components (AnimatedSection, HomeLatestReports).
 */

import Image from 'next/image';
import Link from 'next/link';
import {
  MessageSquare, Bot, ShoppingBag,
  GraduationCap, Users, ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { HomeLatestReports } from '@/app/_components/HomeLatestReports';
import { getTranslations } from 'next-intl/server';
import { listRows, countRows } from '@/lib/api-helpers';

// ── Server-side data fetch ────────────────────────────────────────
async function getHomeData() {
  const [reports, reportsCount, productsCount, resolvedCount] =
    await Promise.all([
      listRows('reports', [], {
        order: { column: 'created_at', ascending: false },
        limit: 4,
      }),
      countRows('reports'),
      countRows('products'),
      countRows('reports', { status: 'completed' }),
    ]);

  return {
    reports,
    stats: {
      reports:  reportsCount  ?? 0,
      products: productsCount ?? 0,
      resolved: resolvedCount ?? 0,
    },
  };
}

// ── Page ─────────────────────────────────────────────────────────
export default async function HomePage() {
  const t = await getTranslations('home');
  const { reports: latestReports, stats } = await getHomeData();

  return (
    <div className="flex flex-col w-full overflow-hidden bg-bg">

      {/* 1. HERO SECTION */}
      <AnimatedSection className="relative pt-10 pb-12 md:pt-12 md:pb-14 lg:pt-16 lg:pb-16 bg-gradient-to-br from-[#FAFAFA] via-surface to-[#F2EFE9] overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-[800px] h-[800px] bg-primary-100/40 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-primary-50/50 rounded-full blur-[80px] -z-10 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

          {/* Image Area */}
          <div className="lg:col-span-7 relative order-1 lg:order-2">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/10] rounded-3xl lg:rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-black/5 bg-gray-100 z-10">
              <Image
                src="/hero-banner.jpg"
                alt="DesaCerdas"
                fill
                className="object-cover hover:scale-[1.03] transition-transform duration-[1.5s] ease-out"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>

            {/* Floating Badge */}
            <div className="absolute top-4 right-4 lg:top-1/2 lg:-translate-y-1/2 lg:-right-8 lg:bottom-auto bg-white/90 backdrop-blur-md px-3 py-2 lg:px-5 lg:py-4 rounded-xl lg:rounded-2xl shadow-xl lg:shadow-2xl border border-white/50 flex items-center gap-2 lg:gap-4 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 pointer-events-none z-20">
              <div className="bg-primary-50/80 p-1.5 lg:p-2.5 rounded-full border border-primary-100/50 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-primary-600" />
              </div>
              <div className="text-left">
                <p className="text-[7px] lg:text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">{t('hero.badge_2_title')}</p>
                <p className="text-[9px] lg:text-[12px] font-bold text-gray-800">{t('hero.badge_2_desc')}</p>
              </div>
            </div>

            {/* Dot Pattern */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-[radial-gradient(#d1d5db_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-60 z-0 hidden md:block" />
          </div>

          {/* Text Content */}
          <div className="lg:col-span-5 flex flex-col justify-center order-2 lg:order-1 relative z-20 text-center lg:text-left mt-8 lg:mt-0">
            <div className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur border border-black/5 px-3.5 py-1.5 rounded-full mx-auto lg:mx-0 w-fit mb-5 lg:mb-6 shadow-sm">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary-600 animate-pulse" />
              <span className="text-[10px] lg:text-[11px] font-bold text-gray-600 tracking-widest uppercase">{t('hero.badge_1')}</span>
            </div>
            <h1 className="text-[32px] sm:text-4xl md:text-5xl lg:text-[52px] leading-[1.2] md:leading-[1.15] font-extrabold text-gray-900 mb-4 lg:mb-6 tracking-tight max-w-2xl mx-auto lg:mx-0">
              {t('hero.title_1')} <span className="text-primary-800 block mt-1">{t('hero.title_2')}</span>
            </h1>
            <p className="text-gray-500 text-[14px] md:text-lg leading-relaxed font-light mb-8 max-w-lg mx-auto lg:mx-0">
              {t('hero.desc')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full sm:w-auto">
              <Link href="/laporan" className="flex items-center justify-center px-8 py-3.5 text-xs lg:text-sm font-bold rounded-full transition-all duration-300 w-full sm:w-auto text-center shadow-md hover:-translate-y-0.5 bg-primary-900 hover:bg-primary-950 text-white shadow-primary-900/20 border border-transparent">
                {t('hero.cta_report')}
              </Link>
              <Link href="/umkm" className="flex items-center justify-center px-8 py-3.5 text-xs lg:text-sm font-bold rounded-full transition-all duration-300 w-full sm:w-auto text-center shadow-sm hover:-translate-y-0.5 bg-white hover:bg-gray-50 text-gray-700 hover:text-primary-900 shadow-black/5 border border-gray-200">
                {t('hero.cta_marketplace')}
              </Link>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* 2. INITIATIVES */}
      <section className="py-14 lg:py-16 bg-bg overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <AnimatedSection as="div" animation="fade-from-left" className="lg:col-span-5 lg:pr-8 py-4 flex flex-col h-full lg:min-h-[450px]">
            <div>
              <h2 className="text-4xl md:text-5xl lg:text-[50px] font-semibold text-primary-950 leading-[1.1] mb-6 tracking-tight">
                {t('initiatives.title_1')}<br />{t('initiatives.title_2')}
              </h2>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-sm mb-8 lg:mb-0">
                {t('initiatives.desc')}
              </p>
            </div>
            <div className="relative w-full max-w-md mx-auto lg:mx-0 mt-auto opacity-70 mix-blend-multiply pt-8">
              <Image src="/id.svg" alt="Peta Indonesia" width={500} height={250} className="w-full h-auto drop-shadow-sm" />
              <div className="absolute top-[55%] left-[32%] w-2 h-2 rounded-full bg-accent-500 shadow-[0_0_15px_rgba(245,158,11,1)] animate-ping mix-blend-normal" />
              <div className="absolute top-[55%] left-[32%] w-2 h-2 rounded-full bg-accent-500 shadow-[0_0_10px_rgba(245,158,11,1)] mix-blend-normal" />
              <div className="absolute top-[68%] left-[46%] w-1.5 h-1.5 rounded-full bg-primary-600 shadow-[0_0_10px_rgba(5,150,105,0.8)] animate-pulse mix-blend-normal" style={{ animationDelay: '1s' }} />
              <div className="absolute top-[40%] left-[80%] w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse mix-blend-normal" style={{ animationDelay: '2s' }} />
            </div>
          </AnimatedSection>

          <AnimatedSection as="div" animation="fade-from-right" className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
            {/* Card: Peta */}
            <Link href="/peta" className="relative h-[450px] w-full overflow-hidden group rounded-sm shadow-sm">
              <div className="absolute inset-0 bg-[#38605A] transition-opacity duration-700 ease-in-out group-hover:opacity-0 z-10" />
              <div className="absolute inset-0 z-0 bg-primary-950">
                <Image src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop" alt="Peta Interaktif Desa" fill className="object-cover scale-110 group-hover:scale-100 transition-transform duration-[1.5s] ease-out opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/30 to-transparent" />
              </div>
              <div className="relative z-20 h-full p-8 flex flex-col justify-between text-white transition-transform duration-500">
                <span className="text-[11px] font-medium opacity-80 tracking-wide">{t('initiatives.cards.map_tag')}</span>
                <h3 className="text-2xl md:text-[28px] font-medium tracking-wide font-sans leading-snug group-hover:translate-y-[-8px] transition-transform duration-500">
                  {t('initiatives.cards.map_title')}
                </h3>
              </div>
            </Link>

            {/* Card: Laporan */}
            <Link href="/laporan" className="relative h-[450px] w-full overflow-hidden group rounded-sm shadow-sm">
              <div className="absolute inset-0 bg-[#2B4A45] transition-opacity duration-700 ease-in-out group-hover:opacity-0 z-10" />
              <div className="absolute inset-0 z-0 bg-primary-950">
                <Image src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop" alt="Sistem Laporan Cerdas" fill className="object-cover scale-110 group-hover:scale-100 transition-transform duration-[1.5s] ease-out opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/30 to-transparent" />
              </div>
              <div className="relative z-20 h-full p-8 flex flex-col justify-between text-white transition-transform duration-500">
                <span className="text-[11px] font-medium opacity-80 tracking-wide">{t('initiatives.cards.reports_tag')}</span>
                <h3 className="text-2xl md:text-[28px] font-medium tracking-wide font-sans leading-snug group-hover:translate-y-[-8px] transition-transform duration-500">
                  {t('initiatives.cards.reports_title')}
                </h3>
              </div>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* 3. HOW WE TURN VISION INTO ACTION */}
      <section className="py-14 lg:py-16 bg-bg overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <AnimatedSection as="div" animation="fade-from-left" className="lg:col-span-1 lg:pr-8 flex flex-col justify-start pt-4 mb-8 lg:mb-0">
              <h2 className="text-3xl lg:text-[40px] font-semibold text-primary-800 leading-[1.1] mb-6 tracking-tight">
                {t('vision.title_1')}<br />{t('vision.title_2')}
              </h2>
              <p className="text-[13px] text-gray-500 leading-relaxed">{t('vision.desc')}</p>
            </AnimatedSection>

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
              {[
                { icon: MessageSquare, titleKey: 'vision.cards.report_title',   descKey: 'vision.cards.report_desc',   delay: 0.1 },
                { icon: Bot,           titleKey: 'vision.cards.ai_title',       descKey: 'vision.cards.ai_desc',       delay: 0.2 },
                { icon: ShoppingBag,   titleKey: 'vision.cards.market_title',   descKey: 'vision.cards.market_desc',   delay: 0.3 },
                { icon: GraduationCap, titleKey: 'vision.cards.edu_title',      descKey: 'vision.cards.edu_desc',      delay: 0.4 },
                { icon: Users,         titleKey: 'vision.cards.forum_title',    descKey: 'vision.cards.forum_desc',    delay: 0.5 },
                { icon: ShieldCheck,   titleKey: 'vision.cards.security_title', descKey: 'vision.cards.security_desc', delay: 0.6 },
              ].map(({ icon: Icon, titleKey, descKey, delay }) => (
                <AnimatedSection key={titleKey} as="div" animation="fade-up" delay={delay} className="bg-[#F0F2F0] p-8 min-h-[320px] flex flex-col justify-start transition-colors duration-300 group hover:bg-primary-700">
                  <Icon className="w-8 h-8 text-primary-950 mb-10 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
                  <h4 className="font-bold text-primary-950 text-[17px] mb-4 group-hover:text-white transition-colors duration-300 leading-snug">
                    {t(titleKey as any)}
                  </h4>
                  <p className="text-[13px] text-gray-600 leading-relaxed group-hover:text-primary-50 transition-colors duration-300">
                    {t(descKey as any)}
                  </p>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE DIFFERENCE WE MAKE */}
      <section className="py-14 lg:py-16 bg-bg overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <AnimatedSection as="div" animation="fade-from-left" className="w-full aspect-[16/9] relative bg-gray-200">
            <Image
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop"
              alt="Dampak Sosial DesaMind"
              fill
              className="object-cover"
            />
          </AnimatedSection>

          <AnimatedSection as="div" animation="fade-from-right">
            <h2 className="text-3xl font-bold text-primary-700 mb-6 tracking-tight">
              {t('difference.title')}
            </h2>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-8 lg:mb-10 max-w-md">
              {t('difference.desc')}
            </p>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-3xl font-bold text-primary-950 mb-1">{stats.reports}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('difference.stats.partners')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-950 mb-1">{stats.products}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('difference.stats.villages')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-950 mb-1">{stats.resolved}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('difference.stats.beneficiaries')}</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 5. OUR FLAGSHIP PROGRAM */}
      <section className="py-14 lg:py-16 bg-bg overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection as="div" animation="fade-up">
            <h2 className="text-2xl font-bold text-primary-700 mb-3 tracking-tight">{t('flagship.title')}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-8 lg:mb-10">{t('flagship.desc')}</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Users,       titleKey: 'flagship.cards.gotong_title',       descKey: 'flagship.cards.gotong_desc',       href: '/gotong-royong', delay: 0.1 },
              { icon: ShieldCheck, titleKey: 'flagship.cards.transparency_title', descKey: 'flagship.cards.transparency_desc', href: '/transparansi',  delay: 0.2 },
              { icon: Briefcase,   titleKey: 'flagship.cards.jobs_title',         descKey: 'flagship.cards.jobs_desc',         href: '/lowongan',      delay: 0.3 },
            ].map(({ icon: Icon, titleKey, descKey, href, delay }) => (
              <AnimatedSection key={titleKey} as="div" animation="fade-up" delay={delay} className="bg-surface border border-gray-200 p-10 h-64 flex flex-col justify-center hover:-translate-y-1 transition-transform duration-500 relative overflow-hidden group hover:shadow-lg">
                <Link href={href} className="absolute inset-0 z-20" aria-label={t(titleKey as any)} />
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] group-hover:-translate-y-2 group-hover:-translate-x-2 transition-all duration-700 pointer-events-none">
                  <Icon className="w-48 h-48 text-primary-900" />
                </div>
                <div className="relative z-10 transition-transform duration-300 group-hover:translate-x-2">
                  <h4 className="font-bold text-primary-950 text-sm mb-4">{t(titleKey as any)}</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed group-hover:text-primary-900 transition-colors">
                    {t(descKey as any)}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* 6. LAPORAN TERBARU — Client Component (Framer Motion stagger) */}
      <HomeLatestReports
        reports={latestReports as any}
        labelTitle={t('impact.title')}
        labelViewAll={t('impact.view_all')}
      />

    </div>
  );
}
