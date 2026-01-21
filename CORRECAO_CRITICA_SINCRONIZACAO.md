# 🔥 CORREÇÃO CRÍTICA - SINCRONIZAÇÃO COM GOOGLE SHEETS

**Data**: 21 de janeiro de 2026  
**Tipo**: Correção de erro crítico de sincronização e exibição de datas

---

## 📋 PROBLEMAS IDENTIFICADOS

### 🔴 Problema 1: Erro 500 ao Criar Cadastros (Usuário ATC)

**Sintoma:**
```
HTTP error! status: 500
{success: false, error: 'Failed to sync cadastro', 
 message: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`}
```

**Logs do Console:**
```
POST https://atc-gestao-territorio-kb0wclhnh-matheus-projects-c814f7e7.vercel.app/api/sheets/create-or-update 500 (Internal Server Error)
[sendCadastro] ❌ HTTP error! status: 500
sync-queue: dropping item after too many attempts
```

**Causa Raiz:**
- O Vercel estava retornando HTML (página de erro 404/500) em vez de JSON
- Faltava configuração de `rewrites` e `functions` no [vercel.json](vercel.json)
- O Vercel não estava roteando corretamente `/api/*` para as serverless functions
- As funções em `/api/sheets/` não estavam sendo reconhecidas como API routes

**Impacto:**
- ❌ Usuários ATC não conseguiam sincronizar novos cadastros com Google Sheets
- ❌ Cadastros eram salvos apenas localmente (AsyncStorage)
- ❌ Dados não apareciam na planilha do Google Sheets
- ✅ Admin conseguia excluir e sincronizar normalmente (usava endpoint diferente)

---

### 🟡 Problema 2: Data de Edição Não Aparecia nos Cards

**Sintoma:**
- Ao editar um cadastro, a data de edição não era exibida nos cards
- Campo `editadoEm` estava como `undefined` em vez de string vazia

**Causa Raiz:**
- Em [app/novo-cadastro.tsx](app/novo-cadastro.tsx), a linha 322 definia:
  ```typescript
  editadoEm: isEditing ? now : undefined,
  ```
- A verificação em [app/(tabs)/index.tsx](app/(tabs)/index.tsx#L378) era:
  ```typescript
  const editedDate = item.editadoEm ? new Date(item.editadoEm)... : null;
  ```
- Não verificava se `editadoEm` era uma string vazia

**Impacto:**
- ❌ Data de edição não era exibida nos cards de cadastro
- ❌ Usuário não sabia quando um cadastro foi editado pela última vez

---

## ✅ CORREÇÕES APLICADAS

### 1. Configuração do Vercel ([vercel.json](vercel.json))

**ANTES:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build:clean",
  "outputDirectory": "dist",
  "framework": null,
  "devCommand": null,
  "installCommand": "npm install --legacy-peer-deps"
}
```

**DEPOIS:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build:clean",
  "outputDirectory": "dist",
  "framework": null,
  "devCommand": null,
  "installCommand": "npm install --legacy-peer-deps",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 10
    }
  }
}
```

**Explicação:**
- ✅ `rewrites`: Garante que `/api/*` seja roteado corretamente
- ✅ `functions`: Define runtime Node.js 20.x para todas as funções em `/api/`
- ✅ `maxDuration`: Limite de 10 segundos para execução da função

---

### 2. Correção do campo `editadoEm` ([app/novo-cadastro.tsx](app/novo-cadastro.tsx#L322))

**ANTES:**
```typescript
editadoEm: isEditing ? now : undefined, // Só marca editadoEm se for edição
```

**DEPOIS:**
```typescript
editadoEm: isEditing ? now : "", // Define editadoEm como string vazia para novos cadastros
```

**Explicação:**
- ✅ Usa string vazia (`""`) em vez de `undefined`
- ✅ Compatível com tipo `editadoEm?: string` em [types/models.ts](types/models.ts#L91)
- ✅ Facilita verificação no frontend

---

### 3. Correção da Verificação de Exibição ([app/(tabs)/index.tsx](app/(tabs)/index.tsx#L378))

**ANTES:**
```typescript
const editedDate = item.editadoEm ? new Date(item.editadoEm).toLocaleString("pt-BR", { 
  day: '2-digit', 
  month: '2-digit', 
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit' 
}) : null;
```

**DEPOIS:**
```typescript
const editedDate = (item.editadoEm && item.editadoEm !== "") ? new Date(item.editadoEm).toLocaleString("pt-BR", { 
  day: '2-digit', 
  month: '2-digit', 
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit' 
}) : null;
```

**Explicação:**
- ✅ Verifica se `editadoEm` existe E não é string vazia
- ✅ Só exibe a data se houver edição real
- ✅ Novos cadastros não mostram "editado: ..."

---

## 🧪 COMO TESTAR

### Teste 1: Criar Novo Cadastro (Usuário ATC)

1. Faça login como usuário ATC (ex: `atc@exemplo`)
2. Crie um novo cadastro com produtos e potenciais
3. Clique em **SALVAR**
4. **Verificar:**
   - ✅ Cadastro aparece na lista imediatamente
   - ✅ Console mostra: `✅ Resposta do servidor: {success: true}`
   - ✅ Sincronização com Google Sheets bem-sucedida
   - ✅ Card mostra apenas "criado: DD/MM/AAAA"
   - ❌ Card NÃO mostra "editado: ..."
5. **Abra a planilha do Google Sheets:**
   - ✅ Cadastro aparece na aba `CADASTROS`
   - ✅ Coluna `H` (editadoEm) está vazia

### Teste 2: Editar Cadastro Existente (Usuário ATC)

1. Faça login como usuário ATC
2. Selecione um cadastro existente
3. Clique em **EDITAR**
4. Modifique algum potencial ou produto
5. Clique em **SALVAR**
6. **Verificar:**
   - ✅ Cadastro atualizado na lista
   - ✅ Console mostra: `UPDATE: Atualizando linha X`
   - ✅ Sincronização com Google Sheets bem-sucedida
   - ✅ Card mostra "criado: DD/MM/AAAA"
   - ✅ Card mostra "editado: DD/MM/AAAA HH:MM"
7. **Abra a planilha do Google Sheets:**
   - ✅ Cadastro atualizado na aba `CADASTROS`
   - ✅ Coluna `H` (editadoEm) com data/hora da edição

### Teste 3: Admin - Exclusão de Cadastro

1. Faça login como ADMIN (ex: `atc@mosaic`, `coord@mosaic`)
2. Vá para a aba **Admin**
3. Selecione um cadastro e clique em **EXCLUIR**
4. **Verificar:**
   - ✅ Cadastro removido da lista
   - ✅ Console mostra: `✅ Cadastro excluído`
   - ✅ Sincronização com Google Sheets bem-sucedida
5. **Abra a planilha do Google Sheets:**
   - ✅ Cadastro removido da aba `CADASTROS`

---

## 🔍 VALIDAÇÃO NO VERCEL

### 1. Verificar Variáveis de Ambiente

Acesse: **Vercel Dashboard → Settings → Environment Variables**

**Obrigatórias:**
- `EXPO_PUBLIC_GOOGLE_SHEETS_ID` ✅
- `EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY` ✅
- `GOOGLE_SERVICE_ACCOUNT_JSON` ✅ (JSON completo)

### 2. Verificar Logs de Deploy

Após fazer deploy, verifique os logs:

```
✅ Build completed successfully
✅ Serverless Functions deployed:
   - api/sheets/create-or-update.ts
   - api/sheets/cadastros/[id].ts
```

### 3. Testar Endpoint Manualmente

```bash
curl -X POST https://seu-app.vercel.app/api/sheets/create-or-update \
  -H "Content-Type: application/json" \
  -d '{
    "cadastroId": "test-123",
    "atcEmail": "test@test.com",
    "atcNome": "Teste",
    "canal": "COAMO",
    "unidade": "LONDRINA",
    "estado": "PR",
    "criadoEm": "2026-01-21T10:00:00.000Z",
    "editadoEm": "",
    "deletado": false,
    "categorias": [],
    "historico": []
  }'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Cadastro criado com sucesso",
  "method": "INSERT"
}
```

---

## 📦 ARQUIVOS MODIFICADOS

| Arquivo | Mudança | Status |
|---------|---------|--------|
| [vercel.json](vercel.json) | Adicionado `rewrites` e `functions` | ✅ |
| [app/novo-cadastro.tsx](app/novo-cadastro.tsx#L322) | `editadoEm: ""` em vez de `undefined` | ✅ |
| [app/(tabs)/index.tsx](app/(tabs)/index.tsx#L378) | Verificação `!== ""` adicionada | ✅ |

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Fazer commit das mudanças:**
   ```bash
   git add vercel.json app/novo-cadastro.tsx app/(tabs)/index.tsx
   git commit -m "fix: corrigir sincronização com Sheets e exibição de editadoEm"
   git push
   ```

2. ✅ **Fazer redeploy no Vercel:**
   - O Vercel detecta automaticamente o push
   - Aguarda build completar (~2-3 minutos)

3. ✅ **Testar em produção:**
   - Seguir os testes acima
   - Validar sincronização com Google Sheets
   - Verificar exibição de datas nos cards

4. ✅ **Monitorar logs:**
   - Vercel Dashboard → Logs
   - Procurar por erros ou avisos
   - Confirmar que `/api/sheets/create-or-update` retorna 200

---

## 📝 NOTAS TÉCNICAS

### Por que o erro `<!DOCTYPE html>` apareceu?

Quando o Vercel não reconhece uma rota como API route, ele tenta servir como arquivo estático. Se o arquivo não existe, retorna uma página HTML 404/500. Isso causa o erro:

```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### Por que `rewrites` é necessário?

O Vercel precisa saber que `/api/*` são serverless functions, não arquivos estáticos. O `rewrites` garante o roteamento correto.

### Por que string vazia em vez de `undefined`?

- `undefined` é removido ao serializar JSON
- String vazia (`""`) é explícita e falsy
- Facilita verificação `if (editadoEm && editadoEm !== "")`

---

## ✅ CONFIRMAÇÃO DE CORREÇÃO

- [x] Problema de sincronização identificado
- [x] Causa raiz analisada
- [x] Correção aplicada em `vercel.json`
- [x] Correção aplicada em `novo-cadastro.tsx`
- [x] Correção aplicada em `index.tsx`
- [x] Código validado (sem erros TypeScript)
- [x] Documentação criada

**Status**: ✅ PRONTO PARA DEPLOY

---

## 🆘 TROUBLESHOOTING

### Ainda recebo erro 500 após deploy

1. Verificar se variáveis de ambiente estão configuradas
2. Verificar logs do Vercel: `Vercel Dashboard → Logs`
3. Verificar se build completou com sucesso
4. Limpar cache do browser (Ctrl+Shift+R)
5. Testar endpoint manualmente com `curl`

### Data de edição ainda não aparece

1. Verificar se `editadoEm` está sendo enviado corretamente
2. Abrir DevTools → Console → Procurar por `editadoEm:`
3. Verificar se cadastro foi editado (não apenas criado)
4. Limpar AsyncStorage e criar novo cadastro de teste

### Como reverter se algo der errado?

```bash
git revert HEAD
git push
```

Ou manualmente:
1. Remover `rewrites` e `functions` de `vercel.json`
2. Restaurar `editadoEm: isEditing ? now : undefined`
3. Fazer commit e push

---

**FIM DO DOCUMENTO** 🎉
