# Project TODO

## Autenticação e Controle de Acesso
- [x] Tela de login com email e senha
- [x] Validação de credenciais
- [x] Identificação de role (ATC ou COORD)
- [x] Persistência de sessão
- [x] Logout

## Estrutura de Dados Local
- [x] Modelo de dados para USUARIOS
- [x] Modelo de dados para PRODUTOS
- [x] Modelo de dados para CANAIS
- [x] Modelo de dados para UNIDADES
- [x] Modelo de dados para CADASTROS
- [x] Armazenamento local com AsyncStorage

## Funcionalidades ATC
- [x] Home - Meus Cadastros (lista filtrada por ATC)
- [x] Formulário de Novo Cadastro
- [x] Validação: Produto filtrado por Categoria
- [x] Validação: Produto Livre obrigatório para HIDROSSOLÚVEIS
- [x] Validação: Potencial obrigatório se Implantado = Sim
- [x] Auto-preenchimento de Unidade Potencial
- [x] Auto-preenchimento de ATC_EMAIL
- [x] Busca e filtros (Categoria, Estado, Implantado)
- [x] Pull-to-refresh

## Funcionalidades Coordenador
- [x] Dashboard com métricas agregadas
- [x] Todos os Cadastros (visualização completa)
- [x] Filtros avançados (ATC, Categoria, Estado, Status)
- [x] Admin - Gestão de Usuários
- [x] Admin - Gestão de Produtos
- [x] Admin - Gestão de Canais
- [x] Admin - Gestão de Unidades
- [ ] Ativação/desativação de registros

## Integração Google Sheets
- [x] Configuração da API do Google Sheets
- [x] Autenticação OAuth2 ou Service Account
- [x] Sincronização de USUARIOS
- [x] Sincronização de PRODUTOS
- [x] Sincronização de CANAIS
- [x] Sincronização de UNIDADES
- [x] Sincronização de CADASTROS (bidirecional)
- [x] Webhook para notificação em tempo real
- [ ] Indicador de sincronização

## Testes
- [x] Teste: Login como ATC
- [x] Teste: Login como COORD
- [x] Teste: ATC vê apenas próprios cadastros
- [x] Teste: COORD vê todos os cadastros
- [x] Teste: Cadastro de produto com todas validações
- [x] Teste: Produto filtrado por categoria
- [x] Teste: HIDROSSOLÚVEIS exige produto livre
- [x] Teste: Potencial obrigatório se implantado
- [x] Teste: Sincronização com Google Sheets
- [x] Teste: Dashboard com dados corretos
- [x] Teste: Admin - CRUD de usuários
- [x] Teste: Admin - CRUD de produtos
- [x] Teste: Admin - CRUD de canais/unidades


## Bugs Encontrados (QA Check-up)
- [x] Bug: Inputs com placeholder invisível em dark mode - CORRIGIDO
- [x] Bug: Botão Sair na tela de perfil não funciona - VERIFICADO OK
- [x] Bug: Botão Salvar Cadastro não funciona - VERIFICADO OK
- [x] Implementar: Função de logout no botão Sair - IMPLEMENTADO
- [x] Implementar: Função de salvar cadastro com validações - IMPLEMENTADO
- [x] Melhorar: Contraste de inputs em dark mode - CORRIGIDO

## Documentação Adicional
- [x] Guia completo de sincronização Google Sheets (gratuito) - SINCRONIZACAO_COMPLETA.md
- [x] Guia de distribuição do app para usuários - DISTRIBUICAO_E_USUARIOS.md
- [x] Guia de gestão de usuários e senhas - DISTRIBUICAO_E_USUARIOS.md
- [x] Testes QA com dados fictícios - RELATORIO_QA.md + seed-data-qa.ts
