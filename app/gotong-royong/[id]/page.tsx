'use client';
/**
 * app/gotong-royong/[id]/page.tsx
 * Community action detail page with join button.
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { use } from 'react';
import { Users, MapPin, Calendar, Clock, ChevronLeft, CheckCircle, Loader2, Share2, UserRound, Mail } from 'lucide-react';
import { fetchJson } from '@/lib/api-client';

export default function GotongRoyongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [action, setAction] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchJson(`/api/actions/${id}`, null),
      fetchJson(`/api/actions/${id}/participants`, []),
    ]).then(([data, participantData]) => {
      if (!mounted) return;
      setAction(data);
      setParticipants(Array.isArray(participantData) ? participantData : []);
      setInitialLoading(false);
    });
    return () => { mounted = false; };
  }, [id]);

  if (initialLoading) return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-sm text-gray-500">Memuat kegiatan...</div>;
  if (!action) notFound();

  const pct = Math.round((action.current_participants / action.max_participants) * 100);

  async function handleJoin() {
    setLoading(true);
    try {
      const response = await fetch(`/api/actions/${id}/participants`, {
        method: 'POST',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.error || 'Gagal mendaftar kegiatan.');
        return;
      }

      setAction((prev: any) => prev ? { ...prev, current_participants: data.current_participants ?? prev.current_participants + 1 } : prev);
      if (data.participant) setParticipants((prev) => [...prev, data.participant]);
      setJoined(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/gotong-royong" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-900 mb-6 transition">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar Kegiatan
      </Link>

      {/* Hero image */}
      <div className="relative h-56 overflow-hidden mb-6 shadow-md border border-gray-200">
        <Image src={action.image_url} alt={action.title} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-white/30">
            {action.category}
          </span>
        </div>
      </div>

      {/* Title & organizer */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{action.title}</h1>
      <p className="text-sm text-gray-500 mb-5">Diorganisir oleh <strong className="text-gray-700">{action.organizer}</strong></p>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { icon: Calendar, label: 'Tanggal', value: new Date(action.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
          { icon: Clock, label: 'Waktu', value: `Pukul ${action.time} WIB` },
          { icon: MapPin, label: 'Lokasi', value: action.location },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 border border-gray-100 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
              <item.icon className="w-3.5 h-3.5 text-primary-900 shrink-0" />
              {item.label}
            </div>
            <div className="text-[11px] font-bold text-gray-800 tracking-wide">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="bg-white p-6 border border-gray-200 shadow-sm mb-5">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Tentang Kegiatan</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
      </div>

      {/* Participation */}
      <div className="bg-white p-6 border border-gray-200 shadow-sm mb-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Peserta</h2>
          <span className="text-[11px] font-bold text-primary-900 tracking-widest">{action.current_participants}/{action.max_participants}</span>
        </div>
        <div className="h-2 bg-gray-100 overflow-hidden mb-3">
          <div className="h-full bg-primary-800 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">{action.max_participants - action.current_participants} tempat tersisa</p>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Daftar Peserta</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{participants.length} terlihat</span>
          </div>

          {participants.length === 0 ? (
            <div className="bg-gray-50 border border-gray-100 p-4 text-sm text-gray-500">
              Detail nama peserta belum tersedia. Data lama hanya menyimpan jumlah peserta, sedangkan pendaftaran baru akan tampil di sini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {participants.map((participant) => {
                const initials = String(participant.name || 'W')
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div key={participant.id || participant.user_id} className="flex items-start gap-3 bg-gray-50 border border-gray-100 p-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center text-[11px] font-bold shrink-0">
                      {initials || <UserRound className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{participant.name || 'Warga'}</p>
                      {participant.email && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          {participant.email}
                        </p>
                      )}
                      {participant.created_at && (
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                          Daftar {new Date(participant.created_at).toLocaleDateString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      {joined ? (
        <div className="flex items-center gap-4 p-5 bg-green-50 border border-green-200 shadow-sm">
          <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-green-900 mb-1">Berhasil Terdaftar!</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-green-700">Anda akan mendapat notifikasi pengingat sehari sebelum kegiatan.</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={handleJoin}
            disabled={loading || action.status !== 'open'}
            className="flex-1 py-4 bg-primary-900 text-white text-[11px] font-bold tracking-widest uppercase hover:bg-primary-950 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Mendaftarkan...</> : '🤝 Ikut Bergabung'}
          </button>
          <button className="p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
