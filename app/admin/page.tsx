'use client';
/**
 * app/admin/page.tsx
 * Admin Dashboard — KPI cards, Recharts charts, AI insights.
 * "use client" because Recharts requires browser environment.
 */
import { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Store,
  AlertCircle,
} from 'lucide-react';
import { StatCardSkeleton } from '@/components/ui/Skeletons';
import { fetchJson } from '@/lib/api-client';
import { StatCard } from '@/components/ui/StatCard';
import { AIInsightCard } from '@/components/admin/AIInsightCard';
import { CategoryBarChart, TrendLineChart } from '@/components/admin/DashboardCharts';
import { CategoryBadge, StatusBadge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const emptyDashboardStats = {
  totalReports: 0,
  pendingReports: 0,
  inProgressReports: 0,
  completedReports: 0,
  activeUMKM: 0,
  totalCitizens: 0,
};

function formatCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value;
}

export default function AdminDashboardPage() {
  const t = useTranslations('admin_dashboard');
  const [stats, setStats] = useState(emptyDashboardStats);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      fetchJson('/api/dashboard/stats', emptyDashboardStats),
      fetchJson('/api/reports?limit=5', []),
    ]).then(([statsData, reportsData]) => {
      if (!mounted) return;
      setStats((prev) => ({ ...prev, ...statsData }));
      setRecentReports(reportsData);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);


  const resolutionRate = stats.totalReports > 0 ? Math.round((stats.completedReports / stats.totalReports) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-primary-900 border-l-4 border-primary-600 pl-4">{t('title')}</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-5">{t('welcome')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>{Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}</>
        ) : (
          <>
            <StatCard icon={FileText} label={t('stat_total_reports')} value={stats.totalReports} />
            <StatCard icon={AlertCircle} label={t('stat_pending')} value={stats.pendingReports} />
            <StatCard icon={Clock} label={t('stat_processing')} value={stats.inProgressReports} />
            <StatCard icon={CheckCircle} label={t('stat_resolved')} value={stats.completedReports} />
          </>
        )}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>{Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}</>
        ) : (
          <>
            <StatCard icon={TrendingUp} label={t('stat_resolution_rate')} value={`${resolutionRate}%`} accent />
            <StatCard icon={Store} label={t('stat_active_umkm')} value={stats.activeUMKM} />
            <StatCard icon={Users} label={t('stat_total_citizens')} value={formatCount(stats.totalCitizens)} />
          </>
        )}
      </div>

      {/* Charts + AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CategoryBarChart />
          <TrendLineChart />
        </div>
        <div className="xl:col-span-1">
          <AIInsightCard />
        </div>
      </div>

      {/* Recent Reports Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('recent_reports')}</h3>
          <Link href="/admin/laporan" className="text-[10px] font-bold uppercase tracking-widest text-primary-800 hover:text-primary-950">
            {t('view_all')}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg border-b border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <th className="text-left px-6 py-4">{t('col_title')}</th>
                <th className="text-left px-6 py-4">{t('col_category')}</th>
                <th className="text-left px-6 py-4">{t('col_status')}</th>
                <th className="text-left px-6 py-4">{t('col_reporter')}</th>
                <th className="text-left px-6 py-4">{t('col_time')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentReports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-primary-900">
                    <Link href={`/laporan/${r.id}`} className="hover:text-primary-600 transition-colors line-clamp-1">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
