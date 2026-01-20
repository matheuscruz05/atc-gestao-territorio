// Tipos de dados baseados no blueprint.md

export type UserRole = "ATC" | "COORD";

export interface Usuario {
  email: string; // Key
  nome: string;
  role: UserRole;
  senha: string;
  ativo: boolean;
  gr?: string; // GR - Gerente Regional (opcional, pode não estar em todos os registros)
}

export type Categoria =
  | "FERTILIZANTE - BASE"
  | "FERTILIZANTES - COBERTURA"
  | "BIOLÓGICOS - INOCULANTES"
  | "BIOLÓGICOS - FOLIARES"
  | "HIDROSSOLÚVEIS";

export type UnidadePotencial = "tons" | "litros";

export interface Produto {
  produtoId: string; // Key
  categoria: Categoria;
  produto: string;
  unidadePotencial: UnidadePotencial;
  ativo: boolean;
}

export interface Canal {
  canalId: string; // Key
  canal: string;
  ativo: boolean;
}

export interface Unidade {
  unidadeId: string; // Key
  unidade: string;
  estadoUf?: string;
  ativo: boolean;
}

export type Implantado = "Sim" | "Não";

export type Safra = "Verão" | "Inverno";

// Dados de cada categoria dentro de um cadastro
export interface CategoriaData {
  categoria: Categoria;
  produtoRef: string; // Ref PRODUTOS
  produtoNomeLivre?: string; // Só para HIDROSSOLÚVEIS
  unidadePotencial: UnidadePotencial; // Derivado de PRODUTO_REF
  implantado: Implantado;
  safra: Safra; // Verão ou Inverno
  potencialAtingido: number; // Potencial que o produtor já utiliza
  potencialTotal: number; // Potencial total da área
  concorrentes: string;
  observacao: string;
  // Campo antigo mantido para compatibilidade
  potencialValor?: number;
}

// Snapshot de potenciais em uma data específica
export interface PotencialSnapshot {
  data: string; // ISO date string
  categoria: Categoria;
  produtoRef: string;
  produtoNomeLivre?: string;
  potencialAtingido: number;
  potencialTotal: number;
  safra: Safra;
}

// Histórico de edições do cadastro
export interface HistoricoEdicao {
  editadoEm: string; // ISO date string
  snapshots: PotencialSnapshot[]; // Snapshot de todos os potenciais naquele momento
}

export interface Cadastro {
  cadastroId: string; // Key - UNIQUEID()
  criadoEm: string; // ISO date string
  atcEmail: string; // USEREMAIL()
  atcNome: string; // Derivado de USUARIOS
  canal: string; // Ref CANAIS
  unidade: string; // Ref UNIDADES
  estado: string; // UF
  categorias: CategoriaData[]; // Array com 5 categorias
  deletado?: boolean; // Marca cadastro como excluído (soft delete)
  editadoEm?: string; // Data da última edição (ISO date string)
  historico?: HistoricoEdicao[]; // Array com histórico de todas as edições
  // Mantém campos antigos para compatibilidade com dados existentes
  categoria?: Categoria;
  produtoRef?: string;
  produtoNomeLivre?: string;
  unidadePotencial?: UnidadePotencial;
  implantado?: Implantado;
  safra?: Safra;
  potencialValor?: number;
  potencialAtingido?: number;
  potencialTotal?: number;
  concorrentes?: string;
  observacao?: string;
}

// Estados brasileiros
export const ESTADOS_UF = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
] as const;

export type EstadoUF = typeof ESTADOS_UF[number];

// Produtos conforme blueprint
export const PRODUTOS_CATALOGO: Omit<Produto, "ativo">[] = [
  // FERTILIZANTE - BASE
  { produtoId: "MICROESSENTIALS", categoria: "FERTILIZANTE - BASE", produto: "MICROESSENTIALS", unidadePotencial: "tons" },
  { produtoId: "PERFORMA_BIO", categoria: "FERTILIZANTE - BASE", produto: "PERFORMA BIO", unidadePotencial: "tons" },
  { produtoId: "PERFORMA_PLUS", categoria: "FERTILIZANTE - BASE", produto: "PERFORMA PLUS", unidadePotencial: "tons" },
  { produtoId: "PERFORMA_NEO", categoria: "FERTILIZANTE - BASE", produto: "PERFORMA NEO", unidadePotencial: "tons" },
  { produtoId: "PERFORMA_FULL", categoria: "FERTILIZANTE - BASE", produto: "PERFORMA FULL", unidadePotencial: "tons" },
  
  // FERTILIZANTES - COBERTURA
  { produtoId: "ASPIRE", categoria: "FERTILIZANTES - COBERTURA", produto: "ASPIRE", unidadePotencial: "tons" },
  { produtoId: "PERFORMA_ULTRA", categoria: "FERTILIZANTES - COBERTURA", produto: "PERFORMA ULTRA", unidadePotencial: "tons" },
  
  // BIOLÓGICOS - INOCULANTES
  { produtoId: "MBIO_PHOS", categoria: "BIOLÓGICOS - INOCULANTES", produto: "MBIO PHOS", unidadePotencial: "litros" },
  { produtoId: "MBIO_HIDRO", categoria: "BIOLÓGICOS - INOCULANTES", produto: "MBIO HIDRO", unidadePotencial: "litros" },
  
  // BIOLÓGICOS - FOLIARES
  { produtoId: "MBIO_STIMULLUS", categoria: "BIOLÓGICOS - FOLIARES", produto: "MBIO STIMULLUS", unidadePotencial: "litros" },
  { produtoId: "MBIO_FLORESCE", categoria: "BIOLÓGICOS - FOLIARES", produto: "MBIO FLORESCE", unidadePotencial: "litros" },
  { produtoId: "REFIRMA_CYBELION", categoria: "BIOLÓGICOS - FOLIARES", produto: "REFIRMA CYBELION", unidadePotencial: "litros" },
  
  // HIDROSSOLÚVEIS
  { produtoId: "NITRATO_CALCIO", categoria: "HIDROSSOLÚVEIS", produto: "NITRATO DE CÁLCIO", unidadePotencial: "litros" },
  { produtoId: "MAP_PUTRIFICADO", categoria: "HIDROSSOLÚVEIS", produto: "MAP PUTRIFICADO", unidadePotencial: "litros" },
];

export const CATEGORIAS: Categoria[] = [
  "FERTILIZANTE - BASE",
  "FERTILIZANTES - COBERTURA",
  "BIOLÓGICOS - INOCULANTES",
  "BIOLÓGICOS - FOLIARES",
  "HIDROSSOLÚVEIS",
];
