# 📋 DEPLOYMENT CHECKLIST INTERATIVO

**Projeto**: ATC Gestão Território  
**Data**: 2 de fevereiro de 2026  
**Tempo Estimado**: 30-45 minutos  
**Nível de Risco**: MÉDIO (produção)

---

## 🟢 FASE 1: PRÉ-DEPLOYMENT (5-10 minutos)

Marque cada item conforme completa:

### Verificações Técnicas
- [ ] **Código compilando sem erros**
  ```bash
  npm run check
  ```
  ✅ Output esperado: Sem erros TypeScript

- [ ] **Linter passou**
  ```bash
  npm run lint
  ```
  ✅ Output esperado: "All checks passed" ou similar

- [ ] **Testes passando**
  ```bash
  npm run test
  ```
  ✅ Output esperado: "XX passed"

- [ ] **Build funciona localmente**
  ```bash
  npm run build
  ```
  ✅ Output esperado: `dist/` criado com sucesso

- [ ] **Sem console.log de debug**
  ```bash
  grep -r "console.log(" app/ lib/ --include="*.ts" --include="*.tsx" \
    | grep -v "logDebug\|console.error\|console.warn"
  ```
  ✅ Output esperado: Poucas ocorrências (apenas production logging)

### Verificações de Git
- [ ] **Não há mudanças não-commitadas importantes**
  ```bash
  git status
  ```
  ✅ Output esperado: "working tree clean" ou apenas arquivos temporários

- [ ] **Branch atual está atualizada**
  ```bash
  git pull origin $(git rev-parse --abbrev-ref HEAD)
  ```
  ✅ Output esperado: "Already up to date"

- [ ] **Histórico de commits é limpo**
  ```bash
  git log --oneline -10
  ```
  ✅ Output esperado: Commits com mensagens claras, sem "WIP" ou "test"

### Verificações de Segurança
- [ ] **Nenhum arquivo .env commitado**
  ```bash
  git log --all --oneline -- ".env*" "secrets/"
  ```
  ✅ Output esperado: Vazio ou apenas commits históricos

- [ ] **.gitignore protege .env files**
  ```bash
  cat .gitignore | grep -E "\.env|secrets"
  ```
  ✅ Output esperado: `.env*` e `secrets/` listados

- [ ] **Sem secrets em código**
  ```bash
  grep -r "API_KEY\|SECRET\|PASSWORD" app/ lib/ \
    --include="*.ts" --include="*.tsx" \
    | grep -v "process.env"
  ```
  ✅ Output esperado: Vazio (apenas referências a env vars)

---

## 🟡 FASE 2: PREPARAÇÃO DE BRANCHES (10-15 minutos)

**Situação Atual:**
```
Você está em: localhost
Precisa estar: main (para produção)
```

### Opção A: Merge Seguro (RECOMENDADO)

- [ ] **Atualizar main localmente**
  ```bash
  git fetch origin
  git checkout main
  git pull origin main
  ```
  ✅ Output esperado: "Already up to date" ou lista de commits puxados

- [ ] **Verificar diferenças**
  ```bash
  git log --oneline main..localhost
  ```
  ✅ Revisar: Todos os commits que serão mergidos estão corretos?

- [ ] **Fazer merge com histórico**
  ```bash
  git merge localhost --no-ff -m "Merge localhost: Deploy v1.0.0"
  ```
  ✅ Output esperado: "Merge made by 'ort' strategy" (sem fast-forward)

- [ ] **Criar tag de release**
  ```bash
  git tag -a v1.0.0 -m "Release v1.0.0 - ATC Produção"
  git show v1.0.0
  ```
  ✅ Output esperado: Tag criada com mensagem

- [ ] **Push tudo**
  ```bash
  git push origin main
  git push origin v1.0.0
  ```
  ✅ Output esperado: "Everything up-to-date" ou novo push

- [ ] **Sincronizar localhost com main**
  ```bash
  git checkout localhost
  git merge main
  git push origin localhost
  ```
  ✅ Output esperado: Ambas branches sincronizadas

### Opção B: Simples (Se main já tem código atualizado)

- [ ] **Apenas verificar**
  ```bash
  git log --oneline main..localhost | wc -l
  ```
  Se retornar `0`: main já está atualizada, pode pular

---

