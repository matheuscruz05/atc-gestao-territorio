# 🔴 ANÁLISE TÉCNICA COMPLETA - Erro 500 no Vercel

**Data da Análise:** 26 de Janeiro de 2026  
**Engenheiro:** GitHub Copilot - Claude Sonnet 4.5  
**Status do Problema:** 🔴 CRÍTICO - Sincronização não funciona em produção

---

## 📊 RESUMO EXECUTIVO

### Problema Reportado
- ✅ **Localhost (http://localhost:3000):** Salvamento funciona perfeitamente na planilha DB do Google Sheets
- ❌ **Vercel (https://atc-gestao-territorio.vercel.app):** Erro 500 ao tentar salvar, dados ficam apenas no localStorage

### Impacto
- **Severidade:** CRÍTICA
- **Usuários Afetados:** 100% dos usuários ATC em produção
- **Funcionalidade Quebrada:** Sincronização com Google Sheets (persistência de dados)
- **Workaround Disponível:** Não (dados ficam apenas no navegador)

---

## 🔍 ANÁLISE DOS LOGS

### 1. Saída no Vercel (ERRO)

```
POST https://atc-gestao-territorio.vercel.app/api/sheets/create-or-update 500 (Internal Server Error)

[sendCadastro] 📡 Response status: 500
[sendCadastro] ❌ ERRO ao enviar cadastro: SyntaxError: Unexpected token 'A', "A server e"... is not valid JSON
```

**Interpretação:**
- O servidor retornou **HTML** ao invés de **JSON**
- Erro "Unexpected token 'A'" indica que começou com "A server error..." (HTML de erro)
- Status 500 = erro interno do servidor

### 2. Saída no Localhost (SUCESSO)

```
[Sheets] ========== POST /create-or-update START ==========
[Sheets] [create-or-update] ✅ Service Account OK - email: atc-gestao-territorio-sa@...
[Sheets] [create-or-update] ✅ Access token obtido (length: 1024)
[Sheets] [create-or-update] ✨ INSERT - Inserindo na linha: 3
[Sheets] [create-or-update] Response status: 200
[Sheets] [create-or-update] ✅ Sucesso!
[Sheets] ========== POST /create-or-update END (SUCCESS) ==========
```

**Interpretação:**
- Service Account carregado com sucesso de `./secrets/sa-key.json`
- Access token obtido via Google OAuth
- Dados inseridos na planilha com sucesso

---

## 🧪 TESTES DE DIAGNÓSTICO REALIZADOS

### Teste 1: Health Check
```bash
curl https://atc-gestao-territorio.vercel.app/api/health
```
**Resultado:** `HTTP 500` ❌

### Teste 2: Diagnóstico Completo
```bash
curl https://atc-gestao-territorio.vercel.app/api/diagnose
```
**Resultado:** `HTTP 500` ❌

### Teste 3: Endpoint Simples de Teste
```bash
curl https://atc-gestao-territorio.vercel.app/api/test-sheets
```
**Resultado:** `HTTP 500` ❌

### Conclusão dos Testes
**TODOS os endpoints retornam 500**, incluindo endpoints simples que não dependem de Google Sheets. Isso indica que o **servidor Express não está iniciando corretamente**.

---

## 🔬 ANÁLISE DO CÓDIGO

### 1. Configuração de Environment Variables

#### Em Localhost (.env.local):
```env
EXPO_PUBLIC_GOOGLE_SHEETS_ID=1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=AIzaSyBNET7Szj8kedgcjDWj1Ix0Vf8V33W6CSQ
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./secrets/sa-key.json
```

#### Em Vercel (.env.vercel):
```env
EXPO_PUBLIC_GOOGLE_SHEETS_ID=1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=AIzaSyBNET7Szj8kedgcjDWj1Ix0Vf8V33W6CSQ
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### 2. Carregamento de Service Account (server/sheets-sync.ts)

```typescript
function loadServiceAccount(): ServiceAccount | null {
  // Opção 1: JSON direto (Vercel)
  const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv && jsonEnv.trim()) {
    const sa = JSON.parse(jsonEnv);
    return sa;
  }

  // Opção 2: Arquivo local (localhost)
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  if (keyFile && keyFile.trim()) {
    const raw = fs.readFileSync(fullPath, "utf-8");
    const sa = JSON.parse(raw);
    return sa;
  }

  return null; // ❌ ERRO: Service Account não configurado
}
```

### 3. Inicialização do Servidor (api/index.ts)

```typescript
// Log environment status at startup
console.log("[API] ========== SERVER STARTUP ==========");
console.log("[API] GOOGLE_SERVICE_ACCOUNT_JSON:", process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "SET" : "NOT SET");

// ...

app.use("/api/sheets", sheetsRouter);
```

---

## 🎯 CAUSA RAIZ IDENTIFICADA

### Hipótese Principal: Erro na Inicialização do Servidor Express

**Evidências:**
1. ❌ Todos os endpoints retornam 500 (não apenas /create-or-update)
2. ❌ Até mesmo `/api/health` (endpoint simples) falha
3. ❌ Não há logs de `[API] SERVER STARTUP` nos logs do Vercel

**Causa Provável:**
O servidor Express está **falhando na inicialização** antes de registrar as rotas. Possíveis causas:

#### A. Erro no módulo `server/_core/sdk.ts`
```typescript
// Em sdk.ts, linha ~7
import { ENV } from "./env";

// Em env.ts
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  // ...
};
```

**PROBLEMA POTENCIAL:** Se `VITE_APP_ID`, `JWT_SECRET` ou `OAUTH_SERVER_URL` não estiverem configuradas, o servidor pode falhar silenciosamente.

#### B. Erro no módulo `server/db.ts`
```typescript
// Em db.ts (possível)
const db = drizzle(process.env.DATABASE_URL);
```

**PROBLEMA POTENCIAL:** Se `DATABASE_URL` não estiver configurada, pode gerar erro fatal.

#### C. Erro no carregamento de dependências
- Falta de variáveis de ambiente obrigatórias
- Módulos nativos não disponíveis no Vercel (ex: `crypto`, `fs`)
- Timeout na inicialização

---

## 🔧 SOLUÇÕES PROPOSTAS

### Solução 1: Verificar Variáveis de Ambiente Obrigatórias no Vercel

**Checklist de Variáveis:**
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` (JSON em uma linha)
- [ ] `EXPO_PUBLIC_GOOGLE_SHEETS_ID`
- [ ] `EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY`
- [ ] `JWT_SECRET` ⚠️ **PODE ESTAR FALTANDO**
- [ ] `DATABASE_URL` ⚠️ **PODE ESTAR FALTANDO**
- [ ] `OAUTH_SERVER_URL` ⚠️ **PODE ESTAR FALTANDO**
- [ ] `VITE_APP_ID` ⚠️ **PODE ESTAR FALTANDO**

