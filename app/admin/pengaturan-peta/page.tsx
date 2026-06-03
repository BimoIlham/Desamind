'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, CheckCircle, Loader2, Map, Save, Search } from 'lucide-react';
import { invalidateSettingsCache } from '@/lib/geofence';
import {
  DEFAULT_APP_SETTINGS,
  getBoundaryCenter,
  normalizeSettings,
  type AppSettings,
} from '@/lib/map-settings';

const AdminMapDrawer = dynamic(() => import('@/components/map/AdminMapDrawer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-50 text-gray-400 text-sm gap-3">
      <Loader2 className="w-5 h-5 animate-spin" />
      Memuat Kanvas Peta...
    </div>
  ),
});

type GeocodeResult = {
  lat: number;
  lng: number;
  display_name?: string;
  boundary_geojson: AppSettings['boundary_geojson'];
  boundary_precision?: 'official' | 'estimated_radius';
  center_precision?: 'office' | 'area';
  source_label?: string;
  score?: number;
  identity?: Partial<Pick<AppSettings, IdentityKey>>;
  region?: {
    code?: string;
    name: string;
    level: 'province' | 'regency' | 'district' | 'village';
    village_name?: string;
    district_name?: string;
    city_name?: string;
    province_name?: string;
  };
};

type IdentityKey = 'village_name' | 'district_name' | 'city_name' | 'province_name';

const IDENTITY_KEYS: IdentityKey[] = ['village_name', 'district_name', 'city_name', 'province_name'];

function identitySignature(settings: Pick<AppSettings, IdentityKey>) {
  return IDENTITY_KEYS
    .map((key) => settings[key].trim().toLowerCase())
    .join('|');
}

function hasEnoughIdentity(settings: Pick<AppSettings, IdentityKey>) {
  const mainArea = Boolean(settings.village_name.trim() || settings.district_name.trim());
  return mainArea && Boolean(settings.city_name.trim() || settings.province_name.trim());
}

function settingsFromGeocode(source: AppSettings, result: GeocodeResult) {
  const identity = result.identity ?? {};
  const region = result.region;
  const regionIdentity: Partial<Pick<AppSettings, IdentityKey>> = region
    ? {
        village_name: region.village_name ?? region.name,
        district_name: region.district_name ?? region.name,
        city_name: region.city_name,
        province_name: region.province_name,
      }
    : {};

  return normalizeSettings({
    ...source,
    ...regionIdentity,
    ...identity,
    center_lat: result.lat,
    center_lng: result.lng,
    boundary_geojson: result.boundary_geojson ?? null,
  });
}

function geocodeMessage(result: GeocodeResult) {
  const target = result.display_name
    ? `Peta diarahkan ke: ${result.display_name}.`
    : 'Peta diarahkan dari Identitas Wilayah.';

  return result.boundary_geojson
    ? result.boundary_precision === 'official'
      ? `${target} Batas wilayah otomatis diperbarui dari ${result.source_label ?? 'data GeoJSON resmi'}.`
      : `${target} Batas wilayah resmi belum tersedia, jadi sistem membuat garis otomatis dari radius wilayah.`
    : `${target} Batas resmi belum tersedia, garis lama dibersihkan supaya tidak salah lokasi.`;
}

