#!/bin/bash

# ============================================================
# FASE 1: SETUP AUTOMATIZADO
# Homelab Deployment - ATC Gestão de Território
# ============================================================

set -e  # Exit on any error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}\n"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}\n"
}

print_error() {
    echo -e "${RED}❌ $1${NC}\n"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "Este script precisa ser executado como root ou com sudo"
        exit 1
    fi
}

# ============================================================
# INÍCIO
# ============================================================

clear
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║  FASE 1: SETUP HOMELAB - ATC Gestão de Território    ║"
echo "║  Hardware: Dell Optplex 3040 + WiFi + Google Sheets  ║"
echo "║  Data: $(date '+%d/%m/%Y %H:%M:%S')                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

read -p "Pressione ENTER para continuar ou CTRL+C para cancelar..."

# ============================================================
# 1. Verificações Pré-Requisitos
# ============================================================

print_header "1️⃣  VERIFICANDO PRÉ-REQUISITOS"

check_root

# Check Ubuntu version
if ! grep -qi "ubuntu" /etc/os-release; then
    print_error "Este script foi testado apenas em Ubuntu. Sistema detectado:"
    cat /etc/os-release | grep PRETTY_NAME
    exit 1
fi

print_success "Ubuntu detectado"

# Check internet
if ! ping -c 1 8.8.8.8 &> /dev/null; then
    print_error "Sem conexão com internet. Verifique a conexão WiFi."
    exit 1
fi

print_success "Conexão com internet OK"

# ============================================================
# 2. Atualizar Sistema
# ============================================================

print_header "2️⃣  ATUALIZANDO SISTEMA"

echo "Atualizando repositórios..."
apt-get update -qq

echo "Instalando atualizações..."
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq

print_success "Sistema atualizado"

# ============================================================
# 3. Instalar Dependências Essenciais
# ============================================================

print_header "3️⃣  INSTALANDO DEPENDÊNCIAS ESSENCIAIS"

PACKAGES="curl wget git build-essential ufw fail2ban htop net-tools vim nano"

echo "Instalando pacotes: $PACKAGES"
apt-get install -y -qq $PACKAGES

print_success "Dependências instaladas"

# ============================================================
# 4. Instalar Docker
# ============================================================

print_header "4️⃣  INSTALANDO DOCKER"

# Remove old versions
echo "Removendo versões antigas do Docker..."
apt-get remove -y -qq docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker repository
echo "Adicionando repositório Docker oficial..."
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
echo "Instalando Docker CE..."
apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin

# Start Docker
systemctl start docker
systemctl enable docker

print_success "Docker instalado e ativado"

# ============================================================
# 5. Configurar Usuário para Docker
# ============================================================

print_header "5️⃣  CONFIGURANDO ACESSO DOCKER"

# Get the user who ran sudo (if sudo was used)
if [ -n "$SUDO_USER" ]; then
    TARGET_USER=$SUDO_USER
else
    # If running as root directly
    print_warning "Script sendo executado como root. Pulando configuração de usuário."
    TARGET_USER=""
fi

if [ -n "$TARGET_USER" ]; then
    usermod -aG docker "$TARGET_USER"
    print_success "Usuário $TARGET_USER adicionado ao grupo docker"
fi

# ============================================================
# 6. Configurar Firewall
# ============================================================

print_header "6️⃣  CONFIGURANDO FIREWALL"

# Enable UFW
echo "Ativando UFW..."
ufw --force enable > /dev/null

# Default rules
echo "Configurando regras padrão..."
ufw default deny incoming > /dev/null
ufw default allow outgoing > /dev/null

# Allow SSH
echo "Liberando SSH (porta 22)..."
ufw allow 22/tcp > /dev/null

# Allow HTTP
echo "Liberando HTTP (porta 80)..."
ufw allow 80/tcp > /dev/null

# Allow HTTPS
echo "Liberando HTTPS (porta 443)..."
ufw allow 443/tcp > /dev/null

