import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  authenticateWithSheets,
  getDashboardMetricas,
  syncCadastrosFromSheets,
} from "@/lib/google-sheets-sync";

beforeEach(() => {
  // Ensure local test env doesn't accidentally have sheet credentials
  delete process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID;
  delete process.env.EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
});
import type { Cadastro, Usuario } from "@/types/models";
import { withCategorias } from "@/lib/cadastro-legacy";

describe("Google Sheets Sync", () => {
  describe("authenticateWithSheets", () => {
    it("deve retornar erro quando Sheets não está configurado", async () => {
      const result = await authenticateWithSheets("test@test.com", "123456");
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("não configurado");
    });
  });

  describe("getDashboardMetricas", () => {
    it("deve retornar métricas padrão quando Sheets não está configurado", async () => {
      const metricas = await getDashboardMetricas();
      
      expect(metricas.totalCadastros).toBe(0);
      expect(metricas.totalAtcs).toBe(0);
      expect(metricas.totalImplantados).toBe(0);
      expect(metricas.potencialTotal).toBe(0);
    });

    it("deve processar cadastros locais e gerar métricas corretas", async () => {
      // Dados de teste locais
      const cadastrosLocais: Cadastro[] = [
        withCategorias({
          cadastroId: "1",
          criadoEm: new Date().toISOString(),
          atcEmail: "atc1@atc.com",
          atcNome: "ATC 1",
          canal: "Distribuidor",
          unidade: "BELO HORIZONTE",
          estado: "MG",
          categoria: "HIDROSSOLÚVEIS",
          produtoRef: "HIDRO_LIVRE",
          produtoNomeLivre: "Produto A",
          unidadePotencial: "litros",
          implantado: "Sim",
          potencialValor: 1000,
          concorrentes: "Concorrente A",
          observacao: "Observação teste",
        }),
        withCategorias({
          cadastroId: "2",
          criadoEm: new Date().toISOString(),
          atcEmail: "atc2@atc.com",
          atcNome: "ATC 2",
          canal: "Direto",
          unidade: "MINAS GERAIS",
          estado: "MG",
          categoria: "FERTILIZANTE - BASE",
          produtoRef: "MICROESSENTIALS",
          produtoNomeLivre: "",
          unidadePotencial: "tons",
          implantado: "Não",
          potencialValor: 2000,
          concorrentes: "Concorrente B",
          observacao: "Observação teste 2",
        }),
      ];

      const usuariosLocais: Usuario[] = [
        {
          email: "atc1@atc.com",
          nome: "ATC 1",
          role: "ATC",
          senha: "123456",
          ativo: true,
        },
        {
          email: "atc2@atc.com",
          nome: "ATC 2",
          role: "ATC",
          senha: "123456",
          ativo: true,
        },
      ];

      const metricas = await getDashboardMetricas(cadastrosLocais, usuariosLocais);

      expect(metricas.totalCadastros).toBe(2);
      expect(metricas.totalAtcs).toBe(2);
      expect(metricas.totalImplantados).toBe(1);
      expect(metricas.potencialTotal).toBe(3000);
      expect(metricas.cadastrosPorCategoria["HIDROSSOLÚVEIS"]).toBe(1);
      expect(metricas.cadastrosPorCategoria["FERTILIZANTE - BASE"]).toBe(1);
      expect(metricas.cadastrosPorAtc["ATC 1"]).toBe(1);
      expect(metricas.cadastrosPorAtc["ATC 2"]).toBe(1);
      expect(metricas.cadastrosPorUnidade["BELO HORIZONTE"]).toBe(1);
      expect(metricas.cadastrosPorUnidade["MINAS GERAIS"]).toBe(1);
    });
  });

  describe("syncCadastrosFromSheets", () => {
    it("deve retornar array vazio quando Sheets não está configurado", async () => {
      const cadastros = await syncCadastrosFromSheets();
      
      expect(Array.isArray(cadastros)).toBe(true);
      expect(cadastros.length).toBe(0);
    });
  });

  describe("sendCadastroToSheets", () => {
    it("deve escrever a linha usando PUT na próxima linha disponível", async () => {
      const fetchMock = vi.fn()
        // primeira chamada: GET CADASTROS!A:A (retorna 3 linhas -> nextRow = 4)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [["A"], ["1"], ["2"]] }) })
        // segunda chamada: PUT para A4:O4
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => 'OK' });

      // stub global fetch
      (global as any).fetch = fetchMock;

      const cadastro = {
        cadastroId: 'TEST-CAD-123',
        criadoEm: new Date().toISOString(),
        atcEmail: 'test@atc.com',
        atcNome: 'Teste ATC',
        canal: 'Canal Teste',
        unidade: 'Unidade Teste',
        estado: 'SP',
        categoria: 'HIDROSSOLUVEIS',
        produtoRef: 'PROD_TEST',
        produtoNomeLivre: 'Produto Teste',
        unidadePotencial: 'tons',
        implantado: 'Não',
        potencialValor: 1.5,
        concorrentes: 'Nenhum',
        observacao: 'Teste',
      } as any;

      // Ensure env vars are set so function doesn't early-return
      process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID = 'SHEET_ID';
      process.env.EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY = 'API_KEY';

      // import dynamically to pick up stubs
      const { sendCadastroToSheets } = await import('@/lib/google-sheets-sync');

      const res = await sendCadastroToSheets(cadastro);
      expect(res.success).toBe(true);

      // fetch should have been called twice
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const putCall = fetchMock.mock.calls[1];
      const putUrl = putCall[0] as string;
      const putOpts = putCall[1] as any;

      expect(putUrl).toContain('CADASTROS!A4:O4');
      expect(putOpts.method).toBe('PUT');

      const body = JSON.parse(putOpts.body);
      expect(Array.isArray(body.values)).toBe(true);
      expect(body.values[0][0]).toBe('TEST-CAD-123');
    });
  });
});
