'use client';
import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Loader2, AlertCircle, RefreshCw, Pencil, Eye, EyeOff } from 'lucide-react';
import { CardGridSkeleton } from '@/components/ui/Skeletons';
import { useTranslations } from 'next-intl';
import { fetchJson } from '@/lib/api-client';
import { ImageUpload } from '@/components/ui/ImageUpload';


type Article = {
  id: string; title: string; excerpt: string | null; content: string | null;
  category: string; author: string; image_url: string | null; is_published: boolean; created_at: string;
};

const EMPTY = { title: '', excerpt: '', content: '', category: 'Umum', author: 'Admin DesaMind', image_url: '', is_published: true };

export default function AdminKomunitasPage() {
  const t = useTranslations('admin_komunitas');
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setArticles(await fetchJson('/api/articles', []));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title) return;
    setSaving(true); setError('');
    const res = await fetch('/api/articles', {
      method: editId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editId ? { id: editId, ...form } : form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Gagal menyimpan data.');
      setSaving(false);
      return;
    }
    const saved = await res.json();
    if (editId) {
      setArticles(prev => prev.map(a => a.id === editId ? { ...a, ...saved } as any : a));
    } else {
      setArticles(prev => [saved as any, ...prev]);
    }
    setSaving(false); setShowForm(false); setEditId(null); setForm(EMPTY);
  }

  async function del(id: string) {
    if (!confirm(t('confirm_delete'))) return;
    const res = await fetch(`/api/articles?id=${id}`, { method: 'DELETE' });
    if (res.ok) setArticles(prev => prev.filter(a => a.id !== id));
    else setError('Gagal menghapus data.');
  }

  async function togglePublish(id: string, current: boolean) {
    const res = await fetch('/api/articles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_published: !current }),
    });
    if (res.ok) setArticles(prev => prev.map(a => a.id === id ? { ...a, is_published: !current } : a));
    else setError('Gagal memperbarui status.');
  }


  function startEdit(a: Article) {
    setForm({ title: a.title, excerpt: a.excerpt ?? '', content: a.content ?? '', category: a.category, author: a.author, image_url: a.image_url ?? '', is_published: a.is_published });
    setEditId(a.id); setShowForm(true);
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
            <Plus className="w-4 h-4" /> {t('add_article')}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 p-8 mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-6">{editId ? t('edit_article') : t('new_article')}</h3>
          {error && <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-widest bg-red-50 border border-red-200 p-4 mb-6"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_title')}</label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_author')}</label>
              <input type="text" value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_category')}</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors">
                <option value="Umum">{t('cat_general')}</option>
                <option value="Pertanian">{t('cat_agri')}</option>
                <option value="Kesehatan">{t('cat_health')}</option>
                <option value="Pendidikan">{t('cat_edu')}</option>
                <option value="Teknologi">{t('cat_tech')}</option>
                <option value="UMKM">{t('cat_umkm')}</option>
                <option value="Lingkungan">{t('cat_env')}</option>
                <option value="Budaya">{t('cat_culture')}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <ImageUpload label={t('lbl_image')} folder="articles" value={form.image_url} onChange={(url) => setForm(p => ({ ...p, image_url: url }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_excerpt')}</label>
              <textarea value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} rows={2} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_content')}</label>
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={6} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors resize-none" />
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
              <tr>{[t('col_title'), t('col_category'), t('col_author'), t('col_date'), t('col_status'), t('col_action')].map(h => (
                <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {articles.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">{t('empty')}</td></tr>
              ) : articles.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-primary-900 max-w-[220px] truncate">{a.title}</td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    {a.category === 'Umum' ? t('cat_general') :
                     a.category === 'Pertanian' ? t('cat_agri') :
                     a.category === 'Kesehatan' ? t('cat_health') :
                     a.category === 'Pendidikan' ? t('cat_edu') :
                     a.category === 'Teknologi' ? t('cat_tech') :
                     a.category === 'UMKM' ? t('cat_umkm') :
                     a.category === 'Lingkungan' ? t('cat_env') :
                     a.category === 'Budaya' ? t('cat_culture') : a.category}
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">{a.author}</td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">{new Date(a.created_at).toLocaleDateString(t('col_title') === 'Title' ? 'en-US' : 'id-ID')}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePublish(a.id, a.is_published)} className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${a.is_published ? 'text-green-600' : 'text-gray-400'}`}>
                      {a.is_published ? <><Eye className="w-4 h-4" />{t('status_published')}</> : <><EyeOff className="w-4 h-4" />{t('status_draft')}</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(a)} className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => del(a.id)} className="p-2 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
