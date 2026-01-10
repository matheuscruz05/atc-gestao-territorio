# 📊 Guia Completo de Sincronização com Google Sheets (100% GRATUITO)

Este guia explica **PASSO A PASSO** como sincronizar o aplicativo ATC Gestão de Território com Google Sheets, **SEM CUSTOS ALGUM**.

---

## 🎯 O que você vai conseguir

Após seguir este guia, você terá:

✅ Uma planilha Google Sheets como banco de dados central (gratuito)  
✅ Sincronização automática de cadastros do app para a planilha  
✅ Sincronização de dados de referência (produtos, canais, unidades)  
✅ Dashboard administrativo na planilha com gráficos  
✅ Notificações por email quando novos cadastros são criados  
✅ Controle total dos dados sem depender de servidores pagos  

---

## 📋 Pré-requisitos

- Uma conta Google (Gmail) - **GRATUITA**
- O aplicativo ATC Gestão de Território instalado
- Acesso a um computador para configurar a planilha

---

## 🚀 PASSO 1: Criar a Planilha Google Sheets

### 1.1 Acessar Google Sheets

1. Abra o navegador e vá para: **https://sheets.google.com**
2. Faça login com sua conta Google (ou crie uma se não tiver)
3. Clique em **"+ Criar"** (ícone de nova planilha)
4. Nomeie a planilha como: **"ATC_Gestao_Territorio_DB"**

### 1.2 Criar as Abas (Sheets)

Você vai criar 5 abas (sheets) dentro da mesma planilha. Clique com botão direito na aba "Planilha1" e renomeie para:

1. **USUARIOS**
2. **PRODUTOS**
3. **CANAIS**
4. **UNIDADES**
5. **CADASTROS**
6. **WEBHOOK_LOG** (opcional, para logs)

---

## 📝 PASSO 2: Preencher as Abas com Dados

### 2.1 Aba: USUARIOS

Clique na aba **USUARIOS** e preencha com os seguintes headers na linha 1:

| EMAIL | NOME | ROLE | ATIVO |
|-------|------|------|-------|
| coord@atc.com | Coordenador Principal | COORD | TRUE |
| atc1@atc.com | João Silva | ATC | TRUE |
| atc2@atc.com | Maria Santos | ATC | TRUE |
| atc3@atc.com | Carlos Oliveira | ATC | TRUE |

**Como preencher:**
1. Célula A1: `EMAIL`
2. Célula B1: `NOME`
3. Célula C1: `ROLE`
4. Célula D1: `ATIVO`
5. Linha 2 em diante: Preencha com os dados acima

### 2.2 Aba: PRODUTOS

| PRODUTO_ID | CATEGORIA | PRODUTO | UNIDADE_POTENCIAL | ATIVO |
|------------|-----------|---------|-------------------|-------|
| MICROESSENTIALS | FERTILIZANTE - BASE | MICROESSENTIALS | tons | TRUE |
| PERFORMA_BIO | FERTILIZANTE - BASE | PERFORMA BIO | tons | TRUE |
| ASPIRE | FERTILIZANTES - COBERTURA | ASPIRE | tons | TRUE |
| MBIO_PHOS | BIOLÓGICOS - INOCULANTES | MBIO PHOS | litros | TRUE |
| HIDRO_LIVRE | HIDROSSOLÚVEIS | (LIVRE) | litros | TRUE |
| NEMATOIDE | BIOLÓGICOS - INOCULANTES | NEMATOIDE | litros | TRUE |
| FOLIAR_A | BIOLÓGICOS - FOLIARES | FOLIAR A | litros | TRUE |
| FOLIAR_B | BIOLÓGICOS - FOLIARES | FOLIAR B | litros | TRUE |
| COBERTURA_X | FERTILIZANTES - COBERTURA | COBERTURA X | tons | TRUE |
| COBERTURA_Y | FERTILIZANTES - COBERTURA | COBERTURA Y | tons | TRUE |
| BASE_PLUS | FERTILIZANTE - BASE | BASE PLUS | tons | TRUE |
| INOCULANTE_Z | BIOLÓGICOS - INOCULANTES | INOCULANTE Z | litros | TRUE |
| PREMIUM_FOLIAR | BIOLÓGICOS - FOLIARES | PREMIUM FOLIAR | litros | TRUE |

