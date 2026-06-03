'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, ChevronDown, Loader2 } from 'lucide-react';
import { StatusBadge, CategoryBadge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { fetchJson } from '@/lib/api-client';

const STATUS_OPTIONS = ['pending', 'in_progress', 'completed'] as const;

export default function AdminLaporanPage() {
  const t = useTranslations('admin_laporan');
  const [reports, setReports] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchJson('/api/reports', []).then((data) => {
      if (!mounted) return;
      setReports(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  async function updateStatus(id: string, status: typeof STATUS_OPTIONS[number]) {
    await fetch(`/api/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => undefined);
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setSelected(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 font-bold text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-primary-900 border-l-4 border-primary-600 pl-4">{t('title')}</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-5">{t('subtitle')}</p>
        </div>
        <Link
          href="/laporan/baru"
          className="px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors"
        >
          {t('add_report')}
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('stat_pending'), count: reports.filter((r) => r.status === 'pending').length, color: 'text-red-700 bg-red-50 border-red-200' },
          { label: t('stat_processing'), count: reports.filter((r) => r.status === 'in_progress').length, color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
          { label: t('stat_resolved'), count: reports.filter((r) => r.status === 'completed').length, color: 'text-green-700 bg-green-50 border-green-200' },
        ].map((s) => (
          <div key={s.label} className={`p-6 border text-center ${s.color}`}>
            <div className="text-3xl font-semibold">{s.count}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest mt-2">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg border-b border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <th className="text-left px-6 py-4">{t('col_report')}</th>
                <th className="text-left px-6 py-4">{t('col_category')}</th>
                <th className="text-left px-6 py-4">{t('col_status')}</th>
                <th className="text-left px-6 py-4">{t('col_reporter')}</th>
                <th className="text-left px-6 py-4">{t('col_time')}</th>
                <th className="text-left px-6 py-4">{t('col_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 max-w-xs">
                    <Link href={`/laporan/${r.id}`} className="font-semibold text-primary-900 hover:text-primary-600 transition-colors line-clamp-1">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <CategoryBadge category={r.category} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">{r.author_name}</td>
                  <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">{formatRelativeTime(r.created_at)}</td>
                  <td className="px-6 py-4 relative">
                    <button
                      onClick={() => setSelected(selected === r.id ? null : r.id)}
                      className="flex items-center gap-1 px-3 py-2 border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-700 hover:border-primary-800 hover:text-primary-800 transition-colors"
                    >
                      {t('btn_edit')} <ChevronDown className="w-3 h-3" />
                    </button>
                    {selected === r.id && (
                      <div className="absolute right-6 mt-2 z-10 bg-white border border-gray-200 overflow-hidden shadow-sm">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(r.id, s)}
                            className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors"
                          >
                            <StatusBadge status={s} />
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reports.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <p>{t('empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
