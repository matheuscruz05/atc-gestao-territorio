# Guia de Testes Manuais - ATC Gestão de Território

Este documento contém todos os testes que devem ser executados para validar as funcionalidades do aplicativo conforme especificado no blueprint.md.

## ✅ Status dos Testes

Execute cada teste e marque com ✅ quando passar ou ❌ se falhar.

---

## 1. AUTENTICAÇÃO E CONTROLE DE ACESSO

### Teste 1.1: Login como ATC
**Objetivo**: Verificar se ATC consegue fazer login

**Passos**:
1. Abrir o aplicativo
2. Na tela de login, inserir:
   - Email: `atc1@atc.com`
   - Senha: `123456`
3. Clicar em "Entrar"

**Resultado Esperado**:
- ✅ Login bem-sucedido
- ✅ Redirecionamento para tela "Meus Cadastros"
- ✅ Nome do usuário aparece no header: "Olá, João Silva"

**Status**: [ ]

---

### Teste 1.2: Login como Coordenador
**Objetivo**: Verificar se Coordenador consegue fazer login

**Passos**:
1. Abrir o aplicativo
2. Na tela de login, inserir:
   - Email: `coord@atc.com`
   - Senha: `123456`
3. Clicar em "Entrar"

**Resultado Esperado**:
- ✅ Login bem-sucedido
- ✅ Redirecionamento para tela "Dashboard"
- ✅ Nome do usuário aparece no header: "Olá, Coordenador Principal"
- ✅ Tabs visíveis: Dashboard, Cadastros, Admin, Perfil

**Status**: [ ]

---

### Teste 1.3: Login com credenciais inválidas
**Objetivo**: Verificar validação de credenciais

**Passos**:
1. Abrir o aplicativo
2. Na tela de login, inserir:
   - Email: `invalido@teste.com`
   - Senha: `senha_errada`
3. Clicar em "Entrar"

**Resultado Esperado**:
- ✅ Mensagem de erro: "Email ou senha inválidos"
- ✅ Usuário permanece na tela de login

**Status**: [ ]

---

### Teste 1.4: Logout
**Objetivo**: Verificar se logout funciona corretamente

**Passos**:
1. Fazer login como qualquer usuário
2. Navegar para aba "Perfil"
3. Clicar no botão "Sair"
4. Confirmar na mensagem de alerta

**Resultado Esperado**:
- ✅ Redirecionamento para tela de login
- ✅ Sessão encerrada (não consegue voltar sem fazer login novamente)

**Status**: [ ]

---

## 2. FUNCIONALIDADES ATC

### Teste 2.1: ATC vê apenas próprios cadastros
**Objetivo**: Verificar isolamento de dados por ATC

**Passos**:
1. Login como `atc1@atc.com`
2. Criar um cadastro qualquer
3. Fazer logout
4. Login como `atc2@atc.com`
5. Verificar lista de cadastros

**Resultado Esperado**:
- ✅ ATC2 NÃO vê o cadastro criado por ATC1
- ✅ Cada ATC vê apenas seus próprios cadastros

**Status**: [ ]

---

### Teste 2.2: Cadastro de Produto - Campos Obrigatórios
**Objetivo**: Validar todos os campos obrigatórios

**Passos**:
1. Login como ATC
2. Clicar no botão "+" (flutuante)
3. Tentar salvar sem preencher nada
4. Preencher apenas Canal e tentar salvar
5. Continuar preenchendo um campo de cada vez

**Resultado Esperado**:
- ✅ Mensagens de erro aparecem para cada campo obrigatório faltante
- ✅ Campos obrigatórios: Canal, Unidade, Estado, Categoria, Produto

**Status**: [ ]

---

### Teste 2.3: Produto Filtrado por Categoria
**Objetivo**: Verificar se produtos são filtrados pela categoria selecionada

