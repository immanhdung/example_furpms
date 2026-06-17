# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDeps for tsc)
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install production-only dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S furpms -u 1001 -G nodejs
USER furpms

EXPOSE 5068

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5068/health || exit 1

CMD ["node", "dist/server.js"]
