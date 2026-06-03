'use client';
import { useState, useEffect } from 'react';
import { Landmark, Plus, Trash2, Loader2, AlertCircle, RefreshCw, Pencil } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/Skeletons';
import { useTranslations } from 'next-intl';
import { fetchJson } from '@/lib/api-client';
import { ImageUpload } from '@/components/ui/ImageUpload';


type Project = {
  id: string;
  title: string;
  category: string;
  status: string;
  budget: number;
  spent: number;
  progress: number;
  description: string | null;
  contractor: string | null;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  created_at: string;
};

const EMPTY: Omit<Project, 'id' | 'created_at'> = {
  title: '', category: 'Infrastruktur', status: 'planning',
  budget: 0, spent: 0, progress: 0, description: '', contractor: '', start_date: '', end_date: '', image_url: '',
};

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

const STATUS_COLOR: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-600', ongoing: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700', paused: 'bg-amber-50 text-amber-700',
};

export default function AdminTransparansiPage() {
  const t = useTranslations('admin_transparansi');
  
  const STATUS_LABEL: Record<string, string> = { 
    planning: t('status_planning'), 
    ongoing: t('status_ongoing'), 
    completed: t('status_completed'), 
    paused: t('status_paused') 
  };

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setProjects(await fetchJson('/api/projects', []));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title) return;
    setSaving(true); setError('');
    const payload = { ...form, budget: Number(form.budget), spent: Number(form.spent), progress: Number(form.progress) };
    const res = await fetch('/api/projects', {
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
      setProjects(prev => prev.map(p => p.id === editId ? { ...p, ...saved } as any : p));
    } else {
      setProjects(prev => [saved as any, ...prev]);
    }
    setSaving(false); setShowForm(false); setEditId(null); setForm(EMPTY);
  }

  async function del(id: string) {
    if (!confirm(t('confirm_delete'))) return;
    const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
    if (res.ok) setProjects(prev => prev.filter(p => p.id !== id));
    else setError('Gagal menghapus data.');
  }

  function startEdit(p: Project) {
    setForm({ title: p.title, category: p.category, status: p.status, budget: p.budget, spent: p.spent, progress: p.progress, description: p.description ?? '', contractor: p.contractor ?? '', start_date: p.start_date ?? '', end_date: p.end_date ?? '', image_url: p.image_url ?? '' });
    setEditId(p.id); setShowForm(true);
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
            <Plus className="w-4 h-4" /> {t('add_project')}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 p-8 mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-6">{editId ? t('edit_project') : t('new_project')}</h3>
          {error && <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-widest bg-red-50 border border-red-200 p-4 mb-6"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: t('lbl_title'), key: 'title', type: 'text' },
              { label: t('lbl_contractor'), key: 'contractor', type: 'text' },
              { label: t('lbl_start_date'), key: 'start_date', type: 'text', placeholder: '2025-01-01' },
              { label: t('lbl_end_date'), key: 'end_date', type: 'text', placeholder: '2025-12-31' },
              { label: t('lbl_budget'), key: 'budget', type: 'number' },
              { label: t('lbl_spent'), key: 'spent', type: 'number' },
              { label: t('lbl_progress'), key: 'progress', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors" />
              </div>
            ))}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_category')}</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors">
                <option value="Infrastruktur">{t('cat_infra')}</option>
                <option value="Pendidikan">{t('cat_edu')}</option>
                <option value="Kesehatan">{t('cat_health')}</option>
                <option value="Sosial">{t('cat_social')}</option>
                <option value="Lingkungan">{t('cat_env')}</option>
                <option value="Ekonomi">{t('cat_econ')}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_status')}</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors">
                {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <ImageUpload label="Foto Proyek" folder="projects" value={form.image_url ?? ''} onChange={(url) => setForm(p => ({ ...p, image_url: url }))} />
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
        <TableSkeleton rows={5} />
      ) : (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg border-b border-gray-200">
              <tr>{[t('col_title'), t('col_category'), t('col_status'), t('col_progress'), t('col_budget'), t('col_action')].map(h => (
                <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">{t('empty')}</td></tr>
              ) : projects.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-primary-900 max-w-[200px] truncate">{p.title}</td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    {p.category === 'Infrastruktur' ? t('cat_infra') :
                     p.category === 'Pendidikan' ? t('cat_edu') :
                     p.category === 'Kesehatan' ? t('cat_health') :
                     p.category === 'Sosial' ? t('cat_social') :
                     p.category === 'Lingkungan' ? t('cat_env') :
                     p.category === 'Ekonomi' ? t('cat_econ') : p.category}
                  </td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border ${STATUS_COLOR[p.status].replace('bg-', 'border-').replace('100', '200')} ${STATUS_COLOR[p.status]}`}>{STATUS_LABEL[p.status]}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3"><div className="w-16 h-1 bg-gray-200"><div className="h-full bg-primary-600" style={{ width: `${p.progress}%` }} /></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{p.progress}%</span></div>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-600">{formatRp(p.budget)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(p)} className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => del(p.id)} className="p-2 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
