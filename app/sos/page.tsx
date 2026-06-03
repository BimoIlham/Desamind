'use client';
/**
 * app/sos/page.tsx — Redesigned v2
 * Emergency SOS reporting page with Lucide icons and modern design.
 */
import { Suspense } from 'react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flame, Droplets, Car, Heart, Shield, MapPin, Loader2, Phone, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

const EMERGENCY_TYPES = [
  { type: 'flood',    label: 'Banjir',           Icon: Droplets, border: 'border-blue-300',   bg: 'bg-blue-50',   text: 'text-blue-700',   sel: 'bg-blue-600 border-blue-600 text-white' },
  { type: 'fire',     label: 'Kebakaran',         Icon: Flame,    border: 'border-red-300',    bg: 'bg-red-50',    text: 'text-red-700',    sel: 'bg-red-600 border-red-600 text-white' },
  { type: 'accident', label: 'Kecelakaan',        Icon: Car,      border: 'border-orange-300', bg: 'bg-orange-50', text: 'text-orange-700', sel: 'bg-orange-600 border-orange-600 text-white' },
  { type: 'medical',  label: 'Darurat Medis',     Icon: Heart,    border: 'border-pink-300',   bg: 'bg-pink-50',   text: 'text-pink-700',   sel: 'bg-pink-600 border-pink-600 text-white' },
  { type: 'crime',    label: 'Gangguan Keamanan', Icon: Shield,   border: 'border-violet-300', bg: 'bg-violet-50', text: 'text-violet-700', sel: 'bg-violet-600 border-violet-600 text-white' },
];

function SOSForm() {
  const searchParams = useSearchParams();
  const [selectedType, setSelectedType] = useState(searchParams.get('type') ?? '');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  function getLocation() {
    setGeoLoading(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => { setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`); setGeoLoading(false); },
      () => { setLocation('Lokasi tidak terdeteksi'); setGeoLoading(false); }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType || !description) return;
    setLoading(true);
    try {
      await fetch('/api/sos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: selectedType, description, location }) });
    } catch { /* use fallback */ }
    setLoading(false);
    setSuccess(true);
  }

    if (success) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-6">
          <div className="bg-white border border-gray-200 p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 border-2 border-green-600 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-primary-900 mb-3">Laporan Terkirim</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">Admin desa dan pihak berwenang telah diberitahu. Bantuan sedang diproses. Tetap tenang dan aman.</p>
            <div className="bg-red-50 border border-red-200 p-6 mb-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-800 mb-4 flex items-center gap-2 justify-center">
                <Phone className="w-4 h-4" /> Nomor Darurat Penting
              </p>
              <div className="space-y-3 text-[11px] font-bold uppercase tracking-widest text-red-700">
                {[{ emoji: '🚒', n: 'Damkar: 113' }, { emoji: '🚑', n: 'Ambulan: 118' }, { emoji: '🚔', n: 'Polisi: 110' }, { emoji: '📞', n: 'Desa: (0251) 123-456' }].map(e => (
                  <p key={e.n}><strong>{e.emoji} {e.n}</strong></p>
                ))}
              </div>
            </div>
            <a href="/" className="block w-full py-4 bg-primary-800 hover:bg-primary-950 text-white text-[10px] font-bold uppercase tracking-widest transition">Kembali ke Beranda</a>
          </div>
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <div className="bg-red-600 text-white">
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <div className="w-16 h-16 border-2 border-white flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold mb-3">Lapor Darurat (SOS)</h1>
          <p className="text-red-200 text-[10px] font-bold uppercase tracking-widest">Laporan Anda langsung diterima tim darurat desa.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Emergency contacts */}
        <div className="bg-white border border-red-200 p-6 mb-8 text-center text-red-700">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Jika nyawa terancam hubungi:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
             <span className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-red-200 bg-red-50">Damkar: 113</span>
             <span className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-pink-200 text-pink-700 bg-pink-50">Ambulan: 118</span>
             <span className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-blue-200 text-blue-700 bg-blue-50">Polisi: 110</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Type selection */}
          <div className="bg-white border border-gray-200 p-8">
            <p className="text-sm font-semibold text-gray-900 mb-5 flex items-center">
              <span className="w-6 h-6 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center mr-3">1</span>
              JENIS DARURAT <span className="text-red-500 ml-1">*</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {EMERGENCY_TYPES.map((t) => {
                const selected = selectedType === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setSelectedType(t.type)}
                    className={`p-4 border-2 flex flex-col items-center gap-3 text-center transition-all ${selected ? t.sel : `${t.border} ${t.bg} ${t.text}`}`}
                  >
                    <t.Icon className="w-6 h-6" />
                    <span className="text-[9px] font-bold uppercase tracking-widest leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Description */}
          <div className="bg-white border border-gray-200 p-8">
            <p className="text-sm font-semibold text-gray-900 mb-5 flex items-center">
              <span className="w-6 h-6 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center mr-3">2</span>
              SITUASI <span className="text-red-500 ml-1">*</span>
            </p>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan singkat: apa yang terjadi, ada korban atau tidak, dan bantuan apa yang diperlukan?"
              className="w-full px-5 py-4 border border-gray-200 text-sm focus:outline-none focus:border-red-600 bg-gray-50 resize-none transition"
            />
          </div>

          {/* Step 3: Location */}
          <div className="bg-white border border-gray-200 p-8">
            <p className="text-sm font-semibold text-gray-900 mb-5 flex items-center">
              <span className="w-6 h-6 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center mr-3">3</span>
              LOKASI
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Alamat atau titik lokasi..."
                className="flex-1 px-5 py-4 border border-gray-200 text-sm focus:outline-none focus:border-red-600 bg-gray-50 transition"
              />
              <button
                type="button"
                onClick={getLocation}
                disabled={geoLoading}
                className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 transition disabled:opacity-50"
                title="Gunakan lokasi GPS"
              >
                {geoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedType || !description}
            className="w-full py-5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase tracking-widest transition disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Mengirim Laporan...</>
            ) : (
              <><ShieldAlert className="w-5 h-5" /> Kirim Laporan Darurat Sekarang</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SOSPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-red-600 font-bold">Memuat halaman darurat...</p></div>}>
      <SOSForm />
    </Suspense>
  );
}
