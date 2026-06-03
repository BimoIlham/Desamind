'use client';
/**
 * app/admin/pengaturan/page.tsx
 * Admin General Settings — Platform configuration hub.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Save, Loader2, CheckCircle, AlertTriangle,
  Map, Globe, Bell, Shield, Palette,
} from 'lucide-react';
import { DEFAULT_APP_SETTINGS, normalizeSettings } from '@/lib/map-settings';

interface PlatformSettings {
  village_name: string;
  district_name: string;
  city_name: string;
  province_name: string;
  center_lat: number;
  center_lng: number;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    let mounted = true;
    fetch('/api/settings', { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : DEFAULT_APP_SETTINGS)
      .then((data) => {
        if (!mounted) return;
        setSettings(normalizeSettings(data));
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setSettings(DEFAULT_APP_SETTINGS);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="text-sm font-medium">Memuat pengaturan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-1 border-l-4 border-primary-600 pl-4">
        <h1 className="text-2xl font-bold text-primary-900">Pengaturan</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Konfigurasi Platform DesaMind
        </p>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Card 1: Wilayah & Peta */}
        <Link
          href="/admin/pengaturan-peta"
          className="bg-white border border-gray-200 p-6 hover:border-primary-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-50 flex items-center justify-center shrink-0 border border-primary-100 group-hover:bg-primary-600 transition-colors">
              <Map className="w-5 h-5 text-primary-600 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-primary-900 transition-colors">Pengaturan Wilayah & Peta</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Ubah identitas desa, pindah lokasi, gambar batas wilayah (geofencing), dan atur titik pusat peta.
              </p>
              {settings && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-1 border border-primary-100">
                    {settings.village_name}, {settings.city_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Card 2: Bahasa */}
        <div className="bg-white border border-gray-200 p-6 relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm mb-1">Bahasa & Lokalisasi</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Pengaturan bahasa default platform (Indonesia / English). Sudah tersinkronisasi otomatis via i18n.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 border border-blue-100">
                  🇮🇩 Indonesia
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 border border-gray-100">
                  🇬🇧 English
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Notifikasi */}
        <div className="bg-white border border-gray-200 p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest text-yellow-600 bg-yellow-50 px-2 py-0.5 border border-yellow-100">Segera</div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-yellow-50 flex items-center justify-center shrink-0 border border-yellow-100">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm mb-1">Notifikasi</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Konfigurasi notifikasi email dan push untuk laporan baru, status update, dan pesan komunitas.
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Keamanan */}
        <div className="bg-white border border-gray-200 p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest text-yellow-600 bg-yellow-50 px-2 py-0.5 border border-yellow-100">Segera</div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm mb-1">Keamanan & Akses</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Kelola role pengguna (Admin/Citizen), manajemen sesi, dan pengaturan otentikasi akun.
              </p>
            </div>
          </div>
        </div>

        {/* Card 5: Tampilan */}
        <div className="bg-white border border-gray-200 p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest text-yellow-600 bg-yellow-50 px-2 py-0.5 border border-yellow-100">Segera</div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm mb-1">Tampilan & Tema</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Ubah logo, warna tema, mode gelap, dan kustomisasi elemen visual platform Anda.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Info */}
      <div className="flex items-start gap-3 px-5 py-4 bg-gray-50 border border-gray-100 text-gray-500 text-[11px] leading-relaxed">
        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-primary-600" />
        <div>
          <strong className="text-gray-700">Catatan:</strong> Fitur yang bertanda <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-600 bg-yellow-50 px-1.5 py-0.5 border border-yellow-100 mx-1">Segera</span> 
          sedang dalam tahap pengembangan dan akan tersedia di pembaruan mendatang.
        </div>
      </div>
    </div>
  );
}
