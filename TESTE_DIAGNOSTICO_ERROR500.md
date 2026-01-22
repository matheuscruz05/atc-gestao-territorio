# 🔧 TESTE DE DIAGNÓSTICO - Erro 500 em Vercel

## 🎯 Problema
Variáveis estão no Vercel, mas endpoint retorna 500 com HTML ("A server error...")

## 🧪 Testes de Diagnóstico (Execute na Ordem)

### Teste 1: Health Check Básico
```
GET https://atc-gestao-territorio.vercel.app/api/health
```
**Resultado esperado:**
```json
{
  "ok": true,
  "timestamp": "2026-01-22T12:15:00.000Z",
  "environment": {
    "has_sheets_id": true,
    "has_service_account_json": true
  }
}
```

---

### Teste 2: Diagnóstico Completo
```
GET https://atc-gestao-territorio.vercel.app/api/diagnose
```
**Resultado esperado:**
```json
{
  "status": "ok",
  "environment_variables": {
    "EXPO_PUBLIC_GOOGLE_SHEETS_ID": "✅ SET (1qDxc1c9j7IEa2...)",
    "GOOGLE_SERVICE_ACCOUNT_JSON": "✅ SET (1500 chars)",
    "GOOGLE_SERVICE_ACCOUNT_KEY_FILE": "❌ NOT SET"
  }
}
```

**Se algum estiver ❌ NOT SET:**
- Vá para Vercel Dashboard
- Settings → Environment Variables
- Verifique se está na aba "Project"
- Certifique-se de que está em "All Environments" (Production, Preview, Development)

---

### Teste 3: Teste POST Simples
```
POST https://atc-gestao-territorio.vercel.app/api/test-sheets
Content-Type: application/json

{}
```
**Resultado esperado:**
```json
{
  "test": "ok",
  "message": "Endpoint de teste funcionando"
}
```

**Se retornar 500:**
- Problema no servidor Express
- Verifique logs do Vercel

---

### Teste 4: Teste da Rota Real (com dados válidos)
```
POST https://atc-gestao-territorio.vercel.app/api/sheets/create-or-update
Content-Type: application/json

{
  "cadastroId": "teste-123",
  "canal": "COCARI",
  "unidade": "LONDRINA",
  "estado": "PR",
  "atcEmail": "teste@atc.com",
  "atcNome": "ATC Teste",
  "criadoEm": "2026-01-22T12:00:00Z",
  "editadoEm": "2026-01-22T12:00:00Z",
  "categorias": [
    {
      "categoria": "MILHO - Produto",
      "produtoRef": "MILHO",
      "produtoNomeLivre": "Milho Premium",
      "potencialTotal": 1000,
      "potencialAtingido": 500,
      "unidadePotencial": "tons",
      "safra": "Verão",
      "implantadoInicialmente": "SIM"
    }
  ]
}
```

---

## 📊 Interpretação dos Resultados

| Teste | Resultado | Significa |
|-------|-----------|-----------|
| Health ✅ | 200 OK | Servidor rodando |
| Diagnose ✅ | Vars SET | Variáveis configuradas |
| Test POST ✅ | 200 OK | Express rodando |
| **create-or-update ❌ 500** | HTML response | **PROBLEMA AQUI** ↓ |

### Se `create-or-update` retorna 500 com HTML:

1. **Verificar logs do Vercel:**
   - Vercel Dashboard → Deployments → Seu Deploy → Logs
   - Procure por:
     ```
     [Sheets] ========== POST /create-or-update START ==========
     [Sheets] SPREADSHEET_ID: ...
     [Sheets] Service Account OK
     ```
   - Se não aparecer → Rota não foi acionada
   - Se aparecer erro → Verificar mensagem

2. **Verificar se Sheet está compartilhada:**
   - A Service Account precisa ter permissão
   - Email da SA: `atc-gestao-territorio-sa@atc-gestao-territorio-483803.iam.gserviceaccount.com`
   - Abra a planilha → Compartilhar → Adicione o email acima

3. **Verificar headers HTTP:**
   - Request precisa ter `Content-Type: application/json`
   - Body precisa ser JSON válido

---

## 🚨 Checklist de Solução

Se `create-or-update` continua retornando 500:

- [ ] Acessei Vercel Dashboard → Environment Variables
- [ ] Confirmei que `GOOGLE_SERVICE_ACCOUNT_JSON` está em "All Environments"
- [ ] Confirmei que o JSON está em UMA LINHA (sem quebras)
- [ ] Verificar se `EXPO_PUBLIC_GOOGLE_SHEETS_ID` está correto
- [ ] Planilha compartilhada com Service Account email
- [ ] Fiz redeploy no Vercel (Deployments → [...] → Redeploy)
- [ ] Aguardei 2-3 minutos antes de testar novamente
- [ ] Verifiquei logs do Vercel para erros específicos

---

## 📝 Logs Esperados no Vercel

**Quando tudo funciona:**
```
[API] POST /api/sheets/create-or-update
[Sheets] ========== POST /create-or-update START ==========
[Sheets] [create-or-update] cadastroId: teste-123
[Sheets] [create-or-update] ✅ Service Account OK - email: atc-gestao-territorio-sa@...
[Sheets] [create-or-update] ✅ Access token obtido (length: 150)
[Sheets] [create-or-update] ✨ INSERT - Inserindo na linha: 5
[Sheets] [create-or-update] Response status: 200
[Sheets] [create-or-update] ✅ Sucesso!
[Sheets] ========== POST /create-or-update END (SUCCESS) ==========
```

**Quando algo está errado:**
```
[Sheets] ❌ Service Account not configured
[Sheets] ❌ Variáveis disponíveis:
[Sheets]   - GOOGLE_SERVICE_ACCOUNT_JSON: SET (length: 1500)
[Sheets]   - GOOGLE_SERVICE_ACCOUNT_KEY_FILE: undefined
```

---

## 🔄 Próximos Passos

1. Execute `Teste 1` (Health Check)
2. Execute `Teste 2` (Diagnóstico)
3. Verifique no Vercel se todos os valores estão SET
4. Se NÃO estão SET → Adicione no Vercel Dashboard
5. Se estão SET → Faça redeploy
6. Execute `Teste 3` (Simples)
7. Execute `Teste 4` (Real)
8. Verifique logs do Vercel
9. Se ainda falhar → Copie os logs e abra issue

---

## 💡 Comandos úteis (via Terminal)

### Health Check
```bash
curl https://atc-gestao-territorio.vercel.app/api/health
```

### Diagnóstico
```bash
curl https://atc-gestao-territorio.vercel.app/api/diagnose | jq
```

### Teste POST
```bash
curl -X POST https://atc-gestao-territorio.vercel.app/api/test-sheets \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Teste Real
```bash
curl -X POST https://atc-gestao-territorio.vercel.app/api/sheets/create-or-update \
  -H "Content-Type: application/json" \
  -d '{
    "cadastroId": "teste-123",
    "canal": "COCARI",
    "unidade": "LONDRINA",
    "estado": "PR",
    "atcEmail": "teste@atc.com",
    "atcNome": "ATC Teste",
    "criadoEm": "2026-01-22T12:00:00Z",
    "categorias": []
  }' | jq
```

---

**✅ Objetivo:** Identificar exatamente onde o erro ocorre para uma correção direcionada.
