#!/usr/bin/env node

/**
 * Script de Teste - Verificar Google Sheets API
 * Testa: Credenciais, Leitura e Escrita
 */

const fs = require("fs");
const path = require("path");

// Carregar .env.local
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

const spreadsheetId = process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID;
const apiKey = process.env.EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY;
const saKeyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;

console.log("\n🔍 ========== TESTE DE CONFIGURAÇÃO GOOGLE SHEETS ==========");
console.log(`\n📋 Spreadsheet ID: ${spreadsheetId || "❌ NÃO ENCONTRADO"}`);
console.log(`🔑 API Key (primeiros 20 chars): ${apiKey ? apiKey.substring(0, 20) + "..." : "❌ NÃO ENCONTRADO"}`);
console.log(`📁 Service Account File: ${saKeyFile || "❌ NÃO ENCONTRADO"}`);

// Verificar arquivo SA
if (saKeyFile) {
  const saPath = path.resolve(process.cwd(), saKeyFile);
  if (fs.existsSync(saPath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(saPath, "utf8"));
      console.log(`✅ Service Account encontrado`);
      console.log(`   - email: ${sa.client_email || "N/A"}`);
      console.log(`   - project_id: ${sa.project_id || "N/A"}`);
    } catch (e) {
      console.log(`❌ Service Account com erro: ${e.message}`);
    }
  } else {
    console.log(`❌ Arquivo não encontrado: ${saPath}`);
  }
}

console.log("\n📍 Iniciando testes...\n");

// Test 1: Verificar acesso à planilha com API Key
async function testPublicAccess() {
  console.log("1️⃣ Testando acesso público (API Key)...");
  
  if (!spreadsheetId || !apiKey) {
    console.log("❌ Credenciais incompletas");
    return false;
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
    const res = await fetch(url);
    
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Acesso público OK`);
      console.log(`   - Planilha: ${data.properties.title}`);
      console.log(`   - Abas: ${data.sheets.length}`);
      return true;
    } else {
      console.log(`❌ Erro ${res.status}: ${res.statusText}`);
      const text = await res.text();
      console.log(`   Resposta: ${text.substring(0, 100)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Erro de rede: ${error.message}`);
    return false;
  }
}

// Test 2: Ler dados do Sheets com API Key
async function testRead() {
  console.log("\n2️⃣ Testando leitura de dados (USUARIOS)...");
  
  if (!spreadsheetId || !apiKey) {
    console.log("❌ Credenciais incompletas");
    return false;
  }

  try {
    const range = "USUARIOS!A1:D10";
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    const res = await fetch(url);
    
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Leitura OK`);
      console.log(`   - Linhas encontradas: ${data.values ? data.values.length : 0}`);
      if (data.values && data.values.length > 0) {
        console.log(`   - Cabeçalho: ${JSON.stringify(data.values[0])}`);
        console.log(`   - Primeira linha: ${JSON.stringify(data.values[1] || "N/A")}`);
      }
      return true;
    } else {
      console.log(`❌ Erro ${res.status}: ${res.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Erro de rede: ${error.message}`);
    return false;
  }
}

// Test 3: Service Account (para escrita)
async function testServiceAccount() {
  console.log("\n3️⃣ Testando Service Account (para escrita)...");
  
  if (!saKeyFile) {
    console.log("⏭️  Service Account não configurado (opcional)");
    return null;
  }

  try {
    const saPath = path.resolve(process.cwd(), saKeyFile);
    if (!fs.existsSync(saPath)) {
      console.log(`❌ Arquivo não existe: ${saPath}`);
      return false;
    }

    const sa = JSON.parse(fs.readFileSync(saPath, "utf8"));
    
    // Verificar campos obrigatórios
    const required = ["private_key", "client_email", "project_id"];
    const missing = required.filter(f => !sa[f]);
    
    if (missing.length > 0) {
      console.log(`❌ Campos obrigatórios faltando: ${missing.join(", ")}`);
      return false;
    }

    console.log(`✅ Service Account válido`);
    console.log(`   - email: ${sa.client_email}`);
    console.log(`   - project_id: ${sa.project_id}`);
    return true;
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return false;
  }
}

// Executar testes
async function runTests() {
  const test1 = await testPublicAccess();
  const test2 = await testRead();
  const test3 = await testServiceAccount();

  console.log("\n\n📊 ========== RESUMO DOS TESTES ==========");
  console.log(`Acesso Público: ${test1 ? "✅ OK" : "❌ FALHO"}`);
  console.log(`Leitura de Dados: ${test2 ? "✅ OK" : "❌ FALHO"}`);
  console.log(`Service Account: ${test3 === null ? "⏭️ NÃO CONFIGURADO" : test3 ? "✅ OK" : "❌ FALHO"}`);

  if (test1 && test2) {
    console.log("\n✅ Credenciais funcionando! O problema pode ser:");
    console.log("   1. API_BASE_URL não está sendo usado corretamente");
    console.log("   2. Problema de CORS no servidor");
    console.log("   3. Rota /api/sheets/create-or-update não existe");
  } else {
    console.log("\n❌ Problema com credenciais do Google Sheets");
    console.log("   Verificar:");
    console.log("   1. EXPO_PUBLIC_GOOGLE_SHEETS_ID correto?");
    console.log("   2. EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY válida?");
    console.log("   3. Planilha é pública (leitura)?");
  }

  console.log("\n");
}

runTests().catch(console.error);
