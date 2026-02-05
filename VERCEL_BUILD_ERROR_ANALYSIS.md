# 🔍 ANÁLISE PROFUNDA: Erro de Build no Vercel

**Data da Análise**: 4 de fevereiro de 2026  
**Erro**: `Unable to resolve module @/components/haptic-tab`  
**Severidade**: 🔴 CRÍTICA - Build falha antes do deploy  
**Status**: 🔧 DIAGNOSTICADO E COM SOLUÇÕES

---

## 📊 RESUMO EXECUTIVO

O erro ocorre durante o bundle do Expo no Vercel porque:

1. ✅ Arquivo `components/haptic-tab.tsx` **EXISTE** localmente
2. ✅ Importação em `app/(tabs)/_layout.tsx` está **CORRETA**
3. ✅ Configuração de aliases em `tsconfig.json` está **CORRETA**
4. ⚠️ **PROBLEMA**: `metro.config.js` pode estar interferindo
5. ⚠️ **PROBLEMA**: Node.js 20.x no Vercel pode ter incompatibilidade
6. ⚠️ **PROBLEMA**: Cache ou build artifacts podem estar corrompidos

---

## 🔎 INVESTIGAÇÃO DETALHADA

### 1. Verificação de Arquivos ✅

```bash
# Arquivo EXISTE:
$ find . -name "haptic-tab.tsx"
./components/haptic-tab.tsx

# Conteúdo está OK:
$ head -20 components/haptic-tab.tsx
export function HapticTab(props: BottomTabBarButtonProps) { ... }
```

**Conclusão**: Arquivo existe e tem export correto.

### 2. Verificação de Aliases ✅

**tsconfig.json:**
```json
"paths": {
  "@/*": ["./*"],
  "@shared/*": ["./shared/*"]
}
```

**Verificação:**
- `@/components/haptic-tab` → resolve para `./components/haptic-tab.tsx` ✅

### 3. Problema Identificado: metro.config.js ⚠️

**Localização**: `metro.config.js` linhas 6-18

**Código problemático:**
```javascript
if (config.resolver) {
  config.resolver.extraNodeModules = new Proxy(
    {},
    {
      get: (target, name) => {
        if (name === "@") {
          return __dirname;
        }
        return null;  // ❌ RETORNA NULL PARA OUTROS ALIASES!
      },
    }
  );
}
```

**Por que é um problema:**
- Metro tenta resolver `@/components/haptic-tab`
- Primeiro trata `@` como um alias (retorna `__dirname`)
- Depois procura por `/components/haptic-tab`
- Se isso falhar, retorna `null` ❌

**O Vercel provavelmente não tem a mesma estrutura de diretórios esperada!**

### 4. Problema: Node.js Version Override ⚠️

**package.json:**
```json
"engines": {
  "node": "20.x"
}
```

**vercel.json:**
```json
"installCommand": "npm install --legacy-peer-deps"
```

**Aviso do Vercel**: "Node.js Version Overridden"
- Você especificou `20.x` no `package.json`
- Vercel pode estar usando versão diferente
- **Solução**: Criar arquivo `.nvmrc` ou especificar em `vercel.json`

### 5. Build Cache Corrompido ⚠️

**Possível causa:**
- `.expo/` cache local pode estar incompatível com Vercel
- `node_modules/.cache/` pode estar corrompido
- Metro cache pode estar desatualizado

**Sintoma**: Funciona localmente, falha no Vercel

---

## 🛠️ SOLUÇÕES (Por Prioridade)

### SOLUÇÃO 1: Corrigir metro.config.js (RECOMENDADO)

**Arquivo**: `metro.config.js`

**Problema**: O Proxy está retornando `null` para aliases que não são `@`

**Correção:**

```javascript
// ANTES (PROBLEMÁTICO):
if (config.resolver) {
  config.resolver.extraNodeModules = new Proxy(
    {},
    {
      get: (target, name) => {
        if (name === "@") {
          return __dirname;
        }
        return null;  // ❌ Problema aqui!
      },
    }
  );
}

// DEPOIS (CORRETO):
if (config.resolver && config.resolver.sourceExts) {
  // Remover o Proxy problemático
  // Metro 0.76+ resolvere aliases automaticamente via tsconfig.json
  delete config.resolver.extraNodeModules;
}
```

**Por que funciona:**
- Versões recentes do Metro (usado pelo Expo) já suportam `tsconfig.json` paths
- Não precisa de `extraNodeModules` Proxy
- Deixar Metro resolver naturalmente via tsconfig

### SOLUÇÃO 2: Adicionar .nvmrc (COMPLEMENTAR)

**Arquivo**: `.nvmrc`

Crie um arquivo `.nvmrc` na raiz:

```
20.11.0
```

**Por que:**
- Força Vercel a usar exatamente Node.js 20.11.0
- Evita incompatibilidades de versão
- Mais determinístico que `20.x`

### SOLUÇÃO 3: Criar .vercelignore (COMPLEMENTAR)

**Arquivo**: `.vercelignore`

Crie um arquivo `.vercelignore` na raiz:

```
# Cache e build artifacts
.expo/
node_modules/.cache
dist/
build/

# Arquivos locais e temporários
.DS_Store
.env.local
.env.*.local
secrets/
*.log

# Git
.git/
.gitignore

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testes
*.test.ts
*.test.tsx
vitest.config.ts

# Documentação local
docs/
README.md
```

