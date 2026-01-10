# Design — ATC Gestão de Território

## Visão Geral
Aplicativo móvel para gestão de território de vendas, permitindo que ATCs (Agentes Técnicos Comerciais) cadastrem produtos em locais/canais e coordenadores administrem toda a operação. O design segue as diretrizes do Apple Human Interface Guidelines para uma experiência nativa iOS.

## Orientação e Uso
- **Orientação**: Portrait (9:16) exclusivamente
- **Uso**: Otimizado para uma mão, com elementos principais acessíveis na parte inferior
- **Estilo**: Clean, profissional, focado em produtividade

## Paleta de Cores
- **Primary (Azul)**: #0a7ea4 - Ações principais, botões de destaque
- **Success (Verde)**: #22C55E - Status "Implantado: Sim", confirmações
- **Warning (Amarelo)**: #F59E0B - Alertas, campos obrigatórios
- **Error (Vermelho)**: #EF4444 - Erros de validação
- **Background**: #ffffff (light) / #151718 (dark)
- **Surface**: #f5f5f5 (light) / #1e2022 (dark) - Cards, formulários
- **Foreground**: #11181C (light) / #e4e8ecff (dark) - Texto principal
- **Muted**: #687076 (light) / #9BA1A6 (dark) - Texto secundário

## Lista de Telas

### 1. Tela de Login
**Conteúdo:**
- Logo do app (ícone de território/mapa com produtos)
- Título "ATC Gestão de Território"
- Campo de email
- Campo de senha
- Botão "Entrar"
- Link "Esqueci minha senha" (opcional para MVP)

**Funcionalidade:**
- Validação de credenciais contra lista de usuários
- Identificação automática de role (ATC ou COORD)
- Redirecionamento baseado em role

### 2. Home - ATC (Meus Cadastros)
**Conteúdo:**
- Header com saudação "Olá, [Nome do ATC]"
- Botão flutuante "+" para novo cadastro (canto inferior direito)
- Lista de cards com cadastros do ATC:
  - Produto (destaque)
  - Canal e Unidade
  - Estado (UF)
  - Badge "Implantado" (verde) ou "Não Implantado" (cinza)
  - Potencial (valor + unidade)
- Filtros rápidos: Categoria, Estado, Implantado/Não
- Pull-to-refresh para sincronizar

**Funcionalidade:**
- Visualização apenas dos próprios cadastros
- Busca e filtros
- Tap no card abre detalhes (somente leitura para ATC)

### 3. Formulário de Novo Cadastro (ATC)
**Conteúdo:**
- Header "Novo Cadastro" com botão voltar
- Campos em sequência vertical:
  1. **Canal** (dropdown de CANAIS)
  2. **Unidade** (dropdown de UNIDADES)
  3. **Estado** (dropdown de UFs)
  4. **Categoria** (dropdown: 5 categorias)
  5. **Produto** (dropdown filtrado pela categoria selecionada)
  6. **Produto Livre** (campo texto, visível apenas se Categoria = HIDROSSOLÚVEIS)
  7. **Implantado** (toggle Sim/Não)
  8. **Potencial** (campo numérico + label da unidade auto-preenchida)
  9. **Concorrentes** (textarea)
  10. **Observação** (textarea)
- Botão "Salvar" (fixo no bottom)

**Funcionalidade:**
- ATC_EMAIL preenchido automaticamente (invisível)
- Validações:
  - Produto Livre obrigatório se HIDROSSOLÚVEIS
  - Potencial obrigatório se Implantado = Sim
  - Unidade auto-preenchida baseada no produto
- Feedback visual de campos obrigatórios
- Sincronização com Google Sheets após salvar

### 4. Home - COORDENADOR (Dashboard)
**Conteúdo:**
- Header "Painel do Coordenador"
- Cards de métricas:
  - Total de cadastros
  - Cadastros por categoria (gráfico de barras simples)
  - Top 5 produtos por potencial
  - Cadastros por ATC
