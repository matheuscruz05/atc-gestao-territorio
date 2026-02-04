# 🚀 DEPLOYMENT CHECKLIST - ATC GESTÃO TERRITÓRIO

**Status**: ✅ Pronto para Produção  
**Data**: 2 de fevereiro de 2026  
**Responsável**: Equipe de DevOps

---

## 📄 DOCUMENTOS CRIADOS

| Arquivo | Descrição |
|---------|-----------|
| **DEPLOYMENT_VERCEL_PRODUCTION.md** | Guia COMPLETO com 8 seções de deployment |
| **.env.vercel.production** | Template de variáveis com instruções |
| **deploy-vercel.sh** | Script bash automatizado para deployment |
| **README_DEPLOYMENT.md** | Este arquivo (resumo executivo) |

---

## ⚡ QUICK START (5 PASSOS)

### 1️⃣ Preparar Repositório
```bash
# Sincronizar branches
git checkout main
git pull origin main
git merge localhost --no-ff -m "Deploy v1.0.0"
git push origin main

# Criar tag de release
git tag -a v1.0.0 -m "Release v1.0.0 - Produção"
git push origin v1.0.0
```

### 2️⃣ Configurar Variáveis no Vercel

**Interface Web (Recomendado):**
- Acesse: https://vercel.com/projects/atc-gestao-territorio
- Settings → Environment Variables
- Clique: "Import .env"
- Cole conteúdo de `.env.vercel.production`
- Clique: "Save"

**OU CLI:**
```bash
vercel login
vercel env add EXPO_PUBLIC_API_BASE_URL
# Valor: https://atc-gestao-territorio.vercel.app
```

### 3️⃣ Executar Script de Deployment
```bash
chmod +x deploy-vercel.sh
./deploy-vercel.sh production
```

**OU Manual:**
```bash
npm run build
vercel --prod
```

### 4️⃣ Aguardar Build
- Monitorar em: https://vercel.com/projects/atc-gestao-territorio/deployments
- Status deve mudar para "Ready" (verde)
- Tempo esperado: 2-3 minutos

### 5️⃣ Testar Produção
```bash
# 1. URL acessível?
curl https://atc-gestao-territorio.vercel.app

# 2. API respondendo?
curl https://atc-gestao-territorio.vercel.app/api/health

# 3. Abrir no navegador
https://atc-gestao-territorio.vercel.app

# 4. DevTools → Console → Verificar se URLs não são localhost
```

---

## 🔑 VARIÁVEIS CRÍTICAS

### ⚠️ FALTANDO EM `.env.vercel` (Adicionar Obrigatoriamente)

```env
# Production URLs
EXPO_PUBLIC_API_BASE_URL=https://atc-gestao-territorio.vercel.app
EXPO_PUBLIC_OAUTH_SERVER_URL=https://atc-gestao-territorio.vercel.app
OAUTH_SERVER_URL=https://atc-gestao-territorio.vercel.app

# Security
JWT_SECRET=[GERAR UUID V4 SEGURO]
NODE_ENV=production

# OBS: Gerar com: node -e "console.log(require('crypto').randomUUID())"
```

### ✅ JÁ EXISTENTES (Apenas Copiar)

```env
EXPO_PUBLIC_GOOGLE_SHEETS_ID=1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=AIzaSyBNET7Szj8kedgcjDWj1Ix0Vf8V33W6CSQ
GOOGLE_SERVICE_ACCOUNT_JSON={...JSON completo...}
VITE_APP_ID=atc-gestao-territorio
EXPO_PUBLIC_APP_ID=atc-gestao-territorio
```

---

## 🌿 GESTÃO DE BRANCHES

### Situação Atual:
```
✅ localhost - Branch de desenvolvimento (ATUAL)
⚠️  main     - Branch de produção (DESATUALIZADA)
```

### Processo Seguro:

```bash
# 1. Sincronizar localmente
git checkout main
git pull origin main

# 2. Fazer merge com histórico (Git Flow)
git merge localhost --no-ff -m "Merge localhost para produção v1.0.0"

# 3. Tag de release
git tag -a v1.0.0 -m "Release v1.0.0"

# 4. Push tudo
git push origin main
git push origin v1.0.0

# 5. Voltar para desenvolvimento
git checkout localhost
git merge main
git push origin localhost
```

**Resultado:**
- ✅ main contém código de produção
- ✅ localhost sincronizado
- ✅ Tag para rastreabilidade
- ✅ Ambas as branches atualizadas

---

## 🔐 SEGURANÇA

### ❌ NUNCA FAZER:
- [ ] Commitar `.env*` files no git
- [ ] Compartilhar `JWT_SECRET`
- [ ] Expor `GOOGLE_SERVICE_ACCOUNT_JSON`
- [ ] Usar secrets em variáveis públicas (`EXPO_PUBLIC_*`)

