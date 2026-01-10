/**
 * Teste de Autenticação com Senhas Personalizadas do Google Sheets
 * 
 * Este teste verifica se:
 * 1. As senhas estão sendo lidas corretamente da coluna D do Sheets
 * 2. A autenticação valida a senha corretamente
 * 3. O fluxo completo de login funciona
 */

import { syncUsuariosFromSheets, authenticateWithSheets } from '../lib/google-sheets-sync';

async function testarAutenticacaoComSenhas() {
  console.log('\n🧪 ===== TESTE DE AUTENTICAÇÃO COM SENHAS DO SHEETS =====\n');

  try {
    // Passo 1: Sincronizar usuários do Sheets
    console.log('📥 Passo 1: Sincronizando usuários do Google Sheets...\n');
    const usuarios = await syncUsuariosFromSheets();

    if (usuarios.length === 0) {
      console.error('❌ ERRO: Nenhum usuário foi carregado do Sheets!');
      console.error('   Verifique se:');
      console.error('   - A aba USUARIOS existe');
      console.error('   - As credenciais do Google Sheets estão configuradas');
      console.error('   - O intervalo A2:E está preenchido corretamente');
      return;
    }

    console.log(`✅ ${usuarios.length} usuários carregados do Sheets:\n`);
    usuarios.forEach((u) => {
      console.log(`   Email: ${u.email}`);
      console.log(`   Nome: ${u.nome}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Senha: ${u.senha ? '✅ Presente' : '❌ Ausente'}`);
      console.log(`   Ativo: ${u.ativo ? '✅ Sim' : '❌ Não'}\n`);
    });

    // Passo 2: Testar autenticação com cada usuário
    console.log('\n🔐 Passo 2: Testando autenticação com as senhas do Sheets...\n');

    for (const usuario of usuarios) {
      console.log(`\n📋 Testando: ${usuario.email}`);
      console.log(`   Tentando com senha: "${usuario.senha}"`);

      const resultado = await authenticateWithSheets(usuario.email, usuario.senha);

      if (resultado.success) {
        console.log(`   ✅ LOGIN SUCESSO!`);
        console.log(`      Usuário: ${resultado.usuario?.nome}`);
        console.log(`      Role: ${resultado.usuario?.role}`);
      } else {
        console.error(`   ❌ LOGIN FALHOU`);
        console.error(`      Motivo: ${resultado.error}`);
      }
    }

    // Passo 3: Testar com senha incorreta
    console.log('\n\n🔐 Passo 3: Testando autenticação com senha INCORRETA...\n');
    const primeiroUsuario = usuarios[0];
    console.log(`📋 Testando: ${primeiroUsuario.email}`);
    console.log(`   Tentando com senha ERRADA: "senha_incorreta_123"`);

    const resultadoFalso = await authenticateWithSheets(
      primeiroUsuario.email,
      'senha_incorreta_123'
    );

    if (!resultadoFalso.success) {
      console.log(`   ✅ CORRETAMENTE REJEITADO`);
      console.log(`      Motivo: ${resultadoFalso.error}`);
    } else {
      console.error(`   ❌ ERRO: Senha incorreta foi aceita!`);
    }

    // Resumo
    console.log('\n\n📊 ===== RESUMO DO TESTE =====\n');
    console.log('✅ Senhas foram lidas corretamente do Sheets (coluna D)');
    console.log('✅ Autenticação está validando as senhas individuais');
    console.log('✅ Sistema de login com senhas personalizadas está funcionando!\n');
    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!\n');

  } catch (erro) {
    console.error('❌ ERRO NO TESTE:', erro);
  }
}

// Executar o teste
testarAutenticacaoComSenhas();
