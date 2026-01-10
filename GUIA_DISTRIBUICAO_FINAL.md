# 📱 Guia de Distribuição do App ATC Gestão Território

## Resumo Executivo

Para distribuir o app para 10-20 pessoas, existem **3 estratégias principais**:

| Opção | Dispositivos | Complexidade | Requer Servidor Ligado | Custo |
|-------|-----------|---------|-----------|--------|
| **Expo Go + QR Code** | Mobile (Android/iOS) | Muito fácil | ✅ Sim | Grátis |
| **Web Deploy (Vercel/Netlify)** | Computador (Web) | Fácil | ❌ Não | Grátis |
| **APK/EXE Local** | Mobile/Desktop | Médio | ❌ Não | Grátis |

**Recomendação**: Combine **Web Deploy (Vercel)** + **Expo Go (Mobile)** para melhor cobertura.

---

## 📍 Opção 1: Expo Go + QR Code (MOBILE - Mais Rápido)

Esta é a forma **mais simples e imediata** de testar no celular.

### Pré-requisitos
- O servidor Expo já deve estar rodando (`npx expo start`)
- Cada usuário precisa do app **Expo Go** instalado (disponível na Play Store / App Store)
- Celulares conectados na **mesma rede WiFi** do computador

### Passo a Passo

#### **Passo 1: Iniciar o servidor Expo**
```bash
cd /home/matheus/Documentos/prog_diuli/v3/atc-gestao-territorioV3/atc-gestao-territorio
npx expo start
```

Você verá um QR code no terminal:
```
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▄▀▀▄▄▄██▄█ ▄▄▄▄▄ █
█ █   █ ███▄█   ▀▀█ █   █ █
█ █▄▄▄█ ██▄▀▄▀ ████ █▄▄▄█ █
█▄▄▄▄▄▄▄█ █ ▀▄▀ █ █▄▄▄▄▄▄▄█
█▄ ▀▄ █▄▀█ ▄▄▀▀█ ▀█▄█▀█▀▀▄█
█▄ ▄▄▀▀▄▀▀▀  ▀█▄▄ ▀███▄▀▀ █
█▀▀▀▄ ▀▄▀ ▄█▄▀▄ █ ▄▀▀█▀ ██
█ ▄ ▄▄ ▄▀▀██ ▄▄▀ ▄▀ ██▄▀  █
█▄█▄▄██▄█ ▀ ▀▀  █ ▄▄▄  ▄▀▄█
█ ▄▄▄▄▄ ██ ▀▄▀  █ █▄█ ██▀▄█
█ █   █ █ ▄▀█▄██▄ █ ▄ █  █
█ █▄▄▄█ █▀█▀█▄█  ▄█▀▀▄█   █
█▄▄▄▄▄▄▄█▄▄▄█▄▄▄█▄▄█▄▄███▄█

› Metro waiting on exp://192.168.15.7:8081
```

#### **Passo 2: Usar o app Expo Go**

**No celular do usuário:**
1. Abra a **Play Store** (Android) ou **App Store** (iOS)
2. Procure por **"Expo Go"** e instale
3. Abra o app Expo Go
4. Clique no botão **"Scan QR Code"** (ícone de câmera)
5. Aponte para o QR code exibido no terminal do seu computador
6. O app carregará automaticamente no celular! 📱

**Mantendo o servidor ligado:**
- O servidor Expo precisa ficar rodando enquanto os usuários estão usando
- **Não pode desligar o computador nem encerrar o terminal**
- Qualquer mudança no código recarga automaticamente nos celulares

### ⚠️ Limitações
- Requer manter computador ligado o tempo todo
- Todos na mesma rede WiFi
- Não funciona pela internet (apenas rede local)
- Ideal para testes, não para produção final

---

## 🌐 Opção 2: Web Deploy em Plataforma Gratuita (RECOMENDADO - Acesso via Link)

Esta é a **melhor opção para distribuir um link simples** que funciona em qualquer computador.

