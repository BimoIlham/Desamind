'use client';
import { useEffect, useState } from 'react';
import { Camera, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { GalleryItem } from '@/lib/types';
import Image from 'next/image';
import { fetchJson } from '@/lib/api-client';

export default function GaleriPage() {
  const t = useTranslations('public_pages');
  const tAuth = useTranslations('auth');
  const CATEGORY_DEFS = [
    { key: 'all', label: t('btn_all') },
    { key: 'PKK', label: 'PKK' },
    { key: 'Karang Taruna', label: 'Karang Taruna' },
    { key: 'Posyandu', label: 'Posyandu' },
    { key: 'Kerja Bakti', label: 'Kerja Bakti' },
    { key: 'Lainnya', label: 'Lainnya' },
  ];
  
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchJson('/api/gallery', []).then((data) => {
      if (mounted) setGallery(data);
    });
    return () => { mounted = false; };
  }, []);

  const filtered = gallery.filter(g => filter === 'all' || g.category === filter);

  return (
    <div className="min-h-screen bg-bg pt-12 lg:pt-14 pb-12 lg:pb-14 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-primary-700 transition-colors mb-6">
            <ArrowLeft className="w-3 h-3" /> {tAuth('back_home')}
          </Link>
          <div className="flex flex-col md:flex-row md:items-center gap-4 border-l-4 border-primary-600 pl-4 py-2">
            <div className="w-12 h-12 bg-primary-800 flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-primary-950 mb-1">{t('galeri_title')}</h1>
              <p className="text-gray-500 text-sm">{t('galeri_subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-8 items-center justify-center md:justify-start">
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

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center p-12 bg-white border border-gray-200">
              <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">{t('no_announcement')}</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div 
                key={item.id} 
                className="group relative cursor-pointer overflow-hidden bg-gray-100 aspect-square border border-gray-200"
                onClick={() => setLightbox(item)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={item.image_url} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-primary-300 mb-1">{item.category}</span>
                  <h3 className="text-white text-sm font-semibold leading-snug">{item.title}</h3>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Lightbox Modal */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-10">
          <button 
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/20 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="max-w-5xl w-full flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={lightbox.image_url} 
              alt={lightbox.title} 
              className="w-full max-h-[75vh] object-contain mb-6"
            />
            <div className="text-center w-full max-w-2xl bg-gray-900 border border-gray-800 p-6">
              <span className="inline-block px-3 py-1 bg-primary-900/50 text-primary-300 text-[9px] font-bold uppercase tracking-widest mb-3 border border-primary-700/50">
                {lightbox.category}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{lightbox.title}</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Diambil pada: {new Date(lightbox.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