## 🔴 FASE 3: CONFIGURAR VARIÁVEIS (5-10 minutos)

### Pré-requisitos
- [ ] **Ter UUID v4 para JWT_SECRET**
  ```bash
  node -e "console.log(require('crypto').randomUUID())"
  ```
  ✅ Output esperado: `a3c2e8f1-9d47-4b2e-8c3f-2a8e7b9c4d3e` (copiado para usar depois)

- [ ] **Ter arquivo `.env.vercel.production` preenchido**
  ```bash
  cat .env.vercel.production | grep -E "SUBSTITUIR|^\[" 
  ```
  ✅ Output esperado: Vazio (sem placeholders faltando)

### Via Interface Web

- [ ] **Acessar Vercel Dashboard**
  - URL: https://vercel.com/projects
  - Selecione: `atc-gestao-territorio`

- [ ] **Ir em Settings → Environment Variables**

- [ ] **Importar .env file**
  - Clique: "Import .env"
  - Cole conteúdo de `.env.vercel.production`
  - Clique: "Save"

- [ ] **Verificar cada variável**
  ```
  EXPO_PUBLIC_GOOGLE_SHEETS_ID          ✅ Público
  EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY     ✅ Público
  EXPO_PUBLIC_API_BASE_URL              ✅ Público
  EXPO_PUBLIC_OAUTH_SERVER_URL          ✅ Público
  EXPO_PUBLIC_APP_ID                    ✅ Público
  VITE_APP_ID                           ✅ Público
  
  GOOGLE_SERVICE_ACCOUNT_JSON           ✅ Production only
  JWT_SECRET                            ✅ Production
  OAUTH_SERVER_URL                      ✅ Production
  NODE_ENV=production                   ✅ Production
  ```

- [ ] **Salvar configurações**
  - Clique: "Save"
  - Aguarde sincronização (30 segundos)

### Via CLI (Alternativa)

```bash
vercel login
vercel env add EXPO_PUBLIC_API_BASE_URL
# Responda as perguntas com os valores do .env.vercel.production
```

---

## 🟠 FASE 4: DEPLOYMENT (5 minutos)

### Método 1: Script Automatizado (RECOMENDADO)

- [ ] **Dar permissão de execução**
  ```bash
  chmod +x deploy-vercel.sh
  ```

- [ ] **Executar script**
  ```bash
  ./deploy-vercel.sh production
  ```
  ✅ O script vai:
  - Validar ambiente
  - Executar testes
  - Build local
  - Fazer deploy no Vercel
  - Mostrar URL final

### Método 2: Manual

- [ ] **Fazer build**
  ```bash
  npm run build
  ```
  ✅ Output esperado: Sem erros

- [ ] **Fazer deploy em produção**
  ```bash
  vercel --prod
  ```
  ✅ Output esperado: "Production deployment completed"

---

## ✅ FASE 5: PÓS-DEPLOYMENT (5-10 minutos)

### Verificação Imediata

- [ ] **Acesso à URL funcionando**
  ```bash
  curl -I https://atc-gestao-territorio.vercel.app
  ```
  ✅ Output esperado: `HTTP/1.1 200 OK`

- [ ] **Build completou no Vercel**
  - URL: https://vercel.com/projects/atc-gestao-territorio/deployments
  - Status: 🟢 "Ready" (verde)

- [ ] **Verificar logs sem erros**
  ```bash
  vercel logs --tail --limit 50
  ```
  ✅ Output esperado: Sem erros críticos (warnings OK)

### Testes de Funcionalidade

- [ ] **Página carrega corretamente**
  - Abrir: https://atc-gestao-territorio.vercel.app
  - Esperado: Tela de login com logo do ATC

- [ ] **DevTools sem erros vermelhos**
  - F12 → Console
  - Esperado: Sem erros (warnings OK)

- [ ] **URLs não são localhost**
  - No Console digitar:
    ```javascript
    console.log(process.env.EXPO_PUBLIC_API_BASE_URL)
    ```
  - Esperado: `https://atc-gestao-territorio.vercel.app` (não localhost)

- [ ] **Login funciona**
  - Usuário: `admin@admin.com`
  - Senha: (a que foi configurada)
  - Esperado: Acesso concedido, dashboard carrega

