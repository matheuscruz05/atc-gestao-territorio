/**
 * Script para atualizar a estrutura da planilha Google Sheets
 * - Adiciona colunas à aba CADASTROS para suportar 5 categorias
 * - Adiciona colunas GC e GR à aba USUARIOS
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { createPrivateKey } from "crypto";

const SPREADSHEET_ID = "1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs";
const SA_KEY_PATH = path.join(__dirname, "../secrets/sa-key.json");

interface ServiceAccount {
  private_key: string;
  client_email: string;
}

function base64UrlEncode(str: Buffer | string): string {
  const buf = typeof str === "string" ? Buffer.from(str) : str;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 3600;

  // Create JWT header and payload
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: expiresAt,
      iat: now,
    })
  );

  const message = `${header}.${payload}`;

  // Sign with private key
  const privateKey = createPrivateKey({
    key: sa.private_key,
    format: "pem",
  });

  const signature = crypto.sign("sha256", Buffer.from(message), privateKey);
  const signatureB64 = base64UrlEncode(signature);

  const jwt = `${message}.${signatureB64}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function updateSheetsStructure() {
  try {
    const saKey: ServiceAccount = JSON.parse(fs.readFileSync(SA_KEY_PATH, "utf-8"));
    const accessToken = await getAccessToken(saKey);

    console.log("✅ Token obtido com sucesso");

    // 1. Atualizar cabeçalhos da aba CADASTROS
    console.log("\n📋 Atualizando cabeçalhos da aba CADASTROS...");

    const cadastrosHeaders = [
      ["CADASTRO_ID", "CRIADO_EM", "ATC_EMAIL", "ATC_NOME", "CANAL", "UNIDADE", "ESTADO"],
      // Categoria 1
      ["CAT1_CATEGORIA", "CAT1_PRODUTO_REF", "CAT1_PRODUTO_LIVRE", "CAT1_UNIDADE_POT", "CAT1_IMPLANTADO", "CAT1_POTENCIAL", "CAT1_CONCORRENTES", "CAT1_OBSERVACAO"],
      // Categoria 2
      ["CAT2_CATEGORIA", "CAT2_PRODUTO_REF", "CAT2_PRODUTO_LIVRE", "CAT2_UNIDADE_POT", "CAT2_IMPLANTADO", "CAT2_POTENCIAL", "CAT2_CONCORRENTES", "CAT2_OBSERVACAO"],
      // Categoria 3
      ["CAT3_CATEGORIA", "CAT3_PRODUTO_REF", "CAT3_PRODUTO_LIVRE", "CAT3_UNIDADE_POT", "CAT3_IMPLANTADO", "CAT3_POTENCIAL", "CAT3_CONCORRENTES", "CAT3_OBSERVACAO"],
      // Categoria 4
      ["CAT4_CATEGORIA", "CAT4_PRODUTO_REF", "CAT4_PRODUTO_LIVRE", "CAT4_UNIDADE_POT", "CAT4_IMPLANTADO", "CAT4_POTENCIAL", "CAT4_CONCORRENTES", "CAT4_OBSERVACAO"],
      // Categoria 5
      ["CAT5_CATEGORIA", "CAT5_PRODUTO_REF", "CAT5_PRODUTO_LIVRE", "CAT5_UNIDADE_POT", "CAT5_IMPLANTADO", "CAT5_POTENCIAL", "CAT5_CONCORRENTES", "CAT5_OBSERVACAO"],
    ];

    const flatHeaders = cadastrosHeaders.flat();

    const cadastrosUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CADASTROS!A1:AU1?valueInputOption=RAW`;

    const cadastrosResponse = await fetch(cadastrosUpdateUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [flatHeaders] }),
    });

    if (!cadastrosResponse.ok) {
      const error = await cadastrosResponse.text();
      throw new Error(`Erro ao atualizar CADASTROS: ${error}`);
    }

    console.log("✅ Cabeçalhos da aba CADASTROS atualizados");

    // Adicionar categorias fixas nas linhas 2+
    console.log("📋 Adicionando categorias fixas...");

    const categoriesData = [
      ["FERTILIZANTE - BASE"],
      ["FERTILIZANTES - COBERTURA"],
      ["BIOLÓGICOS - INOCULANTES"],
      ["BIOLÓGICOS - FOLIARES"],
      ["HIDROSSOLÚVEIS"],
    ];

    // Escrever categoria 1 na coluna H
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CADASTROS!H2:H6?valueInputOption=RAW`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: categoriesData }),
    });

    // Escrever categoria 2 na coluna P
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CADASTROS!P2:P6?valueInputOption=RAW`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: categoriesData }),
    });

    // Escrever categoria 3 na coluna X
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CADASTROS!X2:X6?valueInputOption=RAW`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: categoriesData }),
    });

    // Escrever categoria 4 na coluna AF
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CADASTROS!AF2:AF6?valueInputOption=RAW`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: categoriesData }),
    });

    // Escrever categoria 5 na coluna AN
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CADASTROS!AN2:AN6?valueInputOption=RAW`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: categoriesData }),
    });

    console.log("✅ Categorias fixas adicionadas");

    // 2. Atualizar cabeçalhos da aba USUARIOS
    console.log("\n👥 Atualizando cabeçalhos da aba USUARIOS...");

    const usuariosUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/USUARIOS!A1:G1?valueInputOption=RAW`;

    const usuariosResponse = await fetch(usuariosUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [["EMAIL", "NOME", "ROLE", "SENHA", "ATIVO", "GC", "GR"]],
      }),
    });

    if (!usuariosResponse.ok) {
      const error = await usuariosResponse.text();
      throw new Error(`Erro ao atualizar USUARIOS: ${error}`);
    }

    console.log("✅ Cabeçalhos da aba USUARIOS atualizados");

    console.log("\n🎉 Planilha atualizada com sucesso!");
    console.log("📋 Estrutura:");
    console.log("  - CADASTROS: 67 colunas (A-AU) com suporte para 5 categorias");
    console.log("  - USUARIOS: 7 colunas (A-G) com novas colunas GC e GR");
  } catch (error) {
    console.error("❌ Erro ao atualizar planilha:", error);
    process.exit(1);
  }
}

updateSheetsStructure();
