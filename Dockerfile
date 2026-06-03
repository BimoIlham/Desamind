# syntax=docker/dockerfile:1
# =====================================================================
# DesaMind - Semi-static production Docker image
# Build Next.js app dengan halaman static/SSG dan API demo lokal.
# =====================================================================

# ---------- Stage 1: deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci

# ---------- Stage 2: builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------- Stage 3: runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/locales ./locales
COPY --from=builder /app/data ./data
COPY package.json package-lock.json* next.config.ts ./

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
