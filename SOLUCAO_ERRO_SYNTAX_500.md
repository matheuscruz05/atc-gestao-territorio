# 🔧 Solução: Erro "SyntaxError: Unexpected token ':'" no Vercel

## Problema
```
SyntaxError: Unexpected token ':'
    at compileSourceTextModule (node:internal/modules/esm/utils:346:16)
```

Requests retornando **HTTP 500** com erro de sintaxe na compilação ESM.

---

## 🎯 Root Cause

A variável de ambiente `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` estava configurada **incorretamente no Vercel**:

### ❌ ERRADO (o que estava):
```env
GOOGLE_SERVICE_ACCOUNT_KEY_FILE={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...
```

**Por quê é errado:**
- `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` deveria conter apenas um **caminho de arquivo**
- Ex: `./secrets/sa-key.json`
- Mas estava preenchido com o **JSON inteiro da Service Account**
- Quando o código executava `fs.readFileSync(GOOGLE_SERVICE_ACCOUNT_KEY_FILE)`, passava um JSON com quebras de linha (`\n`) como se fosse um caminho
- Node.js tentava compilar aquela string como um módulo JavaScript e falhava no primeiro `:`

### Fluxo do erro:
1. Vercel inicia o servidor (`api/index.mjs`)
2. Importa `sheets-sync.ts`
3. Chama `loadServiceAccount()`
4. Tenta: `fs.readFileSync(jsonEnv)` onde `jsonEnv` é um objeto JSON enorme
5. Node.js trata como arquivo e tenta compilar → **ERRO**

---

## ✅ Solução Implementada

### Passo 1: Remover variável INCORRETA
- Deletei `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` do `.env.vercel`
- Atualizei arquivo local

### Passo 2: Manter apenas a CORRETA
- `GOOGLE_SERVICE_ACCOUNT_JSON` = JSON inteiro (correto para Vercel)
  - Usado quando: `process.env.GOOGLE_SERVICE_ACCOUNT_JSON`
  - Parse com: `JSON.parse(variavel)`

### Passo 3: Verificar localhost
- `.env.local` pode usar:
  ```env
  GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./secrets/sa-key.json
  ```
  - Isso SIM é um caminho válido

---

## 🚀 Próximos Passos

1. **Ir para Vercel Dashboard:**
   - Project: `atc-gestao-territorio`
   - Settings → Environment Variables

2. **Remover variável errada:**
   - Encontrar `GOOGLE_SERVICE_ACCOUNT_KEY_FILE`
   - Clicar em `...` → Delete
   - Confirmar

3. **Manter variável correta:**
   - `GOOGLE_SERVICE_ACCOUNT_JSON` deve estar presente
   - Valor deve ser o JSON inteiro com `\n` literais

4. **Redeplorar:**
   - Deployments → Último deploy → ... → Redeploy
   - Aguardar 2-3 minutos

5. **Testar:**
   - Abrir app
   - Criar novo cadastro
   - Verificar se sincroniza para Google Sheets

---

## 🔍 Como Verificar

### ✅ Correto em Vercel:
```javascript
// sheets-sync.ts linha 79
const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (jsonEnv) {
  const sa = JSON.parse(jsonEnv); // ✅ Parse JSON string
}
```

### ❌ Errado em Vercel:
```javascript
// sheets-sync.ts linha 105
const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
if (keyFile) {
  const raw = fs.readFileSync(keyFile); // ❌ Tenta ler JSON como arquivo
}
```

---

## 📋 Resumo

| Ambiente | Variável | Valor | Tipo |
|----------|----------|-------|------|
| **Vercel** | `GOOGLE_SERVICE_ACCOUNT_JSON` | `{"type":"service_account",...}` | JSON string |
| **Vercel** | `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` | ❌ **DELETAR** | - |
| **Localhost** | `GOOGLE_SERVICE_ACCOUNT_JSON` | - | (opcional) |
| **Localhost** | `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` | `./secrets/sa-key.json` | Caminho |

---

## 🎓 Lição Aprendida

**Variáveis de ambiente servem propósitos diferentes:**
- Uma é para **ler arquivo local** (dev)
- Outra é para **carregar JSON direto** (prod)

Não misture os dois!
