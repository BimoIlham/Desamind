# Desa Cerdas

Aplikasi web desa cerdas berbasis Next.js untuk layanan warga, laporan,
marketplace UMKM, pengumuman, edukasi, transparansi, peta, dan dashboard admin.

## Menjalankan Project

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` di browser.

## Script Utama

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run setup:storage
npm run seed
npm run create:admin
```

## Konfigurasi

Salin dan isi environment variable yang dibutuhkan di `.env.local`.

Fitur inti memakai Supabase untuk database, auth, dan storage. Fitur tambahan
seperti AI, pembayaran, dan ongkir dapat diaktifkan dengan API key masing-masing.

## Struktur Singkat

- `app/` - halaman dan API routes.
- `components/` - komponen UI.
- `lib/` - helper, tipe data, dan integrasi layanan.
- `scripts/` - script setup, seed, dan admin.
- `supabase/` - skema dan migrasi database.
- `locales/` - terjemahan.

## Build Produksi

```bash
npm run build
npm run start
```
