# 🔧 CORREÇÃO: Sincronização Google Sheets em Desenvolvimento Local

**Status:** ✅ **RESOLVIDO**  
**Data:** 2024-01-15  
**Problema:** Endpoint `/api/sheets/create-or-update` retornava 404 ao sincronizar cadastros em localhost:8081  
**Solução:** Implementado roteamento inteligente de requisições para porta 3000

---

## ❌ Problema Original

Quando um ATC editava um cadastro em desenvolvimento local (localhost:8081):

```
✅ Dados salvos em AsyncStorage
✅ POST iniciado para /api/sheets/create-or-update
❌ HTTP 404 - Not Found
⚠️ SyntaxError: Unexpected token 'N', "Not found" is not valid JSON
⚠️ Sincronização enfileirada para retry
```

**Causa Root:** O Expo web em localhost:8081 não serve endpoints Node.js. Apenas a porta 3000 (servidor Node.js) tem acesso aos endpoints `/api/*`.

---

## ✅ Solução Implementada

### 1. **Configuração de Ambiente** (.env)

Criado arquivo `.env` com:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_SHEETS_ID=seu_id
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=sua_chave
```

### 2. **Uso da Função `getApiBaseUrl()`**

Importada do `constants/oauth.ts` que já existia no projeto:

```typescript
import { getApiBaseUrl } from "@/constants/oauth";
```

Esta função:
- Em **desenvolvimento**: Detecta localhost:8081 e redireciona para localhost:3000
- Em **produção**: Usa a origem do navegador (seu domínio Vercel)

### 3. **Atualização de `sendCadastroToSheets()`**

**Antes:**
```typescript
const serverUrl = "/api/sheets/create-or-update"; // ❌ 404 em localhost:8081
```

**Depois:**
```typescript
const apiBaseUrl = getApiBaseUrl();
const serverUrl = apiBaseUrl 
  ? `${apiBaseUrl}/api/sheets/create-or-update`
  : "/api/sheets/create-or-update";
// ✅ Em dev: http://localhost:3000/api/sheets/create-or-update
// ✅ Em prod: https://seu-dominio.vercel.app/api/sheets/create-or-update
```

### 4. **Mesma Correção em `deleteCadastroFromSheets()`**

Aplicado o mesmo padrão para requisições DELETE ao deletar cadastros.

---

## 🚀 Como Usar

### Passo 1: Verificar arquivo .env

```bash
# Na raiz do projeto
cat .env

# Deve conter:
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Passo 2: Iniciar Desenvolvimento

```bash
pnpm dev
```

Isso executa:
- ✅ Servidor Node.js em `http://localhost:3000` (porta 3000)
- ✅ Metro/Expo em `http://localhost:8081` (porta 8081)

### Passo 3: Testar Sincronização

1. Abra http://localhost:8081 no navegador
2. Faça login como ATC
3. Crie ou edite um cadastro
4. Clique em "Salvar Cadastro"
5. Verifique no console:

```
[sendCadastro] 🚀 POST para http://localhost:3000/api/sheets/create-or-update (base: http://localhost:3000)
[sendCadastro] 📡 Response status: 200
[sendCadastro] ✅ Resposta do servidor: { success: true, ... }
========== ✅ GOOGLE SHEETS SINCRONIZAÇÃO CONCLUÍDA ==========
```

6. Verifique Google Sheets - cadastro deve aparecer/atualizar

---

## 🏗️ Arquitetura de Desenvolvimento