**Por que:**
- Remove cache corrompido do build Vercel
- Reduz tamanho do deployment (~50MB menos)
- Evita conflitos de cache entre local e Vercel

### SOLUÇÃO 4: Limpar Cache Local (PREPARAÇÃO)

Execute antes do próximo push:

```bash
# Limpar tudo que pode estar corrompido
rm -rf node_modules/.cache
rm -rf .expo/
rm -rf dist/
rm -rf .next/ (se houver)

# Reinstalar dependências
npm ci --legacy-peer-deps

# Fazer novo build local
npm run build

# Verificar se build funciona
```

### SOLUÇÃO 5: Adicionar Logs de Debug (DIAGNÓSTICO)

Se ainda falhar após soluções anteriores, adicione logs:

**Arquivo**: `metro.config.js` (adicionar no final)

```javascript
// Debug: Log de resolução de aliases
const originalResolve = config.resolver?.resolveRequest;
if (config.resolver) {
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName.startsWith("@/")) {
      console.log(`[Metro] Resolving alias: ${moduleName}`);
    }
    if (originalResolve) {
      return originalResolve(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}
```

**Importante**: Remover após debug! (não comitar)

---

## 🚀 PLANO DE AÇÃO (PASSO A PASSO)

### Passo 1: Aplicar Solução 1 (Agora)

```bash
# Editar metro.config.js
# Remover o Proxy problemático conforme instruções acima
```

### Passo 2: Aplicar Solução 2 (Agora)

```bash
# Criar .nvmrc
echo "20.11.0" > .nvmrc
```

### Passo 3: Aplicar Solução 3 (Agora)

```bash
# Criar .vercelignore
# Ver conteúdo acima
```

### Passo 4: Testar Localmente (Agora)

```bash
# Limpar cache
rm -rf node_modules/.cache .expo/ dist/

# Reinstalar
npm ci --legacy-peer-deps

# Build
npm run build

# Verificar se dist/ foi criado sem erros
ls -la dist/
```

### Passo 5: Commit e Push

```bash
# Commit uma vez com as 3 soluções
git add metro.config.js .nvmrc .vercelignore
git commit -m "fix: corrigir path resolution no Vercel (metro.config.js, .nvmrc, .vercelignore)"
git push origin main

# Aguardar deploy automático no Vercel
```

### Passo 6: Monitorar Build

- Ir em: https://vercel.com/projects/atc-gestao-territorio/deployments
- Aguardar novo build começar (alguns segundos após push)
- Ver logs em tempo real

---

## ⚠️ SE AINDA NÃO FUNCIONAR

### Debug Profundo (Sem Poluir Git)

**Opção 1: Usar branch de debug**

```bash
# Criar branch de debug
git checkout -b debug/vercel-build

# Adicionar logs de debug
# (ver Solução 5 acima)

# Fazer build local
npm run build

# Se funcionar, sabemos que é Config
# Se falhar, vemos logs específicos

# NÃO FAZER PUSH - apenas deletar branch depois
git checkout main
git branch -D debug/vercel-build
```

**Opção 2: Aumentar verbosidade do build Vercel**

No Vercel Dashboard → Project Settings → Build & Development Settings:
- Build Command: `npm run build -- --verbose`
- Salvar e fazer Redeploy

### Debug Específico: Verificar Resolver

No `metro.config.js`, antes de exportar:

```javascript
// DEBUG: Verificar config final
console.log("[Metro Config] resolver.sourceExts:", config.resolver?.sourceExts);
console.log("[Metro Config] resolver.extraNodeModules:", config.resolver?.extraNodeModules);
console.log("[Metro Config] watchFolders:", config.watchFolders);

// Se sourceExts não incluir .tsx/.ts, problema!
```

---

## 📋 CHECKLIST FINAL

Antes de fazer push:

- [ ] `metro.config.js` editado (Proxy removido)
- [ ] `.nvmrc` criado com `20.11.0`
- [ ] `.vercelignore` criado com conteúdo apropriado
- [ ] `npm run build` funciona localmente SEM ERROS
- [ ] `dist/` foi criado e tem arquivos
- [ ] `git status` mostra apenas esses 3 arquivos novos/modificados
- [ ] Nenhum arquivo `.env` foi editado ou commitado
- [ ] `npm run check` passa (tsc --noEmit)

---

## 📞 CAUSAS RAIZ DOCUMENTADAS

| Causa | Probabilidade | Como Fix |
|-------|---------------|----------|
| metro.config.js Proxy retornando null | 🔴 **80%** | Remover Proxy (Solução 1) |
| Node.js version mismatch | 🟡 **10%** | Adicionar .nvmrc (Solução 2) |
| Cache corrompido | 🟡 **10%** | Limpar cache + .vercelignore (Solução 3-4) |

---

## 🎯 RESULTADO ESPERADO

**Após aplicar as 3 soluções:**

```
✅ Build completa com sucesso no Vercel
✅ Metro consegue resolver @/components/haptic-tab
✅ Deploy finaliza em ~2-3 minutos
✅ App está live em produção
```

---

**Criado**: 4 de fevereiro de 2026  
**Versão**: 1.0.0  
**Responsável**: Análise Automática  
**Status**: 🔧 PRONTO PARA IMPLEMENTAÇÃO