export default function AdminMapSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [polygonEdited, setPolygonEdited] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [locationMessage, setLocationMessage] = useState('');
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedIdentityRef = useRef('');
  const lastLookupIdentityRef = useRef('');
  const latestIdentityRef = useRef(identitySignature(DEFAULT_APP_SETTINGS));

  useEffect(() => {
    let mounted = true;
    fetch('/api/settings', { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : DEFAULT_APP_SETTINGS)
      .then((data) => {
        if (!mounted) return;
        const normalized = normalizeSettings(data);
        const signature = identitySignature(normalized);
        loadedIdentityRef.current = signature;
        lastLookupIdentityRef.current = signature;
        latestIdentityRef.current = signature;
        setSettings(normalized);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        const signature = identitySignature(DEFAULT_APP_SETTINGS);
        loadedIdentityRef.current = signature;
        lastLookupIdentityRef.current = signature;
        latestIdentityRef.current = signature;
        setSettings(DEFAULT_APP_SETTINGS);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => () => {
    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
  }, []);

  function clearLookupTimer() {
    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    lookupTimerRef.current = null;
  }

  function clearFeedback() {
    setStatus('idle');
    setStatusMessage('');
    setLocationMessage('');
  }

  function handleChange(key: keyof AppSettings, value: unknown) {
    setSettings((current) => ({ ...current, [key]: value }));
    clearFeedback();
  }

  function handleIdentityChange(key: IdentityKey, value: string) {
    const nextSettings = { ...settings, [key]: value };
    latestIdentityRef.current = identitySignature(nextSettings);
    setSettings(nextSettings);
    setPolygonEdited(false);
    clearFeedback();
    scheduleIdentityLookup(nextSettings);
  }

  function handleNumberChange(key: 'center_lat' | 'center_lng' | 'fallback_radius_m', value: number) {
    if (!Number.isFinite(value)) return;
    handleChange(key, key === 'fallback_radius_m' ? Math.max(100, Math.round(value)) : value);
  }

  function scheduleIdentityLookup(source: AppSettings) {
    clearLookupTimer();

    const signature = identitySignature(source);
    if (!hasEnoughIdentity(source)) return;
    if (signature === loadedIdentityRef.current || signature === lastLookupIdentityRef.current) return;

    lookupTimerRef.current = setTimeout(() => {
      void applyIdentityLookup(source);
    }, 900);
  }

  async function geocodeIdentity(source: AppSettings, quiet = false): Promise<GeocodeResult | null> {
    if (!quiet) {
      setGeocoding(true);
      setLocationMessage('Mencari koordinat dan batas wilayah otomatis...');
    }

    try {
      const params = new URLSearchParams();
      for (const key of IDENTITY_KEYS) {
        params.set(key, source[key]);
      }
      params.set('radius_m', String(source.fallback_radius_m));

      const response = await fetch(`/api/geocode?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json().catch(() => null) as (GeocodeResult & { error?: string }) | null;
      if (!response.ok || !data) throw new Error(data?.error ?? 'Pencarian lokasi gagal.');

      return data;
    } catch (error) {
      if (!quiet) {
        setLocationMessage(error instanceof Error ? error.message : 'Tidak bisa mencari lokasi saat ini.');
      }
      return null;
    } finally {
      if (!quiet) setGeocoding(false);
    }
  }

  async function applyIdentityLookup(source: AppSettings) {
    const signature = identitySignature(source);
    const result = await geocodeIdentity(source);
    if (!result) return null;
    if (signature !== latestIdentityRef.current) return null;

    const nextSettings = settingsFromGeocode(source, result);
    setSettings(nextSettings);
    setPolygonEdited(false);
    lastLookupIdentityRef.current = identitySignature(nextSettings);
    setLocationMessage(geocodeMessage(result));
    return nextSettings;
  }

  async function handleCenterFromIdentity() {
    clearLookupTimer();
    const payload = normalizeSettings(settings);
    await applyIdentityLookup(payload);
  }

  function handlePolygonChange(coords: AppSettings['boundary_geojson']) {
    const center = getBoundaryCenter(coords);
    setPolygonEdited(true);
    setSettings((current) => ({
      ...current,
      boundary_geojson: coords,
      ...(center ? { center_lat: center[0], center_lng: center[1] } : {}),
    }));
    setStatus('idle');
    setStatusMessage('');
    setLocationMessage(center ? 'Titik pusat otomatis mengikuti tengah wilayah yang ditandai.' : '');
  }

  async function handleSave() {
    setSaving(true);
    setStatus('idle');
    setStatusMessage('');

    try {
      let payload = normalizeSettings(settings);

      if (!polygonEdited && identitySignature(payload) !== lastLookupIdentityRef.current) {
        const identityResult = await geocodeIdentity(payload, true);
        if (!identityResult && hasEnoughIdentity(payload)) {
          throw new Error('Koordinat otomatis belum ditemukan. Tekan Cari & Pusatkan dari Identitas atau periksa kembali nama wilayah.');
        }
        if (identityResult) payload = settingsFromGeocode(payload, identityResult);
        lastLookupIdentityRef.current = identitySignature(payload);
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menyimpan pengaturan.');

      const normalized = normalizeSettings(data);
      setSettings(normalized);
      setPolygonEdited(false);
      loadedIdentityRef.current = identitySignature(normalized);
      lastLookupIdentityRef.current = identitySignature(normalized);
      latestIdentityRef.current = identitySignature(normalized);
      invalidateSettingsCache();
      setStatus('success');
      setStatusMessage('Pengaturan wilayah tersimpan. Peta publik dan geofencing laporan sekarang mengikuti lokasi yang disetel.');
    } catch (error) {
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  }

  const mapCenter: [number, number] = [settings.center_lat, settings.center_lng];
  const hasPolygon = Boolean(settings.boundary_geojson?.[0]?.length);
  const polygonPoints = Math.max(0, (settings.boundary_geojson?.[0]?.length ?? 1) - 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="text-sm font-medium">Memuat pengaturan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 border-l-4 border-primary-600 pl-4">
          <h1 className="text-2xl font-bold text-primary-900">Pengaturan Wilayah & Peta</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Konfigurasi Batas Desa / Kelurahan
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-primary-950 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-3 px-5 py-4 bg-green-50 border border-green-100 text-green-700 text-sm font-medium">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {statusMessage || 'Berhasil! Pengaturan wilayah telah disimpan.'}
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>
            {statusMessage || 'Gagal menyimpan.'} Pastikan tabel <code className="text-xs bg-red-100 px-1 rounded">app_settings</code> sudah dibuat di Supabase menggunakan file <code className="text-xs bg-red-100 px-1 rounded">supabase/schema.sql</code>.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 p-6 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pb-2 border-b border-gray-100">
              Identitas Wilayah
            </h3>
            {(
              [
                { key: 'village_name', label: 'Nama Desa / Kelurahan', placeholder: 'cth: Labuhan Maringgai' },
                { key: 'district_name', label: 'Kecamatan', placeholder: 'cth: Labuhan Maringgai' },
                { key: 'city_name', label: 'Kabupaten / Kota', placeholder: 'cth: Lampung Timur' },
                { key: 'province_name', label: 'Provinsi', placeholder: 'cth: Lampung' },
              ] as { key: keyof AppSettings; label: string; placeholder: string }[]
            ).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
                  {label}
                </label>
                <input
                  type="text"
                  value={settings[key] as string}
                  onChange={(e) => handleIdentityChange(key as IdentityKey, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-primary-600 bg-gray-50 transition-colors"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={handleCenterFromIdentity}
              disabled={geocoding}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-primary-100 bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-widest hover:border-primary-300 disabled:opacity-60 transition-colors"
            >
              {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              {geocoding ? 'Mencari Lokasi...' : 'Cari & Pusatkan dari Identitas'}
            </button>
            {locationMessage && (
              <p className="text-[11px] leading-relaxed text-primary-700 bg-primary-50 border border-primary-100 px-3 py-2">
                {locationMessage}
              </p>
            )}
          </div>

          <div className="bg-white border border-gray-200 p-6 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pb-2 border-b border-gray-100">
              Titik Pusat (Balai Desa / Kantor)
            </h3>
            <p className="text-[11px] text-gray-400">Koordinat ini menentukan posisi tengah kamera peta saat pertama kali dibuka.</p>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                value={settings.center_lat}
                onChange={(e) => handleNumberChange('center_lat', e.target.valueAsNumber)}
                className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-primary-600 bg-gray-50 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                value={settings.center_lng}
                onChange={(e) => handleNumberChange('center_lng', e.target.valueAsNumber)}
                className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-primary-600 bg-gray-50 font-mono"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pb-2 border-b border-gray-100">
              Radius Cadangan
            </h3>
            <p className="text-[11px] text-gray-400">
              Digunakan sebagai validasi Geofencing jika Anda <strong>belum menggambar batas polygon</strong> pada peta di sebelah kanan.
            </p>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
                Radius (meter)
              </label>
              <input
                type="number"
                min={100}
                value={settings.fallback_radius_m}
                onChange={(e) => handleNumberChange('fallback_radius_m', e.target.valueAsNumber)}
                className="w-full px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-primary-600 bg-gray-50 font-mono"
              />
            </div>
          </div>

          <div className={`p-4 border text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 ${hasPolygon ? 'bg-green-50 border-green-100 text-green-700' : 'bg-yellow-50 border-yellow-100 text-yellow-700'}`}>
            <Map className="w-4 h-4 shrink-0" />
            {hasPolygon ? `Poligon aktif (${polygonPoints} titik sudut)` : 'Belum ada poligon - gambar di peta kanan'}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white border border-gray-200 overflow-hidden" style={{ minHeight: 560 }}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Kanvas Pemetaan Wilayah</h3>
              <p className="text-xs text-gray-400 mt-0.5">Isi Identitas Wilayah lalu klik Cari & Pusatkan; batas dan titik pusat akan terisi otomatis. Polygon manual tetap tersedia untuk koreksi lapangan.</p>
            </div>
          </div>
          <div className="h-[500px] w-full">
            <AdminMapDrawer
              center={mapCenter}
              existingPolygon={settings.boundary_geojson}
              onCenterChange={(center) => {
                handleChange('center_lat', center[0]);
                handleChange('center_lng', center[1]);
              }}
              onPolygonChange={handlePolygonChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
