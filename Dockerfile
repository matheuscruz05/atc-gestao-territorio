#!/usr/bin/env Dockerfile

# ============================================================
# Multi-stage Build: ATC Gestão de Território
# Otimizado para produção com Google Sheets
# ============================================================

# ============================================================
# STAGE 1: BUILDER
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências de build
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

# Copiar package files
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependências (cached layer)
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build web app
RUN pnpm build

# Build server
RUN pnpm build:server

# ============================================================
# STAGE 2: RUNTIME (Minimal Production Image)
# ============================================================
FROM node:20-alpine

WORKDIR /app

# Instalar apenas dependências runtime
RUN apk add --no-cache \
    curl \
    tini \
    dumb-init

# Instalar pnpm
RUN npm install -g pnpm

# Copiar package files
COPY package.json pnpm-lock.yaml ./

# Instalar apenas prod dependencies
RUN pnpm install --frozen-lockfile --prod && \
    pnpm store prune

# Copiar built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.expo ./.expo
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/public ./public 2>/dev/null || true

# Criar diretórios necessários
RUN mkdir -p /app/logs /app/secrets && \
    chmod 700 /app/secrets

# Criar user não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Mudar proprietário dos arquivos
RUN chown -R nodejs:nodejs /app

# Trocar para user nodejs
USER nodejs

# Expor portas
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Usar dumb-init para melhor signal handling
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