### 2.3 Aba: CANAIS

| CANAL_ID | CANAL | ATIVO |
|----------|-------|-------|
| VAREJO | Varejo | TRUE |
| COOPERATIVA | Cooperativa | TRUE |
| DISTRIBUIDOR | Distribuidor | TRUE |
| DIRETO | Venda Direta | TRUE |
| ONLINE | E-commerce | TRUE |

### 2.4 Aba: UNIDADES

| UNIDADE_ID | UNIDADE | ESTADO_UF | ATIVO |
|------------|---------|-----------|-------|
| UNID_RS_01 | Cooperativa Agrícola RS | RS | TRUE |
| UNID_SP_01 | Cooperativa Vale do Paraíba | SP | TRUE |
| UNID_MT_01 | Cooperativa Mato Grosso | MT | TRUE |
| UNID_MG_01 | Cooperativa Minas Gerais | MG | TRUE |
| UNID_GO_01 | Cooperativa Goiás | GO | TRUE |
| UNID_BA_01 | Cooperativa Bahia | BA | TRUE |
| UNID_PR_01 | Cooperativa Paraná | PR | TRUE |
| UNID_SC_01 | Cooperativa Santa Catarina | SC | TRUE |
| UNID_MS_01 | Cooperativa Mato Grosso do Sul | MS | TRUE |
| UNID_PA_01 | Cooperativa Pará | PA | TRUE |
| UNID_TO_01 | Cooperativa Tocantins | TO | TRUE |
| UNID_DF_01 | Cooperativa Brasília | DF | TRUE |
| UNID_RJ_01 | Cooperativa Rio de Janeiro | RJ | TRUE |

### 2.5 Aba: CADASTROS

Crie os headers na linha 1:

| CADASTRO_ID | CRIADO_EM | ATC_EMAIL | ATC_NOME | CANAL | UNIDADE | ESTADO | CATEGORIA | PRODUTO_REF | PRODUTO_NOME_LIVRE | UNIDADE_POTENCIAL | IMPLANTADO | POTENCIAL_VALOR | CONCORRENTES | OBSERVACAO |
|-------------|-----------|-----------|----------|-------|---------|--------|-----------|-------------|-------------------|-------------------|------------|-----------------|--------------|------------|

**Esta aba ficará vazia inicialmente. Os cadastros serão preenchidos automaticamente quando os ATCs usarem o app.**

### 2.6 Aba: WEBHOOK_LOG (Opcional)

| LOG_ID | CADASTRO_ID | ENVIADO_EM | DESTINO | STATUS_HTTP | RESPOSTA |
|--------|-------------|------------|---------|-------------|----------|

---

## 🔑 PASSO 3: Obter o ID da Planilha

Este ID é necessário para conectar o app à planilha.

1. Abra a planilha no Google Sheets
2. Olhe a URL na barra de endereço:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
3. Copie o valor entre `/d/` e `/edit`
4. **Guarde este ID com segurança** - você vai precisar dele

**Exemplo:**
```
URL: https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit
ID: 1a2b3c4d5e6f7g8h9i0j
```

---

## 🔐 PASSO 4: Configurar Acesso à Planilha (Opção A - API Key)

### 4.1 Acessar Google Cloud Console

1. Vá para: **https://console.cloud.google.com**
2. Faça login com a mesma conta Google
3. Se for a primeira vez, aceite os termos

### 4.2 Criar um Projeto

