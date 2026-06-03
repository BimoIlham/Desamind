'use client';
/**
 * app/edukasi/[id]/page.tsx
 * Training module detail page with lesson list.
 */
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { GraduationCap, Star, Users, Clock, ChevronLeft, CheckCircle, PlayCircle, Lock } from 'lucide-react';
import type { TrainingModule } from '@/lib/types';
import { fetchJson } from '@/lib/api-client';

const LEVEL_STYLES: Record<string, string> = {
  Pemula: 'bg-green-100 text-green-700',
  Menengah: 'bg-yellow-100 text-yellow-700',
  Lanjutan: 'bg-red-100 text-red-700',
};

export default function EdukasiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mod, setMod] = useState<TrainingModule | null>(null);
  const [loading, setLoading] = useState(true);

  const [enrolled, setEnrolled] = useState(false);
  useEffect(() => {
    let mounted = true;
    fetchJson<TrainingModule | null>(`/api/training-modules/${id}`, null).then((data) => {
      if (!mounted) return;
      setMod(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-gray-500">Memuat modul...</div>;
  if (!mod) notFound();

  const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];
  const hours = Math.floor(mod.duration_minutes / 60);
  const mins = mod.duration_minutes % 60;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/edukasi" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-900 mb-6 transition">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar Modul
      </Link>

      {/* Hero */}
      <div className="relative h-52 overflow-hidden mb-6 shadow-md border border-gray-200">
        <Image src={mod.image_url || '/file.svg'} alt={mod.title} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 flex gap-2">
          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border ${LEVEL_STYLES[mod.level]}`}>{mod.level}</span>
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white border border-white/30 backdrop-blur-sm">{mod.category}</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{mod.title}</h1>
      <p className="text-sm text-gray-500 mb-4">oleh <strong className="text-gray-700">{mod.instructor}</strong></p>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-5 py-3 border-y border-gray-100">
        <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-accent-700 fill-accent-700" /><strong>{mod.rating.toFixed(1)}</strong></span>
        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{mod.enrolled} peserta</span>
        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{hours > 0 ? `${hours} jam ` : ''}{mins > 0 ? `${mins} menit` : ''}</span>
        <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" />{lessons.length} pelajaran</span>
        <span className="ml-auto text-sm font-bold text-green-600">GRATIS</span>
      </div>

      {/* Description */}
      <div className="bg-white p-6 border border-gray-200 shadow-sm mb-5">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Tentang Modul Ini</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{mod.description}</p>
      </div>

      {/* Lesson list */}
      <div className="bg-white border border-gray-200 shadow-sm mb-6 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Daftar Pelajaran</h2>
          <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{lessons.length} pelajaran</span>
        </div>
        <ul className="divide-y divide-gray-50">
          {lessons.map((lesson, i) => (
            <li key={i} className={`flex items-center gap-4 px-6 py-4 ${enrolled || i === 0 ? 'cursor-pointer hover:bg-gray-50' : 'opacity-60'} transition-colors`}>
              <div className={`w-8 h-8 flex items-center justify-center shrink-0 border ${enrolled || i === 0 ? 'bg-primary-900 border-primary-900' : 'bg-gray-100 border-gray-200'}`}>
                {enrolled || i === 0
                  ? <PlayCircle className="w-4 h-4 text-white" />
                  : <Lock className="w-3.5 h-3.5 text-gray-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{lesson.title}</p>
                <p className="text-xs text-gray-400">{lesson.duration} menit</p>
              </div>
              {(enrolled || i === 0) && <CheckCircle className="w-4 h-4 text-primary-900 opacity-40 shrink-0" />}
            </li>
          ))}
        </ul>
      </div>

      {/* Enroll CTA */}
      {enrolled ? (
        <div className="bg-green-50 border border-green-200 p-6 text-center shadow-sm">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-green-800">Anda Sudah Terdaftar!</p>
          <p className="text-[10px] tracking-widest text-green-600 mt-2 uppercase">Klik pelajaran di atas untuk mulai belajar.</p>
        </div>
      ) : (
        <button
          onClick={() => setEnrolled(true)}
          className="w-full py-4 bg-primary-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <GraduationCap className="w-4 h-4" /> Daftarkan Diri — Gratis!
        </button>
      )}
    </div>
  );
}
