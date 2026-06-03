'use client';
/**
 * app/prediksi/page.tsx — Redesigned v2
 */
import { useEffect, useState } from 'react';
import { Zap, Loader2, RefreshCw, AlertTriangle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import type { AIPrediction } from '@/lib/types';
import { useTranslations, useLocale } from 'next-intl';

function getRiskConfig(t: any) {
  return {
    Tinggi: { badge: 'bg-red-50 text-red-700 border-red-200',    bar: 'bg-red-500',    border: 'border-red-200', label: t('risk_high') },
    Sedang: { badge: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-500', border: 'border-amber-200', label: t('risk_medium') },
    Rendah: { badge: 'bg-green-50 text-green-700 border-green-200', bar: 'bg-primary-600', border: 'border-gray-200', label: t('risk_low') },
  };
}

function PredictionCard({ pred, t }: { pred: AIPrediction; t: any }) {
  const [expanded, setExpanded] = useState(false);
  const RISK_CONFIG = getRiskConfig(t);
  const conf = RISK_CONFIG[pred.risk_level as keyof typeof RISK_CONFIG] || RISK_CONFIG.Rendah;

  return (
    <div className={`bg-white border p-6 lg:p-8 transition-colors ${conf.border}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-50 flex items-center justify-center text-2xl border border-gray-100 shrink-0">
            {pred.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{pred.title}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{pred.category}</p>
          </div>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border shrink-0 ${conf.badge}`}>
          {t('risk')} {conf.label}
        </span>
      </div>

      {/* Confidence bar */}
      <div className="mb-6">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
          <span className="text-gray-500">{t('confidence')}</span>
          <span className="text-primary-950">{pred.confidence}%</span>
        </div>
        <div className="h-1 bg-gray-200 overflow-hidden">
          <div className={`h-full ${conf.bar}`} style={{ width: `${pred.confidence}%` }} />
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-6">{pred.description}</p>

      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary-800 hover:text-primary-950 transition">
        {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> {t('hide')}</> : <><ChevronDown className="w-3.5 h-3.5" /> {t('view_rec')}</>}
      </button>

      {expanded && (
        <div className="mt-6 p-6 bg-gray-50 border border-gray-200">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary-600" /> {t('action_rec')}
          </p>
          <p className="text-sm text-gray-800 leading-relaxed font-medium">{pred.recommendation}</p>
        </div>
      )}
    </div>
  );
}

export default function PrediksiPage() {
  const t = useTranslations('prediksi');
  const locale = useLocale();
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/predict', { method: 'POST' });
      const data = await res.json();
      if (data.predictions?.length) setPredictions(data.predictions);
      setLastUpdated(new Date());
    } catch { /* keep */ }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-14 lg:py-16">
      {/* Header card */}
      <div className="bg-primary-950 text-white p-8 lg:p-12 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border border-primary-800 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent-500" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary-400">AI Prediction Engine</span>
            </div>
            <h1 className="text-3xl lg:text-[42px] font-semibold mb-3 tracking-tight">{t('title')}</h1>
            <p className="text-primary-300 text-[11px] font-bold uppercase tracking-widest">{t('subtitle')}</p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-3 px-8 py-4 bg-white hover:bg-gray-100 text-primary-950 text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading ? t('analyzing') : t('regenerate')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 border-y border-primary-900 border-opacity-60">
          {[
            { label: t('stat_high'), value: predictions.filter(p => p.risk_level === 'Tinggi').length, color: 'text-red-400' },
            { label: t('stat_medium'), value: predictions.filter(p => p.risk_level === 'Sedang').length, color: 'text-amber-400' },
            { label: t('stat_total'), value: predictions.length, color: 'text-white' },
          ].map((s) => (
            <div key={s.label} className="sm:border-l border-primary-900 border-opacity-60 sm:pl-8 first:border-l-0 first:pl-0">
              <div className={`text-5xl font-semibold mb-3 ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary-400">{s.label}</div>
            </div>
          ))}
        </div>

        <p className="text-[9px] font-bold uppercase tracking-widest text-primary-500 mt-6 md:text-right">
          {t('last_updated')}: {lastUpdated.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US')} · Model: DesaMind v2
        </p>
      </div>

      {/* Warning */}
      <div className="flex items-start md:items-center gap-3 bg-amber-50 border border-amber-200 p-6 mb-8 text-xs text-amber-700 font-bold uppercase tracking-widest leading-relaxed">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>{t('warning')}</p>
      </div>

      {/* Prediction cards */}
      <div className="space-y-6">
        {predictions.sort((a, b) => b.confidence - a.confidence).map((pred) => (
          <PredictionCard key={pred.id} pred={pred} t={t} />
        ))}
      </div>

      {/* Admin CTA */}
      <div className="mt-8 lg:mt-10 bg-gray-50 border border-gray-200 p-8 text-center flex flex-col items-center">
        <TrendingUp className="w-8 h-8 text-primary-800 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('admin_cta_title')}</h3>
        <p className="text-sm text-gray-500 mb-8 max-w-md">{t('admin_cta_desc')}</p>
        <a href="/admin" className="inline-flex items-center gap-2 px-8 py-3 bg-primary-800 hover:bg-primary-950 text-white font-bold uppercase tracking-widest text-[10px] transition">
          {t('admin_cta_btn')}
        </a>
      </div>
    </div>
  );
}