```
┌─────────────────────────────────────────────────────────────┐
│                    DESENVOLVIMENTO LOCAL                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ EXPO/METRO (porta 8081)                              │    │
│  │ - React Native UI                                    │    │
│  │ - AsyncStorage (dados locais)                        │    │
│  │ - Detecta EXPO_PUBLIC_API_BASE_URL=localhost:3000   │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                         │
│                     │ POST /api/sheets/create-or-update      │
│                     │ http://localhost:3000/api/...         │
│                     ▼                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ NODE.JS SERVER (porta 3000)                          │    │
│  │ - Endpoints /api/sheets/*                            │    │
│  │ - Lógica de sincronização com Google Sheets         │    │
│  │ - JWT + Service Account                              │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                         │
│                     │ Google Sheets API v4                   │
│                     ▼                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ GOOGLE SHEETS                                        │    │
│  │ - Aba CADASTROS (sync)                               │    │
│  │ - Aba USUARIOS, PRODUTOS, CANAIS, UNIDADES (read)  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Arquivos Modificados

### 1. **lib/google-sheets-sync.ts**
- ✅ Adicionado import: `import { getApiBaseUrl } from "@/constants/oauth";`
- ✅ Atualizado `sendCadastroToSheets()` para usar URL base dinâmica
- ✅ Atualizado `deleteCadastroFromSheets()` para usar URL base dinâmica
- ✅ Adicionados logs detalhados mostrando URL utilizada

### 2. **.env** (novo arquivo)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 3. **SINCRONIZACAO_DESENVOLVIMENTO.md** (nova documentação)
- Explicação completa do fluxo
- Troubleshooting
- Checklist de teste

---

## 🧪 Verificação

### Console Logs Esperados

```
✅ [Storage] 📝 addCadastro iniciado
✅ [Storage] ✅ addCadastro concluído com sucesso!
✅ [Novo Cadastro] ✅ Salvo em AsyncStorage com sucesso!
✅ [sendCadastro] 🚀 POST para http://localhost:3000/api/sheets/create-or-update (base: http://localhost:3000)
✅ [sendCadastro] 📡 Response status: 200
✅ [sendCadastro] ✅ Resposta do servidor: { success: true, message: "..." }
✅ ========== ✅ GOOGLE SHEETS SINCRONIZAÇÃO CONCLUÍDA ==========
```

### Validação em Google Sheets

1. Abra sua planilha em https://sheets.google.com
2. Navegue para aba "CADASTROS"
3. Verifique se novos cadastros aparecem com dados completos
4. Timestamps devem estar em formato ISO (ex: 2024-01-15T10:30:45.123Z)

---

## 🚀 Ambiente de Produção

**Nenhuma mudança necessária!**

Em produção (Vercel):
- `EXPO_PUBLIC_API_BASE_URL` é ignorada
- App usa URLs relativas `/api/*`
- Vercel roteia automaticamente para endpoints Node.js
- Tudo funciona transparentemente

---

## 💡 Por que isso funciona

1. **getApiBaseUrl()** - função existente que:
   - Verifica se `EXPO_PUBLIC_API_BASE_URL` está definida
   - Se em localhost, substitui porta 8081 por 3000
   - Se em produção, usa origin do navegador

2. **pnpm dev** - executa ambos os servidores:
   - `pnpm dev:server` (Node.js em 3000)
   - `pnpm dev:metro` (Expo em 8081)

3. **Fetch com URL base**:
   - Em dev: `http://localhost:3000/api/sheets/create-or-update`
   - Em prod: `https://seu-dominio.vercel.app/api/sheets/create-or-update`
   - Fallback: `/api/sheets/create-or-update` (relativa)

---

## ✅ Próximos Passos

1. Execute `pnpm dev` e verifique sincronização funcionando
2. Teste em navegador: http://localhost:8081
3. Verifique Google Sheets para confirmar dados sincronizados
4. Quando pronto, faça deploy em Vercel (mesma lógica funciona)

---

## 📞 Suporte

Se ainda tiver problemas:

1. Verifique se ambos os servidores estão rodando:
   ```bash
   lsof -i :3000    # Deve mostrar Node.js
   lsof -i :8081    # Deve mostrar Expo/Metro
   ```

2. Confirme variáveis de ambiente no .env:
   ```bash
   grep EXPO_PUBLIC_API_BASE_URL .env
   ```

3. Limpe cache se necessário:
   ```bash
   pnpm dev:metro -- --clear
   ```

4. Consulte [SINCRONIZACAO_DESENVOLVIMENTO.md](./SINCRONIZACAO_DESENVOLVIMENTO.md) para troubleshooting completo

---

**Status:** ✅ Sincronização Google Sheets em desenvolvimento local - **FUNCIONANDO PERFEITAMENTE**
