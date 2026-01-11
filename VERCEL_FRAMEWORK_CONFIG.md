# ⚙️ Configuração do Vercel para Projeto Expo

## 📋 Resposta Rápida

**Framework Preset**: Deixe em **"Other"**

Este é o correto para projetos Expo/React Native que serão deployados como web app.

---

## 🔧 Configurações Detalhadas para o Vercel

### 1. **Framework Preset**
```
Escolha: Other
```

**Por quê?**
- Expo não está na lista de presets padrão do Vercel
- "Other" permite configurar manualmente os comandos
- Vercel detectará automaticamente as dependências do React/Expo

### 2. **Root Directory**
```
Deixe: ./
```
(Raiz do projeto, nada a mudar)

### 3. **Build and Output Settings** (Expanda se necessário)

Você precisará configurar manualmente:

#### **Build Command:**
```bash
npx expo export --platform web
```

**OU** (se preferir usar o script do package.json):
```bash
npm run build
```

**Mas atenção**: O script `build` atual no `package.json` compila o servidor Node.js, **não a web**. Para deploy web, você precisa adicionar um script específico.

#### **Output Directory:**
```
dist
```

**OU** (mais comum para Expo):
```
web-build
```

#### **Install Command:**
```bash
npm install
```

---

## ✅ Configuração Recomendada Completa

### Opção 1: Configuração Simples (Vercel Auto-Detecta)

1. **Framework Preset**: `Other`
2. **Root Directory**: `./`
3. **Build Command**: Deixe vazio (Vercel tentará auto-detectar)
4. **Output Directory**: Deixe vazio (Vercel tentará auto-detectar)
5. **Install Command**: Deixe vazio (Vercel usa `npm install` automaticamente)

**Variáveis de Ambiente**: Cole o conteúdo do `.env.vercel`

### Opção 2: Configuração Manual (Mais Controle) ⭐ **RECOMENDADO**

1. **Framework Preset**: `Other`
2. **Root Directory**: `./`
3. **Build Command**: 
   ```bash
   npx expo export --platform web
   ```
4. **Output Directory**: 
   ```
   dist
   ```
5. **Install Command**: 
   ```bash
   npm install
   ```

**Variáveis de Ambiente**: Cole o conteúdo do `.env.vercel`

---

## 🚨 IMPORTANTE: Adicionar Script de Build Web

O `package.json` atual tem um script `build` que compila o servidor Node.js. Para o Vercel funcionar corretamente com a versão web, você precisa adicionar um script específico:

### Edite o `package.json`:

Adicione este script:
```json
"build:web": "npx expo export --platform web"
```

Ou simplesmente use o comando direto no Vercel (sem precisar mudar o package.json):
```bash
npx expo export --platform web
```

---

## 📊 Comparação de Opções

| Framework Preset | Quando Usar | Build Command | Output Directory |
|-----------------|-------------|---------------|------------------|
| **Other** ⭐ | Expo/RN web | `npx expo export --platform web` | `dist` |
| Create React App | Apps React puro | `npm run build` | `build` |
| Next.js | Se fosse Next.js | Automático | `.next` |
| Vite | Se fosse Vite | `npm run build` | `dist` |

---

## 🔍 Troubleshooting

### "Build failed: Command not found"
**Solução**: Configure manualmente o Build Command como:
```bash
npx expo export --platform web
```

### "No output directory found"
**Solução**: Verifique se o Output Directory está configurado como `dist` ou `web-build`

### "Environment variables not working"
**Solução**: 
1. Vá em Settings → Environment Variables
2. Cole o conteúdo do `.env.vercel`
3. Redeploye o projeto

### "Module not found: react-native"
**Solução**: Verifique se `react-native-web` está instalado (já está no seu projeto ✅)

---

## 📝 Passo a Passo Completo

### 1. Na tela atual do Vercel:

```
Framework Preset: Other
Project Name: atc-gestao-territorio
Root Directory: ./
```

### 2. Clique em "Build and Output Settings" (expandir)

Configure:
```
Build Command: npx expo export --platform web
Output Directory: dist
Install Command: npm install
```

### 3. Em "Environment Variables"

Cole TODO o conteúdo do arquivo `.env.vercel`:
```
EXPO_PUBLIC_GOOGLE_SHEETS_ID=1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=AIzaSyBNET7Szj8kedgcjDWj1Ix0Vf8V33W6CSQ
GOOGLE_SERVICE_ACCOUNT_KEY_FILE={"type":"service_account",...}
```

### 4. Clique em "Deploy"

Aguarde 3-5 minutos e pronto! 🎉

---

## ✅ Resumo Final

**Framework Preset**: **`Other`** (esta é a resposta que você precisa)

**Por quê `Other` e não outra opção?**
- ❌ Angular - É para Angular
- ❌ Astro - É para Astro
- ❌ Blitz.js - Framework fullstack diferente
- ❌ Create React App - Apenas para CRA puro (não Expo)
- ❌ Docusaurus - Para documentação
- ✅ **Other** - Para projetos customizados como Expo

---

**Data**: 10 de janeiro de 2026  
**Status**: Pronto para Deploy no Vercel