### 2.1 Deploy no Vercel (Recomendado)

#### **Vantagens**
✅ Link permanente (não precisa deixar computador ligado)  
✅ Acesso rápido via qualquer navegador  
✅ Publicação contínua com GitHub  
✅ Completamente grátis para projetos públicos  
✅ Suporta integração com Google Sheets (requer variáveis de ambiente)  

#### **Pré-requisitos**
- Conta GitHub com o repositório do projeto
- Conta Vercel (grátis, feita em segundos)

#### **Passo 1: Criar conta Vercel**
1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"**
4. Autorize Vercel a acessar seus repositórios

#### **Passo 2: Importar Projeto**
1. Em Vercel, clique em **"New Project"**
2. Procure por **"atc-gestao-territorio"** (seu repositório)
3. Clique em **"Import"**

#### **Passo 3: Configurar Variáveis de Ambiente**
Antes de fazer o deploy, você precisa adicionar as variáveis do Google Sheets:

1. Na tela de importação, vá até **"Environment Variables"**
2. Adicione as seguintes variáveis:

```
EXPO_PUBLIC_GOOGLE_SHEETS_ID = [seu-sheet-id-aqui]
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY = [sua-api-key-aqui]
GOOGLE_SERVICE_ACCOUNT_KEY_FILE = [seu-service-account-json-aqui]
```

Encontre essas valores em seu projeto:
- Procure em `.env.local` ou `.env` no repositório

#### **Passo 4: Fazer Deploy**
1. Clique em **"Deploy"**
2. Aguarde 2-5 minutos
3. Você receberá uma URL como: `https://atc-gestao-territorio.vercel.app`

#### **Passo 5: Compartilhar com Usuários**
Envie este link simples para seus 10-20 usuários:
```
https://atc-gestao-territorio.vercel.app
```

Pronto! Qualquer pessoa pode acessar direto no navegador, **sem instalar nada**.

#### **O que muda no app depois do deploy:**
- A versão web (não o app mobile nativo)
- Funciona em qualquer navegador (Chrome, Safari, Firefox, etc.)
- Acesso imediato, sem login ou instalação
- Dados sincronizados com Google Sheets funcionam normalmente

### 2.2 Deploy no Netlify (Alternativa)

Se Vercel não funcionar, Netlify é muito semelhante:

