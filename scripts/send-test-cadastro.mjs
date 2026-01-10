import 'dotenv/config';
import fs from 'fs';
import { SignJWT } from 'jose';
import { createPrivateKey } from 'crypto';

// Ensure WebCrypto
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = await import('crypto');
  globalThis.crypto = webcrypto;
}

// Re-implement minimal send + sync flow using Sheets API to test write & read
async function loadSa() {
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  if (!keyFile) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_FILE not set');
  return JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
}

async function getToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/spreadsheets' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setIssuer(sa.client_email)
    .setAudience(sa.token_uri)
    .sign(createPrivateKey(sa.private_key));

  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const js = await res.json();
  if (!js.access_token) throw new Error('Failed to obtain access token: ' + JSON.stringify(js));
  return js.access_token;
}

(async () => {
  try {
    const spreadsheetId = process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID;
    if (!spreadsheetId) throw new Error('EXPO_PUBLIC_GOOGLE_SHEETS_ID not set');

    const sa = await loadSa();
    const token = await getToken(sa);

    const id = 'TEST-CAD-' + Date.now();
    const cadastro = [
      id,
      new Date().toISOString(),
      'test@atc.com',
      'Teste ATC',
      'Canal Teste',
      'Unidade Teste',
      'SP',
      'HIDROSSOLUVEIS',
      'PROD_TEST',
      'Produto Teste',
      'tons',
      'Não',
      1.5,
      'Nenhum',
      'Teste de sincronização',
    ];

    // Find next row using A:A
    const rowsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('CADASTROS!A:A')}`;
    const rowsRes = await fetch(rowsUrl, { headers: { Authorization: `Bearer ${token}` } });
    const rowsJson = await rowsRes.json();
    const nextRow = (rowsJson.values?.length || 1) + 1;

    const putRange = `CADASTROS!A${nextRow}:O${nextRow}`;
    const putUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(putRange)}?valueInputOption=RAW`;

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ values: [cadastro] }),
    });

    if (!putRes.ok) {
      console.error('PUT failed:', putRes.status, await putRes.text());
      process.exit(1);
    }

    console.log('WROTE ID', id);

    // Read back CADASTROS
    const range = 'CADASTROS!A2:O';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    const values = data.values || [];

    const found = values.find((row) => row[0] === id);
    console.log('FOUND AFTER WRITE?', !!found);
    if (found) console.log(found);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();