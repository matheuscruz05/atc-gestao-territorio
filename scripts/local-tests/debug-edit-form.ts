#!/usr/bin/env tsx
/**
 * Debug: Verificar o que está sendo carregado ao editar um cadastro
 * 
 * Uso: npx tsx scripts/local-tests/debug-edit-form.ts
 */

// Import direto do código, sem passar por React Native
async function debugEditForm() {
  console.log("\n========== 🔍 DEBUG: VERIFICAR CADASTROS PARA EDIÇÃO ==========");
  
  try {
    const fetch = global.fetch || (await import("node-fetch")).default;
    
    // Buscar do Google Sheets usando API direta
    console.log("\n1️⃣  Buscando cadastros do servidor localhost:3000...");
    const response = await fetch("http://localhost:3000/api/sheets/cadastros");
    
    if (!response.ok) {
      console.error(`❌ Erro HTTP! Status: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    console.log(`✅ Resposta recebida. Status: ${data.success ? "success" : "failed"}`);
    
    if (data.cadastros && data.cadastros.length > 0) {
      console.log(`✅ Encontrados ${data.cadastros.length} cadastros`);
      
      const primeiro = data.cadastros[0];
      console.log("\n📦 Primeiro cadastro:");
      console.log(`  - ID: ${primeiro.cadastroId}`);
      console.log(`  - Canal: ${primeiro.canal}`);
      console.log(`  - Unidade: ${primeiro.unidade}`);
      console.log(`  - Estado: ${primeiro.estado}`);
      console.log(`  - Categorias: ${primeiro.categorias?.length || 0}`);
      
      if (primeiro.categorias && primeiro.categorias.length > 0) {
        console.log(`\n📋 Categorias do primeiro cadastro:`);
        primeiro.categorias.slice(0, 10).forEach((cat: any, i: number) => {
          console.log(`  ${i + 1}. ${cat.categoria}`);
          console.log(`     - Produto: ${cat.produtoRef || cat.produtoNomeLivre || "?"}`);
          console.log(`     - Implantado: ${cat.implantado}`);
          console.log(`     - Pot. Atingido: ${cat.potencialAtingido}`);
          console.log(`     - Pot. Total: ${cat.potencialTotal}`);
        });
        
        if (primeiro.categorias.length > 10) {
          console.log(`  ... e mais ${primeiro.categorias.length - 10} categorias`);
        }
      }
    } else {
      console.log("⚠️  Nenhum cadastro encontrado");
    }
    
    console.log("\n========== ✅ DEBUG CONCLUÍDO ==========\n");
  } catch (error) {
    console.error("\n❌ Erro durante debug:", error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }
  }
}

debugEditForm();
