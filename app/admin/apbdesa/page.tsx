'use client';
import { useEffect, useState } from 'react';
import { AlertCircle, Info, Loader2, PieChart, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { fetchJson } from '@/lib/api-client';
import { formatRupiah } from '@/lib/utils';
import type { APBDesProgram, APBDesa } from '@/lib/types';

type Allocation = APBDesa['allocations'][number];
type RawAPBDesa = Partial<Omit<APBDesa, 'allocations' | 'programs'>> & {
  allocations?: unknown;
  programs?: unknown;
};

const DEFAULT_COLORS = ['#155E55', '#D97706', '#2563EB', '#7C3AED', '#DC2626', '#0891B2', '#16A34A'];
const PROGRAM_STATUSES = ['Direncanakan', 'Berjalan', 'Selesai', 'Ditunda'];

const EMPTY_APB_DESA: APBDesa = {
  year: new Date().getFullYear(),
  total_budget: 0,
  realized: 0,
  allocations: [],
  programs: [],
};

export default function AdminAPBDesaPage() {
  const [data, setData] = useState<APBDesa>(EMPTY_APB_DESA);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const result = await fetchJson<RawAPBDesa | null>('/api/apbdesa', null);
    setData(normalizeApbDesa(result));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const payload: APBDesa = {
        ...data,
        year: Number(data.year) || new Date().getFullYear(),
        total_budget: Number(data.total_budget) || 0,
        realized: Number(data.realized) || 0,
        allocations: data.allocations
          .filter((item) => item.category.trim())
          .map((item, index) => ({
            category: item.category.trim(),
            amount: Number(item.amount) || 0,
            color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
          })),
        programs: data.programs
          .filter((item) => item.name.trim())
          .map((item) => ({
            name: item.name.trim(),
            category: item.category.trim(),
            budget: Number(item.budget) || 0,
            status: item.status || 'Direncanakan',
          })),
      };

      const res = await fetch('/api/apbdesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Gagal menyimpan APBDesa.');
      }
      const saved = await res.json();
      setData(normalizeApbDesa(saved));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan APBDesa.');
    }
    setSaving(false);
  }

  function addAllocation() {
    setData((prev) => ({
      ...prev,
      allocations: [
        ...prev.allocations,
        { category: '', amount: 0, color: DEFAULT_COLORS[prev.allocations.length % DEFAULT_COLORS.length] },
      ],
    }));
  }

  function updateAllocation(index: number, patch: Partial<Allocation>) {
    setData((prev) => ({
      ...prev,
      allocations: prev.allocations.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function removeAllocation(index: number) {
    setData((prev) => ({
      ...prev,
      allocations: prev.allocations.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function addProgram() {
    setData((prev) => ({
      ...prev,
      programs: [...prev.programs, { name: '', category: '', budget: 0, status: 'Direncanakan' }],
    }));
  }

  function updateProgram(index: number, patch: Partial<APBDesProgram>) {
    setData((prev) => ({
      ...prev,
      programs: prev.programs.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function removeProgram(index: number) {
    setData((prev) => ({
      ...prev,
      programs: prev.programs.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  const progress = data.total_budget > 0 ? Math.min(100, Math.round((data.realized / data.total_budget) * 100)) : 0;
  const allocationTotal = data.allocations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const allocationGap = (Number(data.total_budget) || 0) - allocationTotal;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-primary-900 border-l-4 border-primary-600 pl-4">Master Data APBDesa</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-5">Konfigurasi alokasi & realisasi dana desa</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={load} className="p-3 border border-gray-200 hover:bg-gray-50 transition-colors" aria-label="Muat ulang APBDesa">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan APBDesa
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-widest bg-red-50 border border-red-200 p-4 mb-6">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 p-8 mb-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <PieChart className="w-4 h-4" /> Rekapitulasi Anggaran
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Input label="Tahun" type="number" value={String(data.year)} onChange={(value) => setData((prev) => ({ ...prev, year: Number(value) }))} />
          <Input label="Total Anggaran" type="number" value={String(data.total_budget)} onChange={(value) => setData((prev) => ({ ...prev, total_budget: Number(value) }))} />
          <Input label="Realisasi" type="number" value={String(data.realized)} onChange={(value) => setData((prev) => ({ ...prev, realized: Number(value) }))} />
        </div>
        <div className="mt-6">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            <span>{formatRupiah(data.realized)} terserap</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100">
            <div className="h-full bg-primary-600" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-100 p-6 mb-8 flex items-start gap-4">
        <div className="w-10 h-10 flex items-center justify-center bg-white border border-primary-100 text-primary-700 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-primary-950">Konsep Pengisian APBDesa</h2>
          <p className="text-sm text-gray-600">
            Alokasi anggaran adalah pembagian total APBDesa ke bidang besar, misalnya pemerintahan, pembangunan,
            pembinaan, pemberdayaan, atau tak terduga. Data ini dipakai untuk grafik dan ringkasan transparansi.
          </p>
          <p className="text-sm text-gray-600">
            Program APBDesa adalah daftar kegiatan nyata yang dibiayai dari anggaran desa, misalnya pembangunan jalan,
            posyandu, pelatihan UMKM, atau perbaikan drainase. Isi nama program, bidang, anggaran, dan statusnya.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Alokasi Anggaran</h3>
            <p className="text-xs text-gray-500 mt-1">Isi pembagian dana per bidang. Contoh: Pembangunan Desa - Rp 500.000.000.</p>
          </div>
          <button type="button" onClick={addAllocation} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950">
            <Plus className="w-4 h-4" /> Tambah Bidang
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-bg border-b border-gray-200">
              <tr>
                {['Bidang Alokasi', 'Pagu Anggaran', 'Warna Grafik', 'Porsi', 'Aksi'].map((heading) => (
                  <th key={heading} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
              ) : data.allocations.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Belum ada alokasi. Klik Tambah Bidang untuk mulai mengisi.</td></tr>
              ) : data.allocations.map((item, index) => {
                const pct = data.total_budget > 0 ? Math.round((item.amount / data.total_budget) * 100) : 0;
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        value={item.category}
                        onChange={(event) => updateAllocation(index, { category: event.target.value })}
                        placeholder="Contoh: Pembangunan Desa"
                        className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-primary-800"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={String(item.amount)}
                        onChange={(event) => updateAllocation(index, { amount: Number(event.target.value) })}
                        className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-primary-800"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="color"
                        value={item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                        onChange={(event) => updateAllocation(index, { color: event.target.value })}
                        className="w-12 h-10 border border-gray-200 bg-white"
                        aria-label={`Warna grafik ${item.category || index + 1}`}
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="w-full bg-gray-100 h-1.5">
                        <div className="bg-primary-600 h-full" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1 block">{pct}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => removeAllocation(index)} className="p-2 text-red-600 border border-red-100 hover:bg-red-50" aria-label="Hapus alokasi">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between gap-4 flex-wrap text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>Total alokasi: {formatRupiah(allocationTotal)}</span>
          <span className={allocationGap < 0 ? 'text-red-600' : 'text-primary-700'}>
            Selisih dengan total anggaran: {formatRupiah(allocationGap)}
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Program APBDesa</h3>
            <p className="text-xs text-gray-500 mt-1">Isi kegiatan yang dibiayai APBDesa beserta bidang, anggaran, dan status pelaksanaannya.</p>
          </div>
          <button type="button" onClick={addProgram} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950">
            <Plus className="w-4 h-4" /> Tambah Program
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-bg border-b border-gray-200">
              <tr>
                {['Nama Program', 'Bidang', 'Anggaran', 'Status', 'Aksi'].map((heading) => (
                  <th key={heading} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
              ) : data.programs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Belum ada program. Klik Tambah Program untuk mulai mengisi.</td></tr>
              ) : data.programs.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      value={item.name}
                      onChange={(event) => updateProgram(index, { name: event.target.value })}
                      placeholder="Contoh: Pembangunan Jalan Dusun 1"
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-primary-800"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      value={item.category}
                      onChange={(event) => updateProgram(index, { category: event.target.value })}
                      placeholder="Contoh: Pembangunan"
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-primary-800"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={String(item.budget)}
                      onChange={(event) => updateProgram(index, { budget: Number(event.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-primary-800"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={item.status}
                      onChange={(event) => updateProgram(index, { status: event.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-primary-800 bg-white"
                    >
                      {PROGRAM_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button type="button" onClick={() => removeProgram(index)} className="p-2 text-red-600 border border-red-100 hover:bg-red-50" aria-label="Hapus program">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function normalizeApbDesa(value: RawAPBDesa | null | undefined): APBDesa {
  const source = value ?? EMPTY_APB_DESA;
  return {
    year: Number(source.year) || EMPTY_APB_DESA.year,
    total_budget: Number(source.total_budget) || 0,
    realized: Number(source.realized) || 0,
    allocations: parseMaybeArray<Partial<Allocation>>(source.allocations).map((item, index) => ({
      category: String(item.category ?? ''),
      amount: Number(item.amount) || 0,
      color: String(item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]),
    })),
    programs: parseMaybeArray<Partial<APBDesProgram>>(source.programs).map((item) => ({
      name: String(item.name ?? ''),
      category: String(item.category ?? ''),
      budget: Number(item.budget) || 0,
      status: String(item.status || 'Direncanakan'),
    })),
  };
}

function parseMaybeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}
