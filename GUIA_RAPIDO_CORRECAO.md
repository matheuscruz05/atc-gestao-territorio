# 🎯 GUIA RÁPIDO DE CORREÇÃO - Erro 500 Vercel

**⏱️ Tempo Estimado:** 5-10 minutos  
**🚨 Prioridade:** CRÍTICA - App não funciona em produção

---

## 📝 CHECKLIST RÁPIDO

### ✅ Fase 1: Código (JÁ CONCLUÍDO)
- [x] Análise dos logs
- [x] Identificação da causa raiz
- [x] Correção do código (env.ts e api/index.ts)
- [x] Documentação criada

### ⏳ Fase 2: Vercel Dashboard (VOCÊ PRECISA FAZER)
- [ ] Acessar Vercel Dashboard
- [ ] Adicionar variável JWT_SECRET
- [ ] Verificar outras variáveis
- [ ] Fazer redeploy
- [ ] Testar aplicação

---

## 🔑 AÇÃO CRÍTICA NECESSÁRIA

### Adicionar JWT_SECRET no Vercel

1. **Gerar uma chave segura:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   Exemplo de saída:
   ```
   a3f8b9c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0
   ```

2. **Acessar Vercel:**
   - URL: https://vercel.com/seu-projeto/settings/environment-variables
   - Ou: Vercel Dashboard → Seu Projeto → Settings → Environment Variables

3. **Adicionar variável:**
   - Clique em "Add New"
   - **Name:** `JWT_SECRET`
   - **Value:** (cole a chave gerada no passo 1)
   - **Environments:** Marque TODAS (Production, Preview, Development)
   - Clique em "Save"

4. **Fazer Redeploy:**
   - Vá para: Deployments
   - Clique nos 3 pontinhos "..." no deploy mais recente
   - Clique em "Redeploy"
   - Aguarde 2-3 minutos

---

## 🧪 COMO TESTAR SE FUNCIONOU

### Teste 1: Health Check (30 segundos após redeploy)

```bash
curl https://atc-gestao-territorio.vercel.app/api/health
```

**✅ SUCESSO se retornar:**
```json
{
  "ok": true,
  "timestamp": "2026-01-26T...",
  "uptime": 123.45,
  "environment": {
    "has_sheets_id": true,
    "has_service_account_json": true
  }
}
```

**❌ FALHA se retornar:**
```html
<!DOCTYPE html>
<html>
  <head><title>500: Internal Server Error</title></head>
...
```

### Teste 2: App Real (3 minutos após redeploy)

1. Abra: https://atc-gestao-territorio.vercel.app
2. Faça login como usuário ATC:
   - Email: `atc@exemplo`
   - (verifique a senha nos arquivos de usuários)
3. Crie um novo cadastro:
   - Canal: COCAMAR
   - Unidade: LONDRINA
   - Preencha os campos obrigatórios
   - Clique em "Salvar"
4. Abra a planilha do Google Sheets
5. Verifique se o cadastro apareceu

**✅ SUCESSO:** Cadastro aparece na planilha  
**❌ FALHA:** Cadastro não aparece (apenas no localStorage)

### Teste 3: Verificar Logs (se ainda falhar)

1. Acesse: https://vercel.com/seu-projeto/deployments
2. Clique no deploy mais recente
3. Clique em "Functions" ou "Logs"
4. Procure por:
   ```
   [API] ========== SERVER STARTUP ==========
   [API] ✅ All modules imported successfully
   [ENV] ========== Environment Variables Status ==========
   [ENV] appId: ✅ SET
   [ENV] cookieSecret: ✅ SET
   ```

**✅ SUCESSO:** Vê todos os logs acima  
**❌ FALHA:** Não vê logs ou vê mensagens de erro

---

## ❓ FAQ - PROBLEMAS COMUNS

### P: Ainda retorna 500 após adicionar JWT_SECRET

**R:** Verifique se fez o redeploy. A variável só é carregada após um novo deploy.

### P: Redeploy foi feito mas continua 500

**R:** Verifique os logs do Vercel:
1. Deployments → [Deploy] → Functions → Logs
2. Procure por mensagens com `[ENV] ❌` ou `[API] ❌`
3. Copie os logs e analise qual variável está faltando

### P: Como ver se JWT_SECRET foi configurado corretamente?

**R:** Acesse:
```bash
curl https://atc-gestao-territorio.vercel.app/api/diagnose
```

Procure por:
```json
{
  "environment_variables": {
    "JWT_SECRET": "✅ SET"
  }
}
```

### P: O endpoint /api/diagnose também retorna 500

**R:** Significa que o servidor não está iniciando. Possíveis causas:
1. JWT_SECRET não foi adicionada
2. Redeploy não foi feito
3. Alguma outra variável obrigatória está faltando

**Solução:**
1. Verifique novamente as variáveis no Vercel Dashboard
2. Force um redeploy completo (não apenas "Redeploy")
3. Aguarde 5 minutos antes de testar

---

## 📊 VARIÁVEIS DE AMBIENTE - CHECKLIST COMPLETO

### ✅ Obrigatórias (DEVEM estar configuradas)
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` (JSON em uma linha)
- [ ] `EXPO_PUBLIC_GOOGLE_SHEETS_ID`
- [ ] `EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY`
- [ ] `JWT_SECRET` ⭐ **ESTA É A QUE ESTÁ FALTANDO**

### ⚠️ Opcionais (podem estar vazias se não usar OAuth)
- [ ] `OAUTH_SERVER_URL`
- [ ] `VITE_APP_ID` ou `EXPO_PUBLIC_APP_ID`
- [ ] `DATABASE_URL` (se não usar banco de dados externo)
- [ ] `OWNER_OPEN_ID`

### Como Verificar no Vercel:
1. Vá para: Settings → Environment Variables
2. Para cada variável, confirme que está em "All Environments"
3. Se alguma obrigatória estiver faltando, adicione

---

## 🎯 RESUMO - 3 PASSOS SIMPLES

1. **Gerar chave:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Adicionar no Vercel:**
   - Nome: `JWT_SECRET`
   - Valor: (chave gerada)
   - Environments: TODAS

3. **Redeploy e Testar:**
   - Redeploy no Vercel
   - Aguardar 3 minutos
   - Testar: `curl https://atc-gestao-territorio.vercel.app/api/health`

---

## ✅ CONFIRMAÇÃO DE SUCESSO

Você saberá que funcionou quando:
1. ✅ `/api/health` retorna 200 OK (não 500)
2. ✅ App carrega sem erros no console
3. ✅ Login funciona
4. ✅ Criar cadastro salva na planilha Google Sheets
5. ✅ Logs do Vercel mostram inicialização bem-sucedida

---

## 📞 PRECISA DE AJUDA?

Se após seguir TODOS os passos acima o erro persistir:

1. **Copie os logs do Vercel:**
   - Deployments → [Deploy] → Functions → Logs
   - Copie tudo desde `[API] ========== SERVER STARTUP ==========`

2. **Tire print das variáveis de ambiente:**
   - Settings → Environment Variables
   - (sem mostrar os valores, apenas os nomes)

3. **Compartilhe:**
   - Logs completos
   - Print das variáveis
   - Resultado do teste `/api/health`

---

**Última Atualização:** 26 de Janeiro de 2026, 01:45 UTC  
**Próxima Ação:** Adicionar JWT_SECRET agora! ⚡
