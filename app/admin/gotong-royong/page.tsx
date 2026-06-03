'use client';
import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Loader2, AlertCircle, RefreshCw, Pencil } from 'lucide-react';
import { CardGridSkeleton } from '@/components/ui/Skeletons';
import { useTranslations } from 'next-intl';
import { fetchJson } from '@/lib/api-client';


type Action = {
  id: string; title: string; description: string; category: string;
  date: string | null; time: string | null; location: string | null;
  max_participants: number; current_participants: number; status: string; created_at: string;
};

const EMPTY = { title: '', description: '', category: 'Lingkungan', date: '', time: '08:00', location: '', max_participants: 20, current_participants: 0, status: 'open' };
const STATUS_COLOR: Record<string, string> = { open: 'bg-green-50 text-green-700', full: 'bg-amber-50 text-amber-700', done: 'bg-gray-100 text-gray-600' };

export default function AdminGotongRoyongPage() {
  const t = useTranslations('admin_gotong_royong');
  const STATUS_LABEL: Record<string, string> = { open: t('status_open'), full: t('status_full'), done: t('status_done') };
  
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setActions(await fetchJson('/api/actions', []));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title) return;
    setSaving(true); setError('');
    const payload = { ...form, max_participants: Number(form.max_participants), current_participants: Number(form.current_participants) };
    const res = await fetch('/api/actions', {
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
      setActions(prev => prev.map(a => a.id === editId ? { ...a, ...saved } as any : a));
    } else {
      setActions(prev => [saved as any, ...prev]);
    }
    setSaving(false); setShowForm(false); setEditId(null); setForm(EMPTY);
  }

  async function del(id: string) {
    if (!confirm(t('confirm_delete'))) return;
    const res = await fetch(`/api/actions?id=${id}`, { method: 'DELETE' });
    if (res.ok) setActions(prev => prev.filter(a => a.id !== id));
    else setError('Gagal menghapus data.');
  }

  async function changeStatus(id: string, status: string) {
    const res = await fetch('/api/actions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) setActions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    else setError('Gagal memperbarui status.');
  }

  function startEdit(a: Action) {
    setForm({ title: a.title, description: a.description, category: a.category, date: a.date ?? '', time: a.time ?? '', location: a.location ?? '', max_participants: a.max_participants, current_participants: a.current_participants, status: a.status });
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
            <Plus className="w-4 h-4" /> {t('add_activity')}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 p-8 mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-6">{editId ? t('edit_activity') : t('new_activity')}</h3>
          {error && <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-widest bg-red-50 border border-red-200 p-4 mb-6"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_title')}</label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors" />
            </div>
            {[
              { label: t('lbl_location'), key: 'location' }, { label: t('lbl_time'), key: 'time', placeholder: '08:00' },
              { label: t('lbl_date'), key: 'date', placeholder: 'YYYY-MM-DD' },
              { label: t('lbl_max_participants'), key: 'max_participants', type: 'number' },
              { label: t('lbl_current_participants'), key: 'current_participants', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{f.label}</label>
                <input type={f.type ?? 'text'} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors" />
              </div>
            ))}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_category')}</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors">
                <option value="Lingkungan">{t('cat_env')}</option>
                <option value="Infrastruktur">{t('cat_infra')}</option>
                <option value="Sosial">{t('cat_social')}</option>
                <option value="Pendidikan">{t('cat_edu')}</option>
                <option value="Kesehatan">{t('cat_health')}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_status')}</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors">
                {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_desc')}</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors resize-none" />
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
              <tr>{[t('col_activity'), t('col_category'), t('col_date'), t('col_participants'), t('col_status'), t('col_action')].map(h => (
                <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {actions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">{t('empty')}</td></tr>
              ) : actions.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-primary-900 max-w-[200px] truncate">{a.title}</td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    {a.category === 'Lingkungan' ? t('cat_env') :
                     a.category === 'Infrastruktur' ? t('cat_infra') :
                     a.category === 'Sosial' ? t('cat_social') :
                     a.category === 'Pendidikan' ? t('cat_edu') :
                     a.category === 'Kesehatan' ? t('cat_health') : a.category}
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">{a.date ?? '-'}</td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">{a.current_participants}/{a.max_participants}</td>
                  <td className="px-6 py-4">
                    <select value={a.status} onChange={e => changeStatus(a.id, e.target.value)} className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border cursor-pointer outline-none transition-colors ${STATUS_COLOR[a.status].replace('bg-', 'border-').replace('100', '200')} ${STATUS_COLOR[a.status]}`}>
                      {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
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
