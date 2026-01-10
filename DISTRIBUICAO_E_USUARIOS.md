# 📱 Guia de Distribuição do App e Gestão de Usuários

Este guia explica como distribuir o aplicativo ATC Gestão de Território para seus usuários e gerenciar contas de forma segura e profissional.

---

## 📋 Índice

1. [Distribuição do App](#distribuição-do-app)
2. [Gestão de Usuários](#gestão-de-usuários)
3. [Segurança de Senhas](#segurança-de-senhas)
4. [Onboarding de Novos Usuários](#onboarding-de-novos-usuários)
5. [Troubleshooting](#troubleshooting)

---

## 📱 Distribuição do App

### Opção 1: Expo Go (Recomendado para Testes)

**Vantagens:**
- Instalação instantânea
- Sem necessidade de build
- Perfeito para MVP e testes
- Funciona em iOS e Android

**Desvantagens:**
- Requer Expo Go instalado
- Não é ideal para produção
- Requer conexão com servidor Expo

**Passo a Passo:**

1. **Instale Expo Go nos celulares:**
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Gere o QR Code:**
   ```bash
   cd /home/ubuntu/atc-gestao-territorio
   pnpm qr
   ```

3. **Escaneie o QR Code:**
   - Abra o Expo Go
   - Clique em "Escanear código QR"
   - Aponte para o QR code exibido no terminal

4. **O app abrirá automaticamente!**

**Compartilhar com Múltiplos Usuários:**

Se quiser que múltiplos usuários acessem ao mesmo tempo:

1. Execute o servidor:
   ```bash
   pnpm dev
   ```

2. Copie a URL exibida (ex: `exps://8081-i0gmsm6gj4wnnvvhep5da-0ca8b705.us1.manus.computer`)

3. Compartilhe com os usuários

4. Eles podem abrir no Expo Go clicando no link

---

### Opção 2: APK (Android) - Recomendado para Produção

**Vantagens:**
- App instalável sem Expo Go
- Funciona offline (após primeira sincronização)
- Ideal para distribuição em larga escala
- Pode ser instalado via email, WhatsApp, etc.

**Desvantagens:**
- Requer build (leva 10-15 minutos)
- Arquivo maior (~50-100 MB)
- Requer assinatura de chave

**Passo a Passo:**

1. **Preparar o Projeto:**
   ```bash
   cd /home/ubuntu/atc-gestao-territorio
   ```

2. **Gerar APK:**
   ```bash
   eas build --platform android --local
   ```

   **Ou, se usar Expo:**
   ```bash
   expo build:android
   ```

3. **Aguarde o build completar** (10-15 minutos)

4. **Baixe o arquivo APK** que será gerado

5. **Distribua o APK:**
   - Via email
   - Via WhatsApp
   - Via Google Drive
   - Via link de download

6. **Usuários instalam:**
   - Abrem o arquivo `.apk`
   - Clicam em "Instalar"
   - O app aparece na tela inicial

---

### Opção 3: Play Store (Google Play)

**Vantagens:**
- Distribuição profissional
- Atualizações automáticas
- Alcance global

**Desvantagens:**
- Requer conta de desenvolvedor ($25)
- Processo de revisão (1-3 dias)
- Mais complexo de configurar

**Passo a Passo:**

1. **Crie conta de desenvolvedor:**
   - Vá para: https://play.google.com/console
   - Clique em "Criar conta"
   - Pague a taxa de $25

2. **Crie um novo app:**
   - Clique em "Criar app"
   - Preencha os detalhes

3. **Prepare o APK:**
   ```bash
   eas build --platform android --local
   ```

4. **Faça upload do APK:**
   - No console, vá em "Versão"
   - Clique em "Criar versão"
   - Faça upload do APK

5. **Preencha os detalhes:**
   - Descrição
   - Screenshots
   - Categoria
   - Classificação etária

6. **Envie para revisão:**
   - Clique em "Enviar para revisão"
   - Aguarde aprovação (1-3 dias)

7. **Publicar:**
   - Após aprovação, clique em "Publicar"
   - O app estará disponível para download

---

### Opção 4: iOS (App Store)

**Vantagens:**
- Distribuição profissional para iPhone/iPad
- Alcance de usuários iOS

**Desvantagens:**
- Requer Mac
- Requer conta de desenvolvedor Apple ($99/ano)
- Processo de revisão rigoroso
- Mais complexo

**Passo a Passo Resumido:**

1. **Crie conta de desenvolvedor Apple:**
   - Vá para: https://developer.apple.com
   - Clique em "Account"
   - Pague $99/ano

2. **Configure certificados:**
   - Siga o guia oficial da Apple

3. **Gere o IPA:**
   ```bash
   eas build --platform ios --local
   ```

4. **Faça upload via TestFlight ou App Store:**
   - Use Transporter (ferramenta da Apple)
   - Ou use o Xcode

5. **Envie para revisão e aguarde**

---

## 👥 Gestão de Usuários

### Adicionar Novo Usuário

#### Método 1: Via Google Sheets (Recomendado)

**Passo a Passo:**

1. **Abra a planilha Google Sheets**
   - Vá para: https://sheets.google.com
   - Abra "ATC_Gestao_Territorio_DB"

2. **Vá para a aba "USUARIOS"**

3. **Clique na primeira linha vazia**

4. **Preencha os dados:**
   - EMAIL: novo_atc@empresa.com
   - NOME: Nome do Novo ATC
   - ROLE: ATC (ou COORD para coordenador)
   - ATIVO: TRUE

5. **Pressione Enter**

6. **O novo usuário está criado!**

**Exemplo:**

| EMAIL | NOME | ROLE | ATIVO |
|-------|------|------|-------|
| novo_atc@empresa.com | Pedro Costa | ATC | TRUE |

#### Método 2: Via App (Futuro)

Quando implementar admin panel, coordenadores poderão adicionar usuários diretamente no app.

---

### Editar Usuário Existente

1. **Abra a planilha**
2. **Vá para a aba "USUARIOS"**
3. **Encontre o usuário**
4. **Edite os campos desejados:**
   - NOME: Altere o nome
   - ROLE: Mude entre ATC e COORD
   - ATIVO: Mude entre TRUE e FALSE

5. **As mudanças sincronizam automaticamente**

---

### Desativar Usuário

1. **Abra a planilha**
2. **Vá para a aba "USUARIOS"**
3. **Encontre o usuário**
4. **Mude ATIVO para FALSE**
5. **O usuário não conseguirá fazer login**

---

### Deletar Usuário

**Opção 1: Desativar (Recomendado)**
- Mude ATIVO para FALSE
- Mantém histórico de dados

**Opção 2: Deletar Linha (Permanente)**
- Clique com botão direito na linha
- Clique em "Deletar linha"
- ⚠️ Não há como recuperar

---

## 🔐 Segurança de Senhas

### Status Atual

Atualmente, o app usa **senha padrão: 123456** para todos os usuários. Isso é aceitável para MVP/testes, mas **NÃO é seguro para produção**.

### Implementar Segurança (Futuro)

Para produção, recomenda-se uma das seguintes opções:

#### Opção 1: Firebase Authentication (Recomendado)

**Vantagens:**
- Gratuito até 50k usuários/mês
- Autenticação profissional
- Suporta múltiplos métodos (email, Google, etc.)
- Recuperação de senha automática

**Como Implementar:**

1. Crie conta no Firebase: https://firebase.google.com
2. Crie um novo projeto
3. Ative "Authentication"
4. Integre no app (requer código adicional)

#### Opção 2: Servidor Backend Simples

**Vantagens:**
- Controle total
- Pode rodar em servidor gratuito (Heroku, Render, etc.)

**Desvantagens:**
- Requer conhecimento de backend
- Mais complexo de manter

#### Opção 3: Autenticação com Hash

**Vantagens:**
- Simples de implementar
- Senhas armazenadas com segurança

**Desvantagens:**
- Sem recuperação de senha automática
- Requer gerenciamento manual

### Mudança de Senha (Quando Implementado)

1. Usuário faz login
2. Vai em "Perfil"
3. Clica em "Alterar Senha"
4. Digita senha atual
5. Digita nova senha
6. Confirma nova senha
7. Clica em "Salvar"

---

## 🎓 Onboarding de Novos Usuários

### Checklist para Novo ATC

- [ ] Conta criada na planilha USUARIOS
- [ ] Email e senha compartilhados (de forma segura)
- [ ] App instalado no celular
- [ ] Primeiro login realizado
- [ ] Dados de referência sincronizados
- [ ] Primeiro cadastro de teste criado
- [ ] Treinamento básico concluído

### Checklist para Novo Coordenador

- [ ] Conta criada como COORD
- [ ] Acesso à planilha Google Sheets
- [ ] Acesso ao dashboard administrativo
- [ ] Treinamento em gestão de usuários
- [ ] Treinamento em análise de dados

### Email de Boas-vindas (Modelo)

```
Assunto: Bem-vindo ao Sistema ATC Gestão de Território

Olá [NOME],

Bem-vindo ao Sistema ATC Gestão de Território!

Suas credenciais de acesso:
- Email: [EMAIL]
- Senha: [SENHA_TEMPORARIA]

Como acessar:
1. Instale o Expo Go no seu celular
2. Abra o link: [LINK_DO_APP]
3. Faça login com suas credenciais
4. Altere sua senha na primeira vez

Documentação:
- Guia de uso: [LINK]
- Suporte: [EMAIL_SUPORTE]

Qualquer dúvida, entre em contato!

Atenciosamente,
Equipe de TI
```

---

## 📊 Gestão de Dados

### Backup Regular

**Importante:** Faça backup regularmente!

1. **Abra a planilha**
2. Clique em **"Arquivo"** → **"Fazer download"**
3. Selecione **"CSV"** ou **"Excel"**
4. Guarde o arquivo em local seguro

**Frequência Recomendada:**
- Diária (se muitos cadastros)
- Semanal (uso normal)
- Mensal (mínimo)

### Limpeza de Dados

1. **Remova cadastros duplicados:**
   - Use "Dados" → "Remover duplicatas"

2. **Corrija dados inconsistentes:**
   - Verifique nomes de canais, unidades, etc.

3. **Archive dados antigos:**
   - Crie uma aba "ARQUIVO"
   - Mova cadastros antigos para lá

---

## 📞 Suporte e Troubleshooting

### Problema: Usuário não consegue fazer login

**Causas Possíveis:**
- Email digitado incorretamente
- Usuário não está na planilha
- Usuário está marcado como ATIVO = FALSE
- Senha incorreta

**Solução:**
1. Verifique se o email está na planilha
2. Verifique se ATIVO = TRUE
3. Peça para o usuário digitar a senha corretamente
4. Resete a senha (mude para padrão 123456)

### Problema: Novo usuário não aparece no app

**Causa:** O app não sincronizou os dados

**Solução:**
1. No app, faça pull-to-refresh
2. Ou reinicie o app
3. Aguarde alguns segundos

### Problema: Usuário foi deletado por engano

**Solução:**
1. Use Ctrl+Z para desfazer (se for rápido)
2. Ou restaure do backup
3. Ou recrie o usuário

---

## 🚀 Próximos Passos

1. **Implementar autenticação segura** (Firebase ou backend)
2. **Adicionar admin panel** para gerenciar usuários no app
3. **Implementar recuperação de senha**
4. **Adicionar logs de auditoria**
5. **Implementar permissões granulares**

---

## ✅ Checklist de Distribuição

- [ ] App testado em múltiplos dispositivos
- [ ] Credenciais de demo funcionando
- [ ] Sincronização com Google Sheets testada
- [ ] Método de distribuição escolhido
- [ ] APK ou link compartilhado com usuários
- [ ] Usuários conseguem fazer login
- [ ] Primeiro cadastro testado
- [ ] Documentação compartilhada
- [ ] Suporte configurado

---

**Pronto para distribuir seu app!** 🚀

