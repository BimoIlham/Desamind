'use client';
import { useEffect, useState } from 'react';
import { Users, RefreshCw, Trash2, ShieldCheck, ShieldOff, Loader2, AlertCircle, Search, CheckCircle } from 'lucide-react';
import { fetchJson } from '@/lib/api-client';
import type { AuthUser } from '@/lib/auth';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif',
  pending: 'Menunggu',
  suspended: 'Dinonaktifkan',
};

export default function AdminWargaPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');

  async function load() {
    setLoading(true);
    setError('');
    const data = await fetchJson<AuthUser[]>('/api/admin/users', []);
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } else {
      setError('Gagal memperbarui status pengguna.');
    }
    setBusyId(null);
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Hapus akun "${name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
    else setError('Gagal menghapus pengguna.');
    setBusyId(null);
  }

  const filtered = users.filter((u) => {
    if (filter !== 'all' && u.status !== filter) return false;
    if (query) {
      const q = query.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    all: users.length,
    active: users.filter((u) => u.status === 'active').length,
    pending: users.filter((u) => u.status === 'pending').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-primary-900 border-l-4 border-primary-600 pl-4">Kelola Warga</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-5">Manajemen akun & moderasi pengguna desa</p>
        </div>
        <button onClick={load} className="p-3 border border-gray-200 hover:bg-gray-50 transition-colors"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
      </div>

      {error && <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-widest bg-red-50 border border-red-200 p-4 mb-6"><AlertCircle className="w-4 h-4" />{error}</div>}

      {/* Stat chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {([
          { key: 'all', label: 'Total Warga', color: 'text-primary-900' },
          { key: 'active', label: 'Aktif', color: 'text-green-700' },
          { key: 'pending', label: 'Menunggu', color: 'text-amber-700' },
          { key: 'suspended', label: 'Dinonaktifkan', color: 'text-red-700' },
        ] as const).map((c) => (
          <button key={c.key} onClick={() => setFilter(c.key)} className={`text-left bg-white border p-4 transition-colors ${filter === c.key ? 'border-primary-400 ring-1 ring-primary-200' : 'border-gray-200 hover:border-gray-300'}`}>
            <p className={`text-2xl font-bold ${c.color}`}>{counts[c.key]}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{c.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau email..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-primary-800 bg-white" />
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg border-b border-gray-200">
            <tr>{['Nama', 'Email', 'Peran', 'Status', 'Aksi'].map((h) => <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Tidak ada warga ditemukan.</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-white text-[11px] font-bold shrink-0">{u.avatar}</div>
                    <span className="font-semibold text-primary-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border ${u.role === 'admin' ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{u.role}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border ${STATUS_BADGE[u.status]}`}>{STATUS_LABEL[u.status]}</span>
                </td>
                <td className="px-6 py-4">
                  {u.role === 'admin' ? (
                    <span className="text-[10px] text-gray-400 italic">Akun admin</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      {busyId === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      ) : (
                        <>
                          {u.status === 'pending' && (
                            <button onClick={() => setStatus(u.id, 'active')} title="Setujui" className="p-2 border border-gray-200 hover:bg-green-50 hover:text-green-600 text-gray-500"><CheckCircle className="w-4 h-4" /></button>
                          )}
                          {u.status === 'active' ? (
                            <button onClick={() => setStatus(u.id, 'suspended')} title="Nonaktifkan" className="p-2 border border-gray-200 hover:bg-amber-50 hover:text-amber-600 text-gray-500"><ShieldOff className="w-4 h-4" /></button>
                          ) : (
                            <button onClick={() => setStatus(u.id, 'active')} title="Aktifkan" className="p-2 border border-gray-200 hover:bg-green-50 hover:text-green-600 text-gray-500"><ShieldCheck className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => remove(u.id, u.name)} title="Hapus" className="p-2 border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-500"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="flex items-center gap-2 text-[11px] text-gray-400 mt-4">
        <Users className="w-3.5 h-3.5" />
        Warga yang mendaftar langsung aktif dan dapat masuk. Gunakan tombol nonaktifkan untuk memblokir akun yang menyalahgunakan layanan.
      </p>
    </div>
  );
}