**Passos**:
1. Login como ATC
2. Clicar no botão "+"
3. Selecionar Categoria: "FERTILIZANTE - BASE"
4. Abrir dropdown de Produto
5. Verificar produtos listados
6. Mudar Categoria para "BIOLÓGICOS - INOCULANTES"
7. Verificar produtos novamente

**Resultado Esperado**:
- ✅ Apenas produtos da categoria selecionada aparecem
- ✅ Ao mudar categoria, lista de produtos é atualizada
- ✅ Produtos de outras categorias NÃO aparecem

**Status**: [ ]

---

### Teste 2.4: HIDROSSOLÚVEIS - Produto Livre Obrigatório
**Objetivo**: Validar campo Produto Livre para categoria HIDROSSOLÚVEIS

**Passos**:
1. Login como ATC
2. Clicar no botão "+"
3. Preencher campos básicos (Canal, Unidade, Estado)
4. Selecionar Categoria: "HIDROSSOLÚVEIS"
5. Selecionar Produto: "(LIVRE)"
6. NÃO preencher campo "Produto Livre"
7. Tentar salvar

**Resultado Esperado**:
- ✅ Campo "Produto Livre" aparece quando categoria = HIDROSSOLÚVEIS
- ✅ Mensagem de erro: "Produto Livre é obrigatório para HIDROSSOLÚVEIS"
- ✅ Após preencher "Produto Livre", cadastro é salvo com sucesso

**Status**: [ ]

---

### Teste 2.5: Potencial Obrigatório quando Implantado = Sim
**Objetivo**: Validar campo Potencial condicional

**Passos**:
1. Login como ATC
2. Clicar no botão "+"
3. Preencher campos básicos
4. Selecionar Categoria e Produto
5. Selecionar Implantado: "Sim"
6. Deixar Potencial vazio
7. Tentar salvar

**Resultado Esperado**:
- ✅ Mensagem de erro: "Potencial é obrigatório quando Implantado = Sim"
- ✅ Após preencher Potencial, cadastro é salvo com sucesso

**Status**: [ ]

---

### Teste 2.6: Unidade Potencial Auto-preenchida
**Objetivo**: Verificar auto-preenchimento da unidade

**Passos**:
1. Login como ATC
2. Clicar no botão "+"
3. Selecionar Categoria: "FERTILIZANTE - BASE"
4. Selecionar Produto: "MICROESSENTIALS"
5. Verificar campo Potencial

**Resultado Esperado**:
- ✅ Unidade "tons" aparece automaticamente ao lado do campo Potencial
- ✅ Ao mudar para produto com unidade "litros", unidade é atualizada

**Status**: [ ]

---

### Teste 2.7: Cadastro Completo
**Objetivo**: Criar um cadastro completo de ponta a ponta

**Passos**:
1. Login como `atc1@atc.com`
2. Clicar no botão "+"
3. Preencher todos os campos:
   - Canal: Varejo
   - Unidade: Cooperativa Agrícola RS
   - Estado: RS
   - Categoria: FERTILIZANTE - BASE
   - Produto: MICROESSENTIALS
   - Implantado: Sim
   - Potencial: 1000
   - Concorrentes: "Concorrente A, Concorrente B"
   - Observação: "Teste de cadastro completo"
4. Clicar em "Salvar Cadastro"

**Resultado Esperado**:
- ✅ Mensagem de sucesso aparece
- ✅ Redirecionamento para tela "Meus Cadastros"
- ✅ Novo cadastro aparece na lista
- ✅ Todos os dados estão corretos no card

**Status**: [ ]

---

### Teste 2.8: Busca de Cadastros
**Objetivo**: Verificar funcionalidade de busca

**Passos**:
1. Login como ATC (com pelo menos 2 cadastros)
2. Na tela "Meus Cadastros", digitar no campo de busca:
   - Nome de um produto existente
   - Nome de um canal
   - Estado (UF)

**Resultado Esperado**:
- ✅ Lista é filtrada conforme busca
- ✅ Apenas cadastros que correspondem à busca aparecem
- ✅ Ao limpar busca, todos os cadastros voltam

**Status**: [ ]

