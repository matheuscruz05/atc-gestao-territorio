# 🚀 Adicionar GOOGLE_SERVICE_ACCOUNT_JSON no Vercel

## Passo a Passo Rápido

### 1. Acessar o Vercel
- Acesse: https://vercel.com/dashboard
- Clique no projeto **atc-gestao-territorio**

### 2. Ir para Environment Variables
- Clique em **Settings** (menu superior)
- No menu lateral, clique em **Environment Variables**

### 3. Adicionar a Variável

**Nome da Variável:**
```
GOOGLE_SERVICE_ACCOUNT_JSON
```

**Valor da Variável** (JSON em uma linha, sem quebras):
```json
{"type":"service_account","project_id":"<PROJECT_ID>","private_key_id":"<PRIVATE_KEY_ID>","private_key":"-----BEGIN PRIVATE KEY-----\n<PRIVATE_KEY>\n-----END PRIVATE KEY-----\n","client_email":"<SERVICE_ACCOUNT_EMAIL>","client_id":"<CLIENT_ID>","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/<SERVICE_ACCOUNT_EMAIL_URLENCODED>","universe_domain":"googleapis.com"}
```

**Ambientes:**
- ✅ Production
- ✅ Preview  
- ✅ Development

### 4. Salvar
- Clique em **Add** ou **Save**
- A variável será aplicada no próximo deploy

### 5. Redeploy (se necessário)
Se o deploy automático do GitHub já terminou, force um redeploy:
- Vá em **Deployments**
- Clique nos 3 pontinhos do último deploy
- Clique em **Redeploy**

---

## ✅ Checklist de Verificação

Após adicionar a variável e fazer deploy:

1. [ ] Variável `GOOGLE_SERVICE_ACCOUNT_JSON` adicionada no Vercel
2. [ ] Deploy concluído com sucesso (sem erros)
3. [ ] Testar DELETE de cadastro no app
4. [ ] Verificar console do navegador - deve retornar 200 OK
5. [ ] Confirmar que cadastro foi removido da planilha Google Sheets

---

## 🐛 Troubleshooting

**Se o delete ainda falhar:**
1. Verifique se a variável foi salva corretamente (Settings → Environment Variables)
2. Confirme que o valor é JSON válido (sem espaços extras)
3. Verifique os logs do Vercel (Deployments → View Function Logs)
4. Teste com um cadastro novo: crie, sincronize e delete

**Logs úteis:**
- Vercel Dashboard → Deployments → View Function Logs
- Navegador → F12 → Console (para erros client-side)
- Navegador → F12 → Network (para ver requests/responses)
