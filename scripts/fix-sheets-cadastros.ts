import 'dotenv/config';
import fs from 'fs';
import { SignJWT } from 'jose';

if (typeof (globalThis as any).crypto === 'undefined') {
  (globalThis as any).crypto = require('crypto').webcrypto;
}

async function loadSa() {
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || './atc-gestao-territorio-483803-57f324cd3ac8.json';
  const raw = fs.readFileSync(keyFile, 'utf-8');
  return JSON.parse(raw);
}

async function getToken(sa: any) {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/spreadsheets' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setIssuer(sa.client_email)
    .setAudience(sa.token_uri)
    .sign(require('crypto').createPrivateKey(sa.private_key));

  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const js = await res.json();
  return js.access_token;
}

function looksLikeCadastroId(s: any) {
  if (!s || typeof s !== 'string') return false;
  return /-CAD-|^TEST-?CAD-|^UX-CAD-|^ATC-CAD-/i.test(s);
}

(async () => {
  const sa = await loadSa();
  const token = await getToken(sa);
  console.log('TOKEN READY', !!token);

  const spreadsheetId = process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    console.error('Set EXPO_PUBLIC_GOOGLE_SHEETS_ID in env');
    process.exit(1);
  }

  const range = 'CADASTROS!A2:O';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) {
    console.error('Failed to fetch sheet', r.status, await r.text());
    process.exit(1);
  }

  const data = await r.json();
  const values: any[][] = data.values || [];

  console.log(`Rows to inspect: ${values.length}`);

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (!looksLikeCadastroId(row[0]) && looksLikeCadastroId(row[1])) {
      // Row appears shifted right by one column -> shift left
      const shifted = [] as any[];
      // Copy columns B..P into A..O (max 15 cols)
      for (let j = 1; j <= 15; j++) {
        shifted.push(row[j] || "");
      }

      const sheetRowIndex = i + 2; // because we started at A2
      const putRange = `CADASTROS!A${sheetRowIndex}:O${sheetRowIndex}`;
      const putUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(putRange)}?valueInputOption=RAW`;

      console.log(`Row ${sheetRowIndex} appears shifted — writing corrected row:`);
      console.log(JSON.stringify(shifted));

      if (process.env.DRY_RUN === 'true') {
        console.log('DRY RUN - not applying changes');
        continue;
      }

      const putRes = await fetch(putUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ values: [shifted] }),
      });

      if (!putRes.ok) {
        console.error(`Failed to fix row ${sheetRowIndex}:`, putRes.status, await putRes.text());
      } else {
        console.log(`Row ${sheetRowIndex} fixed.`);
      }
    }
  }

  console.log('Finished.');
})();
