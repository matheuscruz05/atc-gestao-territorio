# 📝 Como Importar Variáveis de Ambiente no Vercel

## ✅ Resposta Rápida

**Sim, é possível!** O Vercel tem um recurso **"Import .env"** que permite importar todas as variáveis de uma vez, sem digitar manualmente cada uma.

---

## 📋 Arquivo Pronto para Usar

Criei o arquivo **`.env.vercel`** com todas as variáveis do seu projeto:
- ✅ `EXPO_PUBLIC_GOOGLE_SHEETS_ID` - ID da planilha
- ✅ `EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY` - Chave de API pública
- ✅ `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` - Chave privada da Service Account (para escrita)

Este arquivo está pronto para ser importado no Vercel!

---

## 🚀 Passo a Passo: Como Importar no Vercel

### Passo 1: Acesse a Dashboard do Vercel
1. Abra https://vercel.com
2. Faça login com sua conta
3. Clique em **"Projects"** (no menu esquerdo)
4. Procure por **"atc-gestao-territorio"**
5. Clique nele

### Passo 2: Vá até Settings
1. No topo do projeto, clique em **"Settings"**
2. No menu lateral esquerdo, procure por **"Environment Variables"**
3. Clique em **"Environment Variables"**

### Passo 3: Import do Arquivo .env

**Opção A: Copiar e Colar (Mais Simples)**

1. Vá ao arquivo `.env.vercel` no seu computador
2. Abra e copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
3. Volte para a página do Vercel (na aba Environment Variables)
4. Você verá um botão **"Import .env"** ou **"Import Environment Variables"**
5. Clique nele
6. Cole o conteúdo do arquivo (Ctrl+V)
7. Clique em **"Save"** ou **"Import"**

**Opção B: Upload de Arquivo (Se o Vercel permitir)**

1. Se houver opção de "Upload file"
2. Selecione o arquivo `.env.vercel`
3. Confirme
4. Clique em **"Save"**

### Passo 4: Verificar Se Foi Importado

Após importar, você deverá ver **3 variáveis** listadas:
```
EXPO_PUBLIC_GOOGLE_SHEETS_ID = 1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY = AIzaSyBNET7Szj8kedgcjDWj1Ix0Vf8V33W6CSQ
GOOGLE_SERVICE_ACCOUNT_KEY_FILE = {"type":"service_account",...}
```

✅ Se aparecerem as 3 variáveis, está correto!

### Passo 5: Redeploye o Projeto

Depois de importar as variáveis, você precisa redeploye:

1. No topo do projeto, clique em **"Deployments"**
2. Procure por um botão de **três pontos** (⋯) ou **"Redeploy"**
3. Clique em **"Redeploy"**
4. Aguarde a build completar (2-5 minutos)
5. Quando ficar verde, o deploy funcionou! ✅

---

## ⚠️ Cuidados Importantes

### 1. Não Adicione Variáveis Manualmente
Se já adicionou algumas variáveis manualmente, você pode:
- Deletar as antigas clicando no ❌
- Depois fazer o import do `.env.vercel`
- Ou deixar as que já existem (Vercel não duplica)

### 2. A Chave Privada é Sensível
O arquivo `.env.vercel` contém a chave privada do Google. 
- ✅ É seguro compartilhar com Vercel (eles criptografam)
- ❌ Não compartilhe com pessoas não autorizadas
- ❌ Não commite na pasta pública do GitHub

### 3. Verifique as Permissões
Após o deploy, teste se o sync funciona:
1. Abra o app no navegador (https://seu-app.vercel.app)
2. Tente clicar em "📤 Enviar" (Sync)
3. Verifique se os dados foram para Google Sheets

---

## 📱 O que Muda Depois do Deploy

✅ **Funciona**:
- Botão Sync (📤 Enviar)
- Botão Pull (📥 Atualizar)
- Sincronização com Google Sheets
- Leitura e escrita de dados

❌ **Não Funciona** (apenas na versão web):
- Notificações push
- Alguns recursos nativos do Android/iOS (mas o essencial funciona)

---

## 🔧 Solução de Problemas

### "Erro ao sincronizar com Google Sheets"
- ✅ Verifique se as 3 variáveis foram importadas
- ✅ Aguarde 5 minutos (Vercel às vezes demora para ativar)
- ✅ Recarregue a página (F5)
- ✅ Faça um novo redeploy

### "Variáveis não aparecem"
- ✅ Verifique se copou TODO o arquivo `.env.vercel`
- ✅ Tente colar novamente
- ✅ Se tiver problemas, adicione manualmente as 3 variáveis

### "A página não carrega"
- ✅ Verifique se o deploy ficou verde
- ✅ Aguarde cache do navegador limpar (Ctrl+Shift+Delete)
- ✅ Tente em modo incógnito

---

## 📂 Arquivo .env.vercel Completo

O arquivo está em: `/home/matheus/Documentos/prog_diuli/v3/atc-gestao-territorioV3/atc-gestao-territorio/.env.vercel`

**Conteúdo pronto para copiar e colar:**
```
EXPO_PUBLIC_GOOGLE_SHEETS_ID=1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=AIzaSyBNET7Szj8kedgcjDWj1Ix0Vf8V33W6CSQ
GOOGLE_SERVICE_ACCOUNT_KEY_FILE={"type":"service_account","project_id":"atc-gestao-territorio-483803",...}
```

---

## ✅ Resumo Rápido

| Etapa | Ação |
|-------|------|
| 1 | Abra `.env.vercel` e copie todo o conteúdo |
| 2 | Vá ao Vercel → Settings → Environment Variables |
| 3 | Clique em "Import .env" e cole o conteúdo |
| 4 | Clique em "Save" |
| 5 | Vá em "Deployments" e faça "Redeploy" |
| 6 | Aguarde a build completar (fica verde) |
| 7 | Pronto! Seu app está no ar com Sheets sincronizando |

---

**Data**: 10 de janeiro de 2026  
**Status**: ✅ Pronto para Deploy
