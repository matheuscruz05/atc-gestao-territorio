#!/usr/bin/env node

/**
 * Script para proteger os cabeçalhos das abas CADASTROS e CONCORRENTES
 * Execute com: node scripts/protect-headers.js
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Carregar variáveis de ambiente
require("dotenv").config();

const SPREADSHEET_ID = process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID;
const KEY_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;

if (!SPREADSHEET_ID) {
  console.error("❌ EXPO_PUBLIC_GOOGLE_SHEETS_ID não configurado");
  process.exit(1);
}

if (!KEY_FILE) {
  console.error("❌ GOOGLE_SERVICE_ACCOUNT_KEY_FILE não configurado");
  process.exit(1);
}

async function getAccessToken() {
  const keyPath = path.resolve(KEY_FILE);
  const keyData = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: keyData.private_key_id,
  };

  const payload = {
    iss: keyData.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp,
    iat: now,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const message = `${headerB64}.${payloadB64}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(message);
  const signature = signer.sign(keyData.private_key, "base64url");
  const token = `${message}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error(`Falha ao obter token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

async function getSheetIds() {
  const token = await getAccessToken();

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await response.json();
  const sheets = {};

  data.sheets.forEach((sheet) => {
    sheets[sheet.properties.title] = sheet.properties.sheetId;
  });

  return sheets;
}

async function protectHeaders() {
  const token = await getAccessToken();
  const sheetIds = await getSheetIds();

  console.log("🚀 Iniciando proteção de cabeçalhos...\n");

  const requests = [];

  // Proteger linha 1 de CADASTROS
  if (sheetIds.CADASTROS !== undefined) {
    console.log("📝 Protegendo cabeçalho de CADASTROS (linha 1)...");
    requests.push({
      addProtectedRange: {
        protectedRange: {
          sheetId: sheetIds.CADASTROS,
          name: "CADASTROS Header",
          description: "Cabeçalho protegido - Não editar",
          range: {
            sheetId: sheetIds.CADASTROS,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
          },
          warningOnly: false,
          requestingUserCanEdit: false,
          editors: {
            users: [],
            groups: [],
            domainUsersCanEdit: false,
          },
        },
      },
    });
  }

  // Proteger linha 1 de CONCORRENTES
  if (sheetIds.CONCORRENTES !== undefined) {
    console.log("📝 Protegendo cabeçalho de CONCORRENTES (linha 1)...");
    requests.push({
      addProtectedRange: {
        protectedRange: {
          sheetId: sheetIds.CONCORRENTES,
          name: "CONCORRENTES Header",
          description: "Cabeçalho protegido - Não editar",
          range: {
            sheetId: sheetIds.CONCORRENTES,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
          },
          warningOnly: false,
          requestingUserCanEdit: false,
          editors: {
            users: [],
            groups: [],
            domainUsersCanEdit: false,
          },
        },
      },
    });
  }

  if (requests.length === 0) {
    console.log("⚠️  Nenhuma aba encontrada para proteger");
    return;
  }

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    }
  );

  const result = await response.json();

  if (result.error) {
    console.error("❌ Erro ao proteger cabeçalhos:", result.error.message);
    process.exit(1);
  }

  console.log("\n✅ Cabeçalhos protegidos com sucesso!");
}

protectHeaders().catch((error) => {
  console.error("❌ Erro:", error.message);
  process.exit(1);
});
