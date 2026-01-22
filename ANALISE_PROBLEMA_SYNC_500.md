# 🔍 Análise do Problema de Sincronização (500 Error)

## 📊 Diagnóstico

### Sintomas Observados
```
POST https://atc-gestao-territorio.vercel.app/api/sheets/create-or-update 500 (Internal Server Error)
SyntaxError: Unexpected token 'A', "A server e"... is not valid JSON
```

### Causa Raiz Identificada

O erro 500 + "Unexpected token 'A'" indica que:
1. ✅ A rota `/api/sheets/create-or-update` está sendo alcançada
2. ❌ O servidor está retornando **HTML** ao invés de **JSON**
3. ❌ Erro não tratado está gerando página de erro padrão do Vercel

## 🛠️ Soluções Implementadas

### 1. **Global Error Handler** (api/index.ts)
```typescript
// Global error handler - MUST return JSON
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[API] ❌ ERRO NÃO TRATADO:", err);
  
  // Garante que sempre retorna JSON
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: err.message || String(err),
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
});
```

**Por quê?**
- Garante que **TODOS** os erros retornem JSON
- Evita que o Vercel retorne páginas HTML de erro
- Fornece mensagens de erro detalhadas para debug

### 2. **Logs Detalhados de Debug** (server/sheets-sync.ts)

Adicionados logs em TODOS os pontos críticos:

```typescript
console.log("[Sheets] ========== POST /create-or-update START ==========");
console.log("[Sheets] SPREADSHEET_ID:", spreadsheetId || "❌ NÃO CONFIGURADO");
console.log("[Sheets] Service Account OK - email:", sa.client_email);
console.log("[Sheets] Access token obtido (length:", accessToken.length, ")");
console.log("[Sheets] Response status:", insertRes.status);
console.log("[Sheets] ========== POST /create-or-update END ==========");
```

**Por quê?**
- Permite identificar **exatamente** onde o erro ocorre
- Verifica se variáveis de ambiente estão configuradas
- Monitora cada etapa do processo de sincronização

### 3. **Request Logging Middleware** (api/index.ts)

```typescript
app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});
```

**Por quê?**
- Confirma que as requisições estão chegando no Express
- Valida que o roteamento do Vercel está funcionando

### 4. **Ajustes no vercel.json**

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    }
  ],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

**Mudanças:**
- `/api/:path*` → `/api/(.*)`  (regex mais explícito)
- `api/index.ts` → `api/**/*.ts` (abrange todos os arquivos)
- Adicionado `memory: 1024` para evitar timeout

## 🔍 Próximos Passos para Diagnóstico

Após o deploy, verificar logs do Vercel em:
```
https://vercel.com/seu-projeto/deployments → Logs
```

### O que procurar:

1. **Variáveis de Ambiente:**
```
[Sheets] SPREADSHEET_ID: 1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs
[Sheets] Service Account OK - email: atc-gestao-territorio-sa@...
```
✅ Se aparecer → Variáveis configuradas
❌ Se aparecer "NÃO CONFIGURADO" → Adicionar no Vercel Dashboard

2. **Access Token:**
```
[Sheets] Access token obtido (length: 120+)
```
✅ Se aparecer → Autenticação funcionando
❌ Se falhar → Problema com Service Account JSON

3. **Request Flow:**
```
[API] POST /api/sheets/create-or-update
[Sheets] ========== POST /create-or-update START ==========
[Sheets] cadastroId: 1769080660469-03buenr3a
```
✅ Se aparecer → Roteamento OK
❌ Se não aparecer → Problema no Vercel routing

## 🚨 Checklist de Verificação no Vercel

- [ ] **Environment Variables** (Settings → Environment Variables):
  - `GOOGLE_SERVICE_ACCOUNT_JSON` → JSON completo em uma linha
  - `EXPO_PUBLIC_GOOGLE_SHEETS_ID` ou `GOOGLE_SHEETS_ID` → ID da planilha
  - `GOOGLE_API_KEY` → API Key do Google Cloud

- [ ] **Deploy Status** (Deployments):
  - Build concluído sem erros
  - Functions deployed successfully

- [ ] **Function Logs** (Deployments → Function Logs):
  - Logs de `[API]` e `[Sheets]` aparecendo
  - Sem erros de TypeScript/Import

## 📈 Resultado Esperado

Após as correções, o console do app deve mostrar:

```
✅ [Sheets] ========== POST /create-or-update START ==========
✅ [Sheets] cadastroId: 1769080660469-03buenr3a
✅ [Sheets] SPREADSHEET_ID: 1qDxc1c9j...
✅ [Sheets] Service Account OK - email: atc-gestao-territorio-sa@...
✅ [Sheets] Access token obtido (length: 150)
✅ [Sheets] INSERT - Inserindo na linha: 5
✅ [Sheets] Response status: 200
✅ [Sheets] ========== POST /create-or-update END (SUCCESS) ==========
```

E o app receberá:
```json
{
  "success": true,
  "message": "Cadastro criado com sucesso",
  "method": "INSERT",
  "rowIndex": 5
}
```

## 🔧 Se o Problema Persistir

### Cenário 1: Erro 500 continua
**Causa:** Variáveis de ambiente não configuradas no Vercel
**Solução:** Adicionar no Vercel Dashboard → Settings → Environment Variables

### Cenário 2: Erro "Service Account not configured"
**Causa:** `GOOGLE_SERVICE_ACCOUNT_JSON` inválido
**Solução:** Verificar se o JSON está em **UMA LINHA** e sem espaços extras

### Cenário 3: Erro "SPREADSHEET_ID not configured"
**Causa:** Variável não definida no Vercel
**Solução:** Adicionar `EXPO_PUBLIC_GOOGLE_SHEETS_ID` ou `GOOGLE_SHEETS_ID`

### Cenário 4: Erro 401 Unauthorized
**Causa:** Service Account sem permissões na planilha
**Solução:** Compartilhar planilha com `atc-gestao-territorio-sa@atc-gestao-territorio-483803.iam.gserviceaccount.com`

---

## 📝 Resumo das Alterações

| Arquivo | Mudança | Objetivo |
|---------|---------|----------|
| `api/index.ts` | Global error handler | Retornar sempre JSON |
| `api/index.ts` | Request logging | Monitorar requisições |
| `server/sheets-sync.ts` | Logs detalhados | Debug completo |
| `vercel.json` | Regex mais explícito | Melhorar roteamento |
| `vercel.json` | Memory config | Evitar timeout |

---

**✅ Deploy realizado:** Commit `fix: adicionar logs debug e error handler para sincronização`
**⏳ Aguardando:** Vercel rebuild e teste no app
