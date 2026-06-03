'use client';
import { useState, useEffect } from 'react';
import { GraduationCap, Plus, Trash2, Loader2, AlertCircle, RefreshCw, Pencil, Eye, EyeOff } from 'lucide-react';
import { CardGridSkeleton } from '@/components/ui/Skeletons';
import { useTranslations } from 'next-intl';
import { fetchJson } from '@/lib/api-client';
import { ImageUpload } from '@/components/ui/ImageUpload';


type Module = {
  id: string; title: string; description: string | null; category: string;
  level: string; duration_minutes: number; image_url: string | null;
  rating: number; enrolled: number; is_published: boolean; created_at: string;
};

const EMPTY = { title: '', description: '', category: 'Bisnis & Marketing', level: 'Pemula', duration_minutes: 60, image_url: '', rating: 4.5, enrolled: 0, is_published: true };

export default function AdminEdukasiPage() {
  const t = useTranslations('admin_edukasi');
  
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setModules(await fetchJson('/api/training-modules', []));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title) return;
    setSaving(true); setError('');
    const payload = { ...form, duration_minutes: Number(form.duration_minutes), rating: Number(form.rating), enrolled: Number(form.enrolled) };
    const res = await fetch('/api/training-modules', {
      method: editId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Gagal menyimpan data.');
      setSaving(false);
      return;
    }
    const saved = await res.json();
    if (editId) {
      setModules(prev => prev.map(m => m.id === editId ? { ...m, ...saved } as any : m));
    } else {
      setModules(prev => [saved as any, ...prev]);
    }
    setSaving(false); setShowForm(false); setEditId(null); setForm(EMPTY);
  }

  async function del(id: string) {
    if (!confirm(t('confirm_delete'))) return;
    const res = await fetch(`/api/training-modules?id=${id}`, { method: 'DELETE' });
    if (res.ok) setModules(prev => prev.filter(m => m.id !== id));
    else setError('Gagal menghapus data.');
  }

  async function togglePublish(id: string, current: boolean) {
    const res = await fetch('/api/training-modules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_published: !current }),
    });
    if (res.ok) setModules(prev => prev.map(m => m.id === id ? { ...m, is_published: !current } : m));
    else setError('Gagal memperbarui status.');
  }


  function startEdit(m: Module) {
    setForm({ title: m.title, description: m.description ?? '', category: m.category, level: m.level, duration_minutes: m.duration_minutes, image_url: m.image_url ?? '', rating: m.rating, enrolled: m.enrolled, is_published: m.is_published });
    setEditId(m.id); setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-primary-900 border-l-4 border-primary-600 pl-4">{t('title')}</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-5">{t('subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-3 border border-gray-200 hover:bg-gray-50 transition-colors"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); }} className="flex items-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors">
            <Plus className="w-4 h-4" /> {t('add_module')}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 p-8 mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-6">{editId ? t('edit_module') : t('new_module')}</h3>
          {error && <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-widest bg-red-50 border border-red-200 p-4 mb-6"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_title')}</label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors" />
            </div>
            <div className="sm:col-span-2">
              <ImageUpload label={t('lbl_image')} folder="training" value={form.image_url} onChange={(url) => setForm(p => ({ ...p, image_url: url }))} />
            </div>
            {[
              { label: t('lbl_duration'), key: 'duration_minutes', type: 'number' },
              { label: t('lbl_rating'), key: 'rating', type: 'number' }, { label: t('lbl_enrolled'), key: 'enrolled', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{f.label}</label>
                <input type={f.type ?? 'text'} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors" />
              </div>
            ))}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_category')}</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors">
                <option value="Bisnis & Marketing">{t('cat_business')}</option>
                <option value="Pertanian">{t('cat_agri')}</option>
                <option value="Lingkungan">{t('cat_env')}</option>
                <option value="Keuangan">{t('cat_finance')}</option>
                <option value="Kesehatan & Keselamatan">{t('cat_health')}</option>
                <option value="Kerajinan & Seni">{t('cat_crafts')}</option>
                <option value="Teknologi">{t('cat_tech')}</option>
                <option value="Umum">{t('cat_general')}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_level')}</label>
              <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors">
                <option value="Pemula">{t('lvl_beginner')}</option>
                <option value="Menengah">{t('lvl_intermediate')}</option>
                <option value="Lanjutan">{t('lvl_advanced')}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_desc')}</label>
              <textarea value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors resize-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={save} disabled={saving} className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 disabled:opacity-60 transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} {t('btn_save')}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-6 py-3 border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">{t('btn_cancel')}</button>
          </div>
        </div>
      )}

      {loading ? (
        <CardGridSkeleton count={6} cols={3} />
      ) : (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg border-b border-gray-200">
              <tr>{[t('col_title'), t('col_category'), t('col_level'), t('col_duration'), t('col_status'), t('col_action')].map(h => (
                <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {modules.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">{t('empty')}</td></tr>
              ) : modules.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-primary-900 max-w-[200px] truncate">{m.title}</td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    {m.category === 'Bisnis & Marketing' ? t('cat_business') :
                     m.category === 'Pertanian' ? t('cat_agri') :
                     m.category === 'Lingkungan' ? t('cat_env') :
                     m.category === 'Keuangan' ? t('cat_finance') :
                     m.category === 'Kesehatan & Keselamatan' ? t('cat_health') :
                     m.category === 'Kerajinan & Seni' ? t('cat_crafts') :
                     m.category === 'Teknologi' ? t('cat_tech') :
                     m.category === 'Umum' ? t('cat_general') : m.category}
                  </td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border ${m.level === 'Pemula' ? 'bg-green-50 text-green-700 border-green-200' : m.level === 'Menengah' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {m.level === 'Pemula' ? t('lvl_beginner') : m.level === 'Menengah' ? t('lvl_intermediate') : t('lvl_advanced')}
                  </span></td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">{m.duration_minutes}m</td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePublish(m.id, m.is_published)} className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${m.is_published ? 'text-green-600' : 'text-gray-400'}`}>
                      {m.is_published ? <><Eye className="w-4 h-4" />{t('status_published')}</> : <><EyeOff className="w-4 h-4" />{t('status_hidden')}</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(m)} className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => del(m.id)} className="p-2 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
