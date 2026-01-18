#!/usr/bin/env node

/**
 * Script para criar a aba CONCORRENTES e inserir dados iniciais no Google Sheets
 * Execute com: node scripts/setup-concorrentes.js
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

// Dados dos concorrentes
const CONCORRENTES = [
  "00 00 60 KCL",
  "02 20 18",
  "02 28 20 TOPMIX",
  "03 21 21 CONV",
  "03 21 21 YARA BASA",
  "04 30 10",
  "05 25 25 CIBRA",
  "10 15 15",
  "11 52 00 MAP",
  "14 14 10 YARA TOPMIX",
  "22 10 10 YARAMILA PRATICALE",
  "ULEXITA",
];

async function getAccessToken() {
  const keyPath = path.resolve(KEY_FILE);
  const keyData = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const payload = Buffer.from(
    JSON.stringify({
      iss: keyData.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: exp,
      iat: now,
    })
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const message = `${header}.${payload}`;

  const { createPrivateKey } = require("crypto");
  const privateKey = createPrivateKey({
    key: keyData.private_key,
    format: "pem",
  });

  const signature = crypto.sign("sha256", Buffer.from(message), privateKey);
  const signatureB64 = signature.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const jwt = `${message}.${signatureB64}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  const data = await response.json();
  return data.access_token;
}

async function createConcorrentesSheet(accessToken) {
  console.log("📝 Criando aba CONCORRENTES...");

  const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`;

  const response = await fetch(batchUpdateUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: "CONCORRENTES",
              gridProperties: {
                rowCount: 100,
                columnCount: 1,
              },
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("⚠️ Erro ao criar aba (pode já existir):", error);
    return null;
  }

  const data = await response.json();
  console.log("✅ Aba CONCORRENTES criada com sucesso");
  return data;
}

async function addHeader(accessToken) {
  console.log("📋 Adicionando cabeçalho...");

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CONCORRENTES!A1:B1?valueInputOption=USER_ENTERED`;

  const response = await fetch(updateUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      values: [["CONCORRENTE", "ATIVO"]],
    }),
  });

  if (!response.ok) {
    console.error("❌ Erro ao adicionar cabeçalho");
    return false;
  }

  console.log("✅ Cabeçalho adicionado");
  return true;
}

async function addConcorrentes(accessToken) {
  console.log("📊 Adicionando concorrentes...");

  const rows = CONCORRENTES.map((conc) => [conc, "TRUE"]);
  const startRow = 2;

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CONCORRENTES!A${startRow}:B${startRow + rows.length - 1}?valueInputOption=USER_ENTERED`;

  const response = await fetch(updateUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      values: rows,
    }),
  });

  if (!response.ok) {
    console.error("❌ Erro ao adicionar concorrentes");
    return false;
  }

  console.log(`✅ ${CONCORRENTES.length} concorrentes adicionados`);
  return true;
}

async function main() {
  try {
    console.log("🚀 Iniciando setup de CONCORRENTES...\n");

    const accessToken = await getAccessToken();
    console.log("✅ Token de acesso obtido\n");

    await createConcorrentesSheet(accessToken);
    console.log();

    await addHeader(accessToken);
    console.log();

    await addConcorrentes(accessToken);
    console.log();

    console.log("✅ Setup concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

main();
