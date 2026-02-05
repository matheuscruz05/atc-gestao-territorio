import 'dotenv/config';
import { syncUsuariosFromSheets, syncProdutosFromSheets, syncCanaisFromSheets, syncUnidadesFromSheets, syncCadastrosFromSheets, syncAllCadastrosToSheets, pullCadastrosFromSheets } from './lib/google-sheets-sync';
import type { Cadastro } from "@/types/models";
import { withCategorias } from "@/lib/cadastro-legacy";

// Carregar variáveis de ambiente do .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '.env.local') });

console.log('🔑 Variáveis de ambiente carregadas:');
console.log('   EXPO_PUBLIC_GOOGLE_SHEETS_ID:', process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID ? '✅ Configurado' : '❌ Não encontrado');
console.log('   EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY:', process.env.EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY ? '✅ Configurado' : '❌ Não encontrado');
console.log('   GOOGLE_SERVICE_ACCOUNT_KEY_FILE:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ? '✅ Configurado' : '❌ Não encontrado');

async function testGoogleSheetsSync() {
  console.log('\n🧪 ===== TESTE DE SINCRONIZAÇÃO GOOGLE SHEETS =====\n');
  
  // Teste 1: Leitura de Usuários
  console.log('📖 Teste 1: Leitura de Usuários da planilha');
  try {
    const usuarios = await syncUsuariosFromSheets();
    console.log(`✅ ${usuarios.length} usuários lidos`);
    if (usuarios.length > 0) {
      console.log('   Exemplo:', usuarios[0]);
    }
  } catch (error) {
    console.error('❌ Erro ao ler usuários:', error);
  }
  
  // Teste 2: Leitura de Produtos
  console.log('\n📖 Teste 2: Leitura de Produtos da planilha');
  try {
    const produtos = await syncProdutosFromSheets();
    console.log(`✅ ${produtos.length} produtos lidos`);
    if (produtos.length > 0) {
      console.log('   Exemplo:', produtos[0]);
    }
  } catch (error) {
    console.error('❌ Erro ao ler produtos:', error);
  }
  
  // Teste 3: Leitura de Canais
  console.log('\n📖 Teste 3: Leitura de Canais da planilha');
  try {
    const canais = await syncCanaisFromSheets();
    console.log(`✅ ${canais.length} canais lidos`);
    if (canais.length > 0) {
      console.log('   Exemplo:', canais[0]);
    }
  } catch (error) {
    console.error('❌ Erro ao ler canais:', error);
  }
  
  // Teste 4: Leitura de Unidades
  console.log('\n📖 Teste 4: Leitura de Unidades da planilha');
  try {
    const unidades = await syncUnidadesFromSheets();
    console.log(`✅ ${unidades.length} unidades lidas`);
    if (unidades.length > 0) {
      console.log('   Exemplo:', unidades[0]);
    }
  } catch (error) {
    console.error('❌ Erro ao ler unidades:', error);
  }
  
  // Teste 5: Leitura de Cadastros
  console.log('\n📖 Teste 5: Leitura de Cadastros da planilha');
  try {
    const cadastros = await syncCadastrosFromSheets();
    console.log(`✅ ${cadastros.length} cadastros lidos`);
    if (cadastros.length > 0) {
      console.log('   Exemplo:', cadastros[0]);
    }
  } catch (error) {
    console.error('❌ Erro ao ler cadastros:', error);
  }
  
  // Teste 6: Escrita de Cadastro (Teste)
  console.log('\n✍️  Teste 6: Escrita de cadastro de TESTE na planilha');
  try {
    const cadastroTeste: Cadastro[] = [
      withCategorias({
        cadastroId: 'TEST_' + Date.now(),
        criadoEm: new Date().toISOString(),
        atcEmail: 'teste@sync.com',
        atcNome: 'Teste Sync',
        canal: 'VAREJO',
        unidade: 'UNID_SP_01',
        estado: 'SP',
        categoria: 'FERTILIZANTE - BASE',
        produtoRef: 'FERTBASE_NPK_01',
        unidadePotencial: 'tons',
        implantado: 'Não',
        potencialValor: 100,
        concorrentes: '',
        observacao: '🧪 Teste de sincronização automático',
      }),
    ];
    
    await syncAllCadastrosToSheets(cadastroTeste);
    console.log('✅ Cadastro de teste escrito com sucesso!');
    console.log('   CadastroId:', cadastroTeste[0].cadastroId);
  } catch (error) {
    console.error('❌ Erro ao escrever cadastro:', error);
  }
  
  // Teste 7: Pull de Cadastros (leitura após escrita)
  console.log('\n📥 Teste 7: Pull de cadastros da planilha');
  try {
    const result = await pullCadastrosFromSheets();
    console.log(`✅ ${result.cadastros.length} cadastros baixados`);
    
    // Verificar se o cadastro de teste existe
    const testeCadastro = result.cadastros.find(c => c.atcEmail === 'teste@sync.com');
    if (testeCadastro) {
      console.log('✅ Cadastro de teste encontrado após pull!');
      console.log('   ', testeCadastro);
    } else {
      console.log('⚠️  Cadastro de teste NÃO encontrado (pode demorar alguns segundos)');
    }
  } catch (error) {
    console.error('❌ Erro ao fazer pull:', error);
  }
  
  console.log('\n✅ ===== TESTES CONCLUÍDOS =====\n');
}

// Executar testes
testGoogleSheetsSync().catch(console.error);
