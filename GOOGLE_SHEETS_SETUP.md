# Configuração da Integração com Google Sheets

Guia completo e gratuito para configurar sincronização de dados em tempo real com Google Sheets.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Criar a Planilha](#passo-1-criar-a-planilha-google-sheets)
3. [Configurar Google Cloud Console](#passo-2-configurar-google-cloud-console)
4. [Configurar o Aplicativo](#passo-4-configurar-o-aplicativo)
5. [Testar a Integração](#passo-5-testar-a-integração)
6. [Troubleshooting](#troubleshooting)
7. [Recursos Adicionais](#recursos-adicionais)

---

## Visão Geral

O aplicativo ATC Gestão de Território integra-se com Google Sheets para:

✅ **Sincronização de Dados:**
- Usuários (USUARIOS) - para autenticação
- Produtos (PRODUTOS) - catálogo de produtos
- Canais (CANAIS) - canais de venda
- Unidades (UNIDADES) - unidades comerciais
- Cadastros (CADASTROS) - registros de ATCs em tempo real

✅ **Funcionalidades:**
- Login de usuários contra a planilha
- Envio automático de cadastros após criação
- Sincronização de dados de referência ao iniciar o app
- Dashboard administrativo com métricas em tempo real
- Uso 100% GRATUITO com ferramentas do Google

---

## Passo 1: Criar a Planilha Google Sheets

### 1.1 Criar Nova Planilha

1. Acesse [Google Sheets](https://sheets.google.com)
2. Clique em **+ Novo** → **Planilha em branco**
3. Renomeie para: **ATC_Gestao_Territorio_DB**

### 1.2 Criar as Abas

Renomeie a aba padrão para **USUARIOS** e crie mais 4 abas:
- **USUARIOS** (existente)
- **PRODUTOS**
- **CANAIS**
- **UNIDADES**
- **CADASTROS**

### 1.3 Aba: USUARIOS

Esta aba controla os usuários do sistema e é usada para autenticação.

**Header (primeira linha):**
```
EMAIL | NOME | ROLE | ATIVO
```

**Exemplo de dados:**
```
coord@atc.com | Coordenador Principal | COORD | TRUE
atc1@atc.com | João Silva | ATC | TRUE
atc2@atc.com | Maria Santos | ATC | TRUE
atc3@atc.com | Pedro Oliveira | ATC | TRUE
```

**Notas:**
- EMAIL: e-mail do usuário (usado para login)
- NOME: nome completo do usuário
- ROLE: ATC ou COORD (coordenador)
- ATIVO: TRUE ou FALSE (controla acesso)

### 1.4 Aba: PRODUTOS

Esta aba contém o catálogo de produtos.

**Header:**
```
PRODUTO_ID | CATEGORIA | PRODUTO | UNIDADE_POTENCIAL | ATIVO
```

**Exemplo de dados:**
```
MICROESSENTIALS | FERTILIZANTE - BASE | MICROESSENTIALS | tons | TRUE
PERFORMA_BIO | FERTILIZANTE - BASE | PERFORMA BIO | tons | TRUE
ASPIRE | FERTILIZANTES - COBERTURA | ASPIRE | tons | TRUE
MBIO_PHOS | BIOLÓGICOS - INOCULANTES | MBIO PHOS | litros | TRUE
MBIO_HIDRO | BIOLÓGICOS - INOCULANTES | MBIO HIDRO | litros | TRUE
MBIO_STIMULLUS | BIOLÓGICOS - FOLIARES | MBIO STIMULLUS | litros | TRUE
HIDRO_LIVRE | HIDROSSOLÚVEIS | (LIVRE) | litros | TRUE
```

**Categorias permitidas:**
- FERTILIZANTE - BASE
- FERTILIZANTES - COBERTURA
- BIOLÓGICOS - INOCULANTES
- BIOLÓGICOS - FOLIARES
- HIDROSSOLÚVEIS

**Notas:**
- PRODUTO_ID: identificador único (use sem espaços)
- UNIDADE_POTENCIAL: "tons" ou "litros"
- ATIVO: ativa/desativa o produto

### 1.5 Aba: CANAIS

Canais de distribuição de produtos.

**Header:**
```
CANAL_ID | CANAL | ATIVO
```

**Exemplo de dados:**
```
VAREJO | Varejo | TRUE
COOPERATIVA | Cooperativa | TRUE
DISTRIBUIDOR | Distribuidor | TRUE
REVENDA | Revenda | TRUE
PRODUTOR_DIRETO | Produtor Direto | TRUE
```

### 1.6 Aba: UNIDADES

Unidades comerciais/operacionais.

**Header:**
```
UNIDADE_ID | UNIDADE | ESTADO_UF | ATIVO
```

**Exemplo de dados:**
```
UNID_RS_01 | Cooperativa Agrícola RS | RS | TRUE
UNID_SP_01 | Cooperativa Vale do Paraíba | SP | TRUE
UNID_MT_01 | Cooperativa Mato Grosso | MT | TRUE
UNID_GO_01 | Revenda Goiás Agro | GO | TRUE
UNID_BA_01 | Cooperativa Bahia | BA | TRUE
```

**Estados (UF) válidos:**
AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO

### 1.7 Aba: CADASTROS

Esta aba recebe automaticamente os cadastros criados pelos ATCs no app.

**Header (não editar manualmente):**
```
CADASTRO_ID | CRIADO_EM | ATC_EMAIL | ATC_NOME | CANAL | UNIDADE | ESTADO | CATEGORIA | PRODUTO_REF | PRODUTO_NOME_LIVRE | UNIDADE_POTENCIAL | IMPLANTADO | POTENCIAL_VALOR | CONCORRENTES | OBSERVACAO
```

**Esta aba é preenchida automaticamente pelo app**. Deixe a primeira linha com headers e deixe as outras linhas vazias.

---

## Passo 2: Configurar Google Cloud Console

### 2.1 Criar Projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. No dropdown no topo, clique em **Selecionar um projeto**
3. Clique em **NOVO PROJETO**
4. Nome: **ATC-Gestao-Territorio**
5. Clique em **CRIAR**
6. Aguarde a criação (leva alguns segundos)
7. Quando pronto, clique no projeto para entrar

### 2.2 Ativar Google Sheets API

1. No menu lateral, clique em **APIs e serviços**
2. Clique em **Biblioteca**
3. Busque por "sheets"
4. Clique em **Google Sheets API**
5. Clique em **ATIVAR**

Pronto! A API está ativada.

### 2.3 Gerar API Key

1. Vá em **APIs e serviços** → **Credenciais**
2. Clique em **+ CRIAR CREDENCIAIS** → **Chave de API**
3. Uma chave será gerada (ex: `AIzaSy...`)
4. Copie essa chave
5. (Opcional) Clique em **Restringir chave**:
   - Restrições de aplicativo: **HTTP referrers (web)**
   - Adicionar: `localhost:*`
   - Restrições de API: **Google Sheets API**
   - Clique em **SALVAR**

**Essa é sua API_KEY** (usada apenas para leitura)

---

## Passo 3: Compartilhar a Planilha

1. Abra a planilha criada
2. Clique em **Compartilhar** (canto superior direito)
3. Em "Geral", mude para **Qualquer pessoa com o link**
4. Acesso: **Visualizador** (ou deixe o padrão)
5. Clique em **Compartilhar** ou **Copiar link**

Isso torna a planilha públicos para leitura (suficiente para API Key).

---

## Passo 4: Configurar o Aplicativo

### 4.1 Obter ID da Planilha

Na URL da planilha:
```
https://docs.google.com/spreadsheets/d/[AQUI_ESTA_O_ID]/edit
```

Copie o ID (string longa entre `/d/` e `/edit`)

### 4.2 Adicionar Variáveis de Ambiente

Na raiz do projeto, crie ou edite `.env.local`:

```env
# Google Sheets ID
EXPO_PUBLIC_GOOGLE_SHEETS_ID=seu_spreadsheet_id_aqui

# Google Sheets API Key (leitura)
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=sua_api_key_aqui
```

**Exemplo completo:**
```env
EXPO_PUBLIC_GOOGLE_SHEETS_ID=1A2B3C4D5E6F7G8H9I0J
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=AIzaSyDxJ_8q-9pL_xJ8K9L0M1N2O3P4Q5R6S7T
```

### 4.3 Reiniciar o Servidor

```bash
# Parar o servidor (Ctrl+C)
# Depois:
pnpm dev
```

Se as variáveis estiverem corretas, verá no console:
```
Sincronizando dados com Google Sheets...
Usuários sincronizados: 4
Produtos sincronizados: 13
Canais sincronizados: 5
Unidades sincronizadas: 8
```

---

## Passo 5: Testar a Integração

### 5.1 Testar Autenticação

1. Abra o app
2. Faça login com: **coord@atc.com** / **123456**
3. Deve entrar como Coordenador
4. Tente outro usuário: **atc1@atc.com** / **123456**

### 5.2 Testar Sincronização de Entrada

1. Adicione um novo produto na aba **PRODUTOS**:
   ```
   TESTE_PROD | FERTILIZANTE - BASE | Produto Teste | tons | TRUE
   ```
2. No app, puxe para atualizar (pull-to-refresh) na tela inicial
3. Vá para **Novo Cadastro**
4. Selecione categoria **FERTILIZANTE - BASE**
5. Deve aparecer **Produto Teste** na lista de produtos

### 5.3 Testar Envio de Cadastro

1. Crie um novo cadastro completo no app:
   - Canal: Varejo
   - Unidade: (qualquer uma)
   - Estado: SP
   - Categoria: FERTILIZANTE - BASE
   - Produto: MICROESSENTIALS
   - Implantado: Não
   - Salve

2. Volte para o Google Sheets
3. Vá para a aba **CADASTROS**
4. Deve ver uma nova linha com seus dados

### 5.4 Testar Dashboard

1. Faça login como **coord@atc.com**
2. Na navegação inferior, clique em **Administração**
3. No topo, clique na aba **📊 Dashboard**
4. Deve ver:
   - Total de Cadastros
   - ATCs Ativos
   - Implantados
   - Gráficos por Categoria, ATC, Produto
   - Lista de Unidades

---

## Sincronização em Tempo Real

O app sincroniza dados automaticamente:

| Momento | O que sincroniza | Direção |
|---------|------------------|---------|
| Ao iniciar | USUARIOS, PRODUTOS, CANAIS, UNIDADES | Sheets → App |
| Ao fazer login | Valida usuário | Sheets → App |
| Ao salvar cadastro | Novo cadastro | App → Sheets |
| Pull-to-refresh | Todos os dados | Sheets → App |
| Dashboard | Métricas agregadas | Sheets → App |

---

## Troubleshooting

### Problema: "Google Sheets não configurado"

**Solução:**
- Verifique se as variáveis de ambiente estão no `.env.local`
- Verifique se a chave de API está correta
- Verifique se o ID da planilha está correto
- Reinicie o servidor

### Problema: "The caller does not have permission"

**Solução:**
- Verifique se a planilha está **Pública** (compartilhar com qualquer pessoa)
- Verifique se a URL de compartilhamento está correta
- Aguarde alguns minutos para as permissões sincronizarem

### Problema: "INVALID_ARGUMENT: Requested range does not exist"

**Solução:**
- Verifique se o nome das abas está EXATAMENTE como:
  - USUARIOS, PRODUTOS, CANAIS, UNIDADES, CADASTROS
- Verifique se o header está exatamente na primeira linha
- Verifique maiúsculas/minúsculas

### Problema: Cadastros não aparecem na planilha

**Solução:**
- API Key é **APENAS LEITURA**
- Para enviar cadastros, você precisa compartilhar a planilha com qualquer pessoa
- Se quiser escrita automática avançada, considere usar Service Account (veja seção 2.4)

### Problema: Dados não atualizam no app

**Solução:**
- Verifique conexão com Internet
- Puxe para atualizar (pull-to-refresh)
- Reinicie o app
- Verifique se as abas e headers estão corretos

### Problema: Erro 403 (forbidden)

**Solução:**
- Planilha não está compartilhada publicamente
- API Key está restrita para outro serviço
- Espere alguns minutos para as permissões sincronizarem

---

## Melhorias Futuras (Opcional)

### Service Account para Escrita Automática

Se quiser enviar dados automaticamente **sem compartilhar a planilha como pública**:

1. Em [Google Cloud Console](https://console.cloud.google.com):
   - Vá em **APIs e serviços** → **Credenciais**
   - Clique em **+ CRIAR CREDENCIAIS** → **Conta de Serviço**
   - Preencha o formulário
   - Após criar, clique na conta
   - Vá em **Chaves** → **Adicionar chave** → **Criar nova chave** → **JSON**
   - Salve o arquivo JSON

2. Copie o `client_email` e `private_key` do JSON
3. Compartilhe a planilha com esse email (permissão de Editor)
4. Configure no `.env.local`:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
   ```

---

## Segurança

⚠️ **IMPORTANTE:**

1. **Nunca commite o `.env.local` no Git**
   - Adicione à `.gitignore`:
     ```
     .env.local
     .env*.local
     ```

2. **Mantenha a API Key segura**
   - Respeite o limite de 100 requisições por 100 segundos
   - Se for produção, restrinja por referer

3. **Senha do Google**
   - A senha "123456" no app é apenas para demo
   - Em produção, implemente hash de senha na aba USUARIOS

4. **Dados sensíveis**
   - Não adicione senhas ou tokens na planilha
   - Considere usar OAuth para autenticação real

---

## Recursos Adicionais

- [Google Sheets API - Documentação Oficial](https://developers.google.com/sheets/api)
- [Limites e Cotas do Google Sheets](https://developers.google.com/sheets/api/limits)
- [Guia de Serviços do Google Cloud](https://cloud.google.com/docs)

---

## Suporte

Para dúvidas ou problemas:

1. Verifique os logs do console do app
2. Verifique se as variáveis de ambiente estão corretas
3. Teste a planilha manualmente no Google Sheets
4. Reinicie o servidor de desenvolvimento

**Data da última atualização:** 8 de janeiro de 2026

