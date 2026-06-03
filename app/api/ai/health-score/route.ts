import { NextResponse } from 'next/server';
import { countRows, listRows } from '@/lib/api-helpers';
import type { HealthScore, Report } from '@/lib/types';

const REPORT_CATEGORIES = {
  cleanliness: ['Sampah', 'Lingkungan', 'Kebersihan'],
  infrastructure: ['Infrastruktur', 'Jalan', 'Irigasi', 'Lampu'],
  safety: ['Keamanan', 'Bencana', 'Darurat'],
  health: ['Kesehatan', 'Posyandu'],
};

const REVENUE_STATUSES = ['terbayar', 'diproses', 'dikirim', 'selesai'];

export async function GET() {
  return NextResponse.json(await buildHealthScore());
}

export async function POST() {
  const score = await buildHealthScore();

  if (process.env.OPENAI_API_KEY) {
    try {
      const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/';
      const url = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
      const modelName = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

      const context = `
Statistik Desa:
- Laporan: total ${score.source_stats?.reports.total ?? 0}, selesai ${score.source_stats?.reports.completed ?? 0}, proses ${score.source_stats?.reports.in_progress ?? 0}, pending ${score.source_stats?.reports.pending ?? 0}
- Proyek: ${score.source_stats?.projects.total ?? 0}, progres rata-rata ${score.source_stats?.projects.average_progress ?? 0}%
- Kegiatan warga: ${score.source_stats?.community.actions ?? 0}, peserta terdaftar ${score.source_stats?.community.participants ?? 0}
- Ekonomi: toko aktif ${score.source_stats?.economy.active_stores ?? 0}, pesanan produktif ${score.source_stats?.economy.paid_orders ?? 0}, lowongan aktif ${score.source_stats?.economy.active_jobs ?? 0}
- Darurat: aktif ${score.source_stats?.emergency.active ?? 0}, selesai ${score.source_stats?.emergency.resolved ?? 0}
Skor per dimensi: Kebersihan ${score.metrics.cleanliness}, Infrastruktur ${score.metrics.infrastructure}, Keamanan ${score.metrics.safety}, Kesehatan ${score.metrics.health}, Ekonomi ${score.metrics.economy}, Komunitas ${score.metrics.community}.
Skor keseluruhan: ${score.overall}/100 (${score.grade}).
      `;
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 250,
          messages: [
            { role: 'system', content: 'Anda adalah analis pemerintahan desa. Buat analisis naratif singkat (2-3 kalimat) tentang kondisi desa berdasarkan data yang diberikan, sertakan kekuatan utama dan area yang perlu perhatian. Gunakan Bahasa Indonesia yang jelas dan profesional.' },
            { role: 'user', content: context },
          ],
        }),
      });
      const data = await res.json();
      const narrative = data.choices?.[0]?.message?.content;
      if (narrative) return NextResponse.json({ narrative });
    } catch {
      // Use database-derived narrative below.
    }
  }

  return NextResponse.json({ narrative: score.ai_narrative });
}

