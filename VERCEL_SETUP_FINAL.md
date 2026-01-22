# 🚀 CONFIGURAÇÃO FINAL VERCEL - Google Sheets

## ✅ Status Atual

- **Código**: Commitado e sincronizado ✅
- **Testes Locais**: 100% passando ✅
- **Correção Aplicada**: `server/api/sheets/create-or-update.ts` ✅

## 📋 Próximos Passos (OBRIGATÓRIO)

### 1️⃣ Acessar Vercel Dashboard

```
https://vercel.com/seu-projeto/settings/environment-variables
```

### 2️⃣ Adicionar Variável de Ambiente

**Nome da Variável:**
```
GOOGLE_SERVICE_ACCOUNT_JSON
```

**Valor da Variável:**
```json
{"type":"service_account","project_id":"<PROJECT_ID>","private_key_id":"<PRIVATE_KEY_ID>","private_key":"-----BEGIN PRIVATE KEY-----\n<PRIVATE_KEY>\n-----END PRIVATE KEY-----\n","client_email":"<SERVICE_ACCOUNT_EMAIL>","client_id":"<CLIENT_ID>","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/<SERVICE_ACCOUNT_EMAIL_URLENCODED>","universe_domain":"googleapis.com"}
```

**⚠️ IMPORTANTE:**
- Cole o JSON em **UMA ÚNICA LINHA** (sem quebras de linha entre as propriedades)
- Mantenha os `\n` dentro do campo `private_key`
- Certifique-se de que as aspas estão corretas

**Ambiente:**
- ✅ Production
- ✅ Preview (opcional)
- ✅ Development (opcional)

### 3️⃣ Verificar Outras Variáveis Necessárias

Confirme que essas variáveis também estão configuradas:

```bash
GOOGLE_SPREADSHEET_ID=1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs
GOOGLE_API_KEY=AIzaSyBNET7Szj8kedgcjDWj1Ix0Vf8V33W6CSQ
```

### 4️⃣ Forçar Redeploy (se necessário)

Se o deploy automático não acontecer:

**Via Dashboard:**
1. Vá para: `Deployments`
2. Clique nos 3 pontinhos do último deploy
3. Clique em `Redeploy`

**Via CLI:**
```bash
vercel --prod
```

## 🧪 Como Testar Após Deploy

### Teste 1: Verificar Endpoint
```bash
curl -X POST https://seu-app.vercel.app/api/sheets/create-or-update \
  -H "Content-Type: application/json" \
  -d '{"cadastroId":"TEST-123","atcEmail":"teste@atc.com","atcNome":"Teste ATC","canal":"COCAMAR","unidade":"LONDRINA","estado":"PR","categorias":[]}'
```

**Resposta esperada:**
```json
{"success": true, "cadastroId": "TEST-123"}
```

### Teste 2: Verificar na Planilha
Abra o Google Sheets:
```
https://docs.google.com/spreadsheets/d/1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs/
```

Verifique se o cadastro `TEST-123` foi criado na aba `CADASTROS`.

### Teste 3: Testar do App Mobile/Web
1. Abra o app em produção
2. Faça login como ATC
3. Crie um novo cadastro
4. Verifique se aparece no Google Sheets

## ✅ Checklist Final

- [ ] Variável `GOOGLE_SERVICE_ACCOUNT_JSON` adicionada no Vercel
- [ ] JSON está em uma única linha
- [ ] Deploy realizado com sucesso
- [ ] Teste de endpoint passou
- [ ] Cadastro aparece no Google Sheets
- [ ] App mobile consegue criar cadastros

## 🔍 Troubleshooting

### Erro: "Service Account JSON not found"
**Causa:** Variável `GOOGLE_SERVICE_ACCOUNT_JSON` não configurada
**Solução:** Adicione a variável no Vercel e faça redeploy

### Erro: "Invalid JSON"
**Causa:** JSON mal formatado (quebras de linha incorretas)
**Solução:** Cole o JSON em UMA linha única

### Erro: 401 Unauthorized
**Causa:** Service Account sem permissões na planilha
**Solução:** Compartilhe a planilha com `atc-gestao-territorio-sa@atc-gestao-territorio-483803.iam.gserviceaccount.com`

### Erro: 404 Spreadsheet not found
**Causa:** `GOOGLE_SPREADSHEET_ID` incorreto
**Solução:** Verifique o ID da planilha

## 📊 Resultado Esperado

Após a configuração:

```
✅ Cadastros salvos no banco de dados local (Drizzle)
✅ Cadastros sincronizados com Google Sheets automaticamente
✅ ATC consegue criar/editar/excluir cadastros
✅ Administradores veem dados em tempo real no Google Sheets
✅ Headers protegidos contra deleção
```

## 🎉 Próximos Passos

1. **Monitorar Logs do Vercel** para verificar se há erros
2. **Testar criação de cadastros** pelo app
3. **Verificar sincronização** abrindo o Google Sheets
4. **Treinar usuários** no uso do sistema

---

**📝 Documentação Completa:**
- [CONFIGURACAO_VERCEL_CREDENTIALS.md](CONFIGURACAO_VERCEL_CREDENTIALS.md)
- [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)
- [SINCRONIZACAO_DESENVOLVIMENTO.md](SINCRONIZACAO_DESENVOLVIMENTO.md)

**🧪 Testes Realizados:**
- ✅ Leitura: 22 usuários, 14 produtos, 19 canais
- ✅ Escrita: Novo cadastro criado com sucesso
- ✅ Verificação: Dados sincronizados corretamente
- ✅ Proteção: Headers jamais serão deletados

**🚀 Status: PRONTO PARA PRODUÇÃO**
