'use client';
import { useEffect, useState } from 'react';
import { Megaphone, Plus, RefreshCw, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { fetchJson } from '@/lib/api-client';
import type { Announcement } from '@/lib/types';

const EMPTY_FORM = { title: '', category: 'Umum', content: '', date: '', is_important: false };

export default function AdminPengumumanPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setAnnouncements(await fetchJson<Announcement[]>('/api/announcements', []));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
    setError('');
  }

  function startEdit(item: Announcement) {
    setForm({
      title: item.title,
      category: item.category,
      content: item.content,
      date: item.date ? item.date.slice(0, 16) : '',
      is_important: Boolean(item.is_important),
    });
    setEditId(item.id);
    setShowForm(true);
    setError('');
  }

  async function save() {
    if (!form.title.trim()) return setError('Judul pengumuman wajib diisi.');
    setSaving(true);
    setError('');
    const payload = { ...form, date: form.date || new Date().toISOString() };
    const res = await fetch('/api/announcements', {
      method: editId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Gagal menyimpan pengumuman.');
      setSaving(false);
      return;
    }
    setSaving(false);
    setShowForm(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Hapus pengumuman ini?')) return;
    const res = await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
    if (res.ok) setAnnouncements((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-primary-900 border-l-4 border-primary-600 pl-4">Manajemen Pengumuman</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-5">Kelola informasi publik digital desa</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-3 border border-gray-200 hover:bg-gray-50 transition-colors"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
          <button onClick={startCreate} className="flex items-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors">
            <Plus className="w-4 h-4" /> Tambah Pengumuman
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 p-8 mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2"><Megaphone className="w-4 h-4" /> {editId ? 'Edit Pengumuman' : 'Tambah Pengumuman'}</h3>
          {error && <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-widest bg-red-50 border border-red-200 p-4 mb-6"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Judul" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} />
            <Input label="Kategori" value={form.category} onChange={(value) => setForm((prev) => ({ ...prev, category: value }))} />
            <Input label="Tanggal" type="datetime-local" value={form.date} onChange={(value) => setForm((prev) => ({ ...prev, date: value }))} />
            <label className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-7">
              <input type="checkbox" checked={form.is_important} onChange={(event) => setForm((prev) => ({ ...prev, is_important: event.target.checked }))} />
              Tandai Penting
            </label>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Isi Pengumuman</label>
              <textarea value={form.content} onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))} rows={4} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 resize-none" />
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

      <DataTable loading={loading} rows={announcements} onEdit={startEdit} onDelete={remove} />
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

function DataTable({ loading, rows, onEdit, onDelete }: { loading: boolean; rows: Announcement[]; onEdit: (item: Announcement) => void; onDelete: (id: string) => void }) {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-bg border-b border-gray-200">
          <tr>{['Judul', 'Kategori', 'Tanggal', 'Status', 'Aksi'].map((h) => <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr><td colSpan={5} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-12 text-gray-400">Belum ada pengumuman.</td></tr>
          ) : rows.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-semibold text-primary-900">{item.title}</td>
              <td className="px-6 py-4 text-gray-600">{item.category}</td>
              <td className="px-6 py-4 text-gray-500">{new Date(item.date).toLocaleDateString('id-ID')}</td>
              <td className="px-6 py-4">{item.is_important ? 'Penting' : 'Normal'}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(item)} className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-500"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(item.id)} className="p-2 border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
