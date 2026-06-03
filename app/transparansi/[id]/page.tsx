'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Building2, Calendar, FileText } from 'lucide-react';
import { fetchJson } from '@/lib/api-client';

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

export default function TransparansiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchJson(`/api/projects/${id}`, null).then((data) => {
      if (!mounted) return;
      setProject(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-gray-500">Memuat proyek...</div>;
  if (!project) notFound();

  const budgetPct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/transparansi" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-900 mb-6 transition">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Transparansi
      </Link>

      <div className="bg-white p-6 sm:p-10 border border-gray-200 shadow-sm">
        <div className="flex flex-col mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 mb-2">{project.category}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-950 leading-snug">{project.title}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-100">
          <div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-3">
              <span className="text-gray-400">Progress Pembangunan</span>
              <span className="text-primary-950">{project.progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 overflow-hidden mb-2">
              <div className={`h-full transition-all ${project.progress === 100 ? 'bg-primary-950' : 'bg-primary-600'}`} style={{ width: `${project.progress}%` }} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Anggaran</span>
              <span className="font-bold text-primary-950 text-lg">{formatRupiah(project.budget)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary-600 mb-1">Realisasi ({budgetPct}%)</span>
              <span className="font-bold text-primary-950 text-lg">{formatRupiah(project.spent)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {project.description && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Deskripsi Proyek</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            {project.contractor && (
              <div className="bg-gray-50 p-4 border border-gray-100">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Pelaksana / Kontraktor</span>
                <strong className="text-primary-950 font-bold text-sm">{project.contractor}</strong>
              </div>
            )}
            
            {project.start_date && project.end_date && (
              <div className="bg-gray-50 p-4 border border-gray-100">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Periode Pelaksanaan</span>
                <strong className="text-primary-950 font-bold text-sm">{project.start_date} – {project.end_date}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
