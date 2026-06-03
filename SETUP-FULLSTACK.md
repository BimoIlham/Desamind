# DesaMind — Panduan Fullstack & API

Dokumen ini menjelaskan kondisi fullstack aplikasi setelah integrasi, cara
menjalankannya, dan API/kunci apa saja yang dibutuhkan tiap fitur.

---

## 1. Status: Sudah Fullstack ✅

Semua menu kini terhubung ke backend (Next.js API Routes) dan database
**Supabase**. Tidak ada data palsu/hardcoded lagi pada alur utama — semuanya
CRUD nyata ke database.

| Menu / Fitur | CRUD | Backend | Penyimpanan |
|---|---|---|---|
| Laporan Warga | Create, Read, Update status, Komentar, Like | `/api/reports*` | Supabase + upload foto |
| UMKM / Marketplace | Produk CRUD, Toko, Pesanan, Checkout, Review | `/api/products`, `/api/stores`, `/api/orders`, `/api/checkout`, `/api/reviews` | Supabase + upload foto |
| Lowongan Kerja | Full CRUD | `/api/jobs*` | Supabase |
| Edukasi / Pelatihan | Full CRUD + publish | `/api/training-modules*` | Supabase + upload foto |
| Komunitas / Artikel | Full CRUD + publish | `/api/articles*` | Supabase + upload foto |
| Gotong Royong | Full CRUD + status | `/api/actions*` | Supabase |
| Transparansi / Proyek | Full CRUD | `/api/projects*` | Supabase + upload foto |
| APBDes | Read + upsert | `/api/apbdesa` | Supabase |
| Pengumuman | Full CRUD | `/api/announcements` | Supabase |
| Galeri | Full CRUD | `/api/gallery` | Supabase + upload foto |
| SOS Darurat | Create, Read, Resolve, Delete | `/api/sos` | Supabase |
| Peta & Geofence | Read/Update setting, geocode | `/api/settings`, `/api/geocode` | Supabase |
| Dashboard Admin | Statistik agregat | `/api/dashboard/stats`, `/api/stats` | Supabase |
| Asisten AI | Chat | `/api/ai/chat` | Gemini (opsional) |
| Skor Desa / Prediksi | Analisis AI | `/api/ai/health-score`, `/api/ai/predict` | Gemini (opsional) |
| Upload Gambar | Semua form | `/api/upload` | **Supabase Storage** |

---

## 2. Upload Gambar — Sekarang Gratis via Supabase

Sebelumnya hanya halaman tambah produk yang bisa upload (lewat ImageKit yang
butuh kunci berbayar). Sekarang **semua form** memakai satu mekanisme upload
gratis berbasis **Supabase Storage**:

- Endpoint: `POST /api/upload` (multipart, field `file`, opsional `folder`).
- Komponen UI: `components/ui/ImageUpload.tsx` (klik/drag, preview, hapus).
- Bucket publik: `uploads` (dibuat otomatis) dan `report-images`.
- Dipakai di: tambah/edit produk, daftar toko (logo), galeri, artikel,
  modul edukasi, proyek transparansi, laporan warga, dan modal produk admin.

Tidak perlu ImageKit lagi. Maksimal 5MB, format JPG/PNG/WEBP/GIF.

---

## 3. Cara Menjalankan

```bash
# 1. Install dependency (sekali saja)
npm install

# 2. Siapkan storage bucket (sekali saja)
npm run setup:storage

# 3. Isi database dengan konten contoh (sekali saja, aman: tidak menimpa data)
npm run seed

# 4. Jalankan
npm run dev      # mode pengembangan  -> http://localhost:3000
# atau
npm run build && npm run start   # mode produksi
```

---

## 4. Kunci API yang Dibutuhkan

### WAJIB (sudah terisi di `.env.local`)
Database & penyimpanan — sudah aktif, tidak perlu tindakan:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Dengan ini saja **seluruh fitur inti, CRUD, dan upload gambar sudah berfungsi.**

### OPSIONAL (untuk fitur tambahan)