**Ação:** Acessar Vercel Dashboard → Environment Variables e verificar todas as variáveis.

### Solução 2: Adicionar Try-Catch na Inicialização

**Arquivo:** `api/index.ts`

```typescript
try {
  import express from "express";
  import { createExpressMiddleware } from "@trpc/server/adapters/express";
  import { registerOAuthRoutes } from "../server/_core/oauth";
  import { appRouter } from "../server/routers";
  import { createContext } from "../server/_core/context";
  import { sheetsRouter } from "../server/sheets-sync";
  
  const app = express();
  
  // ... restante do código
} catch (error) {
  console.error("[API] ❌ ERRO CRÍTICO NA INICIALIZAÇÃO:");
  console.error("[API] Tipo:", typeof error);
  console.error("[API] Message:", error.message);
  console.error("[API] Stack:", error.stack);
  process.exit(1);
}
```

### Solução 3: Tornar Dependências Opcionais

**Arquivo:** `server/_core/env.ts`

```typescript
export const ENV = {
  appId: process.env.VITE_APP_ID || process.env.EXPO_PUBLIC_APP_ID || "",
  cookieSecret: process.env.JWT_SECRET || "default-secret-for-dev", // ⚠️ Use secret forte em prod
  databaseUrl: process.env.DATABASE_URL || "", // Opcional se não usar DB
  oAuthServerUrl: process.env.OAUTH_SERVER_URL || "", // Opcional se não usar OAuth
  ownerOpenId: process.env.OWNER_OPEN_ID || "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || "",
};

// Log de alerta se variáveis críticas não estiverem definidas
if (!ENV.appId) console.warn("[ENV] ⚠️ VITE_APP_ID não definido");
if (!ENV.cookieSecret || ENV.cookieSecret === "default-secret-for-dev") {
  console.warn("[ENV] ⚠️ JWT_SECRET não definido - usando fallback inseguro");
}
```

