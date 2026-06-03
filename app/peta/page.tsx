'use client';
/**
 * app/peta/page.tsx
 * Interactive map page — centers on Desa Labuhan Maringgai, Lampung Timur.
 * MapView is loaded client-side only to prevent Leaflet SSR crash.
 */
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Loader2, MapPin, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { fetchSettings } from '@/lib/geofence';
import { DEFAULT_APP_SETTINGS } from '@/lib/map-settings';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 gap-4">
      <div className="w-16 h-16 bg-white shadow-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
      </div>
      <div className="text-center">
        <p className="font-bold text-gray-700">Memuat Peta Interaktif...</p>
        <p className="text-sm text-gray-400">{DEFAULT_APP_SETTINGS.village_name}, {DEFAULT_APP_SETTINGS.city_name}</p>
      </div>
    </div>
  ),
});

export default function PetaPage() {
  const t = useTranslations('map');
  const [subtitle, setSubtitle] = useState(
    `${DEFAULT_APP_SETTINGS.village_name}, ${DEFAULT_APP_SETTINGS.city_name}`
  );

  useEffect(() => {
    let mounted = true;
    fetchSettings({ refresh: true }).then((settings) => {
      if (!mounted) return;
      setSubtitle(`${settings.village_name}, ${settings.city_name}`);
    });
    return () => { mounted = false; };
  }, []);

  // We assign MapView within component or outside? 
  // Next-intl works fine inside React components. We can just keep MapView as is.
  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)]">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="bg-bg border-b border-gray-200 px-6 py-3 shrink-0 z-10 font-bold uppercase tracking-widest text-[9px]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary-800" />
            <div>
              <h1 className="text-primary-950 text-xs">{t('title')}</h1>
              <p className="text-gray-400">{subtitle || t('subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-gray-500">{t('status_waiting')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-gray-500">{t('status_processing')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-500">{t('status_resolved')}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2 text-primary-600">
              <Layers className="w-3.5 h-3.5" />
              <span>{t('change_layer')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Map (takes remaining height) ──────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {/* We mount the MapView lazily but skip passing translations inside since the map overlays might be static for now or can read their own useTranslations instances in components/map/MapView.tsx if needed. */}
        <MapView />
      </div>
    </div>
  );
}
