// Seed the DesaMind database with realistic demo content.
// SAFE: only inserts into tables that are currently empty (no duplicates, no deletes).
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv('.env.local');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const img = (id, w = 800) => `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

async function isEmpty(table) {
  const { count } = await sb.from(table).select('*', { count: 'exact', head: true });
  return (count ?? 0) === 0;
}

async function seed(table, rows, { force = false } = {}) {
  if (!force && !(await isEmpty(table))) {
    console.log(`  [skip] ${table} already has data`);
    return;
  }
  const { error } = await sb.from(table).insert(rows);
  if (error) console.log(`  [ERR] ${table}: ${error.message}`);
  else console.log(`  [OK] ${table}: +${rows.length} rows`);
}

// ---------- REPORTS ----------
await seed('reports', [
  { user_id: 'user-warga', author_name: 'Budi Santoso', title: 'Jalan berlubang di RT 02', description: 'Lubang besar di Jalan Melati dekat balai desa sangat membahayakan pengendara motor terutama saat malam hari.', category: 'Infrastruktur', status: 'in_progress', lat: -5.3429, lng: 105.7938, image_url: img('1515162816999-a0c47dc192f7'), upvotes: 12, comments_count: 0, created_at: daysAgo(5) },
  { user_id: 'user-warga', author_name: 'Siti Aminah', title: 'Tumpukan sampah di pasar', description: 'Sampah menumpuk di belakang pasar desa sudah 3 hari belum diangkut, menimbulkan bau tidak sedap.', category: 'Sampah', status: 'pending', lat: -5.3440, lng: 105.7950, image_url: img('1558618666-fcd25c85cd64'), upvotes: 8, comments_count: 0, created_at: daysAgo(3) },
  { user_id: 'user-warga', author_name: 'Andi Pratama', title: 'Lampu jalan mati di gang utama', description: 'Lampu penerangan jalan umum di gang utama RW 03 mati total, rawan tindak kejahatan.', category: 'Keamanan', status: 'completed', lat: -5.3410, lng: 105.7920, image_url: img('1542315192-1f61a1792f33'), upvotes: 20, comments_count: 0, created_at: daysAgo(14) },
  { user_id: 'user-warga', author_name: 'Dewi Lestari', title: 'Saluran irigasi tersumbat', description: 'Saluran irigasi sawah tersumbat sampah dan lumpur, air tidak mengalir ke area persawahan warga.', category: 'Lingkungan', status: 'pending', lat: -5.3450, lng: 105.7960, image_url: img('1500382017468-9049fed747ef'), upvotes: 5, comments_count: 0, created_at: daysAgo(1) },
  { user_id: 'user-warga', author_name: 'Rahmat Hidayat', title: 'Posyandu butuh perlengkapan', description: 'Posyandu Melati kekurangan timbangan bayi dan alat ukur tinggi badan untuk kegiatan rutin bulanan.', category: 'Kesehatan', status: 'in_progress', lat: -5.3435, lng: 105.7945, image_url: img('1576091160550-2173dba999ef'), upvotes: 15, comments_count: 0, created_at: daysAgo(7) },
]);

// Marketplace stores/products are intentionally not seeded.
// Seller data must come from real user registrations and admin verification.
console.log('  [skip] stores/products demo seed disabled');

// ---------- JOBS ----------
await seed('jobs', [
  { title: 'Operator Mesin Produksi', company: 'CV Maju Bersama', description: 'Dibutuhkan operator mesin produksi keripik, jujur dan teliti.', category: 'Produksi', type: 'full_time', location: 'Desa Labuhan Maringgai', deadline: daysAgo(-20).slice(0, 10), salary_range: 'Rp 2.000.000 - Rp 2.500.000', requirements: ['Minimal SMA/SMK', 'Bersedia kerja shift', 'Pengalaman tidak diutamakan'], phone_number: '6281122334455', is_active: true, created_at: daysAgo(4) },
  { title: 'Admin Toko Online', company: 'Keripik Bu Sari', description: 'Mengelola pesanan online dan media sosial toko.', category: 'Administrasi', type: 'part_time', location: 'Remote / Desa', deadline: daysAgo(-15).slice(0, 10), salary_range: 'Rp 1.000.000 - Rp 1.500.000', requirements: ['Menguasai media sosial', 'Bisa mengetik cepat'], phone_number: '6281234567890', is_active: true, created_at: daysAgo(2) },
  { title: 'Relawan Pengajar PAUD', company: 'PAUD Tunas Bangsa', description: 'Relawan mengajar anak usia dini, ramah dan sabar.', category: 'Pendidikan', type: 'volunteer', location: 'PAUD Tunas Bangsa', deadline: daysAgo(-30).slice(0, 10), salary_range: 'Sukarela', requirements: ['Sabar dan ramah anak', 'Berkomitmen'], phone_number: '6285566778899', is_active: true, created_at: daysAgo(6) },
]);

// ---------- ARTICLES ----------
await seed('articles', [
  { title: 'Tips Memulai UMKM dari Rumah', excerpt: 'Panduan praktis memulai usaha kecil dengan modal terbatas.', content: 'Memulai UMKM dari rumah kini semakin mudah. Mulailah dari produk yang Anda kuasai, manfaatkan bahan lokal, dan pasarkan lewat marketplace desa serta media sosial. Konsistensi kualitas adalah kunci utama membangun kepercayaan pelanggan.', category: 'UMKM', author: 'Admin DesaMind', image_url: img('1556761175-5973dc0f32e7'), is_published: true, created_at: daysAgo(5) },
  { title: 'Pentingnya Gotong Royong di Era Modern', excerpt: 'Semangat gotong royong tetap relevan untuk membangun desa.', content: 'Gotong royong adalah warisan budaya yang memperkuat ikatan sosial. Di era modern, semangat ini bisa diwujudkan melalui kerja bakti, arisan, hingga kolaborasi digital untuk kemajuan desa bersama.', category: 'Budaya', author: 'Kepala Desa', image_url: img('1517048676732-d65bc937f952'), is_published: true, created_at: daysAgo(10) },
  { title: 'Cara Menjaga Kebersihan Lingkungan Desa', excerpt: 'Langkah sederhana menjaga desa tetap bersih dan sehat.', content: 'Kebersihan lingkungan dimulai dari rumah masing-masing. Pisahkan sampah organik dan anorganik, kelola sampah dengan bijak, dan ikut serta dalam kerja bakti rutin.', category: 'Lingkungan', author: 'Admin DesaMind', image_url: img('1532996122724-e3c354a0b15b'), is_published: true, created_at: daysAgo(15) },
]);

// ---------- TRAINING MODULES ----------
await seed('training_modules', [
  { title: 'Dasar Pemasaran Digital untuk UMKM', description: 'Belajar memasarkan produk lewat media sosial dan marketplace.', category: 'Bisnis & Marketing', level: 'Pemula', duration_minutes: 90, image_url: img('1460925895917-afdab827c52f'), instructor: 'Tim DesaMind', lessons: JSON.stringify([{ title: 'Mengenal Marketing Digital', duration: 20 }, { title: 'Membuat Konten Menarik', duration: 35 }, { title: 'Strategi Marketplace', duration: 35 }]), rating: 4.8, enrolled: 45, is_published: true, created_at: daysAgo(20) },
  { title: 'Manajemen Keuangan Usaha Kecil', description: 'Mengelola arus kas dan pembukuan sederhana usaha.', category: 'Keuangan', level: 'Pemula', duration_minutes: 75, image_url: img('1554224155-6726b3ff858f'), instructor: 'Tim DesaMind', lessons: JSON.stringify([{ title: 'Pencatatan Keuangan', duration: 30 }, { title: 'Menghitung Laba', duration: 45 }]), rating: 4.6, enrolled: 30, is_published: true, created_at: daysAgo(18) },
  { title: 'Bertani Organik Modern', description: 'Teknik pertanian organik yang ramah lingkungan dan menguntungkan.', category: 'Pertanian', level: 'Menengah', duration_minutes: 120, image_url: img('1625246333195-78d9c38ad449'), instructor: 'Penyuluh Pertanian', lessons: JSON.stringify([{ title: 'Pengenalan Organik', duration: 40 }, { title: 'Pembuatan Pupuk Kompos', duration: 40 }, { title: 'Pengendalian Hama Alami', duration: 40 }]), rating: 4.9, enrolled: 25, is_published: true, created_at: daysAgo(12) },
]);

// ---------- COMMUNITY ACTIONS ----------
await seed('community_actions', [
  { title: 'Kerja Bakti Bersih Sungai', description: 'Membersihkan sungai desa dari sampah dan eceng gondok bersama warga.', category: 'Lingkungan', location: 'Sungai Way Sekampung', date: daysAgo(-7).slice(0, 10), time: '07:00', max_participants: 50, current_participants: 23, organizer: 'Karang Taruna', image_url: img('1532996122724-e3c354a0b15b'), status: 'open', created_at: daysAgo(3) },
  { title: 'Penanaman 1000 Pohon', description: 'Gerakan penghijauan menanam pohon di area lahan kritis desa.', category: 'Lingkungan', location: 'Bukit Desa', date: daysAgo(-14).slice(0, 10), time: '08:00', max_participants: 100, current_participants: 67, organizer: 'Pemerintah Desa', image_url: img('1466692476868-aef1dfb1e735'), status: 'open', created_at: daysAgo(5) },
  { title: 'Posyandu Balita Bulanan', description: 'Kegiatan rutin penimbangan dan imunisasi balita.', category: 'Kesehatan', location: 'Balai Desa', date: daysAgo(-3).slice(0, 10), time: '09:00', max_participants: 40, current_participants: 40, organizer: 'Kader Posyandu', image_url: img('1576091160399-112ba8d25d1d'), status: 'full', created_at: daysAgo(8) },
]);

// ---------- ANNOUNCEMENTS ----------
await seed('announcements', [
  { title: 'Jadwal Pelayanan Administrasi Desa', category: 'Pemerintahan', content: 'Pelayanan administrasi desa buka Senin-Kamis 08:00-15:00 WIB dan Jumat 08:00-11:30 WIB.', date: daysAgo(2), is_important: true },
  { title: 'Pembagian BLT Dana Desa Tahap II', category: 'Sosial', content: 'Pembagian BLT Dana Desa tahap II akan dilaksanakan pada tanggal 10 bulan ini di Balai Desa. Mohon membawa KTP dan KK asli.', date: daysAgo(4), is_important: true },
  { title: 'Vaksinasi Hewan Ternak Gratis', category: 'Kesehatan', content: 'Dinas Peternakan mengadakan vaksinasi gratis untuk hewan ternak warga. Daftar di kantor desa.', date: daysAgo(6), is_important: false },
]);

// ---------- GALLERY ----------
await seed('gallery', [
  { title: 'Kerja Bakti Mingguan', category: 'Kerja Bakti', date: daysAgo(7).slice(0, 10), image_url: img('1517048676732-d65bc937f952') },
  { title: 'Kegiatan PKK', category: 'PKK', date: daysAgo(14).slice(0, 10), image_url: img('1488521787991-ed7bbaae773c') },
  { title: 'Posyandu Balita', category: 'Posyandu', date: daysAgo(21).slice(0, 10), image_url: img('1576091160399-112ba8d25d1d') },
  { title: 'Latihan Karang Taruna', category: 'Karang Taruna', date: daysAgo(28).slice(0, 10), image_url: img('1529156069898-49953e39b3ac') },
]);

// ---------- PROJECTS (transparansi) ----------
await seed('projects', [
  { title: 'Pembangunan Jalan Desa', description: 'Pengaspalan jalan utama desa sepanjang 2km.', budget: 350000000, spent: 210000000, progress: 60, status: 'ongoing', category: 'Infrastruktur', image_url: img('1503387762-592deb58ef4e'), start_date: daysAgo(60).slice(0, 10), end_date: daysAgo(-30).slice(0, 10), contractor: 'CV Karya Bangun', created_at: daysAgo(60) },
  { title: 'Renovasi Balai Desa', description: 'Perbaikan dan perluasan gedung balai desa.', budget: 150000000, spent: 150000000, progress: 100, status: 'completed', category: 'Infrastruktur', image_url: img('1486406146926-c627a92ad1ab'), start_date: daysAgo(120).slice(0, 10), end_date: daysAgo(20).slice(0, 10), contractor: 'CV Maju Jaya', created_at: daysAgo(120) },
  { title: 'Pengadaan Air Bersih', description: 'Instalasi sumur bor dan pipa distribusi air bersih.', budget: 200000000, spent: 50000000, progress: 25, status: 'ongoing', category: 'Kesehatan', image_url: img('1538300342682-cf57afb97285'), start_date: daysAgo(30).slice(0, 10), end_date: daysAgo(-60).slice(0, 10), contractor: 'PT Tirta Sehat', created_at: daysAgo(30) },
]);

// ---------- APBDESA ----------
const year = new Date().getFullYear();
const { data: apb } = await sb.from('apbdesa').select('year').eq('year', year).maybeSingle();
if (!apb) {
  const { error } = await sb.from('apbdesa').insert({
    year,
    total_budget: 1500000000,
    realized: 920000000,
    allocations: JSON.stringify([
      { category: 'Pembangunan', amount: 600000000, color: '#2E6B5E' },
      { category: 'Pemberdayaan', amount: 350000000, color: '#E8B04B' },
      { category: 'Pemerintahan', amount: 300000000, color: '#3B82F6' },
      { category: 'Pembinaan', amount: 150000000, color: '#A855F7' },
      { category: 'Tak Terduga', amount: 100000000, color: '#EF4444' },
    ]),
    programs: JSON.stringify([
      { name: 'Pembangunan Jalan Desa', category: 'Pembangunan', budget: 350000000, status: 'Berjalan' },
      { name: 'Renovasi Balai Desa', category: 'Pembangunan', budget: 150000000, status: 'Selesai' },
      { name: 'Pelatihan UMKM', category: 'Pemberdayaan', budget: 100000000, status: 'Berjalan' },
      { name: 'Posyandu & Kesehatan', category: 'Pembinaan', budget: 80000000, status: 'Berjalan' },
      { name: 'Pengadaan Air Bersih', category: 'Pembangunan', budget: 200000000, status: 'Berjalan' },
    ]),
  });
  console.log(error ? `  [ERR] apbdesa: ${error.message}` : `  [OK] apbdesa: +1 row (${year})`);
} else {
  console.log('  [skip] apbdesa already has current year');
}

console.log('\nSeeding selesai.');
