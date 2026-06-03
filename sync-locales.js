const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const idPath = path.join(localesPath, 'id', 'common.json');
const enPath = path.join(localesPath, 'en', 'common.json');

const idData = JSON.parse(fs.readFileSync(idPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// New Payloads
const newIdPayload = {
  auth: {
    login_title_1: "Membangun",
    login_title_2: "Ekosistem Desa Digital",
    login_title_3: "yang Inklusif.",
    login_desc: "Akses layanan administrasi, pantau transparansi anggaran, laporkan masalah desa, dan kembangkan UMKM langsung dari satu genggaman.",
    login_mode: "Mode Simulasi",
    welcome: "Selamat Datang",
    welcome_desc: "Masuk untuk mengakses layanan desa.",
    login_acc_title: "Masuk Akun",
    login_acc_desc: "Selamat datang kembali di Aplikasi DesaMind.",
    success: "Masuk berhasil! Mengalihkan...",
    error: "Email atau password salah. Gunakan akun demo di bawah.",
    lbl_email: "Alamat Email",
    lbl_pass: "Password",
    btn_login: "Masuk Sekarang",
    btn_loading: "Memproses...",
    demo_title: "Pilih Akun Demo",
    no_account: "Belum punya akun?",
    register_here: "Daftar di sini",
    
    register_title_1: "Mulai Perjalanan",
    register_title_2: "Desa Digital Anda",
    register_title_3: "Hari Ini.",
    register_desc: "Jadilah bagian dari revolusi pelayanan masyarakat yang serba cepat, transparan, dan mudah dijangkau dari mana pun.",
    join_us: "Bergabung Bersama Kami",
    join_desc: "Buat akun untuk melapor, belanja, dan memantau desa.",
    reg_acc_title: "Daftar Akun Baru",
    reg_acc_desc: "Lengkapi data di bawah untuk bergabung.",
    reg_success: "Daftar berhasil! Mengalihkan...",
    lbl_name: "Nama Lengkap",
    lbl_pass_new: "Buat Password",
    btn_register: "Selesaikan Pendaftaran",
    has_account: "Sudah punya akun?",
    login_here: "Masuk di sini",
    
    back_home: "Kembali ke Beranda"
  },
  admin_pages: {
    pengumuman_title: "Manajemen Pengumuman",
    pengumuman_subtitle: "Kelola informasi publik digital desa",
    btn_add_pengumuman: "Tambah Pengumuman",
    galeri_title: "Galeri Kegiatan",
    galeri_subtitle: "Manajemen dokumentasi foto desa",
    btn_add_galeri: "Unggah Foto Baru",
    apbdesa_title: "Master Data APBDesa",
    apbdesa_subtitle: "Konfigurasi alokasi & realisasi dana desa",
    btn_add_apbdesa: "Entri Laporan Baru",
    
    demo_mode_title: "Mode Statis & Read-Only Aktif",
    demo_mode_desc_pengumuman: "Halaman Kelola Pengumuman ini berada dalam mode simulasi statis/semi-dinamis untuk keperluan kompetisi UI/UX. Semua tindakan perubahan data backend dinonaktifkan sementara.",
    demo_mode_desc_galeri: "Halaman Kelola Galeri ini berada dalam mode simulasi statis/semi-dinamis untuk keperluan kompetisi UI/UX. Semua tindakan perubahan data backend dinonaktifkan sementara.",
    demo_mode_desc_apbdesa: "Halaman pengaturan APBDesa ini berada dalam mode simulasi. Chart dan data APBDesa akan dirender statis di UI publik untuk keperluan penjurian kompetisi.",
    
    lbl_title_pengumuman: "Judul Pengumuman",
    lbl_category: "Kategori",
    lbl_date: "Tanggal Posting",
    lbl_action: "Aksi",
    btn_edit: "Edit",
    
    lbl_title_galeri: "Nama Kegiatan",
    lbl_count: "Jumlah Foto",
    lbl_date_galeri: "Tanggal Diunggah",
    album_list: "Daftar Album Foto",
    
    rekap_anggaran: "Rekapitulasi Anggaran Tahun Berjalan",
    lbl_bidang: "Bidang Alokasi",
    lbl_pagu: "Pagu Anggaran",
    lbl_realisasi: "Realisasi (%)",
    
    group_utama: "Utama",
    group_info: "Informasi Desa",
    group_eco: "Ekonomi & Layanan",
    group_sosial: "Sosial & Geospasial"
  },
  public_pages: {
    pengumuman_title: "Papan Pengumuman",
    pengumuman_subtitle: "Informasi & Kebijakan Terbaru Desa",
    btn_all: "Semua Kategori",
    no_announcement: "Belum ada pengumuman di kategori ini.",
    
    galeri_title: "Galeri Kegiatan",
    galeri_subtitle: "Dokumentasi kehidupan dan pembangunan desa",
    select_category: "Kategori:",
    select_month: "Bulan:",
    photo_count: "Foto",
    
    apbdesa_title: "Transparansi APBDesa",
    apbdesa_subtitle: "Keterbukaan alokasi dan realisasi dana desa tercinta",
    total_budget: "Total Anggaran Tahun",
    total_realized: "Total Realisasi",
    realization_rate: "Tingkat Serapan",
    calculator_title: "Simulasi Pengaruh Anggaran",
    calculator_desc: "Lihat seberapa besar porsi APBDesa yang tersentuh jika Anda menggeser prioritas dana ke sektor tertentu.",
    select_sector: "Pilih Sektor",
    add_funds: "Tambahan Dana Simulasi",
    btn_simulate: "Simulasikan Dampak",
    simulation_result: "Hasil Simulasi Porsi Sektor",
    target_sector: "Sektor Target",
    other_sectors: "Sektor Lainnya",
    sims_warning: "* Ini hanyalah alat bantu simulasi partisipatif untuk kompetisi web dan tidak mengubah data riil."
  }
};

const newEnPayload = {
  auth: {
    login_title_1: "Building an",
    login_title_2: "Inclusive Digital Village",
    login_title_3: "Ecosystem.",
    login_desc: "Access administrative services, monitor budget transparency, report village issues, and grow SMEs directly from your hand.",
    login_mode: "Simulation Mode",
    welcome: "Welcome",
    welcome_desc: "Log in to access village services.",
    login_acc_title: "Account Login",
    login_acc_desc: "Welcome back to the DesaMind App.",
    success: "Login successful! Redirecting...",
    error: "Incorrect email or password. Use demo accounts below.",
    lbl_email: "Email Address",
    lbl_pass: "Password",
    btn_login: "Login Now",
    btn_loading: "Processing...",
    demo_title: "Select Demo Account",
    no_account: "Don't have an account?",
    register_here: "Register here",
    
    register_title_1: "Start Your",
    register_title_2: "Digital Village Journey",
    register_title_3: "Today.",
    register_desc: "Be a part of a revolution in public services that are fast, transparent, and easy to access from anywhere.",
    join_us: "Join Us",
    join_desc: "Create an account to report, shop, and monitor the village.",
    reg_acc_title: "Register New Account",
    reg_acc_desc: "Fill in the data below to join.",
    reg_success: "Registration successful! Redirecting...",
    lbl_name: "Full Name",
    lbl_pass_new: "Create Password",
    btn_register: "Complete Registration",
    has_account: "Already have an account?",
    login_here: "Login here",
    
    back_home: "Back to Home"
  },
  admin_pages: {
    pengumuman_title: "Announcement Management",
    pengumuman_subtitle: "Manage digital public village information",
    btn_add_pengumuman: "Add Announcement",
    galeri_title: "Activity Gallery",
    galeri_subtitle: "Manage village photo documentation",
    btn_add_galeri: "Upload New Photo",
    apbdesa_title: "APBDesa Master Data",
    apbdesa_subtitle: "Configure village fund allocation & realization",
    btn_add_apbdesa: "Entry New Report",
    
    demo_mode_title: "Static & Read-Only Mode Active",
    demo_mode_desc_pengumuman: "This Announcement Management page is in a static/semi-dynamic simulation mode for UI/UX competition purposes. All backend data change actions are temporarily disabled.",
    demo_mode_desc_galeri: "This Gallery Management page is in a static/semi-dynamic simulation mode for UI/UX competition purposes. All backend data change actions are temporarily disabled.",
    demo_mode_desc_apbdesa: "This APBDesa setting page is in simulation mode. APBDesa charts and data will be statically rendered on the public UI for competition judging.",
    
    lbl_title_pengumuman: "Announcement Title",
    lbl_category: "Category",
    lbl_date: "Posting Date",
    lbl_action: "Action",
    btn_edit: "Edit",
    
    lbl_title_galeri: "Activity Name",
    lbl_count: "Photo Count",
    lbl_date_galeri: "Upload Date",
    album_list: "Photo Album List",
    
    rekap_anggaran: "Current Year Budget Recapitulation",
    lbl_bidang: "Allocation Sector",
    lbl_pagu: "Budget Ceiling",
    lbl_realisasi: "Realization (%)",
    
    group_utama: "Main",
    group_info: "Village Information",
    group_eco: "Economy & Services",
    group_sosial: "Social & Geospatial"
  },
  public_pages: {
    pengumuman_title: "Notice Board",
    pengumuman_subtitle: "Latest Village Information & Policies",
    btn_all: "All Categories",
    no_announcement: "No announcements in this category yet.",
    
    galeri_title: "Activity Gallery",
    galeri_subtitle: "Documentation of village life and development",
    select_category: "Category:",
    select_month: "Month:",
    photo_count: "Photos",
    
    apbdesa_title: "APBDesa Transparency",
    apbdesa_subtitle: "Openness of fund allocation and realization for our beloved village",
    total_budget: "Total Year Budget",
    total_realized: "Total Realized",
    realization_rate: "Absorption Rate",
    calculator_title: "Budget Impact Simulation",
    calculator_desc: "See how much of the APBDesa portion is affected if you shift funding priorities to a specific sector.",
    select_sector: "Select Sector",
    add_funds: "Additional Simulation Funds",
    btn_simulate: "Simulate Impact",
    simulation_result: "Simulation Result of Sector Portion",
    target_sector: "Target Sector",
    other_sectors: "Other Sectors",
    sims_warning: "* This is purely a participatory simulation tool for a web competition and does not change real data."
  }
};

const mergedId = { ...idData, ...newIdPayload };
const mergedEn = { ...enData, ...newEnPayload };

fs.writeFileSync(idPath, JSON.stringify(mergedId, null, 2) + '\n');
fs.writeFileSync(enPath, JSON.stringify(mergedEn, null, 2) + '\n');

console.log('Translations successfully merged into common.json!');
