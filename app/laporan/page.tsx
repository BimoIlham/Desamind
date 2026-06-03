'use client';
/**
 * app/laporan/page.tsx — Redesigned v2
 * Modern report listing with search, tabs, filters.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, FileText, SlidersHorizontal } from 'lucide-react';
import { CardGridSkeleton } from '@/components/ui/Skeletons';
import { ReportCard } from '@/components/ui/ReportCard';
import { useTranslations } from 'next-intl';
import { fetchJson } from '@/lib/api-client';

export default function LaporanPage() {
  const t = useTranslations('laporan');
  
  const CATEGORY_DEFS = [
    { key: 'all', label: t('cat_all') },
    { key: 'Infrastruktur', label: t('cat_infra') },
    { key: 'Sampah', label: t('cat_waste') },
    { key: 'Kesehatan', label: t('cat_health') },
    { key: 'Keamanan', label: t('cat_security') },
    { key: 'Lingkungan', label: t('cat_env') },
  ];
  const STATUSES = ['all', 'pending', 'in_progress', 'done'];
  const STATUS_LABELS: Record<string,string> = { 
    all: t('stat_all'), 
    pending: t('stat_pending'), 
    in_progress: t('stat_process'), 
    done: t('stat_done') 
  };
  
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    let mounted = true;
    fetchJson('/api/reports', []).then((data) => {
      if (!mounted) return;
      setReports(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const filtered = reports.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || r.category === category;
    const matchStatus = status === 'all' || r.status === status;
    return matchSearch && matchCat && matchStatus;
  });


  return (
    <div className="max-w-7xl mx-auto px-6 py-14 lg:py-16">
      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-8 mb-10">
        <h1 className="text-4xl md:text-[42px] font-semibold text-primary-800 tracking-tight shrink-0 mr-8">
          {t('title_1')}<br />{t('title_2')}
        </h1>
        <div className="flex-1" />
        <Link
          href="/laporan/baru"
          className="bg-primary-800 hover:bg-primary-950 text-white text-[10px] font-bold uppercase tracking-widest px-8 py-3 transition-colors mb-2"
        >
          {t('btn_create')}
        </Link>
      </div>

      {/* Search + Filter bar */}
      <div className="mb-8 lg:mb-10 border-b border-gray-200 pb-6 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-none w-full md:w-auto">
          {CATEGORY_DEFS.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                category === c.key
                  ? 'bg-primary-800 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
             <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input
               type="text"
               placeholder={t('search_placeholder')}
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-10 pr-4 py-2.5 bg-white text-xs border border-gray-200 focus:border-primary-900 focus:outline-none transition-colors"
             />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2.5 bg-white text-[10px] font-bold uppercase tracking-widest text-gray-700 border border-gray-200 focus:border-primary-900 focus:outline-none focus:ring-0 cursor-pointer transition-colors"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <CardGridSkeleton count={6} cols={4} />
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filtered.map((report) => <ReportCard key={report.id} report={report} />)}
        </div>
      ) : (
        <div className="py-14 lg:py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">{t('empty_title')}</p>
          <p className="text-sm text-gray-500">{t('empty_desc')}</p>
        </div>
      )}
    </div>
  );
}
