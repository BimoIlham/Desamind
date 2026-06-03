'use client';
import { useEffect, useState } from 'react';
import { Landmark, Search, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { fetchJson } from '@/lib/api-client';


type Project = {
  id: string; title: string; category: string; status: string;
  budget: number; spent: number; progress: number;
  description: string | null; contractor: string | null;
  start_date: string | null; end_date: string | null;
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

function getStatusConfig(t: any) {
  return {
    planning:  { label: t('stat_planning'), color: 'bg-gray-100 text-gray-600 border-transparent' },
    ongoing:   { label: t('stat_ongoing'),    color: 'bg-primary-800 text-white border-transparent' },
    completed: { label: t('stat_completed'),     color: 'bg-white text-primary-950 border-gray-200' },
    paused:    { label: t('stat_paused'),     color: 'bg-gray-800 text-white border-transparent' },
  };
}

function ProjectCard({ project, t }: { project: Project; t: any }) {
  const [expanded, setExpanded] = useState(false);
  const budgetPct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
  const STATUS_CONFIG = getStatusConfig(t);
  const status = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.planning;

  return (
    <Link href={`/transparansi/${project.id}`} className="bg-white border border-gray-200 hover:shadow-lg transition-all p-6 md:p-8 block group cursor-pointer">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 mt-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 mb-2">{project.category}</p>
          <h3 className="font-bold text-primary-950 text-xl group-hover:text-primary-700 transition-colors">{project.title}</h3>
        </div>
        <span className={`text-[9px] font-bold px-3 py-1 uppercase tracking-widest border shrink-0 ${status.color}`}>{status.label}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-gray-100 flex-1">
        <div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-3">
            <span className="text-gray-400">{t('progress')}</span>
            <span className="text-primary-950">{project.progress}%</span>
          </div>
          <div className="h-1 bg-gray-100 overflow-hidden">
            <div className={`h-full transition-all ${project.progress === 100 ? 'bg-primary-950' : 'bg-primary-600'}`} style={{ width: `${project.progress}%` }} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">{t('budget')}</span>
            <span className="font-bold text-primary-950">{formatRupiah(project.budget)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary-600 mb-1">{t('spent')} ({budgetPct}%)</span>
            <span className="font-bold text-primary-950">{formatRupiah(project.spent)}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary-600 hover:text-primary-800 transition">
        Lihat Selengkapnya <ChevronUp className="w-3.5 h-3.5 rotate-90" />
      </div>
    </Link>
  );
}

export default function TransparansiPage() {
  const t = useTranslations('transparansi');
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    fetchJson('/api/projects', []).then((data) => {
      if (mounted) setProjects(data);
    });
    return () => { mounted = false; };
  }, []);


  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );
  const totalBudget = projects.reduce((a, p) => a + p.budget, 0);
  const totalSpent = projects.reduce((a, p) => a + p.spent, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-14 lg:py-16">
      <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-8 mb-10">
        <h1 className="text-4xl md:text-[42px] font-semibold text-primary-800 tracking-tight shrink-0 mr-8">
          {t('title_1')}<br />{t('title_2')}
        </h1>
        <div className="flex-1" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full lg:w-auto">
          {[
            { label: t('stat_total'), value: projects.length },
            { label: t('stat_ongoing_count'), value: projects.filter(p => p.status === 'ongoing').length },
            { label: t('stat_budget'), value: formatRupiah(totalBudget) },
            { label: t('stat_spent'), value: formatRupiah(totalSpent) },
          ].map(s => (
            <div key={s.label} className="border-l-2 border-primary-600 pl-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-primary-600 mb-1">{s.label}</div>
              <div className="text-sm font-bold text-primary-950">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8 lg:mb-10 border-b border-gray-200 pb-6 flex justify-between items-center gap-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('list_title')}</div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder={t('search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 text-xs border-transparent focus:border-primary-400 focus:bg-white focus:outline-none transition-all" />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map(proj => <ProjectCard key={proj.id} project={proj as any} t={t} />)}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-3"><Building2 className="w-7 h-7 text-gray-400" /></div>
            <p className="font-semibold text-gray-700">{projects.length === 0 ? t('empty_no_projects') : t('empty_not_found')}</p>
          </div>
        )}
      </div>

    </div>
  );
}