print_success "Firewall configurado"

ufw status numbered

# ============================================================
# 7. Configurar Fail2Ban
# ============================================================

print_header "7️⃣  CONFIGURANDO FAIL2BAN"

echo "Criando configuração Fail2Ban..."

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log

[nginx-badbots]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
EOF

systemctl restart fail2ban
systemctl enable fail2ban

print_success "Fail2Ban configurado"

# ============================================================
# 8. Instalar Nginx
# ============================================================

print_header "8️⃣  INSTALANDO NGINX"

echo "Instalando Nginx..."
apt-get install -y -qq nginx nginx-full

# Stop nginx (será gerenciado pelo Docker)
systemctl stop nginx
systemctl disable nginx

print_success "Nginx instalado (desativado no momento)"

# ============================================================
# 9. Instalar Certbot (Let's Encrypt)
# ============================================================

print_header "9️⃣  INSTALANDO CERTBOT"

echo "Instalando Certbot..."
apt-get install -y -qq certbot python3-certbot-nginx

print_success "Certbot instalado"

print_warning "Certificado SSL será gerado durante Fase 2"

# ============================================================
# 10. Criar Estrutura de Diretórios
# ============================================================

print_header "🔟 CRIANDO ESTRUTURA DE DIRETÓRIOS"

mkdir -p /opt/atc-gestao/secrets
mkdir -p /opt/atc-gestao/data/redis
mkdir -p /opt/atc-gestao/logs/{nginx,app,redis}
mkdir -p /opt/atc-gestao/certs
mkdir -p /opt/atc-gestao/backups
mkdir -p /opt/atc-gestao/scripts

# Set permissions
chmod 700 /opt/atc-gestao/secrets
chmod 755 /opt/atc-gestao
chmod 755 /opt/atc-gestao/{data,logs,certs,backups,scripts}

print_success "Diretórios criados em /opt/atc-gestao"

# ============================================================
# 11. Criar Script de Limpeza de Disco
# ============================================================

print_header "1️⃣1️⃣  CRIANDO SCRIPT DE LIMPEZA"

cat > /opt/atc-gestao/scripts/cleanup.sh << 'CLEANUP_EOF'
#!/bin/bash
LOG_FILE="/opt/atc-gestao/logs/cleanup.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando limpeza..." >> $LOG_FILE

# Remover logs antigos (7 dias)
find /opt/atc-gestao/logs -type f -mtime +7 -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Logs antigos removidos" >> $LOG_FILE

# Comprimir logs
gzip -9 /opt/atc-gestao/logs/*.log 2>/dev/null || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Logs comprimidos" >> $LOG_FILE

# Limpeza Docker (imagens e containers não usados)
docker system prune -af --volumes >> $LOG_FILE 2>&1
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Docker limpado" >> $LOG_FILE

# Relatorio
DISK_USAGE=$(df /opt/atc-gestao | tail -1 | awk '{print $5}')
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Disco: ${DISK_USAGE}% utilizado" >> $LOG_FILE
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Limpeza concluída" >> $LOG_FILE
echo "" >> $LOG_FILE
CLEANUP_EOF

chmod +x /opt/atc-gestao/scripts/cleanup.sh

print_success "Script de limpeza criado"

# Schedule cleanup
(crontab -l 2>/dev/null; echo "0 1 * * * /opt/atc-gestao/scripts/cleanup.sh") | crontab - 2>/dev/null || true

print_success "Limpeza agendada para 1h da manhã diariamente"

# ============================================================
# 12. Criar Script de Monitoramento
# ============================================================

print_header "1️⃣2️⃣  CRIANDO SCRIPT DE MONITORAMENTO"

cat > /opt/atc-gestao/scripts/monitor.sh << 'MONITOR_EOF'
#!/bin/bash
LOG_FILE="/opt/atc-gestao/logs/monitor.log"

CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print int(100 - $1)}')
MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
DISK_USAGE=$(df /opt/atc-gestao | tail -1 | awk '{print int($5)}')

echo "[$(date '+%Y-%m-%d %H:%M:%S')] CPU: ${CPU_USAGE}% | MEM: ${MEM_USAGE}% | DISK: ${DISK_USAGE}%" >> $LOG_FILE

if [ $DISK_USAGE -gt 85 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ ALERTA: DISCO > 85%" >> $LOG_FILE
fi

if [ $MEM_USAGE -gt 85 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ ALERTA: MEMÓRIA > 85%" >> $LOG_FILE
fi
MONITOR_EOF

chmod +x /opt/atc-gestao/scripts/monitor.sh

print_success "Script de monitoramento criado"

# Schedule monitoring
(crontab -l 2>/dev/null; echo "*/30 * * * * /opt/atc-gestao/scripts/monitor.sh") | crontab - 2>/dev/null || true