---

### Teste 2.9: Pull-to-Refresh
**Objetivo**: Verificar atualização da lista

**Passos**:
1. Login como ATC
2. Na tela "Meus Cadastros", puxar lista para baixo

**Resultado Esperado**:
- ✅ Indicador de carregamento aparece
- ✅ Lista é recarregada
- ✅ Novos cadastros (se houver) aparecem

**Status**: [ ]

---

## 3. FUNCIONALIDADES COORDENADOR

### Teste 3.1: Coordenador vê todos os cadastros
**Objetivo**: Verificar acesso total do coordenador

**Passos**:
1. Criar cadastros com diferentes ATCs:
   - Login como `atc1@atc.com`, criar 1 cadastro, logout
   - Login como `atc2@atc.com`, criar 1 cadastro, logout
2. Login como `coord@atc.com`
3. Navegar para aba "Cadastros"

**Resultado Esperado**:
- ✅ Coordenador vê TODOS os cadastros (de todos os ATCs)
- ✅ Nome do ATC aparece em cada card
- ✅ Contador mostra total correto

**Status**: [ ]

---

### Teste 3.2: Filtros Avançados - Coordenador
**Objetivo**: Testar filtros na tela de Cadastros

**Passos**:
1. Login como coordenador
2. Navegar para aba "Cadastros"
3. Testar cada filtro:
   - Filtro por Categoria
   - Filtro por Estado
   - Filtro por Status (Implantado/Não)
4. Combinar múltiplos filtros

**Resultado Esperado**:
- ✅ Cada filtro funciona corretamente
- ✅ Filtros podem ser combinados
- ✅ Contador atualiza: "X de Y cadastro(s)"

**Status**: [ ]

---

### Teste 3.3: Dashboard - Visualização
**Objetivo**: Verificar tela de Dashboard

**Passos**:
1. Login como coordenador
2. Verificar aba "Dashboard" (home)

**Resultado Esperado**:
- ✅ Dashboard carrega sem erros
- ✅ Dados agregados são exibidos (se implementado)

**Status**: [ ]

---

### Teste 3.4: Admin - Visualizar Usuários
**Objetivo**: Verificar gestão de usuários

**Passos**:
1. Login como coordenador
2. Navegar para aba "Admin"
3. Verificar tab "Usuários"

**Resultado Esperado**:
- ✅ Lista de usuários é exibida
- ✅ Cada usuário mostra: Nome, Email, Role, Status (Ativo/Inativo)
- ✅ Pelo menos 4 usuários aparecem (1 COORD + 3 ATCs)

**Status**: [ ]

---

### Teste 3.5: Admin - Visualizar Produtos
**Objetivo**: Verificar catálogo de produtos

**Passos**:
1. Login como coordenador
2. Navegar para aba "Admin"
3. Clicar em tab "Produtos"

**Resultado Esperado**:
- ✅ Lista de produtos é exibida
- ✅ Cada produto mostra: Nome, Categoria, Unidade, Status
- ✅ Pelo menos 13 produtos aparecem (conforme blueprint)

**Status**: [ ]

---

### Teste 3.6: Admin - Visualizar Canais
**Objetivo**: Verificar lista de canais

**Passos**:
1. Login como coordenador
2. Navegar para aba "Admin"
3. Clicar em tab "Canais"

**Resultado Esperado**:
- ✅ Lista de canais é exibida
- ✅ Pelo menos 5 canais aparecem

**Status**: [ ]

---

### Teste 3.7: Admin - Visualizar Unidades
**Objetivo**: Verificar lista de unidades

**Passos**:
1. Login como coordenador
2. Navegar para aba "Admin"
3. Clicar em tab "Unidades"

**Resultado Esperado**:
- ✅ Lista de unidades é exibida
- ✅ Cada unidade mostra: Nome, Estado (se houver), Status
- ✅ Pelo menos 13 unidades aparecem

**Status**: [ ]

---

## 4. INTERFACE E USABILIDADE

