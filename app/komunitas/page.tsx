'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Book } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { fetchJson } from '@/lib/api-client';
import type { Article } from '@/lib/types';

export default function KomunitasPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tab, setTab] = useState<'diskusi' | 'artikel'>('artikel');
  const t = useTranslations('community');
  const locale = useLocale();

  useEffect(() => {
    let mounted = true;
    fetchJson<Article[]>('/api/articles', []).then((data) => {
      if (mounted) setArticles(data);
    });
    return () => { mounted = false; };
  }, []);

  function getRelativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return t('today');
    if (days === 1) return t('yesterday');
    if (days < 7) return t('days_ago', { days });
    return new Date(dateStr).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US');
  }


  return (
    <div className="max-w-7xl mx-auto px-6 py-14 lg:py-16">
      <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-8 mb-10">
        <h1 className="text-4xl md:text-[42px] font-semibold text-primary-800 tracking-tight shrink-0">
          {t('title')}
        </h1>
        
        <div className="flex gap-2 flex-wrap pb-1">
          {(['artikel', 'diskusi'] as const).map(tabItem => (
            <button key={tabItem} onClick={() => setTab(tabItem)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${tab === tabItem ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {tabItem === 'artikel' ? t('tab_article') : t('tab_discussion')}
            </button>
          ))}
        </div>
      </div>

      {tab === 'artikel' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {articles.map(article => (
                <Link href={`/komunitas/${article.id}`} key={article.id} className="group cursor-pointer block">
                  {article.image_url ? (
                    <div className="relative aspect-square mb-4 overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={article.image_url} alt={article.title} className="object-cover w-full h-full group-hover:scale-105 transition duration-500" />
                    </div>
                  ) : (
                    <div className="relative aspect-square mb-4 overflow-hidden bg-gray-100 flex items-center justify-center">
                       <Book className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-primary-950 text-sm leading-snug mb-4 group-hover:text-primary-600 transition-colors">{article.title}</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(article.created_at).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </Link>
              ))}
            </div>
        </div>
      )}

      {tab === 'diskusi' && (
        <div className="bg-[#EBECE8] p-16 text-center max-w-2xl mx-auto">
          <MessageCircle className="w-10 h-10 text-primary-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-primary-950 mb-4">{t('discussion_title')}</h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto mb-8">{t('discussion_desc')}</p>
          <Link href="/laporan" className="inline-block px-8 py-3 bg-primary-800 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-primary-950 transition">
            {t('view_reports')}
          </Link>
        </div>
      )}
    </div>
  );
}
