# Menjalankan DesaMind dengan Docker

Aplikasi ini sudah disiapkan untuk berjalan di Docker memakai **Next.js
standalone output** (image kecil, cepat, production-ready).

File terkait:
- `Dockerfile` — image multi-stage (deps → builder → runner)
- `.dockerignore` — memperkecil konteks build
- `docker-compose.yml` — cara termudah menjalankan

---

## Prasyarat
- **Docker Desktop** terpasang dan berjalan. Unduh: https://www.docker.com/products/docker-desktop/
- File **`.env.local`** sudah terisi (Supabase, dll) — sudah ada di proyek ini.

Cek Docker terpasang:
```bash
docker --version
```

---

## Cara 1 — Docker Compose (paling mudah, disarankan)

Dari folder proyek:

```bash
# Build image lalu jalankan container di background
docker compose up -d --build
```

Buka di browser: **http://localhost:3000**

Perintah berguna lainnya:
```bash
docker compose logs -f      # lihat log
docker compose down         # hentikan & hapus container
docker compose up -d --build  # rebuild setelah ada perubahan kode
```

---

## Cara 2 — Docker manual (build image + run)

```bash
# 1. Build image dengan nama "desamind"
docker build -t desamind:latest .

# 2. Jalankan container, ambil env dari .env.local, petakan port 3000
docker run -d --name desamind -p 3000:3000 --env-file .env.local desamind:latest
```

Akses: **http://localhost:3000**

Kelola container:
```bash
docker logs -f desamind     # lihat log
docker stop desamind        # hentikan
docker start desamind       # jalankan lagi
docker rm -f desamind       # hapus container
```

Ganti port (mis. 8080 di host):
```bash
docker run -d --name desamind -p 8080:3000 --env-file .env.local desamind:latest
# akses di http://localhost:8080
```

---

## Catatan penting

- **Environment variables**: semua variabel (Supabase URL/keys, `GEMINI_API_KEY`,
  `MIDTRANS_*`, `REQUIRE_ADMIN_APPROVAL`, dll) dibaca dari `.env.local` saat
  container berjalan. Ubah `.env.local` lalu restart container untuk menerapkannya.
- **Upload gambar** tetap memakai Supabase Storage (tidak ada file disimpan di
  dalam container), jadi aman walau container dibuat ulang.
- **Setup awal sekali jalan** (kalau database/storage belum disiapkan):
  jalankan dari host (bukan dari dalam container), karena butuh akses script:
  ```bash
  npm run setup:storage
  npm run seed
  npm run create:admin -- admin@desamind.id passwordku "Admin Desa"
  ```
- **`output: 'standalone'`** sudah diaktifkan di `next.config.ts` khusus untuk
  image Docker yang ramping.

---

## Membagikan image (opsional)

Untuk menjalankan di komputer/server lain tanpa build ulang:

```bash
# Simpan image ke file .tar
docker save desamind:latest -o desamind-image.tar

# Di mesin tujuan: muat image, lalu jalankan
docker load -i desamind-image.tar
docker run -d --name desamind -p 3000:3000 --env-file .env.local desamind:latest
```

Atau push ke registry (Docker Hub):
```bash
docker tag desamind:latest <username>/desamind:latest
docker push <username>/desamind:latest
```
