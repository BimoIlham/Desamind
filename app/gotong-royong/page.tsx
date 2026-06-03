'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Calendar, MapPin, ChevronRight, UserPlus, Clock, CheckCircle2, Search } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { fetchJson } from '@/lib/api-client';

type Action = {
  id: string; title: string; description: string; category: string;
  date: string | null; time: string | null; location: string | null;
  max_participants: number; current_participants: number; status: string;
};

const STATUS_STYLES: Record<string, { badge: string }> = {
  open: { badge: 'bg-green-50 text-green-700 border border-green-200' },
  full: { badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  done: { badge: 'bg-gray-100 text-gray-600 border border-gray-200' },
};

function ActionCard({ action, t, locale }: { action: Action; t: any; locale: string }) {
  const pct = Math.min(100, Math.round((action.current_participants / action.max_participants) * 100));
  const statusStyle = STATUS_STYLES[action.status] ?? STATUS_STYLES.open;
  
  const STATUS_LABEL: Record<string, string> = { open: t('stat_open'), full: t('stat_full'), done: t('stat_done') };
  return (
    <Link href={`/gotong-royong/${action.id}`} className="group bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col p-6 block">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 mb-2">{action.category}</p>
          <h3 className="font-bold text-primary-950 text-lg leading-snug group-hover:text-primary-600 transition-colors">{action.title}</h3>
        </div>
        <span className={`text-[9px] font-bold px-3 py-1 uppercase tracking-widest shrink-0 ${statusStyle.badge}`}>{STATUS_LABEL[action.status]}</span>
      </div>
      <p className="text-[11px] text-gray-500 mb-6 line-clamp-2 leading-relaxed flex-1">{action.description}</p>
      
      <div className="flex flex-col gap-2 text-[10px] uppercase tracking-widest text-gray-400 mb-6 font-bold">
        {action.date && <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />{new Date(action.date).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
        {action.time && <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" />{action.time}</span>}
        {action.location && <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{action.location}</span>}
      </div>
      
      <div className="mt-auto border-t border-gray-100 pt-4">
        <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold mb-2">
          <span className="text-gray-500 flex items-center gap-1.5"><Users className="w-3 h-3" />{action.current_participants} / {action.max_participants} {t('participants')}</span>
          <span className="text-primary-700">{pct}%</span>
        </div>
        <div className="h-1 bg-gray-100 overflow-hidden">
          <div className={`h-full transition-all ${pct >= 100 ? 'bg-gray-400' : pct > 70 ? 'bg-amber-400' : 'bg-primary-600'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}

export default function GotongRoyongPage() {
  const t = useTranslations('gotong_royong');
  const locale = useLocale();
  const CATEGORY_DEFS = [
    { key: 'all', label: t('cat_all') },
    { key: 'Lingkungan', label: t('cat_env') },
    { key: 'Infrastruktur', label: t('cat_infra') },
    { key: 'Sosial', label: t('cat_social') },
    { key: 'Pendidikan', label: t('cat_edu') },
    { key: 'Kesehatan', label: t('cat_health') },
  ];

  const [actions, setActions] = useState<Action[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    let mounted = true;
    fetchJson('/api/actions', []).then((data) => {
      if (mounted) setActions(data);
    });
    return () => { mounted = false; };
  }, []);

  const filtered = actions.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || a.category === category;
    return matchSearch && matchCat;
  });

  const stats = [
    { label: t('stat_active'), value: actions.filter(a => a.status === 'open').length, color: 'bg-primary-50 text-primary-700 border-primary-100' },
    { label: t('stat_joined'), value: actions.reduce((sum, a) => sum + a.current_participants, 0), color: 'bg-accent-50 text-amber-700 border-accent-100' },
    { label: t('stat_completed'), value: actions.filter(a => a.status === 'done').length, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  ];

  return (
    <div>
      {/* ── Minimalist Elegant Banner ── */}
      <div className="relative bg-bg pt-12 lg:pt-16 pb-12 lg:pb-14 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-60" />

        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Text */}
          <div className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left order-2 lg:order-1 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 mb-6 mx-auto lg:mx-0 w-max">
              <Users className="w-4 h-4 text-primary-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary-700">Layanan Komunitas</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[54px] font-semibold text-primary-950 leading-[1.1] mb-6 tracking-tight">
              {t('title_1')} <br className="hidden lg:block" /> {t('title_2')}
            </h1>

            <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-md mx-auto lg:mx-0">
              {t('desc')}
            </p>
          </div>

          {/* Right Image Container */}
          <div className="lg:col-span-7 relative order-1 lg:order-2">
            <div className="relative w-full aspect-[4/3] lg:aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl shadow-primary-900/10">
              <Image
                src="/gotong-royong-banner.jpg"
                alt="Gotong Royong Banner"
                fill
                className="object-cover hover:scale-105 transition-transform duration-1000"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/20 to-transparent mix-blend-overlay" />
            </div>

            <div className="absolute -bottom-6 -left-4 lg:-left-10 bg-white/95 backdrop-blur-md px-5 py-4 rounded-2xl shadow-xl border border-black/5 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 z-20">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div className="pr-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Partisipasi</p>
                <p className="text-sm font-bold text-gray-800">
                  {actions.filter(a => a.status === 'open').length} Kegiatan Aktif
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className={`p-4 sm:p-4 text-center border flex flex-row sm:flex-col items-center justify-between sm:justify-center ${s.color}`}>
              <div className="text-[10px] font-bold tracking-widest uppercase sm:mt-1 order-2 sm:order-2 text-right sm:text-center max-w-[50%] sm:max-w-none">{s.label}</div>
              <div className="text-2xl font-extrabold order-1 sm:order-1">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters and search */}
        <div className="mb-10 text-center lg:text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">Filter Kategori</p>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 pb-6">
            <div className="flex gap-2 w-full overflow-x-auto scrollbar-none pb-2 sm:pb-0">
              {CATEGORY_DEFS.map(c => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    category === c.key ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white text-xs border border-gray-200 focus:border-primary-900 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(action => <ActionCard key={action.id} action={action as any} t={t} locale={locale} />)}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="w-14 h-14 bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-3"><Users className="w-7 h-7 text-gray-400" /></div>
              <p className="font-semibold text-gray-700">{actions.length === 0 ? t('empty_none') : t('empty_not_found')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
