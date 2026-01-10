# 🎯 GUIA PASSO-A-PASSO VISUAL

Guia visual e simplificado para configurar tudo em menos de 10 minutos.

---

## Passo 1: Criar Planilha Google Sheets (2 minutos)

### 1.1 Abra Google Sheets
```
👉 https://sheets.google.com
```

### 1.2 Clique em "+ Novo"
```
[+ Novo]  →  [Planilha em branco]
```

### 1.3 Renomeie para "ATC_Gestao_Territorio_DB"
```
Sem título  →  ATC_Gestao_Territorio_DB
```

### 1.4 Criar as Abas
```
Clique com botão direito na aba "Planilha1"
Renomear para: USUARIOS

Depois crie novas abas:
+ [Novo]  →  PRODUTOS
+ [Novo]  →  CANAIS
+ [Novo]  →  UNIDADES
+ [Novo]  →  CADASTROS
```

### 1.5 Preencha ABA: USUARIOS
```
Aba: USUARIOS

Linha 1 (Headers):
[EMAIL]         [NOME]                    [ROLE]  [ATIVO]

Linha 2:
coord@atc.com   Coordenador Principal     COORD   TRUE

Linha 3:
atc1@atc.com    João Silva                ATC     TRUE

Linha 4:
atc2@atc.com    Maria Santos              ATC     TRUE
```

### 1.6 Preencha ABA: PRODUTOS
```
Aba: PRODUTOS

Linha 1 (Headers):
[PRODUTO_ID]        [CATEGORIA]           [PRODUTO]          [UNIDADE_POTENCIAL]  [ATIVO]

Linha 2:
MICROESSENTIALS     FERTILIZANTE - BASE   MICROESSENTIALS    tons                 TRUE

Linha 3:
ASPIRE              FERTILIZANTES - COBERTURA  ASPIRE        tons                 TRUE

Linha 4:
MBIO_PHOS           BIOLÓGICOS - INOCULANTES   MBIO PHOS     litros               TRUE

Linha 5:
HIDRO_LIVRE         HIDROSSOLÚVEIS            (LIVRE)        litros               TRUE
```

### 1.7 Preencha ABA: CANAIS
```
Aba: CANAIS

Linha 1 (Headers):
[CANAL_ID]      [CANAL]         [ATIVO]

Linha 2:
VAREJO          Varejo          TRUE

Linha 3:
COOPERATIVA     Cooperativa     TRUE

Linha 4:
DISTRIBUIDOR    Distribuidor    TRUE
```

### 1.8 Preencha ABA: UNIDADES
```
Aba: UNIDADES

Linha 1 (Headers):
[UNIDADE_ID]    [UNIDADE]                           [ESTADO_UF]  [ATIVO]

Linha 2:
UNID_RS_01      Cooperativa Agrícola RS             RS           TRUE

Linha 3:
UNID_SP_01      Cooperativa Vale do Paraíba         SP           TRUE

Linha 4:
UNID_MT_01      Cooperativa Mato Grosso             MT           TRUE
```

### 1.9 Prepare ABA: CADASTROS (Deixe vazia!)
```
Aba: CADASTROS

Linha 1 (Headers apenas):
[CADASTRO_ID] [CRIADO_EM] [ATC_EMAIL] [ATC_NOME] [CANAL] [UNIDADE] [ESTADO] [CATEGORIA] [PRODUTO_REF] [PRODUTO_NOME_LIVRE] [UNIDADE_POTENCIAL] [IMPLANTADO] [POTENCIAL_VALOR] [CONCORRENTES] [OBSERVACAO]

Deixe as outras linhas VAZIAS (o app vai preencher)
```

✅ **Sua planilha está pronta!**

---

## Passo 2: Configurar Google Cloud (3 minutos)

### 2.1 Acesse Google Cloud Console
```
👉 https://console.cloud.google.com
```

### 2.2 Criar Projeto
```
Clique no ▼ (dropdown) no topo
[Selecionar um projeto]
[NOVO PROJETO]

Nome: ATC-Gestao-Territorio
Clique em [CRIAR]

(Aguarde alguns segundos)
```

### 2.3 Ativar Google Sheets API
```
Menu esquerdo → [APIs e serviços]
[Biblioteca]

Busque: "sheets"
Clique: [Google Sheets API]
Clique: [ATIVAR]

(Aguarde alguns segundos)
```

### 2.4 Gerar API Key
```
Menu esquerdo → [APIs e serviços]
[Credenciais]

[+ CRIAR CREDENCIAIS]
[Chave de API]

UMA CHAVE FOI CRIADA!
Exemplo: AIzaSy_xJ8K9L0M1N2O3P4Q5R6S7T...

👉 COPIE ESSA CHAVE
```

✅ **Você tem a API Key!**

---

## Passo 3: Compartilhar Planilha (1 minuto)

### 3.1 Abra a Planilha
```
👉 Volte para Google Sheets
Abra: ATC_Gestao_Territorio_DB
```

### 3.2 Clique em Compartilhar
```
Canto superior direito → [Compartilhar]
```

### 3.3 Mude para Público
```
"Geral" → [Clique]
[Qualquer pessoa com o link]
[Visualizador]
[Compartilhar] ou [Copiar link]
```

✅ **Planilha está pública!**

---

## Passo 4: Configurar o Aplicativo (2 minutos)

