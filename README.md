# Desa Cerdas

Aplikasi web desa cerdas semi-statis berbasis Next.js untuk layanan warga, laporan,
marketplace UMKM, pengumuman, edukasi, transparansi, peta, dan dashboard admin.
Halaman tetap dirender ringan oleh Next.js, sementara endpoint `/api/*` memakai
data demo lokal tanpa koneksi ke layanan eksternal atau secret environment.

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
```

## Konfigurasi

Tidak ada konfigurasi backend wajib. Untuk produksi semi-statis, jalankan
`npm run build` lalu `npm run start`.

## Struktur Singkat

- `app/` - halaman aplikasi dan API demo lokal.
- `components/` - komponen UI.
- `lib/` - helper, tipe data, dan data semi-statis.
- `data/` - aset data pendukung.
- `locales/` - terjemahan.

## Build Produksi

```bash
npm run build
npm run start
```