1. No topo, clique em **"Selecionar um projeto"**
2. Clique em **"NOVO PROJETO"**
3. Nome: **"ATC_Gestao_Territorio"**
4. Clique em **"Criar"**
5. Aguarde alguns segundos até o projeto ser criado

### 4.3 Ativar Google Sheets API

1. No menu lateral esquerdo, clique em **"APIs e Serviços"**
2. Clique em **"Biblioteca"**
3. Na barra de busca, digite: **"Google Sheets API"**
4. Clique no resultado
5. Clique em **"ATIVAR"**
6. Aguarde a ativação

### 4.4 Criar Credenciais (API Key)

1. No menu lateral, clique em **"Credenciais"**
2. Clique em **"+ CRIAR CREDENCIAIS"**
3. Selecione **"Chave de API"**
4. Uma chave será gerada (ex: `AIzaSyD1a2b3c4d5e6f7g8h9i0j...`)
5. **Copie e guarde esta chave com segurança**

### 4.5 Compartilhar a Planilha

1. Abra a planilha no Google Sheets
2. Clique em **"Compartilhar"** (canto superior direito)
3. Mude para **"Qualquer pessoa com o link"**
4. Copie o link e compartilhe com os usuários que precisam acessar

---

## 🔐 PASSO 5: Configurar o Aplicativo

### 5.1 Criar Arquivo de Variáveis de Ambiente

No seu computador, na pasta do projeto (`atc-gestao-territorio`), crie um arquivo chamado `.env` com o seguinte conteúdo:

```env
# ID da planilha Google Sheets (obtido no Passo 3)
EXPO_PUBLIC_GOOGLE_SHEETS_ID=seu_spreadsheet_id_aqui

# API Key (obtida no Passo 4.4)
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=sua_api_key_aqui

# URL do Webhook (opcional - deixe em branco se não usar)
EXPO_PUBLIC_WEBHOOK_URL=
```

**Exemplo preenchido:**
```env
EXPO_PUBLIC_GOOGLE_SHEETS_ID=1a2b3c4d5e6f7g8h9i0j
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=AIzaSyD1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
EXPO_PUBLIC_WEBHOOK_URL=
```

### 5.2 Reiniciar o Servidor

1. Abra o terminal na pasta do projeto
2. Execute:
   ```bash
   pnpm dev
   ```
3. Aguarde o servidor iniciar

---

## 📱 PASSO 6: Testar a Sincronização

### 6.1 Criar um Cadastro no App

1. Abra o app no seu celular ou emulador
2. Faça login como ATC: `atc1@atc.com` / `123456`
3. Clique no botão **"+"** para criar um novo cadastro
4. Preencha todos os campos:
   - Canal: Varejo
   - Unidade: Cooperativa Agrícola RS
   - Estado: RS
   - Categoria: FERTILIZANTE - BASE
   - Produto: MICROESSENTIALS
   - Implantado: Sim
   - Potencial: 1000
   - Concorrentes: Concorrente A
   - Observação: Teste de sincronização
5. Clique em **"Salvar Cadastro"**

### 6.2 Verificar na Planilha

1. Abra a planilha Google Sheets
2. Vá para a aba **"CADASTROS"**
3. Verifique se uma nova linha foi adicionada com os dados do cadastro
4. **Se apareceu, a sincronização está funcionando!** ✅

---

## 🔔 PASSO 7: Configurar Notificações por Email (Opcional)

### 7.1 Criar Script no Google Sheets

1. Abra a planilha
2. Clique em **"Extensões"** → **"Apps Script"**
3. Delete o código padrão
4. Cole este código:

