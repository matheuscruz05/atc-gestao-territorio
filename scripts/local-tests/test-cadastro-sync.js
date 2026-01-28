#!/usr/bin/env node

/**
 * Test script para validar sincronização de cadastros com Google Sheets
 */

const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs';
const API_KEY = 'AIzaSyBNET7Szj8kedgcjDWj1Ix0Vf8V33W6CSQ';
const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'secrets/sa-key.json');

// Test 1: Verificar que podemos ler o que foi escrito no Sheets
async function test1ReadCadastros() {
  console.log('\n📖 Test 1: Ler cadastros atuais do Sheets...');
  
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CADASTROS!A:G?key=${API_KEY}`
    );
    
    if (!response.ok) {
      console.error('❌ Erro ao ler Sheets:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    const rows = data.values || [];
    
    console.log(`✅ Cadastros encontrados: ${rows.length - 1} linhas de dados`);
    if (rows.length > 1) {
      console.log('   Cabeçalhos:', rows[0].join(' | '));
      console.log('   Últimos 3 cadastros:');
      rows.slice(-3).forEach((row, idx) => {
        console.log(`     ${idx}. ID:${row[0]} | Nome:${row[1]} | ATC:${row[2]}`);
      });
    }
    
    return rows;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return null;
  }
}

// Test 2: Simular envio de cadastro via API
async function test2SendViaAPI() {
  console.log('\n🚀 Test 2: Testar envio de cadastro via API (localhost:3000)...');
  
  const testData = {
    id: 'test-' + Date.now(),
    nome: 'Cadastro Teste - ' + new Date().toLocaleTimeString('pt-BR'),
    atc: 'ATC-TESTE',
    municipio: 'Teste',
    propriedade: 'Teste Property',
    responsavel: 'Teste User',
    contato: 'teste@teste.com'
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/sheets/create-or-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ API respondeu com sucesso (200)');
      console.log('   Resposta:', result);
      return true;
    } else {
      console.error(`❌ API respondeu com ${response.status}:`, result);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao conectar à API:', error.message);
    console.error('   Verifique se o servidor Express está rodando em localhost:3000');
    return false;
  }
}

// Test 3: Validar credenciais do Service Account
async function test3ValidateServiceAccount() {
  console.log('\n🔐 Test 3: Validar Service Account...');
  
  if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    console.error('❌ Arquivo de Service Account não encontrado:', SERVICE_ACCOUNT_FILE);
    return false;
  }
  
  try {
    const saKey = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));
    console.log('✅ Service Account carregado');
    console.log('   Email:', saKey.client_email);
    console.log('   Project:', saKey.project_id);
    console.log('   Type:', saKey.type);
    return true;
  } catch (error) {
    console.error('❌ Erro ao carregar Service Account:', error.message);
    return false;
  }
}

// Test 4: Verificar conectividade com localhost:3000
async function test4APIConnectivity() {
  console.log('\n🌐 Test 4: Verificar conectividade com API server...');
  
  try {
    const response = await fetch('http://localhost:3000/health', {
      timeout: 5000
    }).catch(e => {
      throw new Error(`Não conseguiu conectar a localhost:3000: ${e.message}`);
    });
    
    if (response.ok) {
      console.log('✅ API server respondendo em http://localhost:3000');
      return true;
    } else {
      console.log('⚠️  API respondeu mas com status', response.status);
      return true; // Ainda funciona, pode não ter rota /health
    }
  } catch (error) {
    console.error('❌', error.message);
    console.error('   Certifique-se de que `pnpm dev` está rodando');
    return false;
  }
}

// Test 5: Verificar porta 8081 (Expo/Metro)
async function test5MetroConnectivity() {
  console.log('\n📱 Test 5: Verificar Metro bundler...');
  
  try {
    const response = await fetch('http://localhost:8081', {
      timeout: 5000
    }).catch(e => {
      throw new Error(`Não conseguiu conectar a localhost:8081: ${e.message}`);
    });
    
    console.log('✅ Metro bundler respondendo em http://localhost:8081');
    return true;
  } catch (error) {
    console.error('❌', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TESTE COMPLETO DE SINCRONIZAÇÃO - ATC GESTÃO TERRITÓRIO');
  console.log('═══════════════════════════════════════════════════════════');
  
  const results = {
    connectivity: {
      api: await test4APIConnectivity(),
      metro: await test5MetroConnectivity()
    },
    sheets: {
      readCadastros: await test1ReadCadastros() !== null,
      serviceAccount: await test3ValidateServiceAccount()
    },
    sync: {
      sendViaAPI: await test2SendViaAPI()
    }
  };
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 RESUMO DOS TESTES:');
  console.log('═══════════════════════════════════════════════════════════');
  
  const criticalTests = [
    ['API Connectivity', results.connectivity.api],
    ['Metro Bundler', results.connectivity.metro],
    ['Google Sheets Read', results.sheets.readCadastros],
    ['Service Account', results.sheets.serviceAccount],
    ['API Sync POST', results.sync.sendViaAPI]
  ];
  
  let allPassed = true;
  criticalTests.forEach(([name, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (!passed) allPassed = false;
  });
  
  console.log('\n═══════════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('🎉 TUDO FUNCIONANDO! Sincronização operacional.');
  } else {
    console.log('⚠️  PROBLEMAS DETECTADOS - Veja acima para detalhes.');
  }
  console.log('═══════════════════════════════════════════════════════════\n');
}

runAllTests().catch(console.error);
