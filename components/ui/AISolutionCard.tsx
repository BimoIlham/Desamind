'use client';
/**
 * components/ui/AISolutionCard.tsx
 * Displays AI-generated actionable solutions for a given report.
 * Shown on the report detail page below description.
 */
import { useState } from 'react';
import { Sparkles, Loader2, ChevronRight, Lightbulb } from 'lucide-react';

type Suggestion = { step: string; detail: string };

type AISolutionCardProps = {
  reportTitle: string;
  reportDescription: string;
  category: string;
};

/** Fallback solutions per category */
function getFallback(category: string): Suggestion[] {
  const fallbacks: Record<string, Suggestion[]> = {
    Infrastruktur: [
      { step: 'Koordinasi Tim Teknis', detail: 'Hubungi Kepala Seksi Pembangunan untuk penjadwalan survei lapangan dalam 3 hari kerja.' },
      { step: 'Pasang Rambu Peringatan', detail: 'Segera pasang cone/rambu peringatan sementara agar tidak terjadi kecelakaan susulan.' },
      { step: 'Alokasikan Anggaran Darurat', detail: 'Gunakan pos anggaran tak terduga desa untuk perbaikan cepat sambil menunggu tender resmi.' },
    ],
    Sampah: [
      { step: 'Jadwalkan Pengangkutan Tambahan', detail: 'Koordinasi dengan Dinas Kebersihan untuk frekuensi pengangkutan 2x seminggu di titik masalah.' },
      { step: 'Aktivasi Kader Lingkungan', detail: 'Mobilisasi kader RT/RW untuk memimpin kerja bakti darurat di lokasi penumpukan.' },
      { step: 'Sosialisasi Pemilahan Sampah', detail: 'Pasang poster dan lakukan edukasi singkat warga tentang pemilahan organik/anorganik.' },
    ],
    Kesehatan: [
      { step: 'Koordinasi Puskesmas', detail: 'Hubungi Kepala Puskesmas untuk mengirim tenaga kesehatan ke lokasi jika diperlukan.' },
      { step: 'Aktifkan Kader Posyandu', detail: 'Libatkan kader posyandu setempat untuk pemantauan kesehatan warga sekitar.' },
      { step: 'Sosialisasi Pencegahan', detail: 'Buat dan sebarkan leaflet pencegahan kepada warga yang tinggal di area terdampak.' },
    ],
    Keamanan: [
      { step: 'Koordinasi Linmas', detail: 'Tingkatkan frekuensi patroli Linmas di area yang dilaporkan paling tidak 2x per malam.' },
      { step: 'Pasang CCTV atau Lampu', detail: 'Ajukan pengadaan lampu penerangan/CCTV di titik rawan kepada pemerintah desa.' },
      { step: 'Aktifkan Sistem Siskamling', detail: 'Ajak pemuda RT untuk menghidupkan kembali ronda malam secara terjadwal.' },
    ],
    Lingkungan: [
      { step: 'Survei Kondisi Lapangan', detail: 'Tim lingkungan desa segera survei untuk menilai tingkat kerusakan dan risiko yang ada.' },
      { step: 'Aksi Gotong Royong', detail: 'Buat kegiatan gotong royong bersama warga untuk penanganan awal di lokasi masalah.' },
      { step: 'Konsultasi Dinas Lingkungan', detail: 'Laporkan ke Dinas Lingkungan Hidup Kecamatan untuk mendapatkan bantuan teknis.' },
    ],
  };
  return fallbacks[category] ?? [
    { step: 'Verifikasi dan Dokumentasi', detail: 'Admin desa segera melakukan verifikasi lapangan dan dokumentasi foto/video.' },
    { step: 'Tentukan PIC (Penanggungjawab)', detail: 'Tetapkan petugas yang bertanggung jawab untuk menindaklanjuti laporan ini.' },
    { step: 'Informasikan ke Pelapor', detail: 'Berikan update status kepada pelapor dalam 1x24 jam sebagai bentuk responsivitas.' },
  ];
}

export function AISolutionCard({ reportTitle, reportDescription, category }: AISolutionCardProps) {
  const [solutions, setSolutions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function generateSolutions() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: reportTitle, description: reportDescription, category }),
      });
      const data = await res.json();
      setSolutions(data.solutions ?? getFallback(category));
    } catch {
      setSolutions(getFallback(category));
    } finally {
      setLoading(false);
      setGenerated(true);
    }
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-[13px] sm:text-sm">Rekomendasi Solusi AI</h3>
            <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed mt-0.5">Tindakan yang disarankan berdasarkan jenis laporan</p>
          </div>
        </div>
        
        {!generated && (
          <button
            onClick={generateSolutions}
            disabled={loading}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-violet-700 disabled:opacity-60 transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Memproses...' : 'Generate AI'}
          </button>
        )}
      </div>

      {/* Not yet generated state */}
      {!generated && !loading && (
        <div className="text-center py-4 text-sm text-violet-600">
          <Lightbulb className="w-6 h-6 mx-auto mb-2 opacity-60" />
          Klik <strong>"Generate AI"</strong> untuk mendapatkan rekomendasi tindakan dari sistem AI DesaMind.
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-6">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-violet-600">AI sedang menganalisis laporan...</p>
        </div>
      )}

      {/* Solutions list */}
      {generated && !loading && solutions.length > 0 && (
        <div className="space-y-3">
          {solutions.map((sol, i) => (
            <div key={i} className="flex gap-3 bg-white/70 p-3.5 border border-violet-100">
              <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{sol.step}</p>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{sol.detail}</p>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-violet-500 text-center mt-2">
            Dihasilkan oleh DesaMind · Bukan keputusan final pemerintah
          </p>
        </div>
      )}
    </div>
  );
}