#### **Passo 1: Criar conta Netlify**
1. Acesse [netlify.com](https://netlify.com)
2. Clique em **"Sign up"**
3. Escolha **"GitHub"**

#### **Passo 2: Importar Repositório**
1. Clique em **"Import from Git"**
2. Selecione **"GitHub"** e escolha seu repositório
3. Configure as mesmas variáveis de ambiente

#### **Passo 3: Deploy**
1. Deixe as configurações padrão
2. Clique em **"Deploy site"**
3. Aguarde a construção

Você receberá uma URL como: `https://atc-gestao-territorio-production.netlify.app`

### 2.3 Qual Plataforma Escolher?

| Aspecto | Vercel | Netlify |
|--------|--------|---------|
| Velocidade | ⚡⚡⚡ Muito rápida | ⚡⚡ Rápida |
| Interface | Simples e intuitiva | Simples |
| Suporte a variáveis de ambiente | ✅ Excelente | ✅ Bom |
| Redeploy automático | ✅ Sim | ✅ Sim |
| **Recomendação** | **👍 Primeira escolha** | 👌 Boa alternativa |

---

## 📦 Opção 3: Gerar APK para Android (Para Distribuição via Arquivo)

Se quiser enviar um **arquivo .apk** aos usuários (sem precisar da internet):

### Pré-requisitos
- Projeto publicado em repositório público ou privado
- EAS CLI instalado

### Passo 1: Instalar EAS CLI
```bash
npm install -g eas-cli
```

### Passo 2: Fazer Login na Expo
```bash
eas login
```
(Use sua conta Expo existente)

### Passo 3: Configurar Projeto
```bash
eas build --platform android --local
```

### Passo 4: Gerar APK
```bash
npx eas-cli build --platform android --local
```

O arquivo `.apk` será gerado em minutos. Você pode então:
- Compartilhar via email/WhatsApp
- Distribuir em um servidor interno
- Colocar em um drive compartilhado

**Cada usuário instala assim:**
1. Recebe o arquivo `.apk`
2. Toca no arquivo (ou vai em Configurações > Instalação de Apps Desconhecidas)
3. O app instala como um aplicativo normal

### ⚠️ Limitações
- Você precisa gerar um novo APK **cada vez que fizer mudanças** no código
- Arquivo maior (20-50 MB)
- Atualizar para todos usuários é mais trabalhoso

---

## 🚀 Estratégia Recomendada para 10-20 Pessoas

### Combinação Ideal:

```
┌─────────────────────────────────────────┐
│  USUÁRIOS ACESSAM VIA NAVEGADOR         │
│  (Computador, Tablet, etc)              │
│                                         │
│  Deploy Web: Vercel + Link Único        │
│  https://seu-app.vercel.app             │
│                                         │
│  ✅ Simples de compartilhar             │
│  ✅ Sem instalação necessária           │
│  ✅ Acesso imediato                     │
│  ✅ Sincronização com Sheets            │
│  ✅ Computador não precisa ficar ligado │
└─────────────────────────────────────────┘
         ↓
    Cada usuário recebe 1 link
    e clica para acessar
```

### Por que essa estratégia?

1. **Mais simples de distribuir**: Um único link para todos
2. **Sem instalação**: Abre direto no navegador
3. **Servidor gratuito**: Vercel/Netlify não cobram
4. **Computador desligado**: Não precisa manter servidor rodando
5. **Atualizações automáticas**: Deploy novo = todos veem a versão nova
6. **Funciona em qualquer dispositivo**: Desktop, tablet, celular (navegador)

---

## 📋 Comparação Completa de Opções

### Quando Usar Cada Opção

#### ✅ **USE Expo Go + QR Code QUANDO:**
- Testar no celular durante desenvolvimento
- Feedback rápido de poucos usuários
- Rede local disponível
- Não precisa ser permanente

#### ✅ **USE Web Deploy (Vercel) QUANDO:** ⭐ **RECOMENDADO**
- Distribuir para múltiplos usuários
- Acesso precisa ser permanente
- Usuários acessam principalmente de computador
- Não quer manter servidor ligado
- Quer atualizações fáceis

#### ✅ **USE APK QUANDO:**
- Usuários querem app nativo no celular
- Precisa funcionar offline
- Quer distribuir arquivo único
- Tem poucos usuários (atualizar é trabalhoso)

---

## 🔧 Passo a Passo Prático: Escolha uma Opção

### Opção A: Web via Vercel (Mais Recomendado)

```bash
# 1. Certifique-se que código está no GitHub
git push origin main

# 2. Acesse vercel.com e faça deploy
# (Siga os passos da Seção 2.1 acima)

# 3. Compartilhe o link com seus usuários:
# "Acesse https://seu-app.vercel.app"

# 4. Pronto! Nada mais precisa fazer
# (Vercel cuida do servidor)
```

### Opção B: Expo Go (Para Testar Rapidamente)

```bash
# 1. Certifique-se de estar no diretório do projeto
cd /home/matheus/Documentos/prog_diuli/v3/atc-gestao-territorioV3/atc-gestao-territorio

# 2. Inicie o servidor
npx expo start

# 3. Peça a usuários para:
#    - Instalar Expo Go (Play Store / App Store)
#    - Abrir app Expo Go
#    - Clicar em "Scan QR Code"
#    - Apontar para QR code do terminal

# 4. App carrega no celular!
# Mantenha o terminal aberto
```

### Opção C: APK para Android

```bash
# 1. Instale EAS
npm install -g eas-cli
eas login

# 2. Gere o APK
eas build --platform android

# 3. Distribuir arquivo .apk aos usuários
# (Email, Google Drive, pendrive, etc)

# 4. Usuários instalam no celular
```

---

## ❓ Perguntas Frequentes

### P: É necessário deixar meu computador ligado como servidor?

**Resposta**: Depende da opção:

- **Expo Go**: ✅ SIM, precisa manter ligado enquanto está em uso
- **Web Deploy (Vercel)**: ❌ NÃO, servidor está na nuvem
- **APK**: ❌ NÃO, arquivo é independente

### P: Posso enviar um link único para todos acessarem?

**Resposta**: Sim! A melhor forma é:

```
Deploy Web → Gera um link único → Compartilha com todos
Exemplo: https://seu-app.vercel.app
```

Todos clicam no mesmo link e acessam a mesma versão do app.

### P: O que acontece se eu mudar o código depois de fazer deploy?

**Com Vercel/Netlify**: 
- Você faz `git push` no repositório
- Vercel detecta a mudança
- Redeploy automático em segundos
- Todos usuários já veem a versão nova (sem fazer nada)

### P: Os dados sincronizam com Google Sheets mesmo com Web Deploy?

**Resposta**: Sim, 100%! A sincronização com Sheets funciona exatamente igual:
- Botão Sync: ✅ Funciona
- Botão Pull: ✅ Funciona
- Variáveis de ambiente: ✅ Configuradas no Vercel

### P: Qual é o limite de usuários simultâneos?

- **Expo Go**: Apenas os conectados à mesma rede
- **Vercel**: Até milhares de usuários simultâneos (plano grátis tem limites, mas suficientes para você)
- **APK**: Sem limite (é local)

### P: Posso usar meu nome de domínio personalizado?

**Resposta**: Sim! Tanto Vercel quanto Netlify permitem configurar domínios personalizados:
- Vercel: Vá em Settings → Domains → Add Domain
- Netlify: Domain Management → Add custom domain

Exemplo: `atc.suaempresa.com.br` em vez de `atc.vercel.app`

### P: E se o Google Sheets tiver limite de requisições?

**Resposta**: O plano gratuito permite:
- Leitura: ✅ Ilimitado
- Escrita: ✅ ~100 operações/minuto (suficiente)

Para 10-20 usuários não há problema.

---

## 📱 Resumo Final: O Que Fazer Agora

### Se quer compartilhar via LINK (RECOMENDADO):
1. Faça deploy no Vercel
2. Compartilhe `https://seu-app.vercel.app` com os usuários
3. Pronto!

### Se quer compartilhar via CELULAR:
1. Peça a usuários para instalar Expo Go
2. Rode `npx expo start`
3. Compartilhe o QR code
4. Mantenha computador ligado

### Se quer compartilhar via ARQUIVO APK:
1. Gere o APK com EAS
2. Envie arquivo `.apk`
3. Usuários instalam no celular
4. Sem necessidade de internet depois de instalado

---

## 🎯 Próximas Ações

```
1. Escolha uma estratégia acima
2. Implemente conforme o passo a passo
3. Teste com 1-2 usuários primeiro
4. Aumente para os 10-20 usuários
5. Monitore feedback
6. Atualize código conforme necessário
```

---

## 📞 Suporte Rápido

Se algo não funcionar:

**Web Deploy não carrega:**
- Verifique as variáveis de ambiente no Vercel
- Confirme que repositório está público
- Redeploy manual

**Expo Go não conecta:**
- Verifique se está na mesma rede WiFi
- Reinicie o servidor (`npx expo start`)
- Atualize Expo Go para versão mais recente

**Google Sheets não sincroniza:**
- Verifique configurações de variáveis de ambiente
- Confirme permissões na Service Account do Google
- Teste sincronização localmente antes de fazer deploy

---

**Documento atualizado em**: 10 de janeiro de 2026  
**Versão**: 1.0  
**Recomendação**: Use **Opção 2 (Web Deploy Vercel)** para melhor experiência de distribuição.
