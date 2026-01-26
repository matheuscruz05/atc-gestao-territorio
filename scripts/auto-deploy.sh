#!/usr/bin/env bash
# ============================================================
# AUTOMAÇÃO COMPLETA: COPIA CREDENCIAIS E EXECUTA FASE 2
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info(){ echo -e "${BLUE}[*]${NC} $1"; }
success(){ echo -e "${GREEN}[OK]${NC} $1"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $1"; }
err(){ echo -e "${RED}[ERR]${NC} $1"; exit 1; }

clear
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║  AUTOMAÇÃO FASE 2: DEPLOY COM CREDENCIAIS            ║"
echo "║  Google Sheets + DuckDNS + Docker Compose            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Pedir informações
read -rp "IP/Host do servidor (ex: 192.168.15.50): " SERVER_HOST || err "IP obrigatório"
read -rp "Usuário SSH (ex: matheus): " SSH_USER || err "Usuário obrigatório"
read -rp "Domínio DuckDNS (ex: seu-app.duckdns.org) [ou Enter para self-signed]: " DOMAIN || true

# Validar conexão SSH
info "Testando conexão SSH com $SSH_USER@$SERVER_HOST"
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_HOST" "echo OK" >/dev/null 2>&1; then
  err "Falha ao conectar via SSH. Verifique IP, usuário e chave."
fi
success "SSH OK"

# Extrair credenciais do .env.local
info "Extraindo credenciais do .env.local"
GS_ID=$(grep "EXPO_PUBLIC_GOOGLE_SHEETS_ID" .env.local | cut -d'=' -f2 | tr -d ' ')
GS_KEY=$(grep "EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY" .env.local | cut -d'=' -f2 | tr -d ' ')
[[ -z "$GS_ID" || -z "$GS_KEY" ]] && err "Credenciais não encontradas em .env.local"
success "Credenciais extraídas (ID e KEY presentes)"

# Copiar service account
info "Copiando service account para servidor"
if [[ -f "secrets/sa-key.json" ]]; then
  scp -q secrets/sa-key.json "$SSH_USER@$SERVER_HOST:~/sa-key.json"
  success "Service account copiado"
else
  warn "Service account não encontrado (adicione depois manualmente)"
fi

# Copiar setup-fase2.sh
info "Sincronizando script setup-fase2.sh"
scp -q scripts/setup-fase2.sh "$SSH_USER@$SERVER_HOST:~/setup-fase2.sh"
success "Script copiado"

# Executar setup-fase2 remotamente com credenciais
info "Executando setup-fase2 no servidor (com credenciais pré-preenchidas)"
ssh "$SSH_USER@$SERVER_HOST" bash <<REMOTE_SCRIPT
set -e
chmod +x ~/setup-fase2.sh

# Simular inputs (credenciais já extraídas, self-signed se sem domínio)
{
  echo "$DOMAIN"
  echo "https://${DOMAIN:-localhost}"
  echo "$GS_ID"
  echo "$GS_KEY"
  echo "~/sa-key.json"
  echo ""  # Redis (auto-gerar)
  echo ""  # JWT (auto-gerar)
  echo ""  # SESSION (auto-gerar)
} | sudo ~/setup-fase2.sh
REMOTE_SCRIPT

success "Setup-fase2 completado no servidor!"

info "Limpando arquivos temporários"
ssh "$SSH_USER@$SERVER_HOST" "rm -f ~/sa-key.json ~/setup-fase2.sh"

echo -e "\n${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ FASE 2 CONCLUÍDA COM SUCESSO!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}\n"

if [[ -n "${DOMAIN:-}" ]]; then
  echo -e "${YELLOW}⚠️  PRÓXIMO PASSO: Configurar DuckDNS${NC}"
  echo "Veja o guia DuckDNS_SETUP.md para:"
  echo "  1. Criar conta e domínio em DuckDNS"
  echo "  2. Configurar IP dinâmico"
  echo "  3. Fazer port forwarding no router (porta 443→7000)"
  echo "  4. Testes de acesso remoto"
  echo ""
else
  echo -e "${YELLOW}⚠️  Usando certificado self-signed${NC}"
  echo "Para acesso remoto seguro, configure DuckDNS e Let's Encrypt depois"
fi

echo -e "Acesse: ${BLUE}https://$DOMAIN${NC} (após DuckDNS estar configurado)"
echo ""
