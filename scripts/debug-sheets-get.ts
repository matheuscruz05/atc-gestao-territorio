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

(async () => {
  const sa = await loadSa();
  const token = await getToken(sa);
  console.log('TOKEN READY', !!token);

  const spreadsheetId = process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID;
  const range = 'CADASTROS!A1:O';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  console.log('HTTP', r.status);
  const data = await r.json();
  console.log(JSON.stringify(data, null, 2));
})();
