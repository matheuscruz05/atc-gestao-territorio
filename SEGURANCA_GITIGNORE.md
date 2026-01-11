# 🔐 Segurança: Arquivos Ignorados no Git

## ✅ Atualizado em: 10 de janeiro de 2026

O arquivo `.gitignore` foi atualizado para garantir que **nenhum arquivo sensível** seja commitado no repositório.

---

## 📋 Arquivos Agora Ignorados

### 🔑 **Variáveis de Ambiente (CRÍTICO)**
```
.env
.env.local
.env.vercel
.env.*.local
.env.production.local
.env.test.local
```

**Por quê?**
- Contêm chaves da API Google Sheets
- Contêm credenciais de Service Account
- Exposição = acesso não autorizado aos dados

### 🗝️ **Arquivos de Segurança/Credenciais**
```
secrets/
secrets/**/*.json
.env.json
google-key.json
firebase-key.json
credentials.json
```

**Por quê?**
- `secrets/sa-key.json` - Chave privada da Google
- Arquivos de autenticação
- Tokens e credenciais

### 🔐 **Certificados e Chaves Criptográficas**
```
*.jks          # Android keystores
*.p8           # iOS provisioning
*.p12          # Certificados SSL
*.key          # Chaves privadas
*.mobileprovision
*.pem          # Certificados PEM
```

**Por quê?**
- Assinatura de app
- SSL/TLS
- Autenticação

### 📱 **Pastas Nativas Geradas**
```
/ios
/android
```

**Por quê?**
- Grandes demais para repositório
- Geradas automaticamente por Expo/EAS
- Não precisam ser versionadas

### 🐛 **Logs e Debug**
```
npm-debug.*
yarn-debug.*
yarn-error.*
logs/
*.log
```

**Por quê?**
- Logs contêm informações sensíveis
- Podem expor tokens ou dados internos

### 💾 **Cache e Build**
```
.expo/
dist/
web-build/
.cache/
*.tgz
*.tar.gz
.metro-health-check*
```

**Por quê?**
- Arquivos temporários
- Não precisam ser versionados
- Regenerados automaticamente

---

## ⚠️ Arquivos CRÍTICOS para Ignorar

| Arquivo/Pasta | Status | Razão |
|--------------|--------|-------|
| `.env.vercel` | ✅ Ignorado | Contém chaves da API |
| `.env.local` | ✅ Ignorado | Dados de desenvolvimento |
| `secrets/sa-key.json` | ✅ Ignorado | Chave privada Google |
| `.env.production.local` | ✅ Ignorado | Credenciais de produção |
| `node_modules/` | ✅ Ignorado | Muito grande, regenerável |
| `/ios` e `/android` | ✅ Ignorado | Gerados automaticamente |

---

## ✅ Como Verificar se Está Correto

### Verificar o que SERIA commitado:
```bash
git status --short
```

Você **NÃO** deve ver:
- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.vercel`
- ❌ `secrets/`
- ❌ `sa-key.json`

Se algum desses aparecer, execute:
```bash
git rm --cached .env.vercel
git rm --cached secrets/sa-key.json
# ... etc
```

### Verificar se .gitignore está funcionando:
```bash
git check-ignore -v .env.vercel
git check-ignore -v secrets/sa-key.json
```

Deve retornar que os arquivos estão ignorados.

---

## 📝 Instruções para Colaboradores

Se alguém clonar seu repositório, eles precisarão:

1. **Criar arquivo `.env.local`** com as variáveis corretas
2. **Criar pasta `secrets/`** com as chaves (se necessário)
3. **Não commitarem** esses arquivos

### Template para novo desenvolvedor:

```bash
# 1. Clone o repositório
git clone <seu-repo>

# 2. Entre na pasta
cd atc-gestao-territorio

# 3. Crie o arquivo .env.local (copie do .env.example)
cp .env.example .env.local

# 4. Edite .env.local com os dados REAIS:
nano .env.local

# 5. Para as chaves do Google, peça ao administrador:
mkdir -p secrets
# (Receberá sa-key.json por outro canal seguro)

# 6. Verifique se os arquivos estão ignorados
git status
# NÃO deve mostrar .env.local ou secrets/
```

---

## 🚨 Se Alguma Chave Foi Exposta

**AÇÃO IMEDIATA:**

1. **Invalide as chaves**:
   - Acesse Google Cloud Console
   - Regenere a Service Account key
   - Regenere a API Key

2. **Remova do histórico Git**:
   ```bash
   git filter-branch --tree-filter 'rm -f .env.local' HEAD
   git push origin master --force
   ```

3. **Atualize as chaves**:
   - Atualize `.env.local` com as novas chaves
   - Atualize `.env.vercel` no Vercel

---

## 📚 Referência Rápida do .gitignore

**Arquivo completo** está em:
```
/home/matheus/Documentos/prog_diuli/v3/atc-gestao-territorioV3/atc-gestao-territorio/.gitignore
```

**Seções principais:**
1. Dependencies (`node_modules/`)
2. Build artifacts (`.expo/`, `dist/`, `web-build/`)
3. Native files (`/ios`, `/android`, chaves e certificados)
4. Environment files (`.env`, `secrets/`)
5. Logs e debug
6. IDE files

---

## ✨ Resumo de Segurança

✅ **Protegido agora:**
- Chaves Google Sheets
- Service Account JSON
- Variáveis de ambiente
- Certificados de assinatura
- Logs que podem conter dados sensíveis

✅ **Não commitará:**
- Nenhuma credencial
- Nenhuma chave privada
- Nenhum token secreto

✅ **Repositório está seguro** para compartilhar publicamente no GitHub!

---

**Última atualização**: 10 de janeiro de 2026  
**Responsabilidade**: Verificar regularmente que arquivos sensíveis não são commitados