### Solução 4: Verificar Logs do Vercel

**Ação:** Acessar Vercel Dashboard → Deployments → [Seu Deploy] → Function Logs

**Procurar por:**
- Erros de inicialização do Express
- Erros de parsing de JSON
- Erros de módulos não encontrados
- Timeouts

---

## 📋 PLANO DE AÇÃO (EXECUTAR NA ORDEM)

### Fase 1: Diagnóstico Remoto ✅ CONCLUÍDO
- [x] Analisar logs do arquivo ERRO_SINC.txt
- [x] Testar endpoints /api/health e /api/diagnose
- [x] Confirmar que o erro é na inicialização do servidor

### Fase 2: Investigação de Variáveis 🔄 EM ANDAMENTO
- [ ] Acessar Vercel Dashboard → Environment Variables
- [ ] Verificar se todas as variáveis obrigatórias estão configuradas
- [ ] Adicionar variáveis faltantes (JWT_SECRET, DATABASE_URL, etc.)

### Fase 3: Correção de Código 🔜 PRÓXIMO PASSO
- [ ] Tornar variáveis de ambiente opcionais com fallbacks seguros
- [ ] Adicionar try-catch robusto na inicialização
- [ ] Melhorar logs de diagnóstico

### Fase 4: Deploy e Teste 🔜 APÓS CORREÇÃO
- [ ] Fazer redeploy no Vercel
- [ ] Verificar logs de inicialização
- [ ] Testar /api/health
- [ ] Testar /api/sheets/create-or-update
- [ ] Validar salvamento na planilha

---

## 🚨 HIPÓTESES ALTERNATIVAS

### Hipótese B: Timeout na Inicialização
- Vercel tem limite de 10s para serverless functions iniciarem
- Se o carregamento de dependências demorar muito, função falha

**Teste:** Aumentar timeout no vercel.json
```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

### Hipótese C: Erro na Resolução de Módulos
- Vercel pode não encontrar módulos devido a caminhos relativos

**Teste:** Verificar se todos os imports estão corretos

---

## 📞 RECOMENDAÇÕES IMEDIATAS

### 1. URGENTE: Verificar Vercel Dashboard
Acessar: https://vercel.com/seu-projeto/settings/environment-variables

Adicionar as variáveis faltantes:
```env
JWT_SECRET=sua-chave-secreta-forte-aqui
DATABASE_URL=mysql://user:pass@host/db (se usar DB)
OAUTH_SERVER_URL=https://seu-oauth-server.com (se usar OAuth)
VITE_APP_ID=seu-app-id
```

### 2. URGENTE: Verificar Logs do Vercel
Acessar: https://vercel.com/seu-projeto/deployments

Procurar pelo último deploy e abrir "Function Logs"

### 3. Implementar Correções no Código
Aplicar Soluções 2 e 3 acima para tornar o servidor mais robusto

---

## 📝 CONCLUSÃO

**Causa Raiz Provável:** Servidor Express falhando na inicialização devido a variáveis de ambiente faltantes (`JWT_SECRET`, `DATABASE_URL`, etc.)

**Solução Recomendada:**
1. Verificar e adicionar todas as variáveis no Vercel Dashboard
2. Tornar variáveis opcionais com fallbacks seguros
3. Melhorar error handling na inicialização

**Próximo Passo:** Executar Fase 2 do Plano de Ação

---

**Status Final:** 🔴 Aguardando verificação de variáveis de ambiente no Vercel Dashboard
