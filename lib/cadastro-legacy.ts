import type { Cadastro, CategoriaData } from "@/types/models";

export type LegacyCadastro = Omit<Cadastro, "categorias"> & {
  categorias?: CategoriaData[];
};

export const buildCategoriasFromLegacy = (cad: LegacyCadastro): CategoriaData[] => {
  return [
    {
      categoria: cad.categoria ?? "FERTILIZANTE - BASE",
      produtoRef: cad.produtoRef ?? "",
      produtoNomeLivre: cad.produtoNomeLivre,
      unidadePotencial: cad.unidadePotencial ?? "tons",
      implantado: cad.implantado ?? "Não",
      safra: cad.safra ?? "Verão",
      potencialAtingido: cad.potencialAtingido ?? 0,
      potencialTotal: cad.potencialTotal ?? cad.potencialValor ?? 0,
      concorrentes: cad.concorrentes ?? "",
      observacao: cad.observacao ?? "",
      potencialValor: cad.potencialValor,
    },
  ];
};

export const withCategorias = (cad: LegacyCadastro): Cadastro => {
  const categorias = cad.categorias && cad.categorias.length > 0
    ? cad.categorias
    : buildCategoriasFromLegacy(cad);

  return {
    ...cad,
    categorias,
  } as Cadastro;
};