async function buildHealthScore(): Promise<HealthScore> {
  const [reports, projects, actions, participants, stores, orders, jobs, emergencyAlerts] = await Promise.all([
    listRows<Report>('reports', [], { order: { column: 'created_at', ascending: false } }),
    listRows<any>('projects', [], { order: { column: 'created_at', ascending: false } }),
    listRows<any>('community_actions', [], { order: { column: 'created_at', ascending: false } }),
    listRows<any>('action_participants', [], { order: { column: 'created_at', ascending: false } }),
    listRows<any>('stores', [], { order: { column: 'created_at', ascending: false } }),
    listRows<any>('orders', [], { order: { column: 'created_at', ascending: false } }),
    listRows<any>('jobs', [], { order: { column: 'created_at', ascending: false } }),
    listRows<any>('emergency_alerts', [], { order: { column: 'created_at', ascending: false } }),
  ]);

  const totalReports = reports.length;
  const pendingReports = reports.filter((report) => report.status === 'pending').length;
  const inProgressReports = reports.filter((report) => report.status === 'in_progress').length;
  const completedReports = reports.filter((report) => report.status === 'completed').length;
  const resolutionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 75;

  const projectAverage = projects.length > 0
    ? Math.round(projects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / projects.length)
    : 75;
  const activeStores = stores.filter((store) => store.status === 'active').length;
  const revenueOrders = orders.filter((order) => REVENUE_STATUSES.includes(order.status));
  const activeJobs = jobs.filter((job) => job.is_active !== false).length;
  const activeEmergencies = emergencyAlerts.filter((alert) => ['active', 'handled'].includes(alert.status)).length;
  const resolvedEmergencies = emergencyAlerts.filter((alert) => alert.status === 'resolved').length;

  const metrics = {
    cleanliness: scoreReportsByCategory(reports, REPORT_CATEGORIES.cleanliness, 78),
    infrastructure: Math.round((scoreReportsByCategory(reports, REPORT_CATEGORIES.infrastructure, 76) * 0.55) + (projectAverage * 0.45)),
    safety: clamp(Math.round(scoreReportsByCategory(reports, REPORT_CATEGORIES.safety, 78) - Math.min(35, activeEmergencies * 12) + Math.min(10, resolvedEmergencies * 2))),
    health: Math.round((scoreReportsByCategory(reports, REPORT_CATEGORIES.health, 78) * 0.75) + (participationScore(actions, participants, 'Kesehatan') * 0.25)),
    economy: economyScore(activeStores, revenueOrders.length, activeJobs),
    community: communityScore(actions, participants, resolutionRate),
  };

  const overall = Math.round(Object.values(metrics).reduce((sum, value) => sum + value, 0) / 6);
  const grade =
    overall >= 85 ? 'Sangat Baik' :
    overall >= 70 ? 'Baik' :
    overall >= 55 ? 'Cukup' :
    overall >= 40 ? 'Perlu Perhatian' :
    'Kritis';
  const trend = calculateTrend(reports);
  const sourceStats = {
    reports: {
      total: totalReports,
      pending: pendingReports,
      in_progress: inProgressReports,
      completed: completedReports,
    },
    projects: {
      total: projects.length,
      average_progress: projectAverage,
    },
    community: {
      actions: actions.length,
      participants: participants.length,
    },
    economy: {
      active_stores: activeStores,
      paid_orders: revenueOrders.length,
      active_jobs: activeJobs,
    },
    emergency: {
      active: activeEmergencies,
      resolved: resolvedEmergencies,
    },
  };

  return {
    overall,
    grade,
    metrics,
    trend,
    ai_narrative: buildNarrative(overall, grade, metrics, sourceStats),
    last_updated: latestTimestamp([reports, projects, actions, participants, stores, orders, jobs, emergencyAlerts]),
    source_stats: sourceStats,
  };
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function scoreReportsByCategory(reports: Report[], categories: string[], neutralScore: number) {
  const normalizedCategories = categories.map(normalizeText);
  const relevant = reports.filter((report) => normalizedCategories.some((category) => normalizeText(report.category || '').includes(category)));

  if (relevant.length === 0) return neutralScore;

  const weighted = relevant.reduce((sum, report) => {
    if (report.status === 'completed') return sum + 100;
    if (report.status === 'in_progress') return sum + 58;
    return sum + 22;
  }, 0);

  return clamp(Math.round(weighted / relevant.length));
}

function participationScore(actions: any[], participants: any[], category?: string) {
  const relevantActions = category
    ? actions.filter((action) => normalizeText(action.category || '').includes(normalizeText(category)))
    : actions;

  if (relevantActions.length === 0) return 70;

  const actionIds = new Set(relevantActions.map((action) => action.id));
  const relevantParticipants = participants.filter((participant) => actionIds.has(participant.action_id));
  const capacity = relevantActions.reduce((sum, action) => sum + Number(action.max_participants || 0), 0);
  const ratio = capacity > 0
    ? Math.round((relevantParticipants.length / capacity) * 100)
    : Math.round((relevantActions.reduce((sum, action) => sum + Number(action.current_participants || 0), 0) / Math.max(1, relevantActions.length * 20)) * 100);

  return clamp(45 + Math.round(ratio * 0.55));
}

function economyScore(activeStores: number, revenueOrders: number, activeJobs: number) {
  return clamp(
    45 +
    Math.min(25, activeStores * 6) +
    Math.min(20, revenueOrders * 4) +
    Math.min(10, activeJobs * 2)
  );
}

function communityScore(actions: any[], participants: any[], resolutionRate: number) {
  const participation = participationScore(actions, participants);
  return clamp(Math.round((participation * 0.65) + (resolutionRate * 0.35)));
}

function calculateTrend(reports: Report[]): HealthScore['trend'] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const current = reports.filter((report) => {
    const time = new Date(report.created_at).getTime();
    return now - time <= 30 * day;
  });
  const previous = reports.filter((report) => {
    const time = new Date(report.created_at).getTime();
    return now - time > 30 * day && now - time <= 60 * day;
  });

  const currentRate = current.length > 0 ? current.filter((report) => report.status === 'completed').length / current.length : 0;
  const previousRate = previous.length > 0 ? previous.filter((report) => report.status === 'completed').length / previous.length : currentRate;
  const delta = currentRate - previousRate;

  if (delta > 0.08) return 'naik';
  if (delta < -0.08) return 'turun';
  return 'stabil';
}

function latestTimestamp(groups: any[][]) {
  const timestamps = groups
    .flat()
    .map((row) => new Date(row.updated_at || row.created_at || row.date || Date.now()).getTime())
    .filter(Number.isFinite);

  if (timestamps.length === 0) return new Date().toISOString();
  return new Date(Math.max(...timestamps)).toISOString();
}

function strongestMetric(metrics: HealthScore['metrics']) {
  return Object.entries(metrics).sort((a, b) => b[1] - a[1])[0];
}

function weakestMetric(metrics: HealthScore['metrics']) {
  return Object.entries(metrics).sort((a, b) => a[1] - b[1])[0];
}

function metricLabel(metric: string) {
  return ({
    cleanliness: 'kebersihan',
    infrastructure: 'infrastruktur',
    safety: 'keamanan',
    health: 'kesehatan',
    economy: 'ekonomi',
    community: 'komunitas',
  } as Record<string, string>)[metric] ?? metric;
}

function buildNarrative(
  overall: number,
  grade: HealthScore['grade'],
  metrics: HealthScore['metrics'],
  stats: NonNullable<HealthScore['source_stats']>
) {
  const [strongestKey, strongestValue] = strongestMetric(metrics);
  const [weakestKey, weakestValue] = weakestMetric(metrics);
  return `Indeks ${overall}/100 (${grade}) dihitung dari ${stats.reports.total} laporan warga, ${stats.projects.total} proyek, ${stats.community.actions} kegiatan, ${stats.economy.active_stores} toko aktif, ${stats.economy.paid_orders} pesanan produktif, dan ${stats.emergency.active} data darurat aktif. Dimensi terkuat saat ini adalah ${metricLabel(strongestKey)} (${strongestValue}), sedangkan ${metricLabel(weakestKey)} (${weakestValue}) menjadi prioritas perbaikan berdasarkan data terbaru.`;
}