| Kunci | Mengaktifkan | Tanpa kunci |
|---|---|---|
| `GEMINI_API_KEY` | Asisten AI cerdas, klasifikasi laporan, skor desa, prediksi, auto-isi produk dari foto | Pakai fallback berbasis kata kunci (tetap jalan) |
| `MIDTRANS_SERVER_KEY` + `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Pembayaran online di checkout | Checkout mode COD (tetap jalan) |
| `BINDERBYTE_API_KEY` | Ongkir kurir nyata | Estimasi ongkir mock (tetap jalan) |
| `OPENAI_API_KEY` | Alternatif klasifikasi laporan | Pakai Gemini / fallback |

Cara isi: buka `.env.local`, hapus tanda `#` pada baris yang diinginkan, isi
nilainya, lalu jalankan ulang `npm run dev`.

- Gemini (gratis): https://aistudio.google.com/app/apikey
- Midtrans (sandbox): https://dashboard.sandbox.midtrans.com/

---

## 5. Catatan Teknis

- **Helper data**: `lib/api-helpers.ts` (listRows/insertRow/updateRow/deleteRow).
- **Skema database**: `supabase/schema.sql` (19 tabel + bucket).
- **Script**: `scripts/setup-storage.mjs`, `scripts/seed.mjs`.
- Build & TypeScript: lolos tanpa error (`npm run build`).
- Catatan kecil: Next.js 16 menyarankan rename `middleware.ts` → `proxy.ts`
  (deprecation, belum wajib).

---

## 6. Autentikasi (Tanpa Clerk — Supabase Auth)

Clerk sudah **dihapus**. Sistem login sekarang nyata, berbasis **Supabase Auth**:

- Password di-hash & disimpan oleh Supabase (tidak pernah oleh aplikasi).
- Sesi disimpan di **cookie httpOnly** (`dm_access`, `dm_refresh`) — aman dari XSS.
- Tidak perlu setup email/SMTP; akun langsung terkonfirmasi.

### Alur warga
1. Warga buka `/auth/register`, isi nama + email + password (min 8 karakter).
2. **Akun langsung aktif** dan otomatis login. (Lihat mode persetujuan di bawah.)
3. Login berikutnya lewat `/auth/login`.

### Apakah perlu verifikasi admin? (rekomendasi)
**Tidak untuk warga biasa.** Warga langsung aktif agar tidak membebani admin dan
tidak menghambat partisipasi. Pengaman yang dipakai:
- **Moderasi setelah kejadian**: Admin > **Kelola Warga** bisa menonaktifkan
  (suspend) atau menghapus akun yang menyalahgunakan. Akun suspended tidak bisa login.
- **Role aman**: pendaftaran selalu jadi `warga`. Admin dibuat manual.
- **Verifikasi di titik berisiko**: persetujuan admin dipakai untuk **buka toko UMKM**
  (status toko `pending` → `active`), bukan untuk login warga.

### Mode "wajib persetujuan" (opsional)
Jika ingin warga harus di-ACC dulu sebelum bisa login, set di `.env.local`:
```
REQUIRE_ADMIN_APPROVAL=true
```
Maka warga baru berstatus `pending` dan hanya bisa login setelah admin menekan
tombol **Setujui** di menu Kelola Warga.

### Membuat akun admin
```bash
npm run create:admin -- admin@desamind.id passwordku "Admin Desa"
```
Akun admin sudah dibuat saat setup:
- Email: `admin@desamind.id`
- Password: `admin12345`  ← **ganti segera** dengan menjalankan perintah di atas.

Login admin akan diarahkan otomatis ke `/admin`. Halaman `/admin` kini terkunci:
hanya bisa diakses oleh akun ber-role `admin`.

### Endpoint auth
| Endpoint | Fungsi |
|---|---|
| `POST /api/auth/register` | Daftar warga baru |
| `POST /api/auth/login` | Masuk |
| `POST /api/auth/logout` | Keluar |
| `GET /api/auth/me` | Ambil user dari sesi cookie |
| `GET/PATCH/DELETE /api/admin/users` | Admin: list, ubah status/role, hapus |
