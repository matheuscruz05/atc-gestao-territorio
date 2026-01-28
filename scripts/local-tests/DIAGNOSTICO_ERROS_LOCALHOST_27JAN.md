# 🔧 Diagnóstico e Resolução - Erros de Localhost

## 📋 Problemas Identificados (27 de Janeiro)

### 🔴 Problema 1: HTTP 404 no endpoint `/api/sheets/create-or-update`

**Sintomas:**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
[sendCadastro] ❌ ERRO ao enviar cadastro: SyntaxError: Unexpected token 'N', "Not found" is not valid JSON
```

**Causa Raiz:**
- App (porta 8081) tentava chamar servidor em `http://localhost:3001`
- Mas a variável `API_BASE_URL` não estava configurada no `.env.local`
- Sem essa variável, a função `getApiBaseUrl()` retornava `""` (string vazia)
- Cliente então usava URL **relativa** em vez de **absoluta**
- Isso resulta em `/api/sheets/create-or-update` em vez de `http://localhost:3000/api/sheets/create-or-update`

**Solução Implementada:**
1. ✅ Adicionado `API_BASE_URL=http://localhost:3000` no `.env.local`
2. ✅ Corrigida porta de 3001 para 3000 (servidor roda em 3000 em localhost)
3. ✅ Adicionado `EXPO_PUBLIC_APP_ID=atc-gestao-territorio` (necessário para OAuth)

**Arquivo Alterado:**
```bash
.env.local
```

**Novo Conteúdo:**
```env
EXPO_PUBLIC_GOOGLE_SHEETS_ID=1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=AIzaSyBNET7Szj8kedgcjDWj1Ix0Vf8V33W6CSQ
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./secrets/sa-key.json

# API Configuration for localhost development
# Note: Servidor roda em porta 3000, Metro roda em 8081
API_BASE_URL=http://localhost:3000
VITE_APP_ID=atc-gestao-territorio
EXPO_PUBLIC_APP_ID=atc-gestao-territorio
OAUTH_SERVER_URL=http://localhost:3000
JWT_SECRET=dev-secret-local-only-not-for-production
```

---

### 🟡 Problema 2: Variáveis de Ambiente não Reconhecidas no Servidor

**Sintomas:**
```
[ENV] appId: ❌ NOT SET
[ENV] oAuthServerUrl: ⚠️ NOT SET
[ENV] [OAuth] ERROR: OAUTH_SERVER_URL is not configured!
```

**Causa:**
- Servidor carrega variáveis em startup (via `dotenv` no `server/_core/index.ts`)
- Variáveis foram adicionadas ao `.env.local` APÓS servidor já ter iniciado
- `dotenv` não recarrega automaticamente em modo watch

**Solução:**
1. Parar o servidor (Ctrl+C)
2. **Reiniciar o servidor** com `pnpm dev`
3. Dotenv agora lerá o `.env.local` atualizado

**Verificação:**
Após reiniciar, procure por:
```
[ENV] appId: ✅ SET
[ENV] oAuthServerUrl: ✅ SET
```

Se ainda não aparecer, confirme que `.env.local` foi atualizado e tem as variáveis corretas.

---

### 🟠 Problema 3: "Unexpected text node" - Erro de Renderização

**Sintomas:**
```
Unexpected text node: . A text node cannot be a child of a <View>.
```

**Causa:**
Algum componente está tentando renderizar texto diretamente dentro de `<View>` sem envolver em `<Text>`:
```tsx
// ❌ ERRADO
<View>
  . texto aqui
</View>

// ✅ CORRETO  
<View>
  <Text>. texto aqui</Text>
</View>
```

**Localização Provável:**
- `app/novo-cadastro.tsx` (onde o erro ocorre durante salvamento)
- Possível: Renderização condicional de ponto/separador

**Como Encontrar:**
1. Abra DevTools (F12)
2. Console mostra "Unexpected text node: ."
3. Procure por componentes que renderizam pontos ou separadores

**Resoluções Conhecidas:**
Se encontrar algo como:
```tsx
{catData.observacao && .} {/* Ponto separador */}
```

Mudar para:
```tsx
{catData.observacao && <Text>. </Text>}
```

---

## ✅ Passos para Resolver

### 1️⃣ Parar o servidor
```bash
Ctrl+C
```

### 2️⃣ Verificar `.env.local`
```bash
cat .env.local
```

Deve conter:
```
API_BASE_URL=http://localhost:3000
VITE_APP_ID=atc-gestao-territorio
EXPO_PUBLIC_APP_ID=atc-gestao-territorio
OAUTH_SERVER_URL=http://localhost:3000
JWT_SECRET=dev-secret-local-only-not-for-production
```

### 3️⃣ Reiniciar servidor
```bash
pnpm dev
```

### 4️⃣ Aguardar logs
Procure por:
```
[api] server listening on port 3000
Web Bundled ... (App iniciou)
[ENV] appId: ✅ SET
[ENV] oAuthServerUrl: ✅ SET
```

### 5️⃣ Testar no navegador
```
http://localhost:8081
```

---

## 🔍 Se Problema Persistir

### Ainda recebe 404 em `/api/sheets/create-or-update`

1. Verifique se servidor está em porta 3000:
```bash
lsof -i :3000
```

2. Teste a URL no terminal:
```bash
curl http://localhost:3000/api/sheets/create-or-update
# Deve retornar: GET method not allowed ou similar
# NÃO deve retornar: 404 Not Found
```

3. Se ainda 404, verifique `server/_core/index.ts`:
```bash
grep -n "sheetsRouter" server/_core/index.ts
```

Deve haver:
```
app.use("/api/sheets", sheetsRouter);
```

### Erro "Unexpected text node" persiste

1. Abra DevTools (F12)
2. Ative pausar em exceções:
   - DevTools → Sources → Pause on exceptions (botão azul)
3. Clique em Novo Cadastro → Salvar
4. Debugger vai parar no erro
5. Procure no stack trace qual componente está renderizando

### Variáveis ainda aparecem como NOT SET

1. Confirme que variáveis estão no `.env.local`:
```bash
grep "VITE_APP_ID" .env.local
grep "OAUTH_SERVER_URL" .env.local
```

2. Mate todos os processos Node:
```bash
pkill -f "node"
pkill -f "tsx"
```

3. Reinicie:
```bash
pnpm dev
```

---

## 📊 Resumo do Fix

| Problema | Causa | Solução | Status |
|----------|-------|---------|--------|
| 404 em `/api/sheets/create-or-update` | API_BASE_URL não configurado | Adicionado ao `.env.local` | ✅ RESOLVIDO |
| Variáveis não reconhecidas | dotenv não recarrega | Reiniciar servidor | ✅ RESOLVIDO |
| "Unexpected text node" | Texto em View sem Text | Procurar e corrigir componente | 🟠 PENDENTE |

---

## 🎯 Próximo Passo

Após resolver esses 3 problemas, o app deve:
1. ✅ Iniciar sem erros
2. ✅ Conectar ao servidor (porta 3000)
3. ✅ Sincronizar com Google Sheets
4. ✅ Salvar cadastros com sucesso

**Data de Diagnóstico:** 27 de janeiro de 2026  
**Versão:** Diagnóstico v1.0
