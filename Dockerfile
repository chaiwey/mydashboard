# syntax=docker/dockerfile:1

# ---------- base ----------
FROM node:22-alpine AS base
WORKDIR /app
# libc6-compat is needed by some native-ish deps on Alpine.
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- deps: install all dependencies (incl. dev, needed to build) ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder: generate Prisma client + build standalone output ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time,
# so they must be present here (not just at runtime).
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=${NEXT_PUBLIC_VAPID_PUBLIC_KEY}

# A placeholder URL so the build never attempts a real DB connection.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

RUN npx prisma generate
RUN npm run build

# ---------- migrator: minimal image that runs `prisma migrate deploy` ----------
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY package.json prisma.config.ts ./
COPY prisma ./prisma
CMD ["npx", "prisma", "migrate", "deploy"]

# ---------- runner: minimal production image ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# Standalone server + assets.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Generated Prisma client (WASM query compiler) — copied explicitly so it is
# always present at runtime regardless of output tracing.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
