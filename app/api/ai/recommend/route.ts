/**
 * app/api/ai/recommend/route.ts
 * POST: Generate actionable solution recommendations for a village report.
 * Uses OpenAI or keyword-based local fallback.
 */
import { NextRequest, NextResponse } from 'next/server';

type Suggestion = { step: string; detail: string };

const FALLBACKS: Record<string, Suggestion[]> = {
  Infrastruktur: [
    { step: 'Koordinasi Tim Teknis', detail: 'Hubungi Kepala Seksi Pembangunan untuk penjadwalan survei lapangan dalam 3 hari kerja.' },
    { step: 'Pasang Rambu Peringatan', detail: 'Segera pasang cone atau rambu sementara agar tidak terjadi kecelakaan susulan di lokasi.' },
    { step: 'Alokasikan Anggaran Darurat', detail: 'Gunakan pos anggaran tak terduga desa untuk perbaikan cepat sambil menunggu tender resmi.' },
  ],
  Sampah: [
    { step: 'Jadwalkan Pengangkutan Tambahan', detail: 'Koordinasi dengan Dinas Kebersihan untuk frekuensi pengangkutan 2x seminggu di titik masalah.' },
    { step: 'Aktivasi Kader Lingkungan', detail: 'Mobilisasi kader RT/RW untuk memimpin kerja bakti darurat di lokasi penumpukan.' },
    { step: 'Sosialisasi Pemilahan Sampah', detail: 'Pasang poster dan edukasi singkat mengenai pemilahan organik/anorganik kepada warga.' },
  ],
  Kesehatan: [
    { step: 'Koordinasi Puskesmas', detail: 'Hubungi Kepala Puskesmas untuk mengirim tenaga kesehatan ke lokasi jika diperlukan.' },
    { step: 'Aktifkan Kader Posyandu', detail: 'Libatkan kader posyandu setempat untuk pemantauan kesehatan warga sekitar area laporan.' },
    { step: 'Distribusi Informasi Pencegahan', detail: 'Buat dan sebarkan leaflet pencegahan kepada warga yang tinggal di area terdampak.' },
  ],
  Keamanan: [
    { step: 'Tingkatkan Patroli Linmas', detail: 'Koordinasikan peningkatan frekuensi patroli Linmas paling tidak 2x per malam di area berisiko.' },
    { step: 'Pemasangan Lampu atau CCTV', detail: 'Ajukan pengadaan lampu penerangan / CCTV di titik rawan kepada pemerintah desa.' },
    { step: 'Aktifkan Siskamling', detail: 'Ajak pemuda RT untuk mengaktifkan kembali ronda malam secara terjadwal dan terkoordinasi.' },
  ],
  Lingkungan: [
    { step: 'Survei Kondisi Lapangan', detail: 'Tim lingkungan desa segera survei untuk menilai tingkat kerusakan dan risiko yang ada.' },
    { step: 'Organisir Gotong Royong', detail: 'Buat kegiatan gotong royong bersama warga untuk penanganan awal secepat mungkin.' },
    { step: 'Konsultasi Dinas Lingkungan', detail: 'Laporkan ke Dinas Lingkungan Hidup Kecamatan untuk mendapatkan dukungan teknis lebih lanjut.' },
  ],
  default: [
    { step: 'Verifikasi dan Dokumentasi', detail: 'Admin desa segera melakukan verifikasi lapangan dan dokumentasi foto/video.' },
    { step: 'Tentukan Penanggungjawab', detail: 'Tetapkan petugas yang bertanggung jawab untuk menindaklanjuti laporan ini.' },
    { step: 'Update Pelapor dalam 24 Jam', detail: 'Berikan update status kepada pelapor dalam 1x24 jam sebagai bentuk responsivitas pemerintah desa.' },
  ],
};

export async function POST(request: NextRequest) {
  const { title, description, category } = await request.json();
  const text = `Masalah: ${title}. Detail: ${description}. Kategori: ${category}.`;

  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          max_tokens: 400,
          messages: [
            {
              role: 'system',
              content: `Anda adalah konsultan pemerintah desa. Berikan TEPAT 3 rekomendasi tindakan konkret untuk menangani laporan warga desa berikut. 
              Format respons HANYA dalam JSON array: [{"step": "Nama Tindakan", "detail": "Penjelasan konkret 1-2 kalimat"}]
              Tidak perlu penjelasan lain di luar JSON. Gunakan Bahasa Indonesia.`,
            },
            { role: 'user', content: text },
          ],
        }),
      });
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content ?? '';
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        const solutions = JSON.parse(match[0]) as Suggestion[];
        return NextResponse.json({ solutions });
      }
    } catch { /* fallthrough */ }
  }

  const solutions = FALLBACKS[category] ?? FALLBACKS.default;
  return NextResponse.json({ solutions });
}
