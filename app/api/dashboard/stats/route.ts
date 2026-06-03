/**
 * app/api/dashboard/stats/route.ts
 * GET: Aggregated statistics for the admin dashboard.
 * Returns aggregated statistics from Supabase.
 */
import { NextResponse } from 'next/server';
import { countRows, listRows } from '@/lib/api-helpers';
import { listAuthUsers } from '@/lib/auth-server';

export async function GET() {
  try {
    const [total, pending, inProgress, completed, products, reports, users] = await Promise.all([
      countRows('reports'),
      countRows('reports', { status: 'pending' }),
      countRows('reports', { status: 'in_progress' }),
      countRows('reports', { status: 'completed' }),
      listRows('products'),
      listRows('reports'),
      listAuthUsers(),
    ]);

    const totalCount = total ?? 0;
    const pendingCount = pending ?? 0;
    const inProgressCount = inProgress ?? 0;
    const completedCount = completed ?? 0;
    const categoryData = Object.values(
      reports.reduce((acc: Record<string, { category: string; count: number }>, report: any) => {
        const category = report.category ?? 'Lainnya';
        acc[category] ??= { category, count: 0 };
        acc[category].count += 1;
        return acc;
      }, {})
    );

    return NextResponse.json({
      totalReports: totalCount,
      pendingReports: pendingCount,
      inProgressReports: inProgressCount,
      completedReports: completedCount,
      resolutionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      activeUMKM: products.length,
      totalCitizens: users.filter((user) => user.role === 'warga').length,
      categoryData,
      trendData: buildTrendData(reports),
    });
  } catch {
    return NextResponse.json({ totalReports: 0, pendingReports: 0, inProgressReports: 0, completedReports: 0, resolutionRate: 0, activeUMKM: 0, totalCitizens: 0, categoryData: [], trendData: [] }, { status: 500 });
  }
}


function buildTrendData(reports: any[]) {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const rows = reports.filter((report) => {
      const created = new Date(report.created_at);
      return created.getMonth() === month && created.getFullYear() === year;
    });
    return {
      month: labels[month],
      laporan: rows.length,
      selesai: rows.filter((report) => report.status === 'completed').length,
    };
  });
}
