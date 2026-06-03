# syntax=docker/dockerfile:1
# =====================================================================
# DesaMind — Production Docker image (Next.js 16 standalone)
# Multi-stage build untuk image kecil & cepat.
# =====================================================================

# ---------- Stage 1: deps ----------
# Install dependencies secara terpisah agar layer cache efisien.
FROM node:20-alpine AS deps
WORKDIR /app

# libc6-compat dibutuhkan beberapa paket native di Alpine.
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci


# ---------- Stage 2: builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Supabase env (NEXT_PUBLIC_* & service role) hanya dipakai sisi server
# di aplikasi ini, sehingga cukup diberikan saat runtime (env_file di
# docker-compose atau --env-file di docker run). Tidak perlu build arg.
RUN npm run build


# ---------- Stage 3: runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# User non-root untuk keamanan.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Aset statis & output standalone dari builder.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# next-intl memuat file terjemahan via dynamic import yang tidak ikut
# ter-trace ke output standalone, jadi disalin manual. Begitu pula data
# GeoJSON batas wilayah yang dibaca saat runtime.
COPY --from=builder --chown=nextjs:nodejs /app/locales ./locales
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

USER nextjs

EXPOSE 3000

# server.js dihasilkan oleh output: 'standalone'
CMD ["node", "server.js"]
