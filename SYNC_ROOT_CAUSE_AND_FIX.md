# 🧠 Análise Metacognitiva — Falha Crítica de Sincronização (Localhost + Vercel)

## DECOMPOR (Subproblemas)
1. **Localhost**: POST para `/api/sheets/create-or-update` retorna **404**.
2. **Vercel**: POST para `/api/sheets/create-or-update` retorna **500** com resposta **HTML** (não JSON).
3. **Sinais secundários**: warnings de rotas e de UI (não causam falha de sincronização).

---

## RESOLVER (Causa raiz + confiança)

### 1) Localhost — **404 em `/api/sheets/create-or-update`**
**Causa raiz**: o frontend roda no **Metro** (http://localhost:8081) e faz `fetch` com **URL relativa** (`/api/...`). O **servidor Express** do backend roda em **porta diferente** (3000+), portanto o endpoint **não existe** em 8081. Resultado: **404**.

**Evidências**:
- Log: `POST http://localhost:8081/api/sheets/create-or-update 404 (Not Found)`
- Server local usa `server/_core/index.ts` e escuta `PORT=3000` (ou próximo disponível).

**Correção aplicada**:
- `sendCadastroToSheets()` e `syncAllCadastrosToSheets()` agora usam `getApiBaseUrl()` quando disponível, caindo para URL relativa apenas se não houver base configurada.
- Em localhost, o `.env.local` já possui `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`.

**Confiança**: **0,95**

---

### 2) Vercel — **500 + resposta HTML (“Unexpected token 'A'”)**
**Causa raiz provável**: o handler do Express não estava sendo exportado como **default** no entrypoint do Vercel, então o Vercel respondeu com HTML de erro (não JSON), causando o parse failure no cliente.

**Correção aplicada**:
- `api/index.mjs` exporta `default app`.

**Observação de produção**:
Se ainda ocorrer 500 após deploy, **a causa passa a ser** falta de variáveis críticas no Vercel (`GOOGLE_SERVICE_ACCOUNT_JSON` e/ou `EXPO_PUBLIC_GOOGLE_SHEETS_ID`).

**Confiança**: **0,90**

---

## VERIFICAR (Lógica, fatos, completude, vieses)
- Localhost: evidência direta de 404 na mesma origem (8081). O backend local roda em 3000 → falha confirmada.
- Vercel: erro de parse indica resposta HTML e não JSON → compatível com handler ausente/erro antes do middleware JSON.
- Vieses: múltiplos warnings de UI foram ignorados por não impactarem o endpoint `/api/sheets/*`.

---

## SINTETIZAR (Causa raiz consolidada)
- **Localhost**: frontend aponta para origem errada (8081) porque usa URL relativa; o backend está em 3000.
- **Vercel**: endpoint respondia HTML (handler não exportado). Correção aplicada e requer redeploy.

**Confiança consolidada**: **0,92**

---

## REFLETIR
Como a confiança está **> 0,90**, não é necessário novo ciclo.

---

## ✅ Plano de Correção (tarefas executáveis)

### Tarefa 1 — Confirmar base URL de API no localhost
- Objetivo: garantir que o frontend aponte para o backend em 3000.
- Comando:
```
cat .env.local | grep EXPO_PUBLIC_API_BASE_URL
```

### Tarefa 2 — Reiniciar dev server para aplicar mudanças
- Objetivo: garantir que o bundle carregue o novo `getApiBaseUrl()`.
- Comando:
```
pnpm dev
```

### Tarefa 3 — Confirmar que o backend local responde
- Objetivo: validar que o Express local está rodando.
- Comando:
```
curl -s http://localhost:3000/api/health
```

### Tarefa 4 — Retestar salvamento
- Objetivo: confirmar que `POST /api/sheets/create-or-update` funciona sem 404.
- Ação: salvar um cadastro no app.

### Tarefa 5 — Vercel: redeploy da main
- Objetivo: aplicar `export default app` em produção.
- Ação: redeploy via dashboard do Vercel.

---

## ✅ Resultado esperado
- Localhost: `POST /api/sheets/create-or-update` retorna 200 e grava no Sheets.
- Vercel: endpoint retorna JSON válido e sincroniza normalmente.