- [ ] **Google Sheets sincroniza**
  - Dashboard → Cadastros
  - Dever ver: 4 cadastros listados
  - Esperado: Dados aparecem, não vazio

- [ ] **Dashboard mostra dados corretos**
  - Verificar: LAPA - CASTROLANDA - PR
  - Verificar: 14 produtos visíveis
  - Verificar: Sem "Invalid Date"

### Performance

- [ ] **Tempo de carregamento aceitável**
  - DevTools → Network
  - Esperado: Total < 5 segundos

- [ ] **Sem recursos não carregados**
  - DevTools → Console
  - Esperado: Sem erro `Failed to load resource`

---

## 📊 FASE 6: MONITORAMENTO (Contínuo)

### Primeiras 24 horas

- [ ] **Verificar logs a cada 2 horas**
  ```bash
  vercel logs --tail
  ```

- [ ] **Monitorar aplicação em produção**
  - Testar diferentes funcionalidades
  - Verificar se usuários conseguem usar

- [ ] **Alertar time se houver problemas**
  - Slack: #prod-incidents
  - Email: dev-team@

### Próximas 48 horas

- [ ] **Revisar analytics**
  - URL: https://vercel.com/projects/atc-gestao-territorio/analytics

- [ ] **Verificar erro tracking** (se configurado)
  - Sentry / LogRocket / similar

- [ ] **Confirmar backups**
  - Google Sheets está sendo sincronizado
  - Dados estão sendo persistidos

---

## 🚨 ROLLBACK (Se algo der errado)

### Identificar o Problema

- [ ] **Verificar logs de erro**
  ```bash
  vercel logs --tail
  ```

- [ ] **Testar URL**
  ```bash
  curl -v https://atc-gestao-territorio.vercel.app
  ```

- [ ] **Consultar comunidade/documentação**
  - Buscar erro específico em:
  - Vercel Docs
  - GitHub Issues
  - Stack Overflow

### Fazer Rollback

**Opção 1: Redeploy da versão anterior** (Recomendado)

- [ ] **No Vercel Dashboard**
  - Deployments → Selecione deployment anterior (🟢 Ready)
  - 3 pontos (...) → "Redeploy"

- [ ] **Aguardar novo build**
  - Tempo: 2-3 minutos

- [ ] **Verificar se funcionou**
  - Testar URL novamente
  - Verificar funcionalidades

**Opção 2: Revert Git e repush** (Se erro no código)

```bash
git reset --hard HEAD~1
git push origin main -f
```

⚠️ Use apenas se necessário (força reset)

---

## ✨ SUCESSO!

Se todos os itens das FASES 1-5 estão marcados como ✅:

### Parabéns! 🎉

```
✅ Código está em produção
✅ Usuários podem usar o app
✅ Dados estão sincronizando
✅ Sistema está performático
✅ Time foi notificado
```

### Próximas ações:

1. **Comunicar ao time**
   - Slack: "@channel App em produção! ✅"
   - Email: "v1.0.0 deployed successfully"

2. **Documentar lições aprendidas**
   - O que foi fácil?
   - O que foi difícil?
   - Como melhorar próxima vez?

3. **Preparar runbook de incidentes**
   - Documento com passos para resolver issues comuns
   - Contatos de escalação

4. **Agendar retrospectiva** (1 semana)
   - Team meeting para discutir deploy
   - Coletar feedback

---

## 📞 AJUDA

| Problema | Solução | Link |
|----------|---------|------|
| Build falhou | Ver logs no Vercel | https://vercel.com/projects/atc-gestao-territorio/deployments |
| Variáveis não carregadas | Verificar Environment Variables | https://vercel.com/projects/atc-gestao-territorio/settings/environment-variables |
| Erro CORS | Atualizar URLs de API | DEPLOYMENT_VERCEL_PRODUCTION.md |
| Problema com Git | Revisar seção de branches | DEPLOYMENT_VERCEL_PRODUCTION.md |
| Outras dúvidas | Consultar guia completo | DEPLOYMENT_VERCEL_PRODUCTION.md |

---

**Versão**: 1.0.0  
**Criado**: 2 de fevereiro de 2026  
**Tempo Total**: ~45 minutos  
**Dificuldade**: Médio  
**Status**: Pronto para uso

✅ **Sucesso garantido com este checklist!**
