'use client';
import { useEffect, useState } from 'react';
import { Megaphone, Bell, Calendar, ShieldAlert, Heart, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { fetchJson } from '@/lib/api-client';
import type { Announcement } from '@/lib/types';

function getCategoryIcon(category: string) {
  switch (category) {
    case 'Kesehatan': return <Heart className="w-4 h-4 text-rose-500" />;
    case 'Pemerintahan': return <ShieldAlert className="w-4 h-4 text-blue-500" />;
    case 'Sosial': return <Info className="w-4 h-4 text-purple-500" />;
    default: return <Bell className="w-4 h-4 text-gray-500" />;
  }
}

export default function PengumumanPage() {
  const t = useTranslations('public_pages');
  const tAuth = useTranslations('auth');
  const CATEGORY_DEFS = [
    { key: 'all', label: t('btn_all') },
    { key: 'Pemerintahan', label: 'Pemerintahan' },
    { key: 'Kesehatan', label: 'Kesehatan' },
    { key: 'Sosial', label: 'Sosial' },
    { key: 'Umum', label: 'Umum' },
  ];
  const [filter, setFilter] = useState('all');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchJson<Announcement[]>('/api/announcements', []).then((data) => {
      if (mounted) setAnnouncements(data);
    });
    return () => { mounted = false; };
  }, []);

  const filtered = announcements.filter(a => filter === 'all' || a.category === filter);

  return (
    <div className="min-h-screen bg-bg pt-12 lg:pt-14 pb-12 lg:pb-14 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-primary-700 transition-colors mb-6">
            <ArrowLeft className="w-3 h-3" /> {tAuth('back_home')}
          </Link>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 flex items-center justify-center mx-auto md:mx-0 shrink-0">
              <Megaphone className="w-8 h-8 text-primary-800" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-primary-950 mb-2">{t('pengumuman_title')}</h1>
              <p className="text-gray-500 text-sm">{t('pengumuman_subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORY_DEFS.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                filter === cat.key 
                  ? 'bg-primary-900 border-primary-900 text-white' 
                  : 'bg-white border-gray-200 text-gray-500 hover:border-primary-400 hover:text-primary-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center p-12 bg-white border border-gray-200">
              <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">{t('no_announcement')}</p>
            </div>
          ) : (
            filtered.map((ann) => {
              const date = new Date(ann.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
              return (
                <div key={ann.id} className="bg-white border border-gray-200 p-6 md:p-8 hover:shadow-md transition-shadow relative overflow-hidden group">
                  {ann.is_important && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold uppercase tracking-widest px-4 py-1.5">
                      Penting
                    </div>
                  )}
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Date Block */}
                    <div className="flex-shrink-0 text-center md:text-left md:w-32 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-primary-500 mb-1 flex items-center justify-center md:justify-start gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Tanggal
                      </div>
                      <div className="text-sm font-semibold text-gray-900 leading-tight">{date}</div>
                    </div>

                    {/* Content Block */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        {getCategoryIcon(ann.category)}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{ann.category}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-800 transition-colors">{ann.title}</h3>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {ann.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
