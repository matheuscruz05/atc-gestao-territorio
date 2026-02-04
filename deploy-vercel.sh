#!/bin/bash

# ============================================================================
# SCRIPT DE DEPLOYMENT PARA VERCEL - ATC GESTÃO TERRITÓRIO
# ============================================================================
# 
# Uso:
#   chmod +x deploy-vercel.sh
#   ./deploy-vercel.sh [staging|production]
#
# Exemplos:
#   ./deploy-vercel.sh production  # Deploy em produção
#   ./deploy-vercel.sh             # Default: production
#
# ============================================================================

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

# Configurações
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ENV="${1:-production}"
VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"\([^"]*\)".*/\1/')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 DEPLOYMENT VERCEL - ATC${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${BLUE}📋 Informações:${NC}"
echo "   Versão: $VERSION"
echo "   Ambiente: $DEPLOY_ENV"
echo "   Timestamp: $TIMESTAMP"
echo ""

# ============================================================================
# FUNÇÃO: Validar ambiente
# ============================================================================
validate_environment() {
  echo -e "${YELLOW}🔍 Validando ambiente...${NC}"
  
  # Verificar Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado${NC}"
    exit 1
  fi
  
  # Verificar npm/pnpm
  if ! command -v npm &> /dev/null && ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ npm ou pnpm não encontrado${NC}"
    exit 1
  fi
  
  # Verificar Vercel CLI
  if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI não instalado. Instalando...${NC}"
    npm install -g vercel
  fi
  
  echo -e "${GREEN}✅ Ambiente validado${NC}"
  echo ""
}

