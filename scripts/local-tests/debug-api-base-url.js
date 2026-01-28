#!/usr/bin/env node

/**
 * Quick debug test - Verificar getApiBaseUrl()
 */

// Simular o que o código faz
const EXPO_PUBLIC_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_BASE_URL = process.env.API_BASE_URL;

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🔍 DEBUG: Valores de Environment Variables');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Variáveis carregadas pelo Node:');
console.log(`  EXPO_PUBLIC_API_BASE_URL: "${EXPO_PUBLIC_API_BASE_URL}"`);
console.log(`  API_BASE_URL: "${API_BASE_URL}"`);

// Simular getApiBaseUrl()
function getApiBaseUrl() {
  // If API_BASE_URL is set, use it
  if (EXPO_PUBLIC_API_BASE_URL) {
    return EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }
  
  // Fallback to empty (will use relative URL)
  return "";
}

const result = getApiBaseUrl();
console.log(`\ngetApiBaseUrl() retorna: "${result}"`);
console.log(`Tipo: ${typeof result}`);
console.log(`Vazio? ${result === ''}`);

if (result) {
  console.log(`✅ URL será: ${result}/api/sheets/create-or-update`);
} else {
  console.log(`❌ URL será relativa: /api/sheets/create-or-update`);
  console.log(`   (Isso causará 404 porque vai para localhost:8081)`);
}

console.log('\n═══════════════════════════════════════════════════════════\n');
