# 🔴 PROBLEMA CRÍTICO: Sincronização Falha em Vercel (Funciona em localhost)

## 📊 Diagnóstico Detalhado

### Sintomas
- ✅ **Em localhost**: Cadastros salvos normalmente no Google Sheets
- ❌ **Em Vercel**: Erro 500 - "Unexpected token 'A', "A server e"... is not valid JSON"

### Causa Raiz Identificada

O problema está em **como as variáveis de ambiente são carregadas**:

#### Em Localhost (pnpm dev):
```
.env.local
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./secrets/sa-key.json
                        ↓
[loadServiceAccount] Lê arquivo ./secrets/sa-key.json
                        ↓
✅ JSON carregado e parseado com sucesso
```

#### Em Vercel (produção):
```
Vercel Dashboard Environment Variables
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
                        ↓
❌ Não encontra a variável OU
❌ A variável não está configurada NO DASHBOARD
                        ↓
❌ loadServiceAccount() retorna null
                        ↓
❌ Erro 500 com HTML de erro
```

## 🔧 Soluções Implementadas

### 1. **Logs Detalhados na Inicialização** (api/index.ts)
```typescript
console.log("[API] ========== SERVER STARTUP ==========");
console.log("[API] GOOGLE_SERVICE_ACCOUNT_JSON:", process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "SET" : "NOT SET");
console.log("[API] EXPO_PUBLIC_GOOGLE_SHEETS_ID:", process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID ? "SET" : "NOT SET");
```

Isso permite verificar **imediatamente** se o Vercel está passando as variáveis.

### 2. **Validação Robusta do Service Account** (server/sheets-sync.ts)
```typescript
if (!jsonEnv || !jsonEnv.trim()) {
  console.warn("[Sheets] GOOGLE_SERVICE_ACCOUNT_JSON não definido ou vazio");
}

// Valida se JSON tem campos obrigatórios
if (!sa.private_key || !sa.client_email) {
  throw new Error("JSON inválido: faltam private_key ou client_email");
}
```

### 3. **Mensagens de Erro Claras** (server/sheets-sync.ts)
```
❌ FALHA: Service Account não configurado!
✅ PRODUÇÃO (Vercel): Configure GOOGLE_SERVICE_ACCOUNT_JSON
   - Ir para: Vercel Dashboard → Settings → Environment Variables
   - Adicionar: GOOGLE_SERVICE_ACCOUNT_JSON
✅ DESENVOLVIMENTO: Configure .env.local
   - GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./secrets/sa-key.json
```

### 4. **Endpoint de Diagnóstico** (api/index.ts)
```
GET /api/status
```

Responde com status de todas as variáveis configuradas:
```json
{
  "EXPO_PUBLIC_GOOGLE_SHEETS_ID": "✅ SET",
  "GOOGLE_SERVICE_ACCOUNT_JSON": "✅ SET (1500 chars)",
  "GOOGLE_SERVICE_ACCOUNT_KEY_FILE": "❌ NOT SET"
}
```

## ✅ Próximos Passos - OBRIGATÓRIO

### Passo 1: Configurar Vercel Dashboard
1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Adicione as variáveis:
   - `GOOGLE_SERVICE_ACCOUNT_JSON` (JSON em UMA linha)
   - `EXPO_PUBLIC_GOOGLE_SHEETS_ID` ou `GOOGLE_SHEETS_ID`
   - `EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY` ou `GOOGLE_API_KEY`

### Passo 2: Testar Diagnóstico
Após deploy, acesse:
```
https://atc-gestao-territorio.vercel.app/api/status
```

**Resultado esperado:**
```json
{
  "EXPO_PUBLIC_GOOGLE_SHEETS_ID": "✅ SET",
  "GOOGLE_SERVICE_ACCOUNT_JSON": "✅ SET (1500+ chars)",
  "status": "ok"
}
```

### Passo 3: Verificar Logs
1. Acesse: Vercel Dashboard → Deployments → Function Logs
2. Procure por:
   ```
   [API] ========== SERVER STARTUP ==========
   [Sheets] ========== Loading Service Account ==========
   [Sheets] ✅ Service Account carregado com sucesso!
   ```

### Passo 4: Testar Sincronização
1. Acesse o app em produção
2. Login como ATC
3. Crie um novo cadastro
4. Verifique no console:
   ```
   ✅ [Sheets] ========== POST /create-or-update START ==========
   ✅ [Sheets] Response status: 200
   ✅ [Sheets] ========== POST /create-or-update END (SUCCESS) ==========
   ```

## 🚨 Problemas Comuns e Soluções

### Problema 1: "SyntaxError: Unexpected token 'A'"
**Causa**: Servidor retornando HTML ao invés de JSON  
**Solução**: Verificar logs do Vercel → procurar erro real

### Problema 2: "Service Account not configured"
**Causa**: `GOOGLE_SERVICE_ACCOUNT_JSON` não está configurada  
**Solução**: Adicionar no Vercel Dashboard → Environment Variables

### Problema 3: "Invalid JSON"
**Causa**: JSON com quebras de linha  
**Solução**: Cole o JSON em **UMA ÚNICA LINHA**

### Problema 4: "401 Unauthorized"
**Causa**: Service Account sem permissão na planilha  
**Solução**: Compartilhar planilha com email do Service Account

## 📋 Checklist Final

- [ ] Variável `GOOGLE_SERVICE_ACCOUNT_JSON` adicionada no Vercel
- [ ] JSON está em uma linha (sem quebras)
- [ ] Redeploy realizado no Vercel
- [ ] Acessar `/api/status` e confirmar variáveis SET
- [ ] Verificar logs do Vercel para erros
- [ ] Testar criação de cadastro no app
- [ ] Confirmar cadastro aparece no Google Sheets
- [ ] Testar edição de cadastro
- [ ] Testar exclusão de cadastro

## 🎯 Resultado Esperado

**Antes da correção:**
```
❌ POST /api/sheets/create-or-update 500
❌ SyntaxError: Unexpected token 'A'
❌ Cadastro não salva no Google Sheets
```

**Depois da correção:**
```
✅ POST /api/sheets/create-or-update 200
✅ {"success": true, "message": "Cadastro criado com sucesso"}
✅ Cadastro aparece na planilha Google Sheets
```

---

## 📞 Suporte

Se o problema persistir após seguir os passos acima:

1. **Verificar Vercel Logs:**
   ```
   Vercel Dashboard → Deployments → [Seu Deploy] → Logs
   ```

2. **Procurar por:**
   - `[API]` - Logs do Express
   - `[Sheets]` - Logs do sincronismo
   - Erros de import ou compilação

3. **Testar endpoint de diagnóstico:**
   ```
   curl https://seu-app.vercel.app/api/status
   ```

4. **Forçar redeploy:**
   ```
   Vercel Dashboard → Deployments → [...] → Redeploy
   ```
