'use client';
/**
 * components/admin/AIInsightCard.tsx
 * Displays database-derived insights for the admin dashboard.
 */
import { useEffect, useMemo, useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, Inbox, type LucideIcon } from 'lucide-react';
import { fetchJson } from '@/lib/api-client';

const typeStyles = {
  warning: 'border-l-4 border-l-amber-500 bg-amber-50 border-y border-r border-gray-200 text-amber-900',
  alert: 'border-l-4 border-l-red-500 bg-red-50 border-y border-r border-gray-200 text-red-900',
  success: 'border-l-4 border-l-green-500 bg-green-50 border-y border-r border-gray-200 text-green-900',
  empty: 'border-l-4 border-l-gray-300 bg-gray-50 border-y border-r border-gray-200 text-gray-600',
};

type Insight = {
  type: keyof typeof typeStyles;
  icon: LucideIcon;
  message: string;
};

type DashboardStats = {
  totalReports: number;
  pendingReports: number;
  resolutionRate: number;
  categoryData: { category: string; count: number }[];
};

export function AIInsightCard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchJson<DashboardStats | null>('/api/dashboard/stats', null).then((data) => {
      if (mounted) setStats(data);
    });
    return () => { mounted = false; };
  }, []);

  const insights = useMemo<Insight[]>(() => {
    if (!stats || stats.totalReports === 0) {
      return [{
        type: 'empty',
        icon: Inbox,
        message: 'Belum ada data laporan untuk dianalisis. Insight akan muncul setelah warga membuat laporan.',
      }];
    }

    const result: Insight[] = [];
    if (stats.pendingReports > 0) {
      result.push({
        type: 'warning',
        icon: AlertTriangle,
        message: `${stats.pendingReports} laporan masih menunggu penanganan. Prioritaskan verifikasi awal dari dashboard laporan.`,
      });
    }
    if (stats.resolutionRate >= 80) {
      result.push({
        type: 'success',
        icon: CheckCircle,
        message: `Tingkat penyelesaian laporan mencapai ${stats.resolutionRate}%. Pertahankan ritme tindak lanjut ini.`,
      });
    }
    const topCategory = [...(stats.categoryData ?? [])].sort((a, b) => b.count - a.count)[0];
    if (topCategory) {
      result.push({
        type: 'alert',
        icon: AlertTriangle,
        message: `Kategori paling banyak saat ini adalah ${topCategory.category} dengan ${topCategory.count} laporan.`,
      });
    }

    return result.length ? result : [{
      type: 'empty',
      icon: Inbox,
      message: 'Data tersedia, tetapi belum ada pola khusus yang perlu ditindaklanjuti.',
    }];
  }, [stats]);

  return (
    <div className="bg-white p-6 border border-gray-200">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 border border-primary-200 bg-primary-50 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-800" />
        </div>
        <div>
          <h3 className="font-semibold text-primary-950 text-sm">AI Decision Support</h3>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">Insight berbasis data</p>
        </div>
        <span className="ml-auto text-[9px] font-bold uppercase tracking-widest px-3 py-1 border border-gray-200 bg-gray-50 text-gray-600">
          DB
        </span>
      </div>

      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div key={i} className={`p-4 ${typeStyles[insight.type]}`}>
            <div className="flex gap-3">
              <insight.icon className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs leading-relaxed font-medium">{insight.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-6 pt-4 border-t border-gray-100 text-center">
        Diperbarui dari data database
      </p>
    </div>
  );
}