```javascript
function onEdit(e) {
  // Verificar se foi editada a aba CADASTROS
  if (e.source.getActiveSheet().getName() !== "CADASTROS") {
    return;
  }
  
  // Verificar se foi adicionada uma nova linha
  const range = e.range;
  if (range.getRow() < 2) return; // Pular header
  
  // Obter dados da linha
  const sheet = e.source.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(lastRow, 1, 1, 15).getValues()[0];
  
  // Enviar email
  const email = "SEU_EMAIL@gmail.com"; // ALTERE PARA SEU EMAIL
  const subject = "Novo Cadastro - ATC Gestão de Território";
  const message = `
    Novo cadastro criado!
    
    ATC: ${values[3]} (${values[2]})
    Canal: ${values[4]}
    Unidade: ${values[5]}
    Estado: ${values[6]}
    Categoria: ${values[7]}
    Produto: ${values[8]}
    Potencial: ${values[12]} ${values[10]}
    Data: ${values[1]}
  `;
  
  GmailApp.sendEmail(email, subject, message);
}
```

5. **IMPORTANTE:** Altere `SEU_EMAIL@gmail.com` para seu email real
6. Clique em **"Salvar"** (ícone de disquete)
7. Quando solicitado, autorize o script a acessar o Gmail

### 7.2 Testar Notificação

1. Crie um novo cadastro no app
2. Aguarde alguns segundos
3. Verifique seu email - você deve receber uma notificação!

---

## 👥 PASSO 8: Adicionar Novos Usuários

### 8.1 Adicionar Usuário na Planilha

1. Abra a planilha
2. Vá para a aba **"USUARIOS"**
3. Clique na primeira linha vazia após os usuários existentes
4. Preencha:
   - EMAIL: novo_atc@empresa.com
   - NOME: Nome do Novo ATC
   - ROLE: ATC (ou COORD para coordenador)
   - ATIVO: TRUE

### 8.2 Sincronizar com o App

1. No app, faça pull-to-refresh (puxe a tela para baixo)
2. O novo usuário será sincronizado automaticamente
3. O novo usuário pode fazer login com a senha padrão: `123456`

### 8.3 Alterar Senha (Segurança)

**Nota:** Atualmente, o app usa senha padrão `123456` para todos. Para produção, recomenda-se:

1. Implementar autenticação com hash de senha
2. Usar Firebase Authentication (gratuito até certo limite)
3. Ou implementar um servidor backend simples

---

## 🔄 PASSO 9: Sincronização Automática

### 9.1 Como Funciona

O app sincroniza automaticamente:

- **Dados de Referência** (Produtos, Canais, Unidades): Quando o app inicia ou faz pull-to-refresh
- **Cadastros**: Quando o ATC clica em "Salvar Cadastro"
- **Usuários**: Quando o app inicia (para verificar novas contas)

### 9.2 Sincronização Manual

Se quiser forçar sincronização:

1. No app, vá para a tela "Meus Cadastros"
2. Puxe a tela para baixo (pull-to-refresh)
3. Aguarde o carregamento

---

## 📊 PASSO 10: Dashboard Administrativo

### 10.1 Criar Gráficos na Planilha

1. Abra a planilha
2. Vá para a aba **"CADASTROS"**
3. Selecione os dados (A1:O100)
4. Clique em **"Inserir"** → **"Gráfico"**
5. Escolha o tipo de gráfico desejado

### 10.2 Criar Filtros

1. Selecione a linha de headers (linha 1)
2. Clique em **"Dados"** → **"Criar um filtro"**
3. Agora você pode filtrar por qualquer coluna

### 10.3 Criar Tabelas Dinâmicas

1. Selecione os dados
2. Clique em **"Inserir"** → **"Tabela dinâmica"**
3. Configure para analisar dados por categoria, estado, etc.

---

## 🛡️ SEGURANÇA

### ⚠️ IMPORTANTE

1. **Nunca compartilhe sua API Key publicamente**
   - Mantenha o arquivo `.env` seguro
   - Não faça commit do `.env` no Git
   - Se vazar, regenere a chave no Google Cloud

2. **Compartilhe apenas o link da planilha**
   - Use "Qualquer pessoa com o link" para leitura
   - Use "Pessoas específicas" para edição

