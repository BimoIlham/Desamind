'use client';
import { useState } from 'react';
import { Store, Loader2, CheckCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload } from '@/components/ui/ImageUpload';

export default function DaftarUMKMPage() {
  const [formData, setFormData] = useState({ name: '', description: '', city: '', address: '', logo_url: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        description: formData.description,
        address: formData.address,
        logo_url: formData.logo_url || null,
      }),
    });
    if (res.ok) setSuccess(true);
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Gagal mendaftarkan toko.');
    }
    setLoading(false);
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-bg pt-14 lg:pt-16 pb-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white border border-gray-200 p-10">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-50 border border-green-200 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-primary-900 mb-3">Pendaftaran Berhasil!</h1>
            <p className="text-sm text-gray-500 mb-2">
              Toko <strong className="text-primary-800">{formData.name || 'UMKM Anda'}</strong> telah didaftarkan.
            </p>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Pendaftaran toko Anda menunggu verifikasi admin sebelum dashboard dan produk dapat digunakan.
            </p>
            <Link
              href="/umkm/toko"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors"
            >
              Lihat Status Toko
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-bg pt-14 lg:pt-16 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/umkm" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-primary-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Marketplace
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 mb-4">
            <ShoppingBag className="w-4 h-4 text-primary-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary-700">Daftar Seller</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-950 tracking-tight mb-2">Buka Toko Anda</h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Daftarkan UMKM Anda di marketplace desa secara gratis.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary-900 flex items-center gap-2">
              <Store className="w-4 h-4" />
              Informasi Toko
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nama Toko *</label>
              <input
                type="text"
                required
                maxLength={100}
                className="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-primary-500 transition-colors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="contoh: Toko Keripik"
              />
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Alamat Lengkap Toko *</label>
               <textarea
                 required
                 className="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-primary-500 h-20 resize-none"
                 value={formData.address}
                 onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                 placeholder="Jalan, RT/RW, Patokan Toko"
               />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Deskripsi Toko</label>
              <textarea
                className="w-full border border-gray-300 p-3 text-sm focus:outline-none focus:border-primary-500 transition-colors h-28 resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Jelaskan jenis produk yang dijual..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Logo Toko</label>
              <ImageUpload folder="stores" value={formData.logo_url} onChange={(url) => setFormData({ ...formData, logo_url: url })} />
            </div>

            {/* Info box */}
            <div className="p-4 bg-amber-50 border border-amber-200">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">Catatan</p>
              <ul className="text-xs text-amber-600 space-y-1 leading-relaxed">
                <li>Data toko akan disimpan melalui backend marketplace.</li>
                <li>Setelah mendaftar, admin perlu memverifikasi toko sebelum produk bisa ditambahkan.</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Store className="w-4 h-4" />
                  Daftarkan Toko
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

