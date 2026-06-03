'use client';
/**
 * app/skor-desa/page.tsx — Redesigned v2
 * Village Health Score with radar chart, metric bars, AI narrative.
 */
import { useEffect, useState } from 'react';
import { Activity, Sparkles, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations, useLocale } from 'next-intl';
import { fetchJson } from '@/lib/api-client';
import type { HealthScore } from '@/lib/types';

const EMPTY_HEALTH_SCORE: HealthScore = {
  overall: 0,
  grade: 'Perlu Perhatian',
  metrics: { cleanliness: 0, infrastructure: 0, safety: 0, health: 0, economy: 0, community: 0 },
  trend: 'stabil',
  ai_narrative: 'Belum ada data laporan dan aktivitas desa yang cukup untuk membuat analisis.',
  last_updated: new Date().toISOString(),
};

const RadarChart = dynamic(
  () => import('recharts').then((m) => {
    const { RadarChart: RC, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } = m;
    return function Chart({ labels, score }: { labels: any; score: HealthScore }) {
      const data = [
        { subject: labels.cleanliness,  A: score.metrics.cleanliness },
        { subject: labels.infrastructure, A: score.metrics.infrastructure },
        { subject: labels.safety,    A: score.metrics.safety },
        { subject: labels.health,   A: score.metrics.health },
        { subject: labels.economy,     A: score.metrics.economy },
        { subject: labels.community,   A: score.metrics.community },
      ];
      return (
        <ResponsiveContainer width="100%" height={240}>
          <RC data={data}>
            <PolarGrid stroke="#E4EBF0" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }} />
            <Radar name={labels.score} dataKey="A" stroke="#1FA66C" fill="#1FA66C" fillOpacity={0.2} strokeWidth={2} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #E4EBF0', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((v: number) => [`${v}/100`, labels.score]) as any}
            />
          </RC>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-60 animate-pulse bg-gray-50 border border-gray-100" /> }
);

const GRADE_COLORS: Record<string, string> = {
  'Sangat Baik': 'text-emerald-600',
  'Baik': 'text-primary-600',
  'Cukup': 'text-amber-600',
  'Perlu Perhatian': 'text-orange-600',
  'Kritis': 'text-red-600',
};

const METRICS = [
  { key: 'cleanliness',    labelKey: 'cleanliness',    icon: '🧹' },
  { key: 'infrastructure', labelKey: 'infrastructure', icon: '🏗️' },
  { key: 'safety',         labelKey: 'safety',      icon: '🛡️' },
  { key: 'health',         labelKey: 'health',     icon: '❤️' },
  { key: 'economy',        labelKey: 'economy',       icon: '💼' },
  { key: 'community',      labelKey: 'community',     icon: '🤝' },
];

  function MetricBar({ label, value, icon }: { label: string; value: number; icon: string }) {
    const color = value >= 80 ? 'bg-primary-950' : value >= 60 ? 'bg-primary-700' : value >= 40 ? 'bg-amber-500' : 'bg-red-500';
    return (
      <div className="flex items-center gap-4">
        <span className="text-xl w-8 shrink-0">{icon}</span>
        <div className="flex-1">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
            <span className="text-gray-500">{label}</span>
            <span className="text-primary-950">{value}</span>
          </div>
          <div className="h-1 bg-gray-200 overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
          </div>
        </div>
      </div>
    );
  }

export default function SkorDesaPage() {
  const t = useTranslations('skor_desa');
  const locale = useLocale();
  const [score, setScore] = useState<HealthScore>(EMPTY_HEALTH_SCORE);
  const gradeColor = GRADE_COLORS[score.grade] ?? 'text-primary-600';
  const [regenerating, setRegenerating] = useState(false);
  const [narrative, setNarrative] = useState(score.ai_narrative);

  useEffect(() => {
    let mounted = true;
    fetchJson<HealthScore>('/api/ai/health-score', EMPTY_HEALTH_SCORE).then((data) => {
      if (!mounted) return;
      setScore(data);
      setNarrative(data.ai_narrative);
    });
    return () => { mounted = false; };
  }, []);

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch('/api/ai/health-score', { method: 'POST' });
      const data = await res.json();
      if (data.narrative) setNarrative(data.narrative);
    } catch { /* keep existing */ }
    setRegenerating(false);
  }

  const TrendIcon = score.trend === 'naik' ? TrendingUp : score.trend === 'turun' ? TrendingDown : Minus;
  const sourceStats = score.source_stats;

  return (
    <div className="max-w-5xl mx-auto px-6 py-14 lg:py-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-8 mb-10">
        <h1 className="text-4xl md:text-[42px] font-semibold text-primary-800 tracking-tight shrink-0 mr-8">
          {t('title_1')}<br />{t('title_2')}
        </h1>
        <div className="flex-1" />
        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed max-w-sm text-right hidden lg:block border-r-2 border-primary-600 pr-4">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Score circle card */}
        <div className="bg-white border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
          <div className="relative w-48 h-48 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#F0F4F8" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#133D3A" strokeWidth="8"
                strokeDasharray={`${(score.overall / 100) * 251} 251`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-primary-950">{score.overall}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">/ 100</span>
            </div>
          </div>

          <h2 className={`text-3xl font-bold mb-2 ${gradeColor}`}>{score.grade}</h2>
          <div className="w-12 h-1 bg-gray-200 my-4" />
          <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${gradeColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {t('trend')}: {score.trend.charAt(0).toUpperCase() + score.trend.slice(1)}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-4">
            {t('updated')}: {new Date(score.last_updated).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>

        {/* Radar chart */}
        <div className="bg-white border border-gray-200 p-8 flex flex-col">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> {t('profile_title')}
          </h3>
          <div className="flex-1 -mx-4 -mb-4">
            <RadarChart labels={{
              score: t('score'),
              cleanliness: t('cleanliness'),
              infrastructure: t('infrastructure'),
              safety: t('safety'),
              health: t('health'),
              economy: t('economy'),
              community: t('community')
            }} score={score} />
          </div>
        </div>
      </div>

      {/* Metric bars */}
      <div className="bg-white border border-gray-200 p-8 mb-8">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-8 border-b border-gray-100 pb-4">{t('detail_title')}</h3>
        <div className="space-y-6">
          {METRICS.map((m) => (
            <MetricBar key={m.key} label={t(m.labelKey as any)} value={(score.metrics as Record<string,number>)[m.key]} icon={m.icon} />
          ))}
        </div>
      </div>

      {sourceStats && (
        <div className="bg-white border border-gray-200 p-8 mb-8">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 border-b border-gray-100 pb-4">
            Sumber Data Perhitungan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Laporan Warga', value: sourceStats.reports.total, detail: `${sourceStats.reports.completed} selesai, ${sourceStats.reports.in_progress} proses, ${sourceStats.reports.pending} pending` },
              { label: 'Proyek Desa', value: sourceStats.projects.total, detail: `Rata-rata progres ${sourceStats.projects.average_progress}%` },
              { label: 'Kegiatan Warga', value: sourceStats.community.actions, detail: `${sourceStats.community.participants} peserta terdata` },
              { label: 'Ekonomi Desa', value: sourceStats.economy.active_stores, detail: `${sourceStats.economy.paid_orders} pesanan, ${sourceStats.economy.active_jobs} lowongan aktif` },
              { label: 'Data Darurat', value: sourceStats.emergency.active, detail: `${sourceStats.emergency.resolved} terselesaikan` },
            ].map((item) => (
              <div key={item.label} className="border border-gray-100 bg-gray-50 p-4">
                <p className="text-2xl font-extrabold text-primary-950">{item.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">{item.label}</p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Narrative */}
      <div className="bg-[#EBECE8] p-8 lg:p-12 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8 z-10 relative">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 border border-primary-300 flex items-center justify-center shrink-0 mix-blend-multiply">
               <Sparkles className="w-5 h-5 text-primary-800" />
             </div>
             <div>
               <p className="font-bold text-primary-950 text-base">{t('ai_title')}</p>
               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('ai_subtitle')}</p>
             </div>
          </div>
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="flex items-center gap-2 px-6 py-3 bg-primary-800 hover:bg-primary-950 text-white text-[9px] font-bold uppercase tracking-widest transition disabled:opacity-60"
          >
            {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {regenerating ? t('btn_regenerating') : t('btn_regenerate')}
          </button>
        </div>
        <p className="text-sm font-medium text-primary-900/80 leading-relaxed max-w-4xl z-10 relative pl-14">
          "{narrative}"
        </p>
      </div>
    </div>
  );
}
