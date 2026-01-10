/**
 * Dados fictícios para testes QA
 * 
 * Este arquivo contém dados de exemplo para testes completos do sistema
 * Inclui múltiplos cenários de cadastros, validações e sincronizações
 */

import type { Cadastro } from "@/types/models";

/**
 * Cadastros fictícios para testes QA
 * Estes dados cobrem múltiplos cenários de teste
 */
export const QA_CADASTROS_FICTICIOS: Cadastro[] = [
  // ===== CENÁRIO 1: Cadastro Básico Completo =====
  {
    cadastroId: "qa-001",
    criadoEm: "2024-01-15T10:30:00Z",
    atcEmail: "atc1@atc.com",
    atcNome: "João Silva",
    canal: "Varejo",
    unidade: "Cooperativa Agrícola RS",
    estado: "RS",
    categoria: "FERTILIZANTE - BASE",
    produtoRef: "MICROESSENTIALS",
    unidadePotencial: "tons",
    implantado: "Sim",
    potencialValor: 1000,
    concorrentes: "Concorrente A, Concorrente B",
    observacao: "Potencial alto, cliente interessado em volume",
  },

  // ===== CENÁRIO 2: Cadastro com Produto Livre (HIDROSSOLÚVEIS) =====
  {
    cadastroId: "qa-002",
    criadoEm: "2024-01-15T11:45:00Z",
    atcEmail: "atc1@atc.com",
    atcNome: "João Silva",
    canal: "Cooperativa",
    unidade: "Cooperativa Vale do Paraíba",
    estado: "SP",
    categoria: "HIDROSSOLÚVEIS",
    produtoRef: "HIDRO_LIVRE",
    produtoNomeLivre: "Solução Personalizada NPK 20-20-20",
    unidadePotencial: "litros",
    implantado: "Não",
    potencialValor: 0,
    concorrentes: "Concorrente X, Concorrente Y",
    observacao: "Cliente solicitou formulação customizada",
  },

  // ===== CENÁRIO 3: Cadastro Não Implantado =====
  {
    cadastroId: "qa-003",
    criadoEm: "2024-01-15T13:20:00Z",
    atcEmail: "atc2@atc.com",
    atcNome: "Maria Santos",
    canal: "Distribuidor",
    unidade: "Cooperativa Mato Grosso",
    estado: "MT",
    categoria: "BIOLÓGICOS - INOCULANTES",
    produtoRef: "MBIO_PHOS",
    unidadePotencial: "litros",
    implantado: "Não",
    potencialValor: 0,
    concorrentes: "Concorrente Z",
    observacao: "Prospecção inicial, cliente em avaliação",
  },

  // ===== CENÁRIO 4: Cadastro com Alto Potencial =====
  {
    cadastroId: "qa-004",
    criadoEm: "2024-01-15T14:15:00Z",
    atcEmail: "atc2@atc.com",
    atcNome: "Maria Santos",
    canal: "Varejo",
    unidade: "Cooperativa Minas Gerais",
    estado: "MG",
    categoria: "FERTILIZANTES - COBERTURA",
    produtoRef: "ASPIRE",
    unidadePotencial: "tons",
    implantado: "Sim",
    potencialValor: 5000,
    concorrentes: "Concorrente A",
    observacao: "Grande potencial, cliente com histórico de compras",
  },

  // ===== CENÁRIO 5: Cadastro com Múltiplos Concorrentes =====
  {
    cadastroId: "qa-005",
    criadoEm: "2024-01-15T15:30:00Z",
    atcEmail: "atc3@atc.com",
    atcNome: "Carlos Oliveira",
    canal: "Cooperativa",
    unidade: "Cooperativa Goiás",
    estado: "GO",
    categoria: "FERTILIZANTE - BASE",
    produtoRef: "PERFORMA_BIO",
    unidadePotencial: "tons",
    implantado: "Sim",
    potencialValor: 2500,
    concorrentes: "Concorrente A, Concorrente B, Concorrente C, Concorrente D",
    observacao: "Mercado competitivo, precisa de estratégia diferenciada",
  },

  // ===== CENÁRIO 6: Cadastro com Observações Detalhadas =====
  {
    cadastroId: "qa-006",
    criadoEm: "2024-01-15T16:45:00Z",
    atcEmail: "atc1@atc.com",
    atcNome: "João Silva",
    canal: "Venda Direta",
    unidade: "Cooperativa Bahia",
    estado: "BA",
    categoria: "BIOLÓGICOS - FOLIARES",
    produtoRef: "FOLIAR_A",
    unidadePotencial: "litros",
    implantado: "Sim",
    potencialValor: 500,
    concorrentes: "Concorrente X",
    observacao:
      "Cliente com experiência anterior positiva. Recomenda aumentar frequência de aplicação. Possível aumento de volume no próximo ciclo.",
  },

  // ===== CENÁRIO 7: Cadastro Sem Concorrentes =====
  {
    cadastroId: "qa-007",
    criadoEm: "2024-01-15T17:50:00Z",
    atcEmail: "atc2@atc.com",
    atcNome: "Maria Santos",
    canal: "E-commerce",
    unidade: "Cooperativa Paraná",
    estado: "PR",
    categoria: "FERTILIZANTE - BASE",
    produtoRef: "BASE_PLUS",
    unidadePotencial: "tons",
    implantado: "Não",
    potencialValor: 0,
    concorrentes: "",
    observacao: "Novo canal, sem concorrência identificada",
  },

  // ===== CENÁRIO 8: Cadastro com Potencial Pequeno =====
  {
    cadastroId: "qa-008",
    criadoEm: "2024-01-16T08:00:00Z",
    atcEmail: "atc3@atc.com",
    atcNome: "Carlos Oliveira",
    canal: "Varejo",
    unidade: "Cooperativa Santa Catarina",
    estado: "SC",
    categoria: "BIOLÓGICOS - INOCULANTES",
    produtoRef: "NEMATOIDE",
    unidadePotencial: "litros",
    implantado: "Sim",
    potencialValor: 100,
    concorrentes: "Concorrente Z",
    observacao: "Pequeno cliente, mas com potencial de crescimento",
  },

  // ===== CENÁRIO 9: Cadastro com Vários Estados =====
  {
    cadastroId: "qa-009",
    criadoEm: "2024-01-16T09:15:00Z",
    atcEmail: "atc1@atc.com",
    atcNome: "João Silva",
    canal: "Distribuidor",
    unidade: "Cooperativa Mato Grosso do Sul",
    estado: "MS",
    categoria: "FERTILIZANTES - COBERTURA",
    produtoRef: "COBERTURA_X",
    unidadePotencial: "tons",
    implantado: "Não",
    potencialValor: 0,
    concorrentes: "Concorrente A, Concorrente B",
    observacao: "Primeira abordagem, aguardando feedback",
  },

  // ===== CENÁRIO 10: Cadastro com Inoculante =====
  {
    cadastroId: "qa-010",
    criadoEm: "2024-01-16T10:30:00Z",
    atcEmail: "atc2@atc.com",
    atcNome: "Maria Santos",
    canal: "Cooperativa",
    unidade: "Cooperativa Pará",
    estado: "PA",
    categoria: "BIOLÓGICOS - INOCULANTES",
    produtoRef: "INOCULANTE_Z",
    unidadePotencial: "litros",
    implantado: "Sim",
    potencialValor: 750,
    concorrentes: "Concorrente X",
    observacao: "Aplicação bem-sucedida, cliente satisfeito",
  },

  // ===== CENÁRIO 11: Cadastro com Produto Premium =====
  {
    cadastroId: "qa-011",
    criadoEm: "2024-01-16T11:45:00Z",
    atcEmail: "atc3@atc.com",
    atcNome: "Carlos Oliveira",
    canal: "Varejo",
    unidade: "Cooperativa Tocantins",
    estado: "TO",
    categoria: "BIOLÓGICOS - FOLIARES",
    produtoRef: "PREMIUM_FOLIAR",
    unidadePotencial: "litros",
    implantado: "Sim",
    potencialValor: 1200,
    concorrentes: "Concorrente Y",
    observacao: "Produto premium com ótima aceitação de mercado",
  },

  // ===== CENÁRIO 12: Cadastro em Brasília =====
  {
    cadastroId: "qa-012",
    criadoEm: "2024-01-16T13:00:00Z",
    atcEmail: "atc1@atc.com",
    atcNome: "João Silva",
    canal: "Distribuidor",
    unidade: "Cooperativa Brasília",
    estado: "DF",
    categoria: "FERTILIZANTE - BASE",
    produtoRef: "MICROESSENTIALS",
    unidadePotencial: "tons",
    implantado: "Não",
    potencialValor: 0,
    concorrentes: "Concorrente A",
    observacao: "Novo mercado, potencial a explorar",
  },

  // ===== CENÁRIO 13: Cadastro no Rio de Janeiro =====
  {
    cadastroId: "qa-013",
    criadoEm: "2024-01-16T14:15:00Z",
    atcEmail: "atc2@atc.com",
    atcNome: "Maria Santos",
    canal: "E-commerce",
    unidade: "Cooperativa Rio de Janeiro",
    estado: "RJ",
    categoria: "HIDROSSOLÚVEIS",
    produtoRef: "HIDRO_LIVRE",
    produtoNomeLivre: "Fertilizante Foliar Especial RJ",
    unidadePotencial: "litros",
    implantado: "Sim",
    potencialValor: 300,
    concorrentes: "Concorrente X",
    observacao: "Venda online com sucesso",
  },

  // ===== CENÁRIO 14: Cadastro com Cobertura Y =====
  {
    cadastroId: "qa-014",
    criadoEm: "2024-01-16T15:30:00Z",
    atcEmail: "atc3@atc.com",
    atcNome: "Carlos Oliveira",
    canal: "Varejo",
    unidade: "Cooperativa Agrícola RS",
    estado: "RS",
    categoria: "FERTILIZANTES - COBERTURA",
    produtoRef: "COBERTURA_Y",
    unidadePotencial: "tons",
    implantado: "Sim",
    potencialValor: 800,
    concorrentes: "Concorrente B, Concorrente C",
    observacao: "Boa performance, cliente satisfeito",
  },

  // ===== CENÁRIO 15: Cadastro com Múltiplas Observações =====
  {
    cadastroId: "qa-015",
    criadoEm: "2024-01-16T16:45:00Z",
    atcEmail: "atc1@atc.com",
    atcNome: "João Silva",
    canal: "Cooperativa",
    unidade: "Cooperativa Vale do Paraíba",
    estado: "SP",
    categoria: "BIOLÓGICOS - FOLIARES",
    produtoRef: "FOLIAR_B",
    unidadePotencial: "litros",
    implantado: "Não",
    potencialValor: 0,
    concorrentes: "Concorrente X, Concorrente Y, Concorrente Z",
    observacao:
      "Cliente em fase de avaliação. Solicitou amostra. Próximo contato em 2 semanas. Possível parceria estratégica.",
  },
];

