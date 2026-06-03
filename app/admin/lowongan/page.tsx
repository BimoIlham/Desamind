'use client';
import { useState, useEffect } from 'react';
import { Briefcase, Plus, Trash2, Loader2, AlertCircle, RefreshCw, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { CardGridSkeleton } from '@/components/ui/Skeletons';
import { useTranslations } from 'next-intl';
import { fetchJson } from '@/lib/api-client';


type Job = {
  id: string; title: string; company: string; description: string;
  category: string; type: string; location: string | null;
  deadline: string | null; salary_range: string | null;
  phone_number: string | null; is_active: boolean; created_at: string;
};

const EMPTY = { title: '', company: '', description: '', category: 'Industri', type: 'full_time', location: '', deadline: '', salary_range: '', phone_number: '', is_active: true };

export default function AdminLowonganPage() {
  const t = useTranslations('admin_lowongan');
  const TYPE_LABEL: Record<string, string> = { full_time: t('col_type') === 'Tipe' ? 'Full Time' : 'Full Time', part_time: 'Part Time', freelance: 'Freelance', volunteer: 'Volunteer' };
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setJobs(await fetchJson('/api/jobs', []));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title || !form.company) return;
    setSaving(true); setError('');
    const res = await fetch('/api/jobs', {
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
      setJobs(prev => prev.map(j => j.id === editId ? { ...j, ...saved } as any : j));
    } else {
      setJobs(prev => [saved as any, ...prev]);
    }
    setSaving(false); setShowForm(false); setEditId(null); setForm(EMPTY);
  }

  async function del(id: string) {
    if (!confirm(t('confirm_delete'))) return;
    const res = await fetch(`/api/jobs?id=${id}`, { method: 'DELETE' });
    if (res.ok) setJobs(prev => prev.filter(j => j.id !== id));
    else setError('Gagal menghapus data.');
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch('/api/jobs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    });
    if (res.ok) setJobs(prev => prev.map(j => j.id === id ? { ...j, is_active: !current } : j));
    else setError('Gagal memperbarui status.');
  }

  function startEdit(j: Job) {
    setForm({ title: j.title, company: j.company, description: j.description, category: j.category, type: j.type, location: j.location ?? '', deadline: j.deadline ?? '', salary_range: j.salary_range ?? '', phone_number: j.phone_number ?? '', is_active: j.is_active });
    setEditId(j.id); setShowForm(true);
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
            <Plus className="w-4 h-4" /> {t('add_job')}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 p-8 mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-6">{editId ? t('edit_job') : t('new_job')}</h3>
          {error && <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-widest bg-red-50 border border-red-200 p-4 mb-6"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: t('lbl_title'), key: 'title' }, { label: t('lbl_company'), key: 'company' },
              { label: t('lbl_location'), key: 'location' }, { label: t('lbl_deadline'), key: 'deadline', placeholder: 'YYYY-MM-DD' },
              { label: t('lbl_salary'), key: 'salary_range', placeholder: 'Rp 1.000.000 – Rp 2.000.000' },
              { label: t('lbl_phone'), key: 'phone_number', placeholder: '628xxxxxx' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{f.label}</label>
                <input type="text" placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors" />
              </div>
            ))}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_category')}</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors">
                <option value="Industri">{t('cat_industry')}</option>
                <option value="Pemerintah">{t('cat_gov')}</option>
                <option value="Digital">{t('cat_digital')}</option>
                <option value="Pertanian">{t('cat_agri')}</option>
                <option value="Pendidikan">{t('cat_edu')}</option>
                <option value="Kesehatan">{t('cat_health')}</option>
                <option value="Umum">{t('cat_general')}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{t('lbl_type')}</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-gray-50 transition-colors">
                {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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
        <CardGridSkeleton count={4} cols={2} />
      ) : (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg border-b border-gray-200">
              <tr>{[t('col_position'), t('col_company'), t('col_type'), t('col_deadline'), t('col_status'), t('col_action')].map(h => (
                <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">{t('empty')}</td></tr>
              ) : jobs.map(j => (
                <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-primary-900 max-w-[180px] truncate">{j.title}</td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">{j.company}</td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">{TYPE_LABEL[j.type]}</td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">{j.deadline ?? '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleActive(j.id, j.is_active)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                      {j.is_active ? <><ToggleRight className="w-4 h-4 text-green-600" /><span className="text-green-600">{t('status_active')}</span></> : <><ToggleLeft className="w-4 h-4 text-gray-400" /><span className="text-gray-400">{t('status_inactive')}</span></>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(j)} className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => del(j.id)} className="p-2 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
