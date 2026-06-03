'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Settings, Store } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import { fetchJson } from '@/lib/api-client';

export default function StoreSettingsPage() {
  const [store, setStore] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    logo_url: '',
  });

  useEffect(() => {
    let mounted = true;
    fetchJson('/api/stores?owner=me', [] as any[]).then((stores) => {
      if (!mounted) return;
      const currentStore = stores[0] ?? null;
      setStore(currentStore);
      setForm({
        name: currentStore?.name ?? '',
        description: currentStore?.description?.replace(/\n*\s*Alamat:\s*[\s\S]*$/i, '').trim() ?? '',
        address: currentStore?.address ?? currentStore?.description?.match(/\n*\s*Alamat:\s*([\s\S]*)$/i)?.[1]?.trim() ?? '',
        logo_url: currentStore?.logo_url ?? '',
      });
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function submitSettings(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!store?.id) {
      setError('Toko tidak ditemukan.');
      return;
    }

    if (!form.name.trim()) {
      setError('Nama toko wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/stores/${store.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          address: form.address.trim(),
          logo_url: form.logo_url || null,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || 'Gagal menyimpan pengaturan toko.');
        return;
      }

      setStore(data);
      setMessage('Pengaturan toko berhasil disimpan.');
      window.dispatchEvent(new Event('store-change'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[360px] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary-700" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-700 mb-2">Pengaturan Toko</p>
        <h1 className="text-3xl font-semibold text-primary-900 border-l-4 border-primary-600 pl-4">Profil Toko</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-5 mt-2">
          Ubah nama, alamat, deskripsi, dan logo toko yang tampil di marketplace.
        </p>
      </div>

      <form onSubmit={submitSettings} className="bg-white border border-gray-200 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <span className="w-9 h-9 bg-primary-50 border border-primary-100 flex items-center justify-center">
            <Settings className="w-4 h-4 text-primary-700" />
          </span>
          <div>
            <h2 className="font-bold text-gray-900">Identitas Toko</h2>
            <p className="text-xs text-gray-500">Perubahan langsung tersimpan ke database toko Anda.</p>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div className="space-y-5">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Nama Toko *</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-primary-700"
                required
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Deskripsi Toko</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 px-4 py-3 text-sm min-h-32 resize-none focus:outline-none focus:border-primary-700"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Alamat Toko</span>
              <textarea
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full border border-gray-300 px-4 py-3 text-sm min-h-24 resize-none focus:outline-none focus:border-primary-700"
                placeholder="Jalan, RT/RW, desa/kecamatan, atau patokan toko"
              />
            </label>
          </div>

          <div>
            <ImageUpload
              label="Logo Toko"
              folder="stores"
              value={form.logo_url}
              onChange={(url) => setForm((prev) => ({ ...prev, logo_url: url }))}
            />
            <div className="mt-4 flex items-start gap-3 bg-primary-50 border border-primary-100 p-4">
              <Store className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" />
              <p className="text-xs text-primary-900 leading-relaxed">
                Logo akan dipakai sebagai identitas toko di dashboard dan tampilan marketplace.
              </p>
            </div>
          </div>
        </div>

        {(error || message) && (
          <div className="px-6 md:px-8 pb-4">
            {error && <p className="text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-3">{error}</p>}
            {message && <p className="text-sm text-green-700 bg-green-50 border border-green-100 px-4 py-3">{message}</p>}
          </div>
        )}

        <div className="px-6 md:px-8 py-5 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary-800 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
}
