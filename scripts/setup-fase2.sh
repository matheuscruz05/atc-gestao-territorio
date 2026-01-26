#!/usr/bin/env bash
# ============================================================
# FASE 2: DEPLOY HOMELAB (Google Sheets como BD)
# - Cria .env.production
# - Copia service account
# - Gera certificados (Let's Encrypt se houver domínio, senão self-signed)
# - Prepara links e sobe docker compose
# ============================================================
set -euo pipefail

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info(){ echo -e "${BLUE}[*]${NC} $1"; }
success(){ echo -e "${GREEN}[OK]${NC} $1"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $1"; }
err(){ echo -e "${RED}[ERR]${NC} $1"; }

require_root(){ if [[ $EUID -ne 0 ]]; then err "Execute como root ou com sudo"; exit 1; fi; }
require_cmd(){ command -v "$1" >/dev/null 2>&1 || { err "Comando '$1' ausente"; exit 1; }; }
make_dir(){ mkdir -p "$1" && chmod "$2" "$1"; }
rand_secret(){ openssl rand -base64 32 | tr -d '\n'; }

# ------------------------------------------------------------
# Início
# ------------------------------------------------------------
clear
require_root
info "Fase 2 - Deploy Homelab (Google Sheets)"

# Checagens básicas
for c in docker docker compose openssl; do require_cmd "$c"; done

ROOT_DIR="/opt/atc-gestao"
PROJECT_DIR="/home/matheus/atc-gestao"
ENV_PATH="$ROOT_DIR/.env.production"
TEMPLATE_PATH="$ROOT_DIR/.env.production.template"
SECRETS_DIR="$ROOT_DIR/secrets"
CERTS_DIR="$ROOT_DIR/certs"

make_dir "$SECRETS_DIR" 700
make_dir "$CERTS_DIR" 755

# ------------------------------------------------------------
# Inputs
# ------------------------------------------------------------
read -rp "Domínio (enter se não tiver): " DOMAIN || true
if [[ -n "${DOMAIN:-}" ]]; then
  DEFAULT_API_URL="https://${DOMAIN}"
else
  DEFAULT_API_URL="http://localhost"
fi
read -rp "API URL [${DEFAULT_API_URL}]: " API_URL || true
API_URL=${API_URL:-$DEFAULT_API_URL}

read -rp "GOOGLE SHEETS ID: " GS_ID || true
read -rp "GOOGLE SHEETS API KEY: " GS_KEY || true
read -rp "Caminho da service account (sa-key.json) [enter para pular]: " SA_PATH || true

read -rp "Redis password (vazio = gerar): " REDIS_PASS || true
REDIS_PASS=${REDIS_PASS:-$(rand_secret)}
read -rp "JWT secret (vazio = gerar): " JWT_SECRET || true
JWT_SECRET=${JWT_SECRET:-$(rand_secret)}
read -rp "SESSION secret (vazio = gerar): " SESSION_SECRET || true
SESSION_SECRET=${SESSION_SECRET:-$(rand_secret)}

# ------------------------------------------------------------
# Copiar service account
# ------------------------------------------------------------
if [[ -n "${SA_PATH:-}" ]]; then
  if [[ -f "$SA_PATH" ]]; then
    cp "$SA_PATH" "$SECRETS_DIR/sa-key.json"
    chmod 600 "$SECRETS_DIR/sa-key.json"
    success "Service account copiada para $SECRETS_DIR/sa-key.json"
  else
    warn "Service account não encontrada em $SA_PATH (pulei)"
  fi
else
  warn "Service account NÃO copiada (adicione depois em $SECRETS_DIR/sa-key.json)"
fi

# ------------------------------------------------------------
# Criar .env.production
# ------------------------------------------------------------
cat > "$ENV_PATH" <<EOF
NODE_ENV=production
TZ=America/Sao_Paulo
EXPO_PUBLIC_API_URL=${API_URL}
EXPO_PUBLIC_GOOGLE_SHEETS_ID=${GS_ID}
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=${GS_KEY}
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=/app/secrets/sa-key.json
REDIS_PASSWORD=${REDIS_PASS}
EXPO_PORT=3000
APP_PORT=3001
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
API_TIMEOUT=30000
SHEETS_SYNC_TIMEOUT=60000
DB_CONNECT_TIMEOUT=15000
LOG_LEVEL=info
LOG_FORMAT=json
EOF
chmod 600 "$ENV_PATH"
success "Arquivo .env.production criado em $ENV_PATH"

# ------------------------------------------------------------
# Certificados
# ------------------------------------------------------------
if [[ -n "${DOMAIN:-}" ]]; then
  info "Domínio informado: ${DOMAIN}"; warn "Certbot tentará gerar certificado (requer DNS apontando)"
  if command -v certbot >/dev/null 2>&1; then
    certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos -m "admin@${DOMAIN}" || warn "Certbot falhou; considere self-signed"
    if [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
      cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "$CERTS_DIR/fullchain.pem"
      cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "$CERTS_DIR/privkey.pem"
      success "Certificado Let's Encrypt copiado para $CERTS_DIR"
    fi
  else
    warn "certbot não instalado; pulei Let's Encrypt"
  fi
fi

# Self-signed se não houver domínio ou certbot falhar
if [[ ! -f "$CERTS_DIR/fullchain.pem" || ! -f "$CERTS_DIR/privkey.pem" ]]; then
  info "Gerando certificado self-signed (válido 365 dias)"
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERTS_DIR/privkey.pem" \
    -out "$CERTS_DIR/fullchain.pem" \
    -subj "/CN=localhost"
  success "Certificado self-signed gerado em $CERTS_DIR"
fi

# DH params
if [[ ! -f "$CERTS_DIR/dhparam.pem" ]]; then
  info "Gerando dhparam (pode levar alguns minutos)"
  openssl dhparam -out "$CERTS_DIR/dhparam.pem" 2048
fi

# ------------------------------------------------------------
# Sincronizar links no projeto
# ------------------------------------------------------------
cd "$PROJECT_DIR"
ln -sf "$CERTS_DIR" ./certs
ln -sf "$SECRETS_DIR" ./secrets
ln -sf "$ENV_PATH" ./.env.production
success "Links criados no projeto"

# ------------------------------------------------------------
# Build e subir containers
# ------------------------------------------------------------
info "Build das imagens"
docker compose build
info "Subindo containers"
docker compose up -d
success "Containers no ar"

info "Status dos containers"
docker compose ps

info "Healthcheck (pode levar alguns segundos)"
set +e
curl -I https://localhost/health 2>/dev/null || true
curl -I http://localhost/health 2>/dev/null || true
set -e

success "Fase 2 concluída. Ajuste o DNS/domínio quando disponível e reinicie docker compose se mudar o domínio."