3. **Backup Regular**
   - Faça download da planilha regularmente
   - Clique em **"Arquivo"** → **"Fazer download"** → **"CSV"**

---

## 🚀 PASSO 11: Distribuir o App para Usuários

### 11.1 Opção A: Expo Go (Mais Rápido)

**Para testes rápidos:**

1. Instale o app Expo Go no celular:
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. No terminal, execute:
   ```bash
   pnpm qr
   ```

3. Escaneie o QR code com o celular

### 11.2 Opção B: Build APK (Android)

**Para distribuição permanente:**

1. No terminal, execute:
   ```bash
   pnpm build:android
   ```

2. Aguarde o build ser criado (pode levar 10-15 minutos)

3. O arquivo `.apk` estará pronto para distribuir

4. Compartilhe o arquivo com os usuários

### 11.3 Opção C: Publicar na Play Store

**Para distribuição em larga escala:**

1. Crie uma conta de desenvolvedor Google Play ($25 uma vez)
2. Siga o guia oficial: https://developer.android.com/studio/publish

---

## 🧪 TESTES RECOMENDADOS

### Teste 1: Sincronização Básica
- [ ] Criar cadastro no app
- [ ] Verificar se aparece na planilha
- [ ] Verificar se todos os dados estão corretos

### Teste 2: Múltiplos Usuários
- [ ] Criar cadastro com ATC1
- [ ] Criar cadastro com ATC2
- [ ] Verificar se cada ATC vê apenas seus cadastros

### Teste 3: Filtros de Produto
- [ ] Selecionar categoria FERTILIZANTE
- [ ] Verificar se apenas produtos dessa categoria aparecem
- [ ] Mudar para outra categoria

### Teste 4: Validações
- [ ] Tentar salvar sem preencher campos obrigatórios
- [ ] Tentar salvar HIDROSSOLÚVEIS sem produto livre
- [ ] Tentar salvar com Implantado=Sim sem potencial

### Teste 5: Coordenador
- [ ] Fazer login como coordenador
- [ ] Verificar se vê todos os cadastros
- [ ] Acessar tela de Admin

---

## ❓ TROUBLESHOOTING

### Problema: "API key not valid"
**Solução:**
- Verifique se a chave foi copiada corretamente
- Verifique se a Google Sheets API está ativada
- Regenere a chave no Google Cloud Console

### Problema: "Spreadsheet not found"
**Solução:**
- Verifique se o ID da planilha está correto
- Verifique se a planilha está compartilhada publicamente

### Problema: "Cadastro não aparece na planilha"
**Solução:**
- Verifique se a sincronização está ativada no app
- Verifique se tem conexão com internet
- Tente fazer pull-to-refresh
- Verifique os logs do console

### Problema: "Novos usuários não aparecem"
**Solução:**
- Faça pull-to-refresh no app
- Reinicie o app
- Verifique se o usuário está na aba USUARIOS

---

## 📞 SUPORTE

Se tiver dúvidas:

1. Consulte a documentação oficial:
   - Google Sheets API: https://developers.google.com/sheets/api
   - Google Cloud: https://cloud.google.com/docs

2. Verifique os logs:
   - No app: Abra o console do navegador (F12)
   - Na planilha: Verifique a aba WEBHOOK_LOG

---

## ✅ CHECKLIST FINAL

- [ ] Planilha criada com todas as abas
- [ ] Dados iniciais preenchidos
- [ ] Google Cloud Console configurado
- [ ] API Key gerada
- [ ] Arquivo `.env` criado com credenciais
- [ ] Servidor reiniciado
- [ ] Primeiro cadastro testado
- [ ] Sincronização verificada
- [ ] Novos usuários adicionados
- [ ] Notificações por email configuradas (opcional)
- [ ] App distribuído para usuários

---

**Parabéns! Seu sistema de Gestão de Território está 100% funcional e sincronizado!** 🎉