### 4.1 Abra Terminal no Projeto
```
cd seu/caminho/atc-gestao-territorio
```

### 4.2 Copie a URL da Planilha
```
Na barra de endereço do navegador:
https://docs.google.com/spreadsheets/d/[COPIE ISSO]/edit

Exemplo:
https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J/edit

👉 COPIE: 1A2B3C4D5E6F7G8H9I0J
```

### 4.3 Crie Arquivo .env.local
```bash
# No terminal, dentro da pasta do projeto:

cat > .env.local << EOF
EXPO_PUBLIC_GOOGLE_SHEETS_ID=seu_id_aqui
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=sua_chave_api_aqui
EOF
```

**Ou manualmente:**
```
1. Crie arquivo: .env.local
2. Adicione:

EXPO_PUBLIC_GOOGLE_SHEETS_ID=1A2B3C4D5E6F7G8H9I0J
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=AIzaSy_xJ8K9L0M1N2O3P4Q5R6S7T
```

### 4.4 Reinicie o Servidor
```bash
# Se estiver rodando, pare:
Ctrl + C

# Depois:
pnpm dev
```

**Você verá no console:**
```
✓ Sincronizando dados com Google Sheets...
  Usuários sincronizados: 3
  Produtos sincronizados: 4
  Canais sincronizados: 3
  Unidades sincronizadas: 3
```

✅ **Tudo configurado!**

---

## Passo 5: Testar (2 minutos)

### 5.1 Abra o App
```
Acesse no navegador:
👉 http://localhost:8081
```

### 5.2 Faça Login
```
Email:     coord@atc.com
Senha:     123456
[Entrar]
```

Deve entrar e ver "Administração"

### 5.3 Teste com ATC
```
[Logout] (se necessário)

Email:     atc1@atc.com
Senha:     123456
[Entrar]

Deve ver a tela inicial
```

### 5.4 Teste Dashboard
```
Faça login como: coord@atc.com
Clique em: [Administração]
Clique em: [📊 Dashboard]

Deve ver:
- Total de Cadastros
- ATCs Ativos
- Gráficos
- Listas
```

### 5.5 Teste Sincronização
```
Faça login como: atc1@atc.com
Clique em: [+ Novo Cadastro]

Preencha:
- Canal: Varejo
- Unidade: (qualquer uma)
- Estado: SP
- Categoria: FERTILIZANTE - BASE
- Produto: MICROESSENTIALS
- Implantado: Não

[Salvar]

Deve ver: "Cadastro salvo e sincronizado"
```

### 5.6 Verifique no Google Sheets
```
Volte para Google Sheets
Aba: CADASTROS

Deve ter uma nova linha com seus dados!
```

✅ **Tudo funciona!**

---

## 🎉 Sucesso!

Você tem agora:

✅ Planilha Google Sheets configurada  
✅ Google Cloud API ativada  
✅ API Key gerada  
✅ App sincronizando em tempo real  
✅ Dashboard funcionando  
✅ Login centralizado  

---

## 🔧 Troubleshooting Rápido

### Problema: "Google Sheets não configurado"
```
Solução:
1. Verifique se .env.local existe
2. Verifique se tem EXPO_PUBLIC_GOOGLE_SHEETS_ID
3. Verifique se tem EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY
4. Reinicie: Ctrl+C e pnpm dev
```

### Problema: "Permission denied"
```
Solução:
1. Abra a planilha
2. Clique em Compartilhar
3. Mude para "Qualquer pessoa com o link"
4. Aguarde alguns minutos
5. Reinicie o app
```

### Problema: "Range not found"
```
Solução:
1. Verifique nomes das abas:
   - USUARIOS (exatamente assim)
   - PRODUTOS (exatamente assim)
   - CANAIS (exatamente assim)
   - UNIDADES (exatamente assim)
   - CADASTROS (exatamente assim)
2. Verifique se headers estão na linha 1
3. Reinicie o app
```

### Problema: Dados não aparecem no Dashboard
```
Solução:
1. No app, puxe para baixo (pull-to-refresh)
2. Aguarde sincronização
3. Verifique dados na planilha
4. Reinicie app se necessário
```

---

## 📝 Resumo dos Comandos

```bash
# Criar arquivo de env
echo "EXPO_PUBLIC_GOOGLE_SHEETS_ID=seu_id" > .env.local
echo "EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=sua_chave" >> .env.local

# Iniciar app
pnpm dev

# Testar com TypeScript
pnpm check

# Rodar testes
pnpm test
```

---

## 📚 Documentos Complementares

Se precisar de mais detalhes:
- [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md) - Guia completo
- [IMPLEMENTACAO_SHEETS.md](IMPLEMENTACAO_SHEETS.md) - Detalhes técnicos
- [CHANGELOG_SHEETS.md](CHANGELOG_SHEETS.md) - O que foi alterado

---

## ✨ Próximos Passos

Depois de configurar, você pode:

1. **Adicionar mais produtos** na aba PRODUTOS
2. **Adicionar mais canais** na aba CANAIS
3. **Adicionar mais unidades** na aba UNIDADES
4. **Adicionar mais usuários** na aba USUARIOS
5. **Visualizar dashboard** enquanto ATCs criam cadastros

---

**Tempo total:** ~10 minutos  
**Dificuldade:** Fácil ⭐  
**Resultado:** App com Google Sheets sincronizado! 🎉
