# Menjalankan DesaMind dengan Docker

Aplikasi ini berjalan sebagai website semi-statis. Docker image melakukan build
Next.js, lalu menjalankan server production untuk halaman dan endpoint `/api/*`
demo lokal.

## Prasyarat

- Docker Desktop terpasang dan berjalan.

Cek Docker:

```bash
docker --version
```

## Docker Compose

```bash
docker compose up -d --build
```

Buka: `http://localhost:3000`

Perintah berguna:

```bash
docker compose logs -f
docker compose down
docker compose up -d --build
```

## Docker Manual

```bash
docker build -t desamind:latest .
docker run -d --name desamind -p 3000:3000 desamind:latest
```

Akses: `http://localhost:3000`

Untuk port lain:

```bash
docker run -d --name desamind -p 8080:3000 desamind:latest
```

## Catatan

- Tidak membutuhkan `.env.local` untuk berjalan.
- Tidak membutuhkan penyimpanan server eksternal, storage server, atau secret runtime.
- Endpoint `/api/*` tersedia sebagai API demo lokal berbasis data semi-statis.