### Teste 4.1: Navegação entre Tabs
**Objetivo**: Verificar navegação

**Passos**:
1. Login como coordenador
2. Navegar entre todas as tabs
3. Voltar para cada tab anterior

**Resultado Esperado**:
- ✅ Todas as tabs são acessíveis
- ✅ Navegação é fluida sem erros
- ✅ Tab ativa é destacada

**Status**: [ ]

---

### Teste 4.2: Responsividade
**Objetivo**: Verificar layout em diferentes tamanhos

**Passos**:
1. Testar app em diferentes dispositivos/tamanhos de tela

**Resultado Esperado**:
- ✅ Layout se adapta corretamente
- ✅ Textos são legíveis
- ✅ Botões são acessíveis

**Status**: [ ]

---

### Teste 4.3: Dark Mode
**Objetivo**: Verificar tema escuro (se implementado)

**Passos**:
1. Alterar tema do dispositivo para escuro
2. Abrir o app

**Resultado Esperado**:
- ✅ App respeita tema do sistema
- ✅ Cores são adequadas para dark mode
- ✅ Contraste é suficiente

**Status**: [ ]

---

## 5. INTEGRAÇÃO GOOGLE SHEETS (OPCIONAL)

### Teste 5.1: Configuração
**Objetivo**: Verificar se integração está configurada

**Passos**:
1. Verificar se variáveis de ambiente estão configuradas
2. Verificar se planilha Google Sheets existe

**Resultado Esperado**:
- ✅ Variáveis EXPO_PUBLIC_GOOGLE_SHEETS_ID e EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY estão configuradas
- ✅ Planilha existe e está acessível

**Status**: [ ]

---

### Teste 5.2: Sincronização de Cadastro
**Objetivo**: Verificar envio de cadastro para Google Sheets

**Passos**:
1. Configurar integração (seguir GOOGLE_SHEETS_SETUP.md)
2. Login como ATC
3. Criar um novo cadastro
4. Abrir planilha Google Sheets
5. Verificar aba "CADASTROS"

**Resultado Esperado**:
- ✅ Nova linha aparece na planilha
- ✅ Todos os dados estão corretos
- ✅ Timestamp está correto

**Status**: [ ]

---

### Teste 5.3: Sincronização de Dados de Referência
**Objetivo**: Verificar pull de dados do Sheets

**Passos**:
1. Adicionar novo produto na aba "PRODUTOS" da planilha
2. No app, fazer pull-to-refresh
3. Criar novo cadastro e verificar lista de produtos

**Resultado Esperado**:
- ✅ Novo produto aparece no dropdown
- ✅ Dados são sincronizados corretamente

**Status**: [ ]

---

## 6. CRITÉRIOS DE ACEITE (BLUEPRINT)

### ✅ Critério 1: ATC loga e vê apenas seus cadastros
**Status**: [ ]

### ✅ Critério 2: COORD vê todos os cadastros e administra tabelas
**Status**: [ ]

### ✅ Critério 3: Form "Novo Cadastro" com todas as validações
- ATC_EMAIL preenche automático
- PRODUTO filtra conforme CATEGORIA
- UNIDADE_POTENCIAL preenche automático
- HIDROSSOLÚVEIS exige PRODUTO_NOME_LIVRE

**Status**: [ ]

### ✅ Critério 4: Webhook dispara ao salvar cadastro (se configurado)
**Status**: [ ]

### ✅ Critério 5: Dashboard do COORD mostra totais
**Status**: [ ]

---

## RESUMO DOS TESTES

**Total de Testes**: 30+

**Testes Passados**: ___

**Testes Falhados**: ___

**Taxa de Sucesso**: ___%

---

## OBSERVAÇÕES E BUGS ENCONTRADOS

(Anote aqui qualquer problema encontrado durante os testes)

---

## CONCLUSÃO

[ ] Todos os testes críticos passaram
[ ] App está pronto para uso
[ ] Documentação está completa
[ ] Integração Google Sheets está configurada (opcional)