- Tabs na parte inferior:
  - "Dashboard" (atual)
  - "Cadastros"
  - "Admin"

**Funcionalidade:**
- Visualização de todos os dados agregados
- Atualização em tempo real via sincronização

### 5. Todos os Cadastros (COORDENADOR)
**Conteúdo:**
- Lista completa de todos os cadastros (todos ATCs)
- Filtros avançados:
  - Por ATC
  - Por Categoria
  - Por Estado
  - Por Status (Implantado/Não)
- Busca por produto, canal, unidade
- Botão de exportação (opcional para MVP)

**Funcionalidade:**
- Visualização completa
- Tap no card abre detalhes completos
- Possibilidade de edição (futuro)

### 6. Admin - Gestão (COORDENADOR)
**Conteúdo:**
- Tabs secundárias:
  - **Usuários**: Lista de ATCs e COORDs
  - **Produtos**: Catálogo de produtos
  - **Canais**: Lista de canais
  - **Unidades**: Lista de unidades
- Cada tab com lista + botão "Adicionar"
- Formulários inline para adicionar/editar

**Funcionalidade:**
- CRUD completo de usuários, produtos, canais e unidades
- Ativação/desativação de registros
- Sincronização bidirecional com Google Sheets

### 7. Perfil/Configurações
**Conteúdo:**
- Nome e email do usuário
- Role (ATC ou COORDENADOR)
- Botão "Sair"
- Toggle Dark Mode
- Versão do app

**Funcionalidade:**
- Logout
- Alteração de tema

## Fluxos Principais

### Fluxo 1: ATC Cadastra Produto
1. ATC faz login → Home (Meus Cadastros)
2. Tap no botão "+" → Formulário de Novo Cadastro
3. Preenche campos em sequência
4. Sistema valida campos obrigatórios
5. Tap em "Salvar" → Sincroniza com Google Sheets
6. Retorna para Home com novo cadastro visível
7. (Backend) Webhook notifica coordenador

### Fluxo 2: Coordenador Visualiza Dashboard
1. COORD faz login → Dashboard
2. Visualiza métricas agregadas
3. Navega para "Cadastros" → Vê todos os registros
4. Filtra por ATC específico
5. Tap em cadastro → Vê detalhes completos

### Fluxo 3: Coordenador Adiciona Novo Produto
1. COORD → Tab "Admin"
2. Seleciona "Produtos"
3. Tap em "Adicionar"
4. Preenche: Categoria, Nome, Unidade
5. Salva → Sincroniza com Google Sheets
6. Produto disponível para ATCs imediatamente

## Componentes Reutilizáveis

### Card de Cadastro
- Usado em: Home ATC, Todos os Cadastros
- Estrutura: Produto (título), Canal/Unidade (subtítulo), Badge de status, Potencial

### Dropdown Filtrado
- Usado em: Formulário (Produto por Categoria)
- Comportamento: Opções filtradas dinamicamente

### Form Input com Validação
- Usado em: Todos os formulários
- Estados: normal, error, disabled
- Feedback visual imediato

### Dashboard Card
- Usado em: Dashboard do Coordenador
- Variações: Métrica simples, Gráfico de barras, Lista top N

## Considerações Técnicas

### Sincronização
- Sincronização bidirecional com Google Sheets via API
- Pull-to-refresh em todas as listas
- Indicador de sincronização no header

### Validações
- Client-side: Imediatas, feedback visual
- Server-side: Validação final antes de salvar no Sheets

### Offline
- MVP: Requer conexão (mostrar mensagem se offline)
- Futuro: Cache local com sincronização posterior

### Performance
- Listas com paginação/virtualização
- Cache de dropdowns (Produtos, Canais, Unidades)
- Lazy loading de imagens (se houver)

## Acessibilidade
- Contraste mínimo WCAG AA
- Tamanhos de fonte escaláveis
- Áreas de toque mínimas de 44x44pt
- Labels descritivos para leitores de tela
