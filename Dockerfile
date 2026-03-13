# ── Stage 1: Install dependencies ──
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build ──
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for build-time env (none needed currently)
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Production ──
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy content directory (data layer — will be overridden by volume mount)
COPY --from=builder /app/content ./content
COPY --from=builder /app/selfware.md ./selfware.md
COPY --from=builder /app/selfware.en.md ./selfware.en.md
COPY --from=builder /app/manifest.md ./manifest.md
COPY --from=builder /app/views ./views
# Ensure public directory exists for static assets
RUN mkdir -p ./public

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