print_success "Monitoramento agendado a cada 30 minutos"

# ============================================================
# 13. Criar Arquivo .env.production Template
# ============================================================

print_header "1️⃣3️⃣  CRIANDO TEMPLATE .env.production"

cat > /opt/atc-gestao/.env.production.template << 'ENV_EOF'
# ========== AMBIENTE ==========
NODE_ENV=production
TZ=America/Sao_Paulo

# ========== DOMÍNIO ==========
EXPO_PUBLIC_API_URL=https://seu-dominio.com.br

# ========== GOOGLE SHEETS ==========
EXPO_PUBLIC_GOOGLE_SHEETS_ID=seu-id-aqui
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=sua-chave-api-aqui
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=/app/secrets/sa-key.json

# ========== REDIS ==========
REDIS_PASSWORD=gerar-com-openssl_rand_base64_32

# ========== APLICAÇÃO ==========
EXPO_PORT=3000
APP_PORT=3001
JWT_SECRET=gerar-com-openssl_rand_base64_32
SESSION_SECRET=gerar-com-openssl_rand_base64_32

# ========== TIMEOUTS (aumentados para WiFi) ==========
API_TIMEOUT=30000
SHEETS_SYNC_TIMEOUT=60000
DB_CONNECT_TIMEOUT=15000

# ========== LOGGING ==========
LOG_LEVEL=info
LOG_FORMAT=json
ENV_EOF

chmod 600 /opt/atc-gestao/.env.production.template

print_success "Template .env.production criado"

print_warning "PRÓXIMO PASSO: Editar /opt/atc-gestao/.env.production.template com seus valores"

# ============================================================
# 14. Resumo Final
# ============================================================

print_header "✅ FASE 1 CONCLUÍDA COM SUCESSO!"

echo -e "${GREEN}O servidor está pronto para Fase 2${NC}"
echo ""
echo "📋 RESUMO DO QUE FOI INSTALADO:"
echo "  ✅ Docker CE + Docker Compose"
echo "  ✅ Nginx + Certbot (Let's Encrypt)"
echo "  ✅ UFW Firewall"
echo "  ✅ Fail2Ban (proteção SSH)"
echo "  ✅ Estrutura de diretórios em /opt/atc-gestao"
echo "  ✅ Scripts de limpeza e monitoramento"
echo ""
echo "🔑 PRÓXIMOS PASSOS (Fase 2):"
echo "  1. Copiar arquivo de credenciais Google: /opt/atc-gestao/secrets/sa-key.json"
echo "  2. Editar /opt/atc-gestao/.env.production com seus valores"
echo "  3. Gerar certificado SSL: certbot certonly --standalone -d seu-dominio.com.br"
echo "  4. Build + Deploy dos containers"
echo ""
echo "⏱️  Tempo decorrido: $((SECONDS / 60)) minutos"
echo ""
echo "ℹ️  Logs disponíveis em:"
echo "  - /opt/atc-gestao/logs/"
echo "  - /var/log/docker/"
echo "  - /var/log/nginx/"
echo ""

print_success "Próxima execução: ./setup-fase2.sh"

# ============================================================
# FIM
# ============================================================

exit 0