/**
 * Estatísticas dos dados fictícios para QA
 */
export const QA_ESTATISTICAS = {
  totalCadastros: QA_CADASTROS_FICTICIOS.length,
  cadastrosPorATC: {
    "atc1@atc.com": QA_CADASTROS_FICTICIOS.filter(
      (c) => c.atcEmail === "atc1@atc.com"
    ).length,
    "atc2@atc.com": QA_CADASTROS_FICTICIOS.filter(
      (c) => c.atcEmail === "atc2@atc.com"
    ).length,
    "atc3@atc.com": QA_CADASTROS_FICTICIOS.filter(
      (c) => c.atcEmail === "atc3@atc.com"
    ).length,
  },
  cadastrosImplantados: QA_CADASTROS_FICTICIOS.filter(
    (c) => c.implantado === "Sim"
  ).length,
  cadastrosNaoImplantados: QA_CADASTROS_FICTICIOS.filter(
    (c) => c.implantado === "Não"
  ).length,
  potencialTotal: QA_CADASTROS_FICTICIOS.reduce(
    (sum, c) => sum + c.potencialValor,
    0
  ),
  categorias: [
    ...new Set(QA_CADASTROS_FICTICIOS.map((c) => c.categoria)),
  ].length,
  estados: [...new Set(QA_CADASTROS_FICTICIOS.map((c) => c.estado))].length,
};

/**
 * Cenários de teste para validações
 */
export const QA_CENARIOS_VALIDACAO = {
  // Teste: Campo obrigatório vazio
  campoObrigatorioVazio: {
    descricao: "Tentar salvar sem preencher campo obrigatório",
    esperado: "Mensagem de erro exibida",
  },

  // Teste: Produto Livre obrigatório para HIDROSSOLÚVEIS
  hidrossoluveisSemProdutoLivre: {
    descricao: "Selecionar HIDROSSOLÚVEIS sem preencher Produto Livre",
    esperado: "Erro: Produto Livre é obrigatório para HIDROSSOLÚVEIS",
  },

  // Teste: Potencial obrigatório se Implantado = Sim
  implantadoSemPotencial: {
    descricao: "Selecionar Implantado=Sim sem preencher Potencial",
    esperado: "Erro: Potencial é obrigatório quando Implantado = Sim",
  },

  // Teste: Produto filtrado por categoria
  produtoFiltradoPorCategoria: {
    descricao: "Selecionar categoria e verificar produtos",
    esperado: "Apenas produtos da categoria selecionada aparecem",
  },

  // Teste: Unidade auto-preenchida
  unidadeAutoPreenchida: {
    descricao: "Selecionar produto e verificar unidade",
    esperado: "Unidade potencial aparece automaticamente",
  },

  // Teste: ATC vê apenas seus cadastros
  atcVeApenasSeusRegistros: {
    descricao: "Login como ATC1 e verificar cadastros",
    esperado: "Apenas cadastros do ATC1 aparecem",
  },

  // Teste: Coordenador vê todos os cadastros
  coordenadorVeTodos: {
    descricao: "Login como COORD e verificar cadastros",
    esperado: "Todos os cadastros de todos os ATCs aparecem",
  },
};

/**
 * Função para adicionar dados fictícios ao app
 */
export async function adicionarDadosFicticiasParaTeste(
  addCadastro: (cadastro: Cadastro) => Promise<void>
) {
  console.log("🧪 Adicionando dados fictícios para testes QA...");

  for (const cadastro of QA_CADASTROS_FICTICIOS) {
    try {
      await addCadastro(cadastro);
      console.log(`✅ Cadastro ${cadastro.cadastroId} adicionado`);
    } catch (error) {
      console.error(`❌ Erro ao adicionar ${cadastro.cadastroId}:`, error);
    }
  }

  console.log("✅ Todos os dados fictícios foram adicionados!");
  console.log("📊 Estatísticas:", QA_ESTATISTICAS);
}
