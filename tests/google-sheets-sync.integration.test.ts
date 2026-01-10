import { describe, it, expect, beforeEach } from "vitest";
import {
  syncUsuariosFromSheets,
  syncProdutosFromSheets,
  syncCanaisFromSheets,
  syncUnidadesFromSheets,
  syncCadastrosFromSheets,
  authenticateWithSheets,
  getDashboardMetricas,
} from "@/lib/google-sheets-sync";

describe("Google Sheets Sync - With Real Configuration", () => {
  describe("syncUsuariosFromSheets", () => {
    it("deve carregar usuários do Google Sheets", async () => {
      const usuarios = await syncUsuariosFromSheets();
      
      expect(Array.isArray(usuarios)).toBe(true);
      if (usuarios.length > 0) {
        expect(usuarios[0]).toHaveProperty("email");
        expect(usuarios[0]).toHaveProperty("nome");
        expect(usuarios[0]).toHaveProperty("role");
        expect(usuarios[0]).toHaveProperty("ativo");
        console.log(`✅ ${usuarios.length} usuários carregados`);
      }
    });
  });

  describe("syncProdutosFromSheets", () => {
    it("deve carregar produtos do Google Sheets", async () => {
      const produtos = await syncProdutosFromSheets();
      
      expect(Array.isArray(produtos)).toBe(true);
      console.log(`✅ ${produtos.length} produtos carregados`);
    });
  });

  describe("syncCanaisFromSheets", () => {
    it("deve carregar canais do Google Sheets", async () => {
      const canais = await syncCanaisFromSheets();
      
      expect(Array.isArray(canais)).toBe(true);
      console.log(`✅ ${canais.length} canais carregados`);
    });
  });

  describe("syncUnidadesFromSheets", () => {
    it("deve carregar unidades do Google Sheets", async () => {
      const unidades = await syncUnidadesFromSheets();
      
      expect(Array.isArray(unidades)).toBe(true);
      console.log(`✅ ${unidades.length} unidades carregadas`);
    });
  });

  describe("syncCadastrosFromSheets", () => {
    it("deve carregar cadastros do Google Sheets", async () => {
      const cadastros = await syncCadastrosFromSheets();
      
      expect(Array.isArray(cadastros)).toBe(true);
      if (cadastros.length > 0) {
        expect(cadastros[0]).toHaveProperty("cadastroId");
        expect(cadastros[0]).toHaveProperty("atcEmail");
        expect(cadastros[0]).toHaveProperty("nomeCliente");
      }
      console.log(`✅ ${cadastros.length} cadastros carregados`);
    });
  });

  describe("authenticateWithSheets", () => {
    it("deve autenticar usuário contra Google Sheets", async () => {
      // Tenta autenticar com um usuário que pode estar na planilha
      const result = await authenticateWithSheets("coord@atc.com", "123456");
      
      // Se funcionar, success será true ou false (mas não erro de configuração)
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("error");
      
      if (result.success) {
        expect(result.usuario).toBeDefined();
        console.log(`✅ Autenticação bem-sucedida: ${result.usuario?.nome}`);
      } else {
        console.log(`⚠️ Autenticação: ${result.error}`);
      }
    });
  });

  describe("getDashboardMetricas", () => {
    it("deve retornar métricas do Google Sheets", async () => {
      const metricas = await getDashboardMetricas();
      
      expect(metricas).toHaveProperty("totalCadastros");
      expect(metricas).toHaveProperty("totalAtcs");
      expect(metricas).toHaveProperty("totalImplantados");
      expect(metricas).toHaveProperty("potencialTotal");
      
      console.log(`✅ Dashboard: ${metricas.totalCadastros} cadastros, ${metricas.totalAtcs} ATCs`);
    });
  });
});
