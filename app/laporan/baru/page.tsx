'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Upload, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { isWithinVillage, fetchSettings } from '@/lib/geofence';

const CATEGORIES = ['Infrastruktur', 'Sampah', 'Kesehatan', 'Keamanan', 'Lingkungan', 'Pendidikan', 'Lainnya'];

export default function NewReportPage() {
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  /** Use HTML5 Geolocation API to get current coords */
  async function getLocation() {
    if (!navigator.geolocation) {
      alert('Geolokasi tidak didukung browser ini.');
      return;
    }
    setLocating(true);

    // Fetch dynamic boundary from admin-configured settings
    const settings = await fetchSettings({ refresh: true });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentLat = pos.coords.latitude;
        const currentLng = pos.coords.longitude;

        // Validate using polygon (if set by admin) or radius fallback
        const valid = isWithinVillage(currentLat, currentLng, {
          boundaryCoords: settings.boundary_geojson,
          center: { lat: settings.center_lat, lng: settings.center_lng },
          radiusM: settings.fallback_radius_m,
        });

        if (!valid) {
          alert(`Geofencing Aktif ⛔: Lokasi Anda berada di luar wilayah ${settings.village_name}, ${settings.city_name}. Laporan hanya dapat dibuat dari dalam desa.`);
          setLocating(false);
          return;
        }

        setLat(currentLat);
        setLng(currentLng);
        setLocating(false);
      },
      () => {
        alert('Gagal mendapatkan lokasi. Pastikan izin lokasi sudah diberikan di pengaturan browser/HP Anda.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  /** Call AI classify API route */
  async function classifyWithAI() {
    if (!form.title && !form.description) return;
    setClassifying(true);
    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, description: form.description }),
      });
      const data = await res.json();
      if (data.category) {
        setForm((f) => ({ ...f, category: data.category }));
      }
    } catch {
      // Silently fail — user can select category manually
    } finally {
      setClassifying(false);
    }
  }

  /** Handle image selection preview */
  const [imageFile, setImageFile] = useState<File | null>(null);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  /** Submit the form */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let image_url: string | null = null;

      // Upload image via the unified /api/upload endpoint (Supabase Storage)
      if (imageFile) {
        const body = new FormData();
        body.append('file', imageFile);
        body.append('folder', 'reports');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          image_url = data.url ?? null;
        } else {
          console.error('Image upload failed:', await uploadRes.json().catch(() => ({})));
        }
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, lat, lng, image_url }),
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(`Gagal mengirim laporan: ${errData.error || res.statusText}`);
        return;
      }
      
      setDone(true);
    } catch {
      alert('Gagal mengirim laporan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-14 lg:py-16 text-center">
        <div className="w-16 h-16 bg-green-50 flex items-center justify-center mx-auto mb-4 border border-green-100">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Laporan Terkirim!</h1>
        <p className="text-gray-500 mb-6">
          Laporan Anda telah diterima dan akan segera ditinjau oleh perangkat desa.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/laporan" className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase bg-primary-900 text-white hover:bg-primary-950 transition">
            Lihat Semua Laporan
          </Link>
          <button
            onClick={() => { setDone(false); setForm({ title: '', description: '', category: '' }); setLat(null); setLng(null); setImagePreview(null); }}
            className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            Buat Laporan Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/laporan" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Buat Laporan Baru</h1>
        <p className="text-gray-500 text-sm">Laporkan masalah di sekitar Anda. AI akan membantu mengklasifikasikan laporan Anda.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="bg-white p-6 shadow-sm border border-gray-200">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-3">
            Judul Laporan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Contoh: Jalan rusak di RT 02 dekat balai desa"
            className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-900 bg-gray-50 transition-colors"
          />
        </div>

        {/* Description */}
        <div className="bg-white p-6 shadow-sm border border-gray-200">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-3">
            Deskripsi Masalah <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Jelaskan masalah secara detail. Sudah berapa lama? Dampaknya apa? Siapa saja yang terdampak?"
            className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-900 bg-gray-50 transition-colors resize-none mb-3"
          />
          {/* AI Classify button */}
          {(form.title || form.description) && (
            <button
              type="button"
              onClick={classifyWithAI}
              disabled={classifying}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary-600 hover:text-primary-800 transition-colors"
            >
              {classifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {classifying ? 'AI sedang menganalisis...' : 'Klasifikasi otomatis dengan AI'}
            </button>
          )}
        </div>

        {/* Category */}
        <div className="bg-white p-6 shadow-sm border border-gray-200">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-4">
            Kategori <span className="text-red-500">*</span>
            {form.category && <span className="ml-2 text-[9px] text-primary-600 tracking-normal">(dipilih oleh AI atau manual)</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: cat }))}
                className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                  form.category === cat
                    ? 'bg-primary-900 text-white border-primary-900'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary-900 hover:text-primary-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Image upload */}
        <div className="bg-white p-6 shadow-sm border border-gray-200">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-4">Foto Bukti</label>
          <label className="flex flex-col items-center gap-3 border-2 border-dashed border-gray-200 p-8 cursor-pointer hover:border-primary-900 hover:bg-primary-50 transition-colors">
            {imagePreview ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-300" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Klik untuk upload foto</span>
                <span className="text-[9px] text-gray-400">PNG, JPG hingga 5MB</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        </div>

        {/* Geolocation */}
        <div className="bg-white p-6 shadow-sm border border-gray-200">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-4">Lokasi Kejadian</label>
          <button
            type="button"
            onClick={getLocation}
            disabled={locating}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-700 hover:border-primary-900 hover:text-primary-900 hover:bg-primary-50 transition-colors w-full sm:w-auto"
          >
            {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 text-red-500" />}
            {locating ? 'Mendapatkan lokasi...' : 'Gunakan Lokasi Saat Ini'}
          </button>

          {lat && lng && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-green-50 text-[10px] font-bold uppercase tracking-widest text-green-700 border border-green-100">
              <CheckCircle className="w-3.5 h-3.5" />
              Lokasi didapat: {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !form.title || !form.description || !form.category}
          className="w-full py-4 bg-primary-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-primary-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Mengirim Laporan...
            </>
          ) : (
            'Kirim Laporan'
          )}
        </button>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mt-2">
          Dengan mengirim laporan, Anda setuju dengan{' '}
          <Link href="#" className="text-primary-900 hover:underline">Syarat & Ketentuan</Link> DesaMind.
        </p>
      </form>
    </div>
  );
}
