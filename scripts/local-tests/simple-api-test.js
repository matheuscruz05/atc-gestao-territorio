#!/usr/bin/env node

/**
 * Simple HTTP test - Test if API server is responding
 */

const http = require('http');

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing API Server...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing /api/health endpoint...');
    const health = await makeRequest('GET', '/api/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Body: ${health.body.substring(0, 100)}`);
    console.log(`   ✅ Server is responding!\n`);
    
    // Test 2: POST to sheets endpoint with simple test data
    console.log('2️⃣ Testing /api/sheets/create-or-update endpoint...');
    const testData = {
      cadastroId: 'test-' + Date.now(),
      nome: 'Test Cadastro',
      atc: 'TEST-ATC',
      canal: 'Direct',
      unidade: 'Test Unit',
      atcEmail: 'test@example.com'
    };
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/sheets/create-or-update',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(testData))
      }
    };

    await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response: ${data.substring(0, 200)}...`);
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`   ✅ POST accepted!\n`);
          } else {
            console.log(`   ⚠️ Got status ${res.statusCode}\n`);
          }
          resolve();
        });
      });

      req.on('error', (e) => {
        console.log(`   ❌ Error: ${e.message}\n`);
        reject(e);
      });
      
      req.write(JSON.stringify(testData));
      req.end();
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

test();
