import 'dotenv/config';
import fs from 'fs';
import { SignJWT } from 'jose';
import { createPrivateKey } from 'crypto';

// Ensure WebCrypto is available for jose in Node
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = await import('crypto');
  globalThis.crypto = webcrypto;
}

function looksLikeCadastroId(s) {
  if (!s || typeof s !== 'string') return false;
  return /-CAD-|^TEST-?CAD-|^UX-CAD-|^ATC-CAD-/i.test(s);
}

async function loadSa() {
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  if (!keyFile) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_FILE not set');
  const raw = fs.readFileSync(keyFile, 'utf-8');
  return JSON.parse(raw);
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
    if (!spreadsheetId) {
      console.error('Set EXPO_PUBLIC_GOOGLE_SHEETS_ID in env');
      process.exit(1);
    }

    const sa = await loadSa();
    const token = await getToken(sa);

    const range = 'CADASTROS!A2:O';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      console.error('Failed to fetch sheet', r.status, await r.text());
      process.exit(1);
    }

    const data = await r.json();
    const values = data.values || [];

    // Fetch header row for inspection
    const headerRange = 'CADASTROS!A1:O1';
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(headerRange)}`;
    const hr = await fetch(headerUrl, { headers: { Authorization: `Bearer ${token}` } });
    const headerData = await hr.json();
    const header = (headerData.values && headerData.values[0]) || [];

    if (process.env.DEBUG === 'true') {
      console.log('Header row:', JSON.stringify(header));
      for (let i = 0; i < Math.min(values.length, 6); i++) {
        console.log(`Row ${i + 2}:`, JSON.stringify(values[i]));
      }
    }

    console.log(`Rows to inspect: ${values.length}`);

    // Detect header missing first column but data present in column A (i.e., header starts at B)
    const headerHasId = header[0] && /id|cadastro/i.test(header[0]);
    const col0LooksLikeIdCount = values.reduce((acc, row) => acc + (looksLikeCadastroId(row[0]) ? 1 : 0), 0);

    if (!headerHasId && col0LooksLikeIdCount >= Math.max(1, Math.floor(values.length / 2))) {
      console.log(`Detected that header is missing cadastro ID column while column A contains ${col0LooksLikeIdCount}/${values.length} ids.`);

      if (process.env.DRY_RUN === 'true') {
        console.log('DRY_RUN: recommend adding header `CADASTRO_ID` in A1 (shift header right) to align with IDs in column A.');
      } else {
        // Corrective action: prepend header with CADASTRO_ID so headers align with data in column A
        const newHeader = ['CADASTRO_ID', ...(header || [])].slice(0, 15);
        const headerPutRange = `CADASTROS!A1:O1`;
        const headerPutUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(headerPutRange)}?valueInputOption=RAW`;

        const putRes = await fetch(headerPutUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ values: [newHeader] }),
        });

        if (!putRes.ok) {
          console.error('Failed to update header row:', putRes.status, await putRes.text());
        } else {
          console.log('Header updated to include CADASTRO_ID as first column.');
        }
      }

      // After attempting fix, exit
      console.log('Finished detection for missing header id column.');
      process.exit(0);
    }


    // 1) detect rows that are shifted and fix them (ID in B instead of A)
    let found = 0;
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      if (!looksLikeCadastroId(row[0]) && looksLikeCadastroId(row[1])) {
        found++;
        const sheetRowIndex = i + 2;
        const shifted = [];
        for (let j = 1; j <= 15; j++) {
          shifted.push(row[j] || "");
        }
        console.log(`Row ${sheetRowIndex} appears shifted — proposed corrected row:`);
        console.log(JSON.stringify(shifted));

        if (process.env.DRY_RUN === 'true') continue;

        const putRange = `CADASTROS!A${sheetRowIndex}:O${sheetRowIndex}`;
        const putUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(putRange)}?valueInputOption=RAW`;

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

    if (found === 0) console.log('No shifted rows detected.');
    else console.log(`Detected and ${process.env.DRY_RUN === 'true' ? 'previewed' : 'fixed'} ${found} rows.`);

    // 2) detect rows missing cadastroId (first column looks like timestamp) and generate ids
    const missingIdRows = [];
    for (let i = 0; i < values.length; i++) {
      const first = values[i][0];
      const firstLooksLikeId = looksLikeCadastroId(first);
      const firstLooksLikeTimestamp = typeof first === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(first);
      if (!firstLooksLikeId && firstLooksLikeTimestamp) {
        missingIdRows.push(i);
      }
    }

    if (missingIdRows.length === 0) {
      console.log('No rows missing cadastroId detected.');
    } else {
      console.log(`Detected ${missingIdRows.length} rows missing cadastroId — generating IDs for them.`);
      for (const i of missingIdRows) {
        const sheetRowIndex = i + 2;
        const generatedId = `AUTOGEN-CAD-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        console.log(`Row ${sheetRowIndex} will receive ID ${generatedId}`);

        if (process.env.DRY_RUN === 'true') {
          continue;
        }

        const putRange = `CADASTROS!A${sheetRowIndex}:A${sheetRowIndex}`;
        const putUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(putRange)}?valueInputOption=RAW`;
        const putRes = await fetch(putUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ values: [[generatedId]] }),
        });

        if (!putRes.ok) {
          console.error(`Failed to write generated id for row ${sheetRowIndex}:`, putRes.status, await putRes.text());
        } else {
          console.log(`Row ${sheetRowIndex} id set to ${generatedId}`);
        }
      }
    }
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