### ✅ SEMPRE FAZER:
- [ ] Usar `.gitignore` para `.env` files
- [ ] Armazenar secrets no Vercel
- [ ] Rotacionar secrets a cada 6 meses
- [ ] Separar Production/Preview/Development

### Verificação:
```bash
# Confirmar que .env está no .gitignore
grep -E "^\.env" .gitignore

# Se não estiver:
echo ".env*" >> .gitignore
echo "secrets/" >> .gitignore
git add .gitignore
git commit -m "chore: atualizar .gitignore para segurança"
```

---

## 📊 ANTES vs DEPOIS

### ANTES (localhost)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000        ❌
OAUTH_SERVER_URL=http://localhost:3000                ❌
JWT_SECRET=dev-secret-local-only                      ❌
```

### DEPOIS (Produção)
```env
EXPO_PUBLIC_API_BASE_URL=https://atc-gestao-territorio.vercel.app  ✅
OAUTH_SERVER_URL=https://atc-gestao-territorio.vercel.app           ✅
JWT_SECRET=[UUID V4 SEGURO]                                         ✅
NODE_ENV=production                                                 ✅
```

---

## 🧪 VERIFICAÇÃO PÓS-DEPLOYMENT

### Build Status
```bash
vercel logs --tail
# Deve mostrar: "Build completed successfully"
```

### Testes Rápidos
```bash
# 1. URL acessível
curl -I https://atc-gestao-territorio.vercel.app
# HTTP 200 OK

# 2. API Health
curl https://atc-gestao-territorio.vercel.app/api/health
# {"status": "ok"}

# 3. Verificar variáveis carregadas
# Abrir DevTools → Console
# Verificar que EXPO_PUBLIC_API_BASE_URL é URL de produção
console.log(process.env.EXPO_PUBLIC_API_BASE_URL)
# https://atc-gestao-territorio.vercel.app
```

### Funcionalidades
- [ ] Login funciona
- [ ] Google Sheets sincroniza
- [ ] Dashboard carrega
- [ ] Sem erros no console
- [ ] Performance OK (< 3s)

---

## 🚨 TROUBLESHOOTING

### ❌ "Build Failed"
```bash
# Verificar logs
vercel logs --tail

# Solução: Adicionar variáveis faltando no Vercel
vercel env list
```

### ❌ "Cannot find module"
```bash
# Solução: Atualizar Build Command
# Vercel Settings → General
# Build Command: npm install --legacy-peer-deps && npm run build
```

### ❌ "API Retorna 500"
```bash
# Solução: Confirmar variáveis privadas em "Production"
vercel env list --production-only

# Redeplorar
vercel --prod
```

### ❌ "Cors Error"
```bash
# Solução: Atualizar URLs
vercel env add EXPO_PUBLIC_API_BASE_URL
# Valor: https://atc-gestao-territorio.vercel.app

vercel --prod
```

---

## 📞 REFERÊNCIAS

- **Guia Completo**: [DEPLOYMENT_VERCEL_PRODUCTION.md](./DEPLOYMENT_VERCEL_PRODUCTION.md)
- **Template .env**: [.env.vercel.production](./.env.vercel.production)
- **Script Deploy**: [deploy-vercel.sh](./deploy-vercel.sh)
- **Vercel Docs**: https://vercel.com/docs
- **Expo Web**: https://docs.expo.dev/guides/publishing-websites/

---

## 📝 RESUMO EXECUTIVO

| Item | Status | Ação Necessária |
|------|--------|-----------------|
| Código pronto | ✅ | Nenhuma |
| Testes passando | ✅ | Nenhuma |
| Build funciona | ✅ | Nenhuma |
| Documentação | ✅ | Nenhuma |
| **Variáveis de Ambiente** | ⚠️ | **ADICIONAR URLS + JWT_SECRET** |
| **Branches sincronizadas** | ⚠️ | **FAZER MERGE localhost → main** |
| Vercel configurado | ✅ | Nenhuma |
| **Pronto para Deploy** | 🔄 | **EXECUTAR PASSOS ACIMA** |

---

## 🎯 PRÓXIMOS PASSOS

### Dia 1:
1. ✅ Ler [DEPLOYMENT_VERCEL_PRODUCTION.md](./DEPLOYMENT_VERCEL_PRODUCTION.md)
2. ✅ Gerar JWT_SECRET: `node -e "console.log(require('crypto').randomUUID())"`
3. ✅ Adicionar variáveis no Vercel Dashboard
4. ✅ Executar: `./deploy-vercel.sh production`
5. ✅ Testar aplicação

### Dia 2:
- Monitorar logs em produção
- Alertar usuários (se necessário)
- Documentar issues encontradas

### Próximas Semanas:
- Implementar monitoring
- Configurar alertas
- Preparar runbook de incidentes

---

**Versão**: 1.0.0  
**Criado**: 2 de fevereiro de 2026  
**Última Atualização**: [Data Atual]  
**Revisor**: [Seu Nome]

✅ Pronto para Produção!
