'use client';
/**
 * app/admin/pengaturan/page.tsx
 * Admin General Settings — Platform configuration hub.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2, CheckCircle,
  Map, Globe, Bell, Shield, Palette,
  Eye, EyeOff, KeyRound, UserCircle,
} from 'lucide-react';
import { DEFAULT_APP_SETTINGS, normalizeSettings } from '@/lib/map-settings';
import { useAuth } from '@/hooks/useAuth';

interface PlatformSettings {
  village_name: string;
  district_name: string;
  city_name: string;
  province_name: string;
  center_lat: number;
  center_lng: number;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

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

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Password baru minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password baru belum sama.');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPasswordError(data.error || 'Gagal mengganti password.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password akun berhasil diperbarui dalam mode demo.');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
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

      {/* Account Settings */}
      <section className="bg-white border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
          <aside className="border-b lg:border-b-0 lg:border-r border-gray-100 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-800 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {user?.avatar ?? 'AD'}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-700 mb-1">Pengaturan Akun</p>
                <h2 className="font-bold text-gray-900 truncate">{user?.name ?? 'Admin DesaMind'}</h2>
                <p className="text-xs text-gray-500 mt-1 break-all">{user?.email ?? 'admin@desamind.id'}</p>
              </div>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-100 text-primary-800 text-[10px] font-bold uppercase tracking-widest">
              <UserCircle className="w-3.5 h-3.5" />
              {user?.role ?? 'admin'}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-gray-500">
              Kelola keamanan akun admin langsung dari dashboard. Perubahan berjalan sebagai simulasi mode statis.
            </p>
          </aside>

          <form onSubmit={submitPassword} className="p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 pb-5 border-b border-gray-100 mb-6">
              <div>
                <h2 className="font-bold text-gray-900">Keamanan Akun</h2>
                <p className="text-xs text-gray-500 mt-1">Ganti password admin demo, minimal 8 karakter.</p>
              </div>
              <KeyRound className="w-5 h-5 text-primary-700" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Password Lama', value: currentPassword, setValue: setCurrentPassword },
                { label: 'Password Baru', value: newPassword, setValue: setNewPassword },
                { label: 'Konfirmasi Password', value: confirmPassword, setValue: setConfirmPassword },
              ].map((field) => (
                <label key={field.label} className="block min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{field.label}</span>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={field.value}
                    onChange={(event) => field.setValue(event.target.value)}
                    className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-primary-700 bg-white"
                    required
                  />
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowPasswords((value) => !value)}
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary-800 transition-colors"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPasswords ? 'Sembunyikan password' : 'Tampilkan password'}
            </button>

            {passwordError && <p className="mt-5 text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-3">{passwordError}</p>}
            {passwordMessage && <p className="mt-5 text-sm text-green-700 bg-green-50 border border-green-100 px-4 py-3">{passwordMessage}</p>}

            <div className="mt-7 flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 disabled:opacity-60 transition-colors"
              >
                {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                {savingPassword ? 'Menyimpan...' : 'Simpan Password'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
