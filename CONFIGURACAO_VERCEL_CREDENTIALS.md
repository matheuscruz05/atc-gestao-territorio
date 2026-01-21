# 🔧 Configuração de Credenciais no Vercel - CRÍTICO

## ❌ Problema Identificado

```
{success: false, error: 'Service account not configured'}
```

Ao fazer deploy no Vercel, as credenciais do Google Sheets não estão configuradas.

**Causa:** Variáveis de ambiente locais (`.env`) NÃO são automaticamente enviadas para Vercel. Você precisa configurar manualmente no **Vercel Dashboard**.

---

## ✅ Solução: 4 Passos

### Passo 1: Obter as Credenciais

Você precisa de 2 coisas:

#### A) ID da Planilha Google Sheets
- Abra sua planilha em https://sheets.google.com
- Na URL: `https://docs.google.com/spreadsheets/d/[AQUI]/edit`
- Copie o ID (parte destacada)
- **Exemplo:** `1A2B3C4D5E6F7G8H9I0J`

#### B) Arquivo Service Account JSON
- Google Cloud Console → Seu projeto
- APIs & Services → Credentials
- Service Accounts → Seu email (ex: `manus-xyz@manus-xyz.iam.gserviceaccount.com`)
- Guia Keys → Add Key → Create new key → JSON
- Vai baixar um arquivo `.json` com todas as credenciais

**O arquivo terá esse formato:**
```json
{
  "type": "service_account",
  "project_id": "seu-projeto",
  "private_key_id": "chave-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "seu-email@iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/..."
}
```

### Passo 2: Acessar Vercel Dashboard

1. Abra https://vercel.com/dashboard
2. Selecione seu projeto: `atc-gestao-territorio`
3. Clique em **Settings**
4. Selecione **Environment Variables** no menu lateral

### Passo 3: Adicionar Variáveis de Ambiente

#### 3.1 - Adicionar GOOGLE_SHEETS_ID

- **Name:** `EXPO_PUBLIC_GOOGLE_SHEETS_ID`
- **Value:** ID copiado no Passo 1A (ex: `1A2B3C4D5E6F7G8H9I0J`)
- **Environments:** Production, Preview, Development (marque todas)
- Clique: **Add**

#### 3.2 - Adicionar Service Account JSON

**IMPORTANTE:** Copie **TODO** o conteúdo do arquivo `.json` em uma única linha!

```bash
# No seu terminal, para converter para uma linha:
cat seu-arquivo-service-account.json | tr -d '\n' | tr -s ' ' | pbcopy
# (no Linux use: xclip -i)
```

Ou abra o arquivo em editor de texto e copie tudo.

- **Name:** `GOOGLE_SERVICE_ACCOUNT_JSON`
- **Value:** [Cole o JSON COMPLETO aqui]
- **Environments:** Production, Preview, Development (marque todas)
- Clique: **Add**

#### 3.3 - Adicionar Google Sheets API Key (OPCIONAL - apenas leitura)

Se tiver também a API Key para leitura:

- **Name:** `EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY`
- **Value:** Sua API Key
- **Environments:** Production, Preview, Development
- Clique: **Add**

### Passo 4: Fazer Novo Deploy

Após adicionar as variáveis:

```bash
# No seu terminal local
git push origin main
```

Ou clique em **Deployments** no Vercel Dashboard e clique em **Redeploy** no último deploy.

---

## 🧪 Verificar se Funcionou

1. Aguarde o deploy completar (2-3 min)
2. Abra https://atc-gestao-territorio.vercel.app
3. Faça login como ATC
4. Crie um novo cadastro
5. Clique em **Salvar Cadastro**
6. Abra Console (F12) → Aba Console
7. Procure por:
   ```
   ✅ [sendCadastro] 📡 Response status: 200
   ✅ [sendCadastro] ✅ Resposta do servidor...
   ```
8. Abra Google Sheets e verifique se cadastro apareceu

---

## 🚨 Troubleshooting

### Erro: "Service account not configured"

**Checklist:**

- [ ] Variável `GOOGLE_SERVICE_ACCOUNT_JSON` foi adicionada?
- [ ] O valor é o JSON COMPLETO (não apenas um trecho)?
- [ ] Deploy foi refeito APÓS adicionar a variável?
- [ ] Esperou 2-3 minutos para o deploy completar?

```bash
# Para reforçar o deploy:
git push origin main
# ou clique em Redeploy no Vercel
```

### Erro: "GOOGLE_SHEETS_ID not configured"

- [ ] Variável `EXPO_PUBLIC_GOOGLE_SHEETS_ID` foi adicionada?
- [ ] O valor é apenas o ID (sem URL completa)?

### Cadastro não aparece em Google Sheets

1. Verifique se compartilhou a planilha com o email do Service Account
   - Seu email: `seu-email@iam.gserviceaccount.com`
   - No Google Sheets: Clique Share → Adicione o email

2. Verifique se a aba `CADASTROS` existe

3. Verifique os headers da aba (devem estar em A1)

---

## 📝 Exemplo de Configuração Correta

**Vercel Dashboard → Settings → Environment Variables:**

| Name | Value | Environments |
|------|-------|--------------|
| `EXPO_PUBLIC_GOOGLE_SHEETS_ID` | `1A2B3C4D5E6F7G8H9I0J` | Prod, Preview, Dev |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | `{"type":"service_account","project_id":"...entire JSON...}` | Prod, Preview, Dev |
| `EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY` | `AIzaSy_sua_chave_aqui` | Prod, Preview, Dev |

---

## 🔒 Segurança

⚠️ **IMPORTANTE:**

- Nunca compartilhe o arquivo `service-account.json` ou seu conteúdo
- Nunca commite essas credenciais no Git (devem estar em .gitignore)
- No Vercel, as variáveis são criptografadas
- Se vazar, regenere o arquivo no Google Cloud Console

---

## ✅ Fluxo Completo Após Configuração

```
[User no Vercel] → Clica "Salvar Cadastro"
         ↓
[App Frontend] → Salva em AsyncStorage (sempre funciona)
         ↓
[App Frontend] → Faz POST para /api/sheets/create-or-update
         ↓
[Vercel Endpoint] → Lê GOOGLE_SERVICE_ACCOUNT_JSON ✅
         ↓
[Vercel Endpoint] → Autentica com Google Sheets API
         ↓
[Vercel Endpoint] → Insere/Atualiza linha em CADASTROS
         ↓
[Google Sheets] → Cadastro sincronizado ✅
         ↓
[User] → Vê confirmação de sucesso
```

---

## 📞 Próximas Ações

1. ✅ Adicione as 3 variáveis de ambiente no Vercel
2. ✅ Refaça o deploy
3. ✅ Teste salvando um cadastro
4. ✅ Verifique em Google Sheets
5. ✅ Se não funcionou, verifique Vercel Logs:
   - Dashboard → Deployments → Clique no deployment
   - Aba "Logs" → procure por `[Sheets]` errors

---

**Data:** 2026-01-21  
**Status:** CRÍTICO - Bloqueando sincronização em produção
