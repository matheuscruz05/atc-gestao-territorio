# 🚀 GUIA COMPLETO: DEPLOY EM PRODUÇÃO NO VERCEL

**Data**: 2 de fevereiro de 2026  
**Versão**: 1.0.0  
**Status**: Pronto para Produção  
**Projeto**: ATC Gestão Território

---

## 📋 ÍNDICE

1. [Análise de Variáveis de Ambiente](#-análise-de-variáveis-de-ambiente)
2. [Gestão de Branches (localhost vs main)](#-gestão-de-branches-localhost-vs-main)
3. [Preparação para Produção](#-preparação-para-produção)
4. [Deploy no Vercel](#-deploy-no-vercel)
5. [Configuração de Variáveis no Vercel](#-configuração-de-variáveis-no-vercel)
6. [Verificação Pós-Deploy](#-verificação-pós-deploy)
7. [Segurança e Boas Práticas](#-segurança-e-boas-práticas)
8. [Troubleshooting](#-troubleshooting)

---

## 🔐 ANÁLISE DE VARIÁVEIS DE AMBIENTE

### Comparação: `.env.local` vs `.env.vercel`

#### `.env.local` (Desenvolvimento Local)
```dotenv
EXPO_PUBLIC_GOOGLE_SHEETS_ID=...          # ID da planilha
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=...     # Chave pública (leitura)
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./secrets/sa-key.json  # Arquivo local
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000        # ⚠️ LOCAL
EXPO_PUBLIC_APP_ID=atc-gestao-territorio
EXPO_PUBLIC_OAUTH_SERVER_URL=http://localhost:3000    # ⚠️ LOCAL
VITE_APP_ID=atc-gestao-territorio
OAUTH_SERVER_URL=http://localhost:3000                # ⚠️ LOCAL
JWT_SECRET=dev-secret-local-only-not-for-production  # ⚠️ NÃO USAR EM PROD
```

#### `.env.vercel` (Produção)
```dotenv
EXPO_PUBLIC_GOOGLE_SHEETS_ID=...          # ✅ IGUAL AO .env.local (público)
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=...     # ✅ IGUAL AO .env.local (público)
GOOGLE_SERVICE_ACCOUNT_JSON={...}         # ✅ JSON completo (não arquivo)
                                           # ⚠️ PRECISA ATUALIZAR URL
```

### ⚠️ VARIÁVEIS FALTANDO EM `.env.vercel`

As seguintes variáveis precisam ser adicionadas/atualizadas no Vercel:

| Variável | Valor Necessário | Tipo | Prioridade |
|----------|------------------|------|-----------|
| `EXPO_PUBLIC_API_BASE_URL` | `https://seu-dominio-vercel.vercel.app` | PUBLIC | 🔴 CRÍTICA |
| `EXPO_PUBLIC_OAUTH_SERVER_URL` | `https://seu-dominio-vercel.vercel.app` | PUBLIC | 🔴 CRÍTICA |
| `OAUTH_SERVER_URL` | `https://seu-dominio-vercel.vercel.app` | PRIVATE | 🔴 CRÍTICA |
| `JWT_SECRET` | Gerar valor seguro (UUID v4 ou similar) | PRIVATE | 🔴 CRÍTICA |
| `NODE_ENV` | `production` | PRIVATE | 🟡 IMPORTANTE |

---

## 📊 DETALHAMENTO DAS VARIÁVEIS

### 1️⃣ Variáveis Públicas (`EXPO_PUBLIC_*`)
- **Visibility**: Expostas no código cliente (front-end)
- **Segurança**: ⚠️ NÃO coloque dados sensíveis aqui
- **Exemplos Seguros**: IDs de APIs públicas, URLs de domínio

**Variáveis Necessárias:**
```env
# Google Sheets (Leitura Pública)
EXPO_PUBLIC_GOOGLE_SHEETS_ID=1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=AIzaSyBNET7Szj8kedgcjDWj1Ix0Vf8V33W6CSQ

# URLs de Produção
EXPO_PUBLIC_API_BASE_URL=https://atc-gestao-territorio.vercel.app
EXPO_PUBLIC_OAUTH_SERVER_URL=https://atc-gestao-territorio.vercel.app

# App ID (Identificação)
EXPO_PUBLIC_APP_ID=atc-gestao-territorio
```

### 2️⃣ Variáveis Privadas (Server-side)
- **Visibility**: Apenas no servidor (back-end)
- **Segurança**: 🔐 CRÍTICA - Proteger sempre
- **Exemplos**: Chaves de serviço, JWT_SECRET, tokens privados

**Variáveis Necessárias:**
```env
# Google Service Account (Escrita na Planilha)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Autenticação JWT
JWT_SECRET=seu-secret-super-seguro-aqui-gerar-com-uuid

# Environment
NODE_ENV=production

# Vite Config
VITE_APP_ID=atc-gestao-territorio
OAUTH_SERVER_URL=https://atc-gestao-territorio.vercel.app
```

---

## 🌿 GESTÃO DE BRANCHES (localhost vs main)

### ⚠️ SITUAÇÃO ATUAL

```
Branches Locais:
  * localhost (BRANCH ATUAL)
  * main (BRANCH DE PRODUÇÃO)

Branches Remotas:
  * origin/localhost (atualizado)
  * origin/main (desatualizado)

Status Atual:
  ✅ Branch localhost está atualizada
  ⚠️ Branch main não tem as últimas mudanças de produção
```

### 🎯 ESTRATÉGIA SEGURA E PROFISSIONAL

#### **OPÇÃO 1: Git Flow Strategy** (Recomendado para Empresas)

```
┌─ main (Produção - Tags Release)
│   ↑
│   │ Pull Request + Review
│   │
├─ release/1.0.0
│   ↑
│   │ Merge depois de testes
│   │
├─ develop (Staging)
│   ↑
│   │ Pull Requests de features
│   │
└─ feature/*, bugfix/*, localhost (Development)
```

**Processo Seguro:**

1. **Sincronizar main com localhost:**
   ```bash
   git checkout main
   git pull origin main
   git merge localhost --no-ff -m "Merge localhost to main for v1.0.0 release"
   git tag -a v1.0.0 -m "Release v1.0.0 - Produção"
   git push origin main
   git push origin v1.0.0
   ```

2. **Criar branch de release para testes:**
   ```bash
   git checkout -b release/1.0.0 main
   git push origin release/1.0.0
   ```

3. **Deploy no Vercel via branch main:**
   - Vercel detectará push em `main`
   - Executará build automaticamente
   - Deploy em produção

#### **OPÇÃO 2: Simples (Para Projetos Pequenos)**

```
└─ main (Produção)
   ↑
   └─ localhost (Development)
```

**Processo:**

1. **Fazer merge seguro:**
   ```bash
   # Na branch main
   git checkout main
   git pull origin main
   
   # Merge de localhost
   git merge localhost --no-ff
   
   # Review de conflitos (se houver)
   git diff main...localhost
   
   # Se OK:
   git push origin main
   
   # Voltar para localhost
   git checkout localhost
   git merge main
   git push origin localhost
   ```

---

## ⚙️ PREPARAÇÃO PARA PRODUÇÃO

### ✅ CHECKLIST PRÉ-DEPLOYMENT

- [ ] **Testes Locais**
  ```bash
  npm run test
  npm run check  # TypeScript check
  npm run lint
  ```

- [ ] **Build Local**
  ```bash
  npm run build
  # Verificar se dist/ foi criado sem erros
  ```

- [ ] **Verificar Variáveis**
  ```bash
  # Confirmar que .env.vercel tem TODAS as variáveis
  grep "EXPO_PUBLIC_API_BASE_URL" .env.vercel
  grep "JWT_SECRET" .env.vercel
  ```

- [ ] **Commits Limpos**
  ```bash
  git status
  # Certifique-se que não há arquivos não commitados importantes
  ```

- [ ] **Tags de Release**
  ```bash
  git tag -l
  # Criar tag se ainda não existe
  git tag -a v1.0.0 -m "Release v1.0.0"
  ```

### 🔄 PASSOS RECOMENDADOS

#### **PASSO 1: Sincronizar Branches Localmente**

```bash
# 1. Atualizar ambas as branches
git fetch origin

# 2. Verificar diferenças
git log --oneline main..localhost

# 3. Ir para main
git checkout main

# 4. Merge com localhost (com histórico)
git merge localhost --no-ff -m "Merge localhost: preparação para v1.0.0"

# 5. Fazer tag de release
git tag -a v1.0.0 -m "Release v1.0.0 - ATC Gestão Território"

# 6. Push tudo
git push origin main
git push origin v1.0.0
```

#### **PASSO 2: Voltar para localhost**

```bash
git checkout localhost
git merge main
git push origin localhost
```

Isso garante que ambas as branches estão sincronizadas.

---

## 🚀 DEPLOY NO VERCEL

### MÉTODO 1: Vercel CLI (Recomendado)

#### **Pré-requisitos:**
```bash
npm install -g vercel
vercel login
```

#### **Passos:**

1. **Deploy Inicial (Primeira vez)**
   ```bash
   cd /home/matheus/Documentos/prog_diuli/v3/atc-gestao-territorioV3/atc-gestao-territorio
   vercel
   ```
   - Responda as perguntas:
     - "Set up and deploy?" → `y`
     - "Which scope?" → Seu usuário/team
     - "Link to existing project?" → `n` (primeira vez)
     - "Project name?" → `atc-gestao-territorio`
     - "Framework?" → Detecta automaticamente
     - "Build command?" → `npm run build`
     - "Output directory?" → `dist`

2. **Configurar Variáveis de Ambiente**
   ```bash
   vercel env pull .env.production
   # Depois editar e adicionar as variáveis
   ```

3. **Deploy em Produção**
   ```bash
   vercel --prod
   ```

### MÉTODO 2: GitHub Push (Contínuo/Automático)

#### **Pré-requisitos:**
- Projeto conectado ao GitHub
- Repositório em `github.com/seu-usuario/atc-gestao-territorio`

#### **Passos:**

1. **Conectar Repositório no Vercel:**
   - Acesse: https://vercel.com/new
   - Clique "Import Git Repository"
   - Selecione seu repositório
   - Configure:
     - **Framework**: Detectar automaticamente
     - **Root Directory**: `/` (raiz)
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

2. **Configurar Variáveis de Ambiente:**
   - Vá para: Settings → Environment Variables
   - Clique: "Import .env"
   - Copie conteúdo do `.env.vercel`
   - Clique: "Save"

3. **Deploy Automático:**
   ```bash
   # Quando você fizer push em main
   git push origin main
   # Vercel detectará automaticamente e fará build + deploy
   ```

---

## 🔑 CONFIGURAÇÃO DE VARIÁVEIS NO VERCEL

### MÉTODO 1: Interface Web (Recomendado)

1. **Acesse Vercel Dashboard:**
   - URL: https://vercel.com/projects

2. **Selecione o Projeto:**
   - Clique em `atc-gestao-territorio`

3. **Vá em Settings:**
   - Click: `Settings` (lado direito)
   - Selecione: `Environment Variables`

4. **Adicione as Variáveis:**

   **Variáveis Públicas (EXPO_PUBLIC_*):**
   ```
   Nome: EXPO_PUBLIC_GOOGLE_SHEETS_ID
   Valor: 1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs
   Tipos: Production, Preview, Development
   ```

   ```
   Nome: EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY
   Valor: AIzaSyBNET7Szj8kedgcjDWj1Ix0Vf8V33W6CSQ
   Tipos: Production, Preview, Development
   ```

   ```
   Nome: EXPO_PUBLIC_API_BASE_URL
   Valor: https://atc-gestao-territorio.vercel.app
   Tipos: Production, Preview, Development
   ```

   ```
   Nome: EXPO_PUBLIC_OAUTH_SERVER_URL
   Valor: https://atc-gestao-territorio.vercel.app
   Tipos: Production, Preview, Development
   ```

   ```
   Nome: EXPO_PUBLIC_APP_ID
   Valor: atc-gestao-territorio
   Tipos: Production, Preview, Development
   ```

   **Variáveis Privadas (Servidor):**
   ```
   Nome: GOOGLE_SERVICE_ACCOUNT_JSON
   Valor: {"type":"service_account",...} [JSON COMPLETO]
   Tipos: Production
   ⚠️ Não adicionar em Preview/Development por segurança
   ```

   ```
   Nome: JWT_SECRET
   Valor: [Gerar UUID v4 seguro]
   Tipos: Production, Preview
   ```

   ```
   Nome: NODE_ENV
   Valor: production
   Tipos: Production
   ```

   ```
   Nome: OAUTH_SERVER_URL
   Valor: https://atc-gestao-territorio.vercel.app
   Tipos: Production, Preview, Development
   ```

   ```
   Nome: VITE_APP_ID
   Valor: atc-gestao-territorio
   Tipos: Production, Preview, Development
   ```

5. **Salve e Faça Deploy:**
   - Clique: `Save`
   - Vá em: `Deployments`
   - Clique no último deployment
   - Clique: `Redeploy`

### MÉTODO 2: Vercel CLI

```bash
# Definir variável individual
vercel env add EXPO_PUBLIC_API_BASE_URL
# Será solicitado o valor e os tipos

# Listar variáveis
vercel env list

# Remover variável
vercel env remove EXPO_PUBLIC_API_BASE_URL
```

---

## ✅ VERIFICAÇÃO PÓS-DEPLOY

### 🔍 CHECKLIST DE VALIDAÇÃO

- [ ] **Build Status:**
  ```bash
  # Acesse Vercel Dashboard → Deployments
  # Status deve ser "Ready" (verde)
  ```

- [ ] **CORS Configurado:**
  - Testar em: https://seu-dominio-vercel.app/api/health

- [ ] **Variáveis Carregadas:**
  - Verificar em: DevTools → Console
  - Deve mostrar URLs de produção (não localhost)

- [ ] **Integração Google Sheets:**
  - Tentar fazer sync de cadastros
  - Verificar logs em Vercel

- [ ] **Autenticação JWT:**
  - Fazer login no app
  - Verificar token nos cookies

- [ ] **Performance:**
  - Acessar: https://vercel.com/projects/seu-projeto/analytics
  - Verificar métricas de performance

### 🧪 TESTES RÁPIDOS

```bash
# 1. Testar se URL está acessível
curl https://atc-gestao-territorio.vercel.app

# 2. Testar API
curl https://atc-gestao-territorio.vercel.app/api/health

# 3. Ver logs em tempo real
vercel logs

# 4. Verificar build logs
vercel logs --tail
```

---

## 🔐 SEGURANÇA E BOAS PRÁTICAS

### ⚠️ PROTEÇÃO DE DADOS SENSÍVEIS

#### **Nunca Fazer:**
```bash
❌ Commitar .env files no git
❌ Compartilhar JWT_SECRET
❌ Expor GOOGLE_SERVICE_ACCOUNT_JSON no código
❌ Usar secrets em variáveis públicas (EXPO_PUBLIC_*)
```

#### **Sempre Fazer:**
```bash
✅ Usar .gitignore para arquivos .env
✅ Armazenar secrets no Vercel Environment Variables
✅ Rotacionar JWT_SECRET periodicamente
✅ Separar Production/Preview/Development
```

### 📋 VERIFICAÇÃO DE SEGURANÇA

1. **Verificar .gitignore:**
   ```bash
   grep -E "\.env|secrets" .gitignore
   # Deve conter:
   # .env
   # .env.local
   # .env.*.local
   # secrets/
   ```

2. **Verificar Git History:**
   ```bash
   git log --all --full-history -- .env.local
   # Se houver commits, fazer:
   git filter-branch --tree-filter 'rm -f .env.local' -- --all
   ```

3. **Revisar Variáveis no Vercel:**
   ```bash
   vercel env list
   # Confirmar que:
   # - Private variables não aparecem como "Production+Preview"
   # - Service keys estão apenas em Production
   # - Development tem versões dummy/seguras
   ```

### 🔄 ROTAÇÃO DE SECRETS

A cada 6 meses ou após vazamento:

```bash
# 1. Gerar novo JWT_SECRET
node -e "console.log(require('crypto').randomUUID())"

# 2. Atualizar no Vercel
vercel env add JWT_SECRET

# 3. Redeplorar
vercel --prod

# 4. Monitorar logs
vercel logs --tail
```

---

## 🐛 TROUBLESHOOTING

### ❌ Problema: "Build Failed"

**Causa Comum:** Variáveis faltando durante build

**Solução:**
```bash
# 1. Verificar logs
vercel logs --tail

# 2. Confirmar variáveis estão setadas
vercel env list

# 3. Redeplorar após adicionar variáveis
vercel --prod
```

### ❌ Problema: "Cannot find module"

**Causa:** `node_modules` não instalado com dependências corretas

**Solução:**
```bash
# No Vercel Settings → General
# Build Command deve ser:
npm run build
# OU
npm install --legacy-peer-deps && npm run build
```

### ❌ Problema: "API Retorna 500 Erro"

**Causa:** Variáveis privadas não carregadas no servidor

**Solução:**
```bash
# Verificar se variáveis privadas estão em "Production"
# No Vercel: Settings → Environment Variables
# Confirmar que JWT_SECRET e GOOGLE_SERVICE_ACCOUNT_JSON
# estão com checkbox "Production" marcado

# Redeplorar
vercel --prod
```

### ❌ Problema: "Cors Error ao Chamar API"

**Causa:** URLs de origem não configuradas

**Solução:**
```bash
# 1. Atualizar EXPO_PUBLIC_API_BASE_URL para domínio final
# 2. Atualizar OAUTH_SERVER_URL para domínio final
# 3. Redeplorar

vercel env add EXPO_PUBLIC_API_BASE_URL
# Valor: https://seu-dominio-vercel.app

vercel --prod
```

### ❌ Problema: "Git Branch Mismatch"

**Causa:** Tentando deployer branch que não é main

**Solução:**
```bash
# Opção 1: Push para main
git push origin localhost:main

# Opção 2: Configurar branch de deploy no Vercel
# Settings → Git → Production Branch → Selecionar "localhost"

# Opção 3: Merge seguro (recomendado)
git checkout main
git pull origin main
git merge localhost --no-ff
git push origin main
```

---

## 📊 RESUMO FINAL: CHECKLIST EXECUTIVO

### PRÉ-DEPLOYMENT

- [ ] Todas as mudanças commitadas em `localhost`
- [ ] Testes passando: `npm run test && npm run check`
- [ ] Build local funcionando: `npm run build`
- [ ] `.env.vercel` atualizado com URLs de produção
- [ ] Branches sincronizadas

### DURANTE DEPLOYMENT

- [ ] Push para `main`: `git push origin main`
- [ ] Variáveis adicionadas no Vercel Dashboard
- [ ] Redeploy iniciado
- [ ] Build completou com sucesso

### PÓS-DEPLOYMENT

- [ ] URL acessível: `https://atc-gestao-territorio.vercel.app`
- [ ] API respondendo: `/api/health`
- [ ] Usuários conseguem fazer login
- [ ] Google Sheets sincronizando dados
- [ ] Sem erros no console

---

## 📞 SUPORTE E REFERÊNCIAS

- **Vercel Docs:** https://vercel.com/docs
- **Expo Web Deployment:** https://docs.expo.dev/guides/publishing-websites/
- **Git Workflow:** https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow
- **Environment Variables Best Practices:** https://12factor.net/config

---

**Versão do Documento:** 1.0.0  
**Última Atualização:** 2 de fevereiro de 2026  
**Próxima Revisão Recomendada:** 30 dias após produção  
**Responsável:** Tim de DevOps/DevX
