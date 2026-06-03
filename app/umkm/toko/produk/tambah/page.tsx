'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { fetchJson } from '@/lib/api-client';
import { ImageUpload } from '@/components/ui/ImageUpload';

function ProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [saving, setSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: 'Makanan', image_url: '', phone_number: '', stock: '10',
  });

  useEffect(() => {
    if (editId) {
      fetchJson(`/api/products/${editId}?owner=me`, null as any).then((product) => {
        if (!product) return;
        setFormData({
          name: product.name ?? '',
          description: product.description ?? '',
          price: String(product.price ?? ''),
          category: product.category ?? 'Makanan',
          image_url: product.image_url ?? '',
          phone_number: product.phone_number ?? '',
          stock: String(product.stock ?? '10'),
        });
      });
    }
  }, [editId]);

  /** After an image is uploaded, ask the AI to auto-fill product fields. */
  async function runAIGeneration(imageUrl: string) {
    setIsGeneratingAI(true);
    setAiError('');
    try {
      const aiRes = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await aiRes.json().catch(() => ({}));
      if (!aiRes.ok) {
        throw new Error(data.error || 'AI gagal menganalisis gambar.');
      }
      setFormData((prev) => ({
        ...prev,
        name: data.name || prev.name,
        description: data.description || prev.description,
        category: data.category || prev.category,
      }));
    } catch (error) {
      console.error('AI Generation Error', error);
      setAiError(error instanceof Error ? error.message : 'AI gagal menganalisis gambar.');
    } finally {
      setIsGeneratingAI(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.image_url) {
      alert('Gambar produk wajib diunggah.');
      return;
    }
    setSaving(true);
    const payload = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
    };
    const response = await fetch('/api/products', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
    });
    setSaving(false);
    if (response.ok) router.push('/umkm/toko/produk');
    else {
      const data = await response.json().catch(() => ({}));
      alert(data.error || 'Gagal menyimpan produk.');
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/umkm/toko/produk" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-xl font-bold text-gray-800">{editId ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* IMAGE UPLOAD (Supabase Storage) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Gambar Produk *</label>
            <ImageUpload
              folder="products"
              value={formData.image_url}
              onChange={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
              onUploaded={(url) => runAIGeneration(url)}
            />
            {!formData.image_url && (
              <p className="text-[9px] text-red-500 mt-1">Gambar produk wajib diunggah untuk marketplace.</p>
            )}
          </div>

          {/* AI Banner */}
          {isGeneratingAI && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
              <div className="bg-white p-2 rounded-lg border border-indigo-100 shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-800 mb-0.5">Asisten AI Sedang Bekerja</p>
                <p className="text-[13px] text-indigo-600 font-medium">Menganalisis gambar dan menyusun deskripsi produk otomatis...</p>
              </div>
            </div>
          )}

          {aiError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-1">AI tidak mengisi otomatis</p>
              <p className="text-[12px] text-amber-700 leading-relaxed">{aiError}</p>
            </div>
          )}

          <hr className="border-gray-100" />

          {/* Text Inputs */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nama Produk *</label>
              <input type="text" required className="w-full border border-gray-200 p-3.5 text-sm rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-gray-50/50" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Deskripsi</label>
              <textarea className="w-full border border-gray-200 p-3.5 text-sm rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-gray-50/50 h-28 resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Harga (Rp) *</label>
                <input type="number" required min={0} className="w-full border border-gray-200 p-3.5 text-sm rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-gray-50/50" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Stok *</label>
                <input type="number" required min={0} className="w-full border border-gray-200 p-3.5 text-sm rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-gray-50/50" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Kategori *</label>
                <select className="w-full border border-gray-200 p-3.5 text-sm rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-gray-50/50" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  <option>Makanan</option>
                  <option>Kerajinan</option>
                  <option>Pertanian</option>
                  <option>Fashion</option>
                  <option>Jasa</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">No. WhatsApp</label>
                <input type="text" className="w-full border border-gray-200 p-3.5 text-sm rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-gray-50/50" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} placeholder="628xxxxxxxxxx" />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary-800 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors disabled:opacity-50 rounded-xl shadow-md shadow-primary-900/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? 'Simpan Perubahan' : 'Terbitkan Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddProductPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>}>
      <ProductForm />
    </Suspense>
  );
}
