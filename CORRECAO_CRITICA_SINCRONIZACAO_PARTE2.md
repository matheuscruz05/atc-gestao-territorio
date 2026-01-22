# 🔥 CORREÇÃO CRÍTICA - SINCRONIZAÇÃO GOOGLE SHEETS (PARTE 2)

**Data**: 22 de janeiro de 2026  
**Tipo**: Correção de erro 500 na sincronização com Google Sheets (Usuário ATC)

---

## 📋 PROBLEMA IDENTIFICADO

### 🔴 Erro 500 ao Sincronizar Cadastro (Usuário ATC)

**Sintoma:**
```
POST https://atc-gestao-territorio.vercel.app/api/sheets/create-or-update 500 (Internal Server Error)
{success: false, error: 'Failed to sync cadastro', 
 message: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`}
```

**Por que Admin consegue excluir mas ATC não consegue criar?**

- ✅ **Admin** usa `/api/sheets/cadastros/:id` com DELETE
- ❌ **ATC** tenta usar `/api/sheets/create-or-update` com POST

A diferença é que DELETE funciona porque a rota está no servidor Express (`server/sheets-sync.ts`), mas CREATE-OR-UPDATE falhava porque:

1. Existia um arquivo TypeScript duplicado: `/api/sheets/create-or-update.ts`
2. Este arquivo Vercel serverless function tinha erros
3. Retornava HTML 500 em vez de JSON
4. O servidor Express nunca era consultado em produção

---

## 🔧 CAUSA RAIZ

### ⚙️ Problema 1: Arquivo TypeScript Duplicado

Havia dois arquivos diferentes tratando o mesmo endpoint:
- `/api/sheets/create-or-update.ts` ❌ Serverless function Vercel (com erro)
- `server/sheets-sync.ts` router Express ✅ (funcionando)

Em Vercel, serverless functions têm prioridade. Quando o arquivo TypeScript tinha erro, retornava HTML.

### ⚙️ Problema 2: Servidor Express Não Era Compilado

O `vercel.json` tinha `buildCommand: "npm run build:clean"` que:
- ✅ Compilava o frontend (Expo)
- ❌ NÃO compilava o servidor Express

Sem o servidor compilado, as rotas `/api/sheets/*` do Express não estavam acessíveis.

### ⚙️ Problema 3: Vercel Não Sabia Rotear para o Servidor

O `vercel.json` tinha rewrites para `/api/:path*` → `/api/:path*`, mas:
- Não havia serverless function em `/api/index.ts`
- Vercel não sabia para onde rotear as requisições

---

## ✅ SOLUÇÕES APLICADAS

### 1. Remover Arquivo Duplicado

```bash
rm api/sheets/create-or-update.ts
```

Eliminado o arquivo Vercel que causava erro 500.

---

### 2. Criar Entry Point do Servidor para Vercel

**Novo arquivo**: `api/index.ts`

```typescript
import express from "express";
import { sheetsRouter } from "../server/sheets-sync";

const app = express();

// Registrar rotas do servidor
app.use("/api/sheets", sheetsRouter);
app.use("/api/trpc", createExpressMiddleware(...));

export default app; // Exportar para Vercel usar
```

Este arquivo:
- ✅ Inicializa o Express
- ✅ Registra todas as rotas do servidor
- ✅ É reconhecido pelo Vercel como serverless function
- ✅ Rota `/api/sheets/create-or-update` agora funciona!

---

### 3. Atualizar Configuração do Vercel

**Antes:**
```json
{
  "buildCommand": "npm run build:clean",
  "rewrites": [{
    "source": "/api/:path*",
    "destination": "/api/:path*"
  }]
}
```

**Depois:**
```json
{
  "buildCommand": "npm run build",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/index.ts"
    },
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ],
  "functions": {
    "api/index.ts": {
      "maxDuration": 30
    }
  }
}
```

**O que mudou:**
- ✅ `buildCommand`: Apenas `npm run build` (compila frontend, `api/index.ts` é compilado automaticamente)
- ✅ Rewrite para `/api/*` agora aponta para `/api/index.ts` (nosso novo handler)
- ✅ Rewrite para `/*` agora aponta para `/index.html` (frontend)
- ✅ `maxDuration`: 30 segundos para operações com Google Sheets

---

## 🧪 FLUXO AGORA (PRODUÇÃO)

1. **User ATC cria cadastro e clica SALVAR**
   ```
   App → fetch("/api/sheets/create-or-update")
   ↓
   Vercel rota via rewrite
   ↓
   /api/index.ts (serverless function)
   ↓
   Express app (registrado em api/index.ts)
   ↓
   router.post("/create-or-update") em server/sheets-sync.ts
   ↓
   ✅ Sincroniza com Google Sheets
   ✅ Retorna JSON 200
   ```

---

## 📦 ARQUIVOS MODIFICADOS

| Arquivo | Mudança | Status |
|---------|---------|--------|
| `api/sheets/create-or-update.ts` | Removido (arquivo duplicado) | 🗑️ DELETE |
| `api/index.ts` | Criado (novo entry point Express) | ✅ CREATE |
| `vercel.json` | Atualizado para rotear para `/api/index.ts` | ✅ UPDATE |

---

## 🧪 TESTES ESPERADOS

### ✅ Teste 1: Criar Novo Cadastro (ATC)

1. Login como ATC (`atc@exemplo`)
2. Criar novo cadastro
3. Clicar **SALVAR**
4. **Verificar:**
   - ✅ Cadastro aparece na lista
   - ✅ Console mostra: `✅ Resposta do servidor: {success: true, message: "Cadastro criado com sucesso"}`
   - ✅ POST para `/api/sheets/create-or-update` retorna 200
   - ✅ Google Sheets é atualizado imediatamente

### ✅ Teste 2: Editar Cadastro (ATC)

1. Login como ATC
2. Selecionar cadastro existente
3. Clicar **EDITAR**
4. Modificar potencial
5. Clicar **SALVAR**
6. **Verificar:**
   - ✅ Cadastro atualizado
   - ✅ Console mostra: `UPDATE: Atualizando linha X`
   - ✅ Google Sheets reflete mudança

### ✅ Teste 3: Excluir Cadastro (Admin)

1. Login como Admin
2. Clicar **EXCLUIR**
3. **Verificar:**
   - ✅ Cadastro removido
   - ✅ Google Sheets reflete remoção
   - ✅ Funciona como antes (não quebrou)

---

## 🚀 COMO FAZER O DEPLOY

1. **Git add/commit:**
   ```bash
   git add api/index.ts vercel.json
   git rm api/sheets/create-or-update.ts  # ou git add -u
   git commit -m "fix: corrigir sincronização com Sheets - remover arquivo duplicado e criar entry point Express"
   ```

2. **Git push:**
   ```bash
   git push
   ```

3. **Vercel deploy automático (2-3 minutos)**
   - Acesse: https://vercel.com/dashboard
   - Monitorar build e deployment

4. **Verificar nos logs:**
   - Vercel Dashboard → Logs
   - Procurar por: `POST /api/sheets/create-or-update`
   - Status deve ser 200 ✅

---

## 🔍 VALIDAÇÃO

### Log Esperado no Vercel

```
[Sheets] [create-or-update] cadastroId: 1769075396144-mecef1427
[Sheets] [create-or-update] Gerando access token...
[Sheets] [create-or-update] ✅ Access token obtido
[Sheets] [create-or-update] Buscando cadastros existentes...
[Sheets] [create-or-update] ✨ INSERT - Inserindo na linha: 2
[Sheets] [create-or-update] ✅ Sucesso!
```

### Resposta JSON Esperada

```json
{
  "success": true,
  "message": "Cadastro criado com sucesso",
  "method": "INSERT",
  "rowIndex": 2
}
```

---

## 📝 NOTAS TÉCNICAS

### Por que remover `/api/sheets/create-or-update.ts`?

Vercel serverless functions têm overhead de cold start. Com um arquivo TypeScript por rota, cada requisição precisa:
1. Carregar módulos
2. Parsear arquivo
3. Compilar TypeScript
4. Executar código

Usando um arquivo `api/index.ts` com Express:
- Menos arquivos = menos overhead
- Express rota internamente = mais rápido
- Um único cold start para todas as rotas `/api/*`

### Por que `api/index.ts` funciona como handler?

Vercel detecta automaticamente:
- `api/` é pasta de serverless functions
- `index.ts` é o arquivo padrão
- Exportar Express app é aceito
- Vercel cuida de inicializar e passar requisições

### Por que alteramos `buildCommand`?

- `npm run build`: Expo export + Vercel autodetecta `api/index.ts`
- Sem necessidade de compilar servidor separadamente
- Vercel compila `api/index.ts` automaticamente

---

## ⚠️ POSSÍVEIS PROBLEMAS E SOLUÇÕES

### Problema: Ainda recebo erro 500

**Solução:**
1. Verificar variáveis de ambiente em Vercel Dashboard
2. Confirmar `GOOGLE_SERVICE_ACCOUNT_JSON` está definido
3. Verificar logs do Vercel para erro específico

### Problema: Timezone incorreta em editadoEm

**Esperado:** Data de edição em UTC (Z)  
**Se diferente:** Verificar `now` em `novo-cadastro.tsx`

---

## ✅ STATUS

- [x] Problema identificado
- [x] Arquivo duplicado removido
- [x] Entry point Express criado
- [x] Vercel.json atualizado
- [x] Código validado (sem erros)
- [x] Documentação completa

**Pronto para deploy!** 🚀

---

**FIM DO DOCUMENTO**
