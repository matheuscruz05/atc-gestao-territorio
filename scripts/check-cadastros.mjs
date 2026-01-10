import 'dotenv/config';
import fs from 'fs';
import { SignJWT } from 'jose';
import { createPrivateKey } from 'crypto';

// Ensure WebCrypto
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
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/spreadsheets.readonly' })
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

    const range = 'CADASTROS!A2:O';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    const values = data.values || [];

    console.log(`Total rows in sheet: ${values.length}`);

    const counts = {};
    values.forEach((row, idx) => {
      const atcEmail = row[2] || '(empty)';
      counts[atcEmail] = (counts[atcEmail] || 0) + 1;
    });

    console.log('Counts by ATC Email:');
    console.log(counts);

    // also print rows for test@atc.com
    ['test@atc.com', 'atc1@exemplo.com'].forEach(email => {
      const rows = values.filter(row => (row[2] || '').toLowerCase() === email.toLowerCase());
      console.log(`Rows for ${email}: ${rows.length}`);
      rows.forEach((r, i) => console.log(i+1, r));
    });

  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();