#!/usr/bin/env bash
# ============================================================
# FASE 2 SIMPLIFICADO: Executar DIRETO no servidor
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info(){ echo -e "${BLUE}[*]${NC} $1"; }
success(){ echo -e "${GREEN}[OK]${NC} $1"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $1"; }
err(){ echo -e "${RED}[ERR]${NC} $1"; exit 1; }

require_root(){ if [[ $EUID -ne 0 ]]; then err "Execute com sudo"; exit 1; fi; }
make_dir(){ mkdir -p "$1" && chmod "$2" "$1"; }
rand_secret(){ openssl rand -base64 32 | tr -d '\n'; }

clear
require_root
info "Fase 2 - Deploy Homelab (Google Sheets)"

ROOT_DIR="/opt/atc-gestao"
PROJECT_DIR="/home/matheus/atc-gestao"
ENV_PATH="$ROOT_DIR/.env.production"
SECRETS_DIR="$ROOT_DIR/secrets"
CERTS_DIR="$ROOT_DIR/certs"

make_dir "$SECRETS_DIR" 700
make_dir "$CERTS_DIR" 755

# Credenciais (pré-preenchidas do .env.local)
GS_ID="1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs"
GS_KEY="AIzaSyBNET7Szj8kedgcjDWj1Ix0Vf8V33W6CSQ"

read -rp "Domínio DuckDNS (ex: seu-app.duckdns.org) [Enter=self-signed]: " DOMAIN || true
if [[ -n "${DOMAIN:-}" ]]; then
  API_URL="https://${DOMAIN}"
else
  API_URL="http://localhost"
fi

info "Gerando secrets automaticamente"
REDIS_PASS=$(rand_secret)
JWT_SECRET=$(rand_secret)
SESSION_SECRET=$(rand_secret)

# Copiar service account se existir
if [[ -f "/home/matheus/sa-key.json" ]]; then
  cp "/home/matheus/sa-key.json" "$SECRETS_DIR/sa-key.json"
  chmod 600 "$SECRETS_DIR/sa-key.json"
  success "Service account copiada"
else
  warn "sa-key.json não encontrado em /home/matheus (adicione depois)"
fi

# Criar .env.production
info "Criando .env.production e .env"
cat > "$ENV_PATH" <<EOF
NODE_ENV=production
TZ=America/Sao_Paulo
EXPO_PUBLIC_API_URL=${API_URL}
EXPO_PUBLIC_GOOGLE_SHEETS_ID=${GS_ID}
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=${GS_KEY}
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=/app/secrets/sa-key.json
REDIS_PASSWORD=${REDIS_PASS}
EXPOSE_PORT=3000
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

# Docker Compose procura por .env, não .env.production
cat > "$PROJECT_DIR/.env" <<EOF
NODE_ENV=production
TZ=America/Sao_Paulo
EXPO_PUBLIC_API_URL=${API_URL}
EXPO_PUBLIC_GOOGLE_SHEETS_ID=${GS_ID}
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=${GS_KEY}
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=/app/secrets/sa-key.json
REDIS_PASSWORD=${REDIS_PASS}
EXPOSE_PORT=3000
APP_PORT=3001
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
API_TIMEOUT=30000
SHEETS_SYNC_TIMEOUT=60000
DB_CONNECT_TIMEOUT=15000
LOG_LEVEL=info
LOG_FORMAT=json
EOF
chmod 600 "$PROJECT_DIR/.env"
success ".env.production e .env criados"

# Certificados
if [[ -n "${DOMAIN:-}" ]]; then
  info "Tentando gerar certificado Let's Encrypt para ${DOMAIN}"
  if certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos -m "admin@${DOMAIN}" 2>/dev/null; then
    if [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
      cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "$CERTS_DIR/fullchain.pem"
      cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "$CERTS_DIR/privkey.pem"
      success "Certificado Let's Encrypt copiado"
    fi
  else
    warn "Let's Encrypt falhou (DNS não aponta ainda?); usando self-signed"
  fi
fi

if [[ ! -f "$CERTS_DIR/fullchain.pem" ]]; then
  info "Gerando certificado self-signed"
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERTS_DIR/privkey.pem" \
    -out "$CERTS_DIR/fullchain.pem" \
    -subj "/CN=localhost" 2>/dev/null
  success "Certificado self-signed gerado"
fi

if [[ ! -f "$CERTS_DIR/dhparam.pem" ]]; then
  info "Gerando dhparam (2-3 min)"
  openssl dhparam -out "$CERTS_DIR/dhparam.pem" 2048 2>/dev/null
fi

# Links no projeto
info "Criando links no projeto"
cd "$PROJECT_DIR"
ln -sf "$CERTS_DIR" ./certs
ln -sf "$SECRETS_DIR" ./secrets
ln -sf "$ENV_PATH" ./.env.production

# Ajustar nginx.conf com domínio (se fornecido)
if [[ -n "${DOMAIN:-}" ]]; then
  info "Ajustando nginx.conf para domínio ${DOMAIN}"
  sed -i "s|seu-dominio.com.br|${DOMAIN}|g" nginx.conf 2>/dev/null || true
fi

# Build e subir
info "Build das imagens Docker"
docker compose build

info "Subindo containers"
docker compose up -d

success "Containers no ar"
docker compose ps

info "Aguardando 10s para containers iniciarem"
sleep 10

info "Testando health"
curl -k http://localhost:3000/ 2>/dev/null && success "App respondendo" || warn "App ainda não respondeu (aguarde mais um pouco)"

echo -e "\n${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ FASE 2 CONCLUÍDA!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}\n"

if [[ -n "${DOMAIN:-}" ]]; then
  echo -e "Próximo: Configure DuckDNS e port forwarding"
  echo -e "Depois acesse: ${BLUE}https://${DOMAIN}${NC}"
else
  echo -e "Acesso local: ${BLUE}http://localhost:3000${NC}"
  echo -e "Configure DuckDNS depois para acesso remoto"
fi
