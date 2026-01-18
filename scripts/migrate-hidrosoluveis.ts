/**
 * Script de migração para atualizar produtos HIDROSSOLÚVEIS
 * Converte HIDRO_LIVRE para NITRATO_CALCIO nos cadastros existentes
 */

import { getCadastros, setCadastros } from '../lib/storage';

async function migrateHidrosoluveis() {
  console.log('🔄 Iniciando migração de produtos HIDROSSOLÚVEIS...');
  
  try {
    const cadastros = await getCadastros();
    let migrationCount = 0;
    
    const migratedCadastros = cadastros.map(cadastro => {
      if (!cadastro.categorias || cadastro.categorias.length === 0) {
        return cadastro;
      }
      
      let hasChanges = false;
      const updatedCategorias = cadastro.categorias.map(cat => {
        if (cat.produtoRef === 'HIDRO_LIVRE') {
          hasChanges = true;
          migrationCount++;
          console.log(`  ✅ Migrando cadastro ${cadastro.cadastroId}: HIDRO_LIVRE → NITRATO_CALCIO`);
          return {
            ...cat,
            produtoRef: 'NITRATO_CALCIO',
          };
        }
        return cat;
      });
      
      if (hasChanges) {
        return {
          ...cadastro,
          categorias: updatedCategorias,
        };
      }
      
      return cadastro;
    });
    
    if (migrationCount > 0) {
      await setCadastros(migratedCadastros);
      console.log(`\n✅ Migração concluída! ${migrationCount} produto(s) atualizado(s).`);
    } else {
      console.log('\n✅ Nenhuma migração necessária. Todos os produtos já estão atualizados.');
    }
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  }
}

// Executar migração
migrateHidrosoluveis();
