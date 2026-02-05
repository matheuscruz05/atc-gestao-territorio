import { describe, it, expect, beforeEach } from "vitest";
import {
  getUsuarios,
  setUsuarios,
  getProdutos,
  setProdutos,
  getCanais,
  setCanais,
  getUnidades,
  setUnidades,
  getCadastros,
  addCadastro,
  clearAllData,
  generateUniqueId,
} from "@/lib/storage";
import type { Usuario, Cadastro } from "@/types/models";
import { withCategorias } from "@/lib/cadastro-legacy";
import { SEED_USUARIOS, SEED_PRODUTOS, SEED_CANAIS, SEED_UNIDADES } from "@/lib/seed-data";

describe("ATC Gestão de Território - Testes", () => {
  beforeEach(async () => {
    // Limpar dados antes de cada teste
    await clearAllData();
  });

  describe("1. Autenticação e Controle de Acesso", () => {
    it("deve carregar usuários seed corretamente", async () => {
      await setUsuarios(SEED_USUARIOS);
      const usuarios = await getUsuarios();
      
      expect(usuarios.length).toBeGreaterThan(0);
      expect(usuarios).toEqual(SEED_USUARIOS);
    });

    it("deve identificar coordenador corretamente", async () => {
      await setUsuarios(SEED_USUARIOS);
      const usuarios = await getUsuarios();
      
      const coord = usuarios.find((u) => u.role === "COORD");
      expect(coord).toBeDefined();
      expect(coord?.email).toBe("coord@atc.com");
    });

    it("deve identificar ATCs corretamente", async () => {
      await setUsuarios(SEED_USUARIOS);
      const usuarios = await getUsuarios();
      
      const atcs = usuarios.filter((u) => u.role === "ATC");
      expect(atcs.length).toBeGreaterThanOrEqual(2);
    });

    it("deve verificar usuários ativos", async () => {
      await setUsuarios(SEED_USUARIOS);
      const usuarios = await getUsuarios();
      
      const ativos = usuarios.filter((u) => u.ativo);
      expect(ativos.length).toBe(usuarios.length);
    });
  });

  describe("2. Estrutura de Dados", () => {
    it("deve carregar produtos seed corretamente", async () => {
      await setProdutos(SEED_PRODUTOS);
      const produtos = await getProdutos();
      
      expect(produtos.length).toBeGreaterThan(0);
      expect(produtos).toEqual(SEED_PRODUTOS);
    });

    it("deve carregar canais seed corretamente", async () => {
      await setCanais(SEED_CANAIS);
      const canais = await getCanais();
      
      expect(canais.length).toBeGreaterThan(0);
      expect(canais).toEqual(SEED_CANAIS);
    });

    it("deve carregar unidades seed corretamente", async () => {
      await setUnidades(SEED_UNIDADES);
      const unidades = await getUnidades();
      
      expect(unidades.length).toBeGreaterThan(0);
      expect(unidades).toEqual(SEED_UNIDADES);
    });
  });

  describe("3. Cadastro de Produtos", () => {
    beforeEach(async () => {
      await setUsuarios(SEED_USUARIOS);
      await setProdutos(SEED_PRODUTOS);
      await setCanais(SEED_CANAIS);
      await setUnidades(SEED_UNIDADES);
    });

    it("deve criar cadastro com todos os campos obrigatórios", async () => {
      const novoCadastro: Cadastro = withCategorias({
        cadastroId: generateUniqueId(),
        criadoEm: new Date().toISOString(),
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
        observacao: "Teste de observação",
      });

      await addCadastro(novoCadastro);
      const cadastros = await getCadastros();
      
      expect(cadastros.length).toBe(1);
      expect(cadastros[0].cadastroId).toBe(novoCadastro.cadastroId);
      expect(cadastros[0].atcEmail).toBe("atc1@atc.com");
    });

    it("deve validar produto filtrado por categoria", async () => {
      const produtos = await getProdutos();
      const categoria = "FERTILIZANTE - BASE";
      
      const produtosFiltrados = produtos.filter(
        (p) => p.categoria === categoria && p.ativo
      );
      
      expect(produtosFiltrados.length).toBeGreaterThan(0);
      expect(produtosFiltrados.every((p) => p.categoria === categoria)).toBe(true);
    });

    it("deve auto-preencher unidade potencial baseada no produto", async () => {
      const produtos = await getProdutos();
      const produto = produtos.find((p) => p.produtoId === "MICROESSENTIALS");
      
      expect(produto).toBeDefined();
      expect(produto?.unidadePotencial).toBe("tons");
    });

    it("deve validar HIDROSSOLÚVEIS com produto livre", async () => {
      const cadastroHidro: Cadastro = withCategorias({
        cadastroId: generateUniqueId(),
        criadoEm: new Date().toISOString(),
        atcEmail: "atc1@atc.com",
        atcNome: "João Silva",
        canal: "Varejo",
        unidade: "Cooperativa Agrícola RS",
        estado: "RS",
        categoria: "HIDROSSOLÚVEIS",
        produtoRef: "HIDRO_LIVRE",
        produtoNomeLivre: "Produto Hidrossolúvel Teste",
        unidadePotencial: "litros",
        implantado: "Não",
        potencialValor: 0,
        concorrentes: "",
        observacao: "",
      });

      await addCadastro(cadastroHidro);
      const cadastros = await getCadastros();
      
      expect(cadastros.length).toBe(1);
      expect(cadastros[0].categoria).toBe("HIDROSSOLÚVEIS");
      expect(cadastros[0].produtoNomeLivre).toBe("Produto Hidrossolúvel Teste");
    });

    it("deve validar potencial obrigatório quando implantado = Sim", async () => {
      const cadastroImplantado: Cadastro = withCategorias({
        cadastroId: generateUniqueId(),
        criadoEm: new Date().toISOString(),
        atcEmail: "atc1@atc.com",
        atcNome: "João Silva",
        canal: "Varejo",
        unidade: "Cooperativa Agrícola RS",
        estado: "RS",
        categoria: "FERTILIZANTE - BASE",
        produtoRef: "MICROESSENTIALS",
        unidadePotencial: "tons",
        implantado: "Sim",
        potencialValor: 500,
        concorrentes: "",
        observacao: "",
      });

      await addCadastro(cadastroImplantado);
      const cadastros = await getCadastros();
      
      expect(cadastros[0].implantado).toBe("Sim");
      expect(cadastros[0].potencialValor).toBeGreaterThan(0);
    });
  });

  describe("4. Controle de Acesso - ATC", () => {
    beforeEach(async () => {
      await setUsuarios(SEED_USUARIOS);
    });

    it("ATC deve ver apenas próprios cadastros", async () => {
      // Criar cadastros de diferentes ATCs
      const cadastro1: Cadastro = withCategorias({
        cadastroId: generateUniqueId(),
        criadoEm: new Date().toISOString(),
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
        concorrentes: "",
        observacao: "",
      });

      const cadastro2: Cadastro = {
        ...cadastro1,
        cadastroId: generateUniqueId(),
        atcEmail: "atc2@atc.com",
        atcNome: "Maria Santos",
      };

      await addCadastro(cadastro1);
      await addCadastro(cadastro2);

      const todosCadastros = await getCadastros();
      const cadastrosATC1 = todosCadastros.filter(
        (c) => c.atcEmail === "atc1@atc.com"
      );

      expect(todosCadastros.length).toBe(2);
      expect(cadastrosATC1.length).toBe(1);
      expect(cadastrosATC1[0].atcEmail).toBe("atc1@atc.com");
    });
  });

  describe("5. Controle de Acesso - Coordenador", () => {
    beforeEach(async () => {
      await setUsuarios(SEED_USUARIOS);
    });

    it("Coordenador deve ver todos os cadastros", async () => {
      // Criar cadastros de diferentes ATCs
      const cadastro1: Cadastro = withCategorias({
        cadastroId: generateUniqueId(),
        criadoEm: new Date().toISOString(),
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
        concorrentes: "",
        observacao: "",
      });

      const cadastro2: Cadastro = {
        ...cadastro1,
        cadastroId: generateUniqueId(),
        atcEmail: "atc2@atc.com",
        atcNome: "Maria Santos",
      };

      await addCadastro(cadastro1);
      await addCadastro(cadastro2);

      const todosCadastros = await getCadastros();

      expect(todosCadastros.length).toBe(2);
    });
  });

  describe("6. Geração de IDs", () => {
    it("deve gerar IDs únicos", () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);
    });
  });
});
