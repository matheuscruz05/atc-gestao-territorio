#!/usr/bin/env node

/**
 * Test: Fazer um POST direto para o servidor localmente
 */

console.log('🚀 Testando POST para API em http://localhost:3000...\n');

// Dados de teste
const testData = {
  id: 'test-' + Date.now(),
  nome: 'Cadastro Teste - ' + new Date().toLocaleString('pt-BR'),
  atc: 'TEST',
  municipio: 'Teste',
  propriedade: 'Propriedade Teste',
  responsavel: 'Responsável Teste',
  contato: 'teste@test.com'
};

console.log('📦 Dados do teste:');
console.log(JSON.stringify(testData, null, 2));

fetch('http://localhost:3000/api/sheets/create-or-update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
  .then(res => {
    console.log(`\n✅ Response status: ${res.status} ${res.statusText}`);
    return res.json();
  })
  .then(json => {
    console.log('📋 Response body:');
    console.log(JSON.stringify(json, null, 2));
    console.log('\n✅ Sucesso!');
  })
  .catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  });
