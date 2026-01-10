import 'dotenv/config';
import fs from 'fs';
import { SignJWT } from 'jose';
import { createPrivateKey } from 'crypto';

if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = await import('crypto');
  globalThis.crypto = webcrypto;
}

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
  return js.access_token;
}

(async () => {
  try {
    const spreadsheetId = process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID;
    const sa = await loadSa();
    const token = await getToken(sa);

    const headerRange = 'CADASTROS!A1:O1';
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(headerRange)}`;
    const hres = await fetch(headerUrl, { headers: { Authorization: `Bearer ${token}` } });
    const headerData = await hres.json();
    const header = (headerData.values && headerData.values[0]) || [];
    console.log('Current header:', header);

    const newHeader = ['CADASTRO_ID', ...header].slice(0, 15);
    console.log('Applying header:', newHeader);

    const putUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(headerRange)}?valueInputOption=RAW`;
    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ values: [newHeader] }),
    });
    console.log('PUT status:', putRes.status);
    console.log('PUT body:', await putRes.text());

    const verify = await fetch(headerUrl, { headers: { Authorization: `Bearer ${token}` } });
    const verifyData = await verify.json();
    console.log('Header after PUT:', (verifyData.values && verifyData.values[0]) || []);
  } catch (e) {
    console.error(e);
  }
})();