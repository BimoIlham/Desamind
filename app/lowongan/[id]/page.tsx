'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Briefcase, MapPin, Clock, Phone, Building } from 'lucide-react';
import type { Job } from '@/lib/types';
import { fetchJson } from '@/lib/api-client';

export default function LowonganDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchJson<Job | null>(`/api/jobs/${id}`, null).then((data) => {
      if (!mounted) return;
      setJob(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-gray-500">Memuat lowongan...</div>;
  if (!job) notFound();

  const isExpiring = job.deadline ? new Date(job.deadline) <= new Date(Date.now() + 7 * 86400000) : false;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/lowongan" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-900 mb-6 transition">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Lowongan
      </Link>

      <div className="bg-white p-6 sm:p-10 border border-gray-200 shadow-sm flex flex-col mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-bold text-primary-950 text-2xl sm:text-3xl mb-2">{job.title}</h1>
            <p className="text-xs text-primary-600 font-bold uppercase tracking-widest flex items-center gap-2">
              <Building className="w-4 h-4" /> {job.company}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200">{job.type}</span>
            {isExpiring && <span className="text-[10px] font-bold px-3 py-1.5 bg-red-600 text-white uppercase tracking-widest">Segera Ditutup</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-widest text-gray-400 mb-8 pb-6 border-b border-gray-100">
          {job.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{job.location}</span>}
          {job.deadline && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />Tutup: {new Date(job.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
          {job.salary_range && <span className="text-primary-600">{job.salary_range}</span>}
        </div>

        <div className="mb-8">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Deskripsi Pekerjaan</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
        </div>

        {job.requirements && job.requirements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Persyaratan Dasar</h2>
            <ul className="space-y-2.5 bg-gray-50 p-6 border border-gray-100">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0 mt-2" />{req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {job.phone_number && (
          <div className="mt-4">
            <a href={`https://wa.me/${job.phone_number}?text=${encodeURIComponent(`Halo, saya tertarik melamar posisi ${job.title} dari DesaMind.`)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex flex-1 md:flex-none items-center justify-center gap-2 bg-primary-800 hover:bg-primary-950 text-white text-[11px] font-bold uppercase tracking-widest px-8 py-4 transition-colors w-full md:w-auto text-center">
              <Phone className="w-4 h-4" /> Lamar via WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
