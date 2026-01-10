import type { Usuario, Produto, Canal, Unidade } from "@/types/models";
import { PRODUTOS_CATALOGO } from "@/types/models";

// Usuários iniciais (conforme blueprint)
export const SEED_USUARIOS: Usuario[] = [
  {
    email: "coord@atc.com",
    nome: "Coordenador Principal",
    role: "COORD",
    senha: "123456",
    ativo: true,
  },
  {
    email: "atc1@atc.com",
    nome: "João Silva",
    role: "ATC",
    senha: "123456",
    ativo: true,
  },
  {
    email: "atc2@atc.com",
    nome: "Maria Santos",
    role: "ATC",
    senha: "123456",
    ativo: true,
  },
  {
    email: "atc3@atc.com",
    nome: "Pedro Oliveira",
    role: "ATC",
    senha: "123456",
    ativo: true,
  },
];

// Produtos (catálogo completo do blueprint)
export const SEED_PRODUTOS: Produto[] = PRODUTOS_CATALOGO.map((p) => ({
  ...p,
  ativo: true,
}));

// Canais de exemplo
export const SEED_CANAIS: Canal[] = [
  { canalId: "VAREJO", canal: "Varejo", ativo: true },
  { canalId: "COOPERATIVA", canal: "Cooperativa", ativo: true },
  { canalId: "DISTRIBUIDOR", canal: "Distribuidor", ativo: true },
  { canalId: "REVENDA", canal: "Revenda", ativo: true },
  { canalId: "PRODUTOR_DIRETO", canal: "Produtor Direto", ativo: true },
];

// Unidades de exemplo (algumas por região)
export const SEED_UNIDADES: Unidade[] = [
  // Sul
  { unidadeId: "UNID_RS_01", unidade: "Cooperativa Agrícola RS", estadoUf: "RS", ativo: true },
  { unidadeId: "UNID_PR_01", unidade: "Revenda Paraná Agro", estadoUf: "PR", ativo: true },
  { unidadeId: "UNID_SC_01", unidade: "Distribuidor SC", estadoUf: "SC", ativo: true },
  
  // Sudeste
  { unidadeId: "UNID_SP_01", unidade: "Cooperativa Vale do Paraíba", estadoUf: "SP", ativo: true },
  { unidadeId: "UNID_MG_01", unidade: "Revenda Triângulo Mineiro", estadoUf: "MG", ativo: true },
  { unidadeId: "UNID_SP_02", unidade: "Produtor Grande Porte SP", estadoUf: "SP", ativo: true },
  
  // Centro-Oeste
  { unidadeId: "UNID_MT_01", unidade: "Cooperativa Mato Grosso", estadoUf: "MT", ativo: true },
  { unidadeId: "UNID_GO_01", unidade: "Revenda Goiás Agro", estadoUf: "GO", ativo: true },
  { unidadeId: "UNID_MS_01", unidade: "Distribuidor MS", estadoUf: "MS", ativo: true },
  
  // Nordeste
  { unidadeId: "UNID_BA_01", unidade: "Cooperativa Bahia", estadoUf: "BA", ativo: true },
  { unidadeId: "UNID_MA_01", unidade: "Revenda Maranhão", estadoUf: "MA", ativo: true },
  
  // Norte
  { unidadeId: "UNID_PA_01", unidade: "Distribuidor Pará", estadoUf: "PA", ativo: true },
  { unidadeId: "UNID_TO_01", unidade: "Cooperativa Tocantins", estadoUf: "TO", ativo: true },
];