# ============================================================================
# FUNÇÃO: Verificar branch
# ============================================================================
check_git_status() {
  echo -e "${YELLOW}🌿 Verificando status do git...${NC}"
  
  # Verificar se estamos em um repositório git
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Não é um repositório git${NC}"
    exit 1
  fi
  
  # Obter branch atual
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo "   Branch atual: $CURRENT_BRANCH"
  
  # Verificar se tem mudanças não commitadas
  if [[ $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Existem mudanças não commitadas:${NC}"
    git status -s
    echo ""
    read -p "Deseja continuar? (s/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
      echo -e "${RED}Deployment cancelado${NC}"
      exit 1
    fi
  fi
  
  echo -e "${GREEN}✅ Git status OK${NC}"
  echo ""
}

# ============================================================================
# FUNÇÃO: Sincronizar branches
# ============================================================================
sync_branches() {
  if [[ "$DEPLOY_ENV" == "production" ]]; then
    echo -e "${YELLOW}🔄 Sincronizando branches para produção...${NC}"
    
    read -p "A branch atual é 'main'? (s/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Ss]$ ]]; then
      echo "   ✓ OK, continuando com main"
    else
      echo -e "${YELLOW}⚠️  Aviso: Você não está em 'main'${NC}"
      echo "   Branch de produção deve ser 'main' no Vercel"
      echo ""
      
      read -p "Deseja fazer merge de $(git rev-parse --abbrev-ref HEAD) para main? (s/n): " -n 1 -r
      echo ""
      
      if [[ $REPLY =~ ^[Ss]$ ]]; then
        git checkout main
        git pull origin main
        git merge $CURRENT_BRANCH --no-ff -m "Merge para produção"
        git push origin main
        echo -e "${GREEN}✅ Merge para main concluído${NC}"
      fi
    fi
  fi
  
  echo ""
}

# ============================================================================
# FUNÇÃO: Executar testes
# ============================================================================
run_tests() {
  echo -e "${YELLOW}🧪 Executando testes...${NC}"
  
  if npm run test 2>/dev/null; then
    echo -e "${GREEN}✅ Testes passaram${NC}"
  else
    echo -e "${YELLOW}⚠️  Testes falharam ou npm run test não existe${NC}"
  fi
  
  echo ""
}

# ============================================================================
# FUNÇÃO: Build local
# ============================================================================
run_build() {
  echo -e "${YELLOW}🔨 Executando build local...${NC}"
  
  if npm run build; then
    echo -e "${GREEN}✅ Build concluído com sucesso${NC}"
  else
    echo -e "${RED}❌ Build falhou${NC}"
    exit 1
  fi
  
  echo ""
}

# ============================================================================
# FUNÇÃO: Validar variáveis de ambiente
# ============================================================================
validate_env_vars() {
  echo -e "${YELLOW}🔑 Validando variáveis de ambiente...${NC}"
  
  REQUIRED_VARS=(
    "EXPO_PUBLIC_GOOGLE_SHEETS_ID"
    "EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY"
    "EXPO_PUBLIC_API_BASE_URL"
    "JWT_SECRET"
  )
  
  for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
      echo -e "${YELLOW}⚠️  Variável $var não definida localmente${NC}"
    fi
  done
  
  echo -e "${YELLOW}   Nota: Variáveis serão carregadas do Vercel${NC}"
  echo -e "${GREEN}✅ Verificação de variáveis concluída${NC}"
  echo ""
}

# ============================================================================
# FUNÇÃO: Deploy no Vercel
# ============================================================================
deploy_vercel() {
  echo -e "${YELLOW}🚀 Iniciando deployment no Vercel...${NC}"
  echo ""
  
  if [[ "$DEPLOY_ENV" == "production" ]]; then
    echo -e "${YELLOW}⚠️  ATENÇÃO: Deploy em PRODUÇÃO!${NC}"
    read -p "Tem certeza que deseja continuar? Digite 'sim' para confirmar: " confirm
    
    if [[ "$confirm" != "sim" ]]; then
      echo -e "${RED}Deploy cancelado${NC}"
      exit 1
    fi
    
    vercel --prod
  else
    vercel
  fi
  
  echo ""
  echo -e "${GREEN}✅ Deploy iniciado no Vercel${NC}"
  echo -e "${BLUE}📊 Monitore em: https://vercel.com/projects/atc-gestao-territorio${NC}"
  echo ""
}

# ============================================================================
# FUNÇÃO: Pós-deployment
# ============================================================================
post_deployment() {
  echo -e "${YELLOW}✅ Pós-deployment${NC}"
  echo ""
  
  echo -e "${BLUE}📋 Próximas ações:${NC}"
  echo "   1. Aguarde o build completar no Vercel (2-3 minutos)"
  echo "   2. Acesse: https://atc-gestao-territorio.vercel.app"
  echo "   3. Verifique se a aplicação carregou"
  echo "   4. Teste login e funcionalidades principais"
  echo "   5. Verifique logs em caso de erro"
  echo ""
  
  echo -e "${BLUE}🔍 Links úteis:${NC}"
  echo "   Dashboard: https://vercel.com/projects/atc-gestao-territorio"
  echo "   Logs: vercel logs --tail"
  echo "   Variáveis: https://vercel.com/projects/atc-gestao-territorio/settings/environment-variables"
  echo ""
}

# ============================================================================
# FUNÇÃO: Rollback (em caso de erro)
# ============================================================================
rollback() {
  echo -e "${RED}❌ Deployment falhou${NC}"
  echo ""
  
  read -p "Deseja fazer rollback? (s/n): " -n 1 -r
  echo ""
  
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⏮️  Fazendo rollback...${NC}"
    git reset --hard HEAD~1
    echo -e "${GREEN}✅ Rollback concluído${NC}"
  fi
  
  exit 1
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

validate_environment
check_git_status

if [[ "$DEPLOY_ENV" == "production" ]]; then
  sync_branches
fi

run_tests
run_build
validate_env_vars

read -p "Deseja continuar com o deployment? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
  echo -e "${RED}Deployment cancelado${NC}"
  exit 0
fi

deploy_vercel

if [ $? -eq 0 ]; then
  post_deployment
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✅ DEPLOYMENT CONCLUÍDO COM SUCESSO!${NC}"
  echo -e "${GREEN}========================================${NC}"
else
  rollback
fi
