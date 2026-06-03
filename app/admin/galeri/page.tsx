'use client';
import { useEffect, useState } from 'react';
import { Camera, Plus, RefreshCw, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { fetchJson } from '@/lib/api-client';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { GalleryItem } from '@/lib/types';

const EMPTY_FORM = { title: '', category: 'Lainnya', date: '', image_url: '' };

export default function AdminGaleriPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setGallery(await fetchJson<GalleryItem[]>('/api/gallery', []));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
    setError('');
  }

  function startEdit(item: GalleryItem) {
    setForm({ title: item.title, category: item.category, date: item.date, image_url: item.image_url });
    setEditId(item.id);
    setShowForm(true);
    setError('');
  }

  async function save() {
    if (!form.title.trim()) return setError('Nama kegiatan wajib diisi.');
    if (!form.image_url.trim()) return setError('URL gambar wajib diisi.');
    setSaving(true);
    setError('');
    const payload = { ...form, date: form.date || new Date().toISOString().slice(0, 10) };
    const res = await fetch('/api/gallery', {
      method: editId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Gagal menyimpan galeri.');
      setSaving(false);
      return;
    }
    setSaving(false);
    setShowForm(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Hapus foto galeri ini?')) return;
    const res = await fetch(`/api/gallery?id=${id}`, { method: 'DELETE' });
    if (res.ok) setGallery((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-primary-900 border-l-4 border-primary-600 pl-4">Galeri Kegiatan</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-5">Manajemen dokumentasi foto desa</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-3 border border-gray-200 hover:bg-gray-50 transition-colors"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
          <button onClick={startCreate} className="flex items-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors">
            <Plus className="w-4 h-4" /> Unggah Foto Baru
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 p-8 mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2"><Camera className="w-4 h-4" /> {editId ? 'Edit Foto' : 'Tambah Foto'}</h3>
          {error && <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-widest bg-red-50 border border-red-200 p-4 mb-6"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Nama Kegiatan" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} />
            <Input label="Kategori" value={form.category} onChange={(value) => setForm((prev) => ({ ...prev, category: value }))} />
            <Input label="Tanggal" type="date" value={form.date} onChange={(value) => setForm((prev) => ({ ...prev, date: value }))} />
            <div className="sm:col-span-2">
              <ImageUpload label="Foto Kegiatan" folder="gallery" value={form.image_url} onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))} />
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-3 border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50">Batal</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg border-b border-gray-200">
            <tr>{['Foto', 'Nama Kegiatan', 'Kategori', 'Tanggal', 'Aksi'].map((h) => <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
            ) : gallery.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Belum ada foto galeri.</td></tr>
            ) : gallery.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="relative w-16 h-12 bg-gray-100 border border-gray-200 overflow-hidden">
                    <Image src={item.image_url || '/file.svg'} alt={item.title} fill className="object-cover" />
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-primary-900">{item.title}</td>
                <td className="px-6 py-4 text-gray-600">{item.category}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(item)} className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(item.id)} className="p-2 border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50" />
    </div>
  );
}
