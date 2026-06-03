'use client';
import { useEffect, useState } from 'react';
import { FileBarChart, PieChart, Activity, CheckCircle, Clock, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { formatRupiah } from '@/lib/utils';
import { fetchJson } from '@/lib/api-client';
import type { APBDesa } from '@/lib/types';

const EMPTY_APB_DESA: APBDesa = {
  year: new Date().getFullYear(),
  total_budget: 0,
  realized: 0,
  allocations: [],
  programs: [],
};

export default function APBDesaPage() {
  const t = useTranslations('public_pages');
  const tAuth = useTranslations('auth');
  const tTrans = useTranslations('transparansi');
  
  const [apbdesa, setApbdesa] = useState<APBDesa>(EMPTY_APB_DESA);
  const { year, total_budget, realized, allocations, programs } = apbdesa;
  const progressPercent = total_budget > 0 ? Math.round((realized / total_budget) * 100) : 0;

  const [calcInput, setCalcInput] = useState('');
  const [calcBudget, setCalcBudget] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchJson<APBDesa | null>('/api/apbdesa', null).then((data) => {
      if (mounted && data) setApbdesa(data);
    });
    return () => { mounted = false; };
  }, []);

  function handleCalc(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(calcInput.replace(/[^0-9]/g, ''));
    if (!isNaN(num)) setCalcBudget(num);
  }

  return (
    <div className="min-h-screen bg-bg pt-12 lg:pt-14 pb-12 lg:pb-14 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-primary-700 transition-colors mb-6">
            <ArrowLeft className="w-3 h-3" /> {tAuth('back_home')}
          </Link>
          <div className="p-8 md:p-10 bg-primary-950 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-primary-900 rounded-full blur-3xl opacity-30 -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                  <FileBarChart className="w-8 h-8 text-primary-300" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-semibold mb-2">{t('apbdesa_title')}</h1>
                  <p className="text-primary-300 text-[11px] font-bold uppercase tracking-widest">
                    {t('total_budget')} {year}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Budget Progress */}
        <div className="bg-white border border-gray-200 p-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{t('total_budget')}</p>
              <p className="text-4xl font-bold text-gray-900 tracking-tight">{formatRupiah(total_budget)}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 mb-1">{t('realization_rate')} ({progressPercent}%)</p>
              <p className="text-2xl font-semibold text-gray-800">{formatRupiah(realized)}</p>
            </div>
          </div>

          <div className="w-full h-4 bg-gray-100 mb-2 relative">
            <div 
              className="absolute top-0 left-0 h-full bg-primary-600 transition-all duration-1000" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Allocations & Calculator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Visual Allocations */}
          <div className="bg-white border border-gray-200 p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary-600" /> Breakdown per Bidang
            </h3>
            <div className="space-y-5">
              {allocations.map((a, idx) => {
                const perc = Math.round((a.amount / total_budget) * 100);
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest mb-2">
                      <span className="text-gray-600">{a.category}</span>
                      <span className="text-gray-900">{perc}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2.5 bg-gray-100 relative">
                        <div className={`absolute top-0 left-0 h-full ${a.color}`} style={{ width: `${perc}%` }}></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 min-w-[100px] text-right">
                        {formatRupiah(a.amount)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Calculator */}
          <div className="bg-green-50 border border-green-200 p-8 flex flex-col justify-center">
            <h3 className="text-sm font-bold uppercase tracking-widest text-green-900 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" /> {t('calculator_title')}
            </h3>
            <p className="text-sm text-green-800 mb-6 leading-relaxed">
              {t('calculator_desc')} <br />
              <span className="text-xs italic mt-2 block">{t('sims_warning')}</span>
            </p>
            <form onSubmit={handleCalc} className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="100000000" 
                className="flex-1 px-4 py-3 border border-green-300 text-sm focus:outline-none focus:border-green-600 bg-white"
                value={calcInput}
                onChange={(e) => setCalcInput(e.target.value)}
              />
              <button type="submit" className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors">
                {t('btn_simulate')}
              </button>
            </form>

            {calcBudget && (
              <div className="bg-white p-6 border border-green-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4 border-b pb-3">
                  Distribusi dari {formatRupiah(calcBudget)}:
                </p>
                <div className="space-y-3">
                  {allocations.map((a, idx) => {
                    const perc = a.amount / total_budget;
                    const distributed = calcBudget * perc;
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-700 line-clamp-1 flex-1 pr-4">{a.category}</span>
                        <span className="font-semibold text-green-700">{formatRupiah(distributed)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Programs Table */}
        <div className="bg-white border border-gray-200 p-8 overflow-hidden">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600" /> {tTrans('list_title')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">{tTrans('show_detail')}</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">{tTrans('col_category')}</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">{tTrans('budget')}</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">{tTrans('col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold text-gray-900 whitespace-normal min-w-[200px]">{p.name}</td>
                    <td className="p-4 text-gray-600">{p.category}</td>
                    <td className="p-4 text-right font-semibold text-gray-800">{formatRupiah(p.budget)}</td>
                    <td className="p-4">
                      {p.status === 'Selesai' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-widest border border-green-200"><CheckCircle className="w-3 h-3" /> {tTrans('stat_completed')}</span>}
                      {p.status === 'Berjalan' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest border border-blue-200"><Activity className="w-3 h-3 animate-pulse" /> {tTrans('stat_ongoing')}</span>}
                      {p.status === 'Direncanakan' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest border border-gray-200"><Clock className="w-3 h-3" /> {tTrans('stat_planning')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
