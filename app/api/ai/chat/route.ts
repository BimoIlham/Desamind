/**
 * app/api/ai/chat/route.ts
 * POST: AI Assistant chat endpoint.
 * Uses Google Gemini SDK if key is available, else returns a rich local fallback response.
 */
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `Anda adalah AI Asisten Desa DesaMind yang ramah dan membantu. 
Tugas Anda adalah membantu warga desa dengan pertanyaan seputar:
- Prosedur administrasi desa (KTP, KK, surat keterangan, dll)
- Layanan kesehatan dan posyandu
- Program bantuan dan UMKM
- Informasi jadwal kegiatan desa
- Cara melaporkan masalah
Selalu gunakan Bahasa Indonesia yang sopan dan mudah dipahami. 
Jika Anda tidak tahu jawabannya, arahkan warga untuk menghubungi kantor desa secara langsung.`;

/** Rich local fallback responses for common questions. */
function localFallback(message: string): string {
  const lower = message.toLowerCase();

  if (/jadwal|jam (buka|layanan|kerja|pelayanan)|office hour|buka(nya)?/.test(lower)) {
    return '🕐 **Jadwal Pelayanan Kantor Desa:**\n\n- **Senin – Kamis:** 08:00 – 15:00 WIB\n- **Jumat:** 08:00 – 11:30 WIB\n- **Sabtu – Minggu & Libur Nasional:** Tutup\n\nUntuk layanan mendesak di luar jam kerja, silakan hubungi langsung kepala RT/RW setempat.';
  }
  if (/ktp|kartu tanda penduduk/.test(lower)) {
    return '📋 **Pengurusan KTP:**\n\nDokumen yang dibutuhkan:\n1. Kartu Keluarga (KK) asli\n2. Surat pengantar dari RT/RW\n3. Pas foto 3×4 (2 lembar)\n\n⏱️ Proses: **1–3 hari kerja** di kantor desa.\n🕐 Jam layanan: Senin–Jumat, 08:00–15:00 WIB.';
  }
  if (/kk|kartu keluarga/.test(lower)) {
    return '👨‍👩‍👧 **Pengurusan Kartu Keluarga:**\n\nDokumen yang dibutuhkan:\n1. Surat nikah / akta cerai\n2. Akta kelahiran semua anggota keluarga\n3. KTP Kepala Keluarga\n\nDatang langsung ke kantor desa atau hubungi RT setempat untuk bantuan pendampingan.';
  }
  if (/surat keterangan|surat pengantar|domisili/.test(lower)) {
    return '📄 **Surat Keterangan / Pengantar:**\n\nJenis layanan:\n- Surat Keterangan Domisili\n- Surat Keterangan Tidak Mampu (SKTM)\n- Surat Pengantar untuk Instansi\n- Surat Keterangan Usaha\n\nDatang ke kantor desa dengan membawa KTP dan KK asli. Proses biasanya **sama hari** untuk pemohon yang datang langsung.';
  }
  if (/posyandu|imunisasi|bayi|balita|tumbuh kembang/.test(lower)) {
    return '🏥 **Posyandu & Layanan Kesehatan Anak:**\n\nPostyandu diadakan **setiap bulan** di masing-masing RW.\n\n📅 Jadwal umum: **Minggu pertama setiap bulan**\n\nLayanan meliputi:\n- Penimbangan & pengukuran tinggi badan bayi/balita\n- Imunisasi rutin\n- Konsultasi gizi\n- Pemberian Vitamin A\n\nHubungi kader posyandu RT Anda untuk jadwal dan lokasi pasti.';
  }
  if (/lapor|laporan|masalah|kerusak|jalan|sampah|banjir/.test(lower)) {
    return '📝 **Cara Melaporkan Masalah:**\n\n1. Klik menu **"Laporan"** di navbar\n2. Pilih **"Buat Laporan Baru"**\n3. Isi judul, deskripsi lengkap, dan foto pendukung\n4. Aktifkan GPS untuk menyertakan lokasi akurat\n5. Klik **"Kirim Laporan"**\n\n✅ Laporan akan langsung diterima perangkat desa dan diproses sesuai prioritas.';
  }
  if (/umkm|usaha|jualan|produk|toko|daftar (usaha|produk)/.test(lower)) {
    return '🏪 **Mendaftarkan UMKM Anda:**\n\nLangkah-langkah:\n1. Login ke akun DesaMind Anda\n2. Buka menu **UMKM → Toko Saya**\n3. Klik **"Daftarkan Produk Baru"**\n4. Isi nama produk, deskripsi, harga, dan foto\n5. Produk langsung tampil di halaman marketplace!\n\nUntuk pendampingan usaha dan modal, hubungi BUMDes setempat.';
  }
  if (/bantuan|bansos|blt|pkh|program bantuan|subsidi/.test(lower)) {
    return '💰 **Program Bantuan Sosial:**\n\nJenis bantuan yang tersedia:\n- **BLT Dana Desa** – Bagi KK yang terdampak\n- **PKH** – Program Keluarga Harapan\n- **Sembako BPNT** – Bantuan pangan non-tunai\n\nUntuk informasi kelayakan dan pendaftaran, datang ke kantor desa dengan membawa KTP dan KK.';
  }
  if (/gotong royong|kegiatan sosial|kerja bakti/.test(lower)) {
    return '🤝 **Gotong Royong & Kegiatan Sosial:**\n\nJadwal kegiatan rutin desa dapat dilihat di halaman **Gotong Royong** di menu website ini. Anda juga bisa mendaftar sebagai relawan untuk berbagai kegiatan sosial.\n\nUntuk inisiatif baru, ajukan proposal ke kantor desa atau klik **"Buat Kegiatan"** di halaman Gotong Royong.';
  }
  if (/prediksi|keamanan|kriminal|risiko/.test(lower)) {
    return '🔍 **Prediksi & Analisis Desa:**\n\nPlatform DesaMind menggunakan AI untuk menganalisis tren dan memberikan prediksi keamanan serta risiko. Kunjungi halaman **Prediksi Cerdas** untuk melihat dashboard analisis terbaru.';
  }
  if (/skor|skor desa|kesehatan desa|kondisi desa/.test(lower)) {
    return '📊 **Skor Kesehatan Desa:**\n\nPlatform DesaMind menghitung skor kesehatan desa berdasarkan 6 dimensi: Kebersihan, Infrastruktur, Keamanan, Kesehatan, Ekonomi, dan Komunitas. Kunjungi halaman **Skor Desa** untuk melihat analisis terkini.';
  }
  if (/terima kasih|makasih|thanks/.test(lower)) {
    return '😊 Sama-sama! Senang bisa membantu. Jika ada pertanyaan lain seputar layanan desa, jangan ragu untuk bertanya. Bersama DesaMind, kemajuan desa adalah tanggung jawab kita bersama! 🌿';
  }
  if (/halo|hai|hello|apa kabar|selamat/.test(lower)) {
    return '🌿 Halo! Selamat datang di Asisten DesaMind. Saya siap membantu Anda dengan informasi seputar:\n\n- Pengurusan administrasi desa\n- Jadwal pelayanan & kegiatan\n- Program bantuan sosial & UMKM\n- Cara melaporkan masalah\n\nApa yang bisa saya bantu hari ini?';
  }

  return '🤝 Terima kasih atas pertanyaan Anda. Untuk informasi lebih spesifik, silakan kunjungi kantor desa pada jam layanan (Senin–Kamis 08:00–15:00, Jumat 08:00–11:30) atau hubungi kepala RT/RW setempat.\n\nAnda bisa mencoba menanyakan hal seperti "jadwal pelayanan", "cara buat KTP", "cara lapor masalah", atau "program bantuan sosial".';
}

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user')?.content ?? '';

  // Try Gemini SDK
  if (process.env.GEMINI_API_KEY) {
    try {
      const formattedHistory = messages.map((m: any) => `${m.role === 'user' ? 'Warga' : 'AI'}: ${m.content}`).join('\n');
      const prompt = `${SYSTEM_PROMPT}\n\nRiwayat Percakapan:\n${formattedHistory}\n\nBalasan AI:`;

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Use gemini-1.5-flash for better free tier quota compatibility
      const targetModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({ model: targetModel });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const reply = response.text();
      
      if (reply) return NextResponse.json({ reply });
    } catch (error: any) {
      console.error('[Gemini SDK Error]', error.message);
      // Fall through to local fallback
    }
  }

  // Rich local fallback response
  const reply = localFallback(lastUserMessage);
  return NextResponse.json({ reply });
}
