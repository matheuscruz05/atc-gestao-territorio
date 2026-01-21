import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { createPrivateKey } from "crypto";

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

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

function loadServiceAccount(): ServiceAccount | null {
  // Opção 1: Tentar JSON environment variable (produção Vercel preferido)
  const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    try {
      const sa = JSON.parse(jsonEnv);
      console.log("[Sheets] ✅ Carregado Service Account de GOOGLE_SERVICE_ACCOUNT_JSON");
      return sa;
    } catch (e) {
      console.error("[Sheets] ERROR: GOOGLE_SERVICE_ACCOUNT_JSON não é JSON válido", e);
    }
  }

  // Opção 2: Tentar arquivo local (desenvolvimento)
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  if (keyFile) {
    try {
      const fullPath = path.resolve(keyFile);
      const raw = fs.readFileSync(fullPath, "utf-8");
      const sa = JSON.parse(raw);
      console.log("[Sheets] ✅ Carregado Service Account de GOOGLE_SERVICE_ACCOUNT_KEY_FILE");
      return sa;
    } catch (e) {
      console.error("[Sheets] ERROR: Could not read GOOGLE_SERVICE_ACCOUNT_KEY_FILE", e);
    }
  }

  console.error("[Sheets] ERROR: Service account não configurado!");
  console.error("[Sheets] Defina uma destas variáveis:");
  console.error("[Sheets]   - GOOGLE_SERVICE_ACCOUNT_JSON (JSON string, recomendado produção)");
  console.error("[Sheets]   - GOOGLE_SERVICE_ACCOUNT_KEY_FILE (caminho arquivo, desenvolvimento)");
  return null;
}

function getSpreadsheetId(): string {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID ||
    process.env.GOOGLE_SHEETS_ID ||
    ""
  );
}

async function findRowByCadastroId(
  spreadsheetId: string,
  accessToken: string,
  cadastroId: string
): Promise<number | null> {
  const response = await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/CADASTROS`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    console.warn(`Failed to fetch data: ${response.statusText}`);
    return null;
  }

  const data: any = await response.json();
  const rows = data.values || [];

  console.log(`[Sheets] Procurando cadastroId "${cadastroId}" em ${rows.length} linhas`);

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === cadastroId) {
      console.log(`[Sheets] ✅ Encontrado cadastroId "${cadastroId}" na linha ${i + 1}`);
      return i + 1; // Sheets uses 1-based indexing
    }
  }

  console.log(`[Sheets] ❌ cadastroId "${cadastroId}" NÃO encontrado - será INSERT`);
  return null;
}

async function appendCadastroToSheets(
  spreadsheetId: string,
  accessToken: string,
  cadastroRow: any[]
): Promise<void> {
  const response = await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/CADASTROS/append?valueInputOption=RAW`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        values: [cadastroRow],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to append: ${error.error?.message || response.statusText}`);
  }
}

async function updateCadastroInSheets(
  spreadsheetId: string,
  accessToken: string,
  rowIndex: number,
  cadastroRow: any[]
): Promise<void> {
  const range = `CADASTROS!A${rowIndex}:K${rowIndex}`;
  
  const response = await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        values: [cadastroRow],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update: ${error.error?.message || response.statusText}`);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { cadastroId, categorias, atcEmail, atcNome, canal, unidade, estado, criadoEm, editadoEm, historico, deletado } = req.body;

    console.log(`[Sheets Handler] Recebido: cadastroId=${cadastroId}, editadoEm=${editadoEm}`);

    if (!cadastroId) {
      return res.status(400).json({ success: false, error: "cadastroId is required" });
    }

    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      console.error("[Sheets Handler] ❌ GOOGLE_SHEETS_ID não configurado");
      return res.status(500).json({ 
        success: false, 
        error: "GOOGLE_SHEETS_ID not configured",
        details: "Configure EXPO_PUBLIC_GOOGLE_SHEETS_ID no Vercel Dashboard"
      });
    }

    const sa = loadServiceAccount();
    if (!sa) {
      console.error("[Sheets Handler] ❌ Service account não configurado");
      return res.status(500).json({ 
        success: false, 
        error: "Service account not configured",
        details: "Configure GOOGLE_SERVICE_ACCOUNT_JSON no Vercel Dashboard (JSON completo do arquivo service account)"
      });
    }

    const accessToken = await getAccessToken(sa);

    // Construir a linha do cadastro
    const cadastroRow = [
      cadastroId,
      atcEmail,
      atcNome,
      canal,
      unidade,
      estado,
      criadoEm,
      editadoEm || "",
      deletado ? "true" : "false",
      JSON.stringify(categorias || []),
      JSON.stringify(historico || []),
    ];

    // Verificar se já existe
    const existingRowIndex = await findRowByCadastroId(spreadsheetId, accessToken, cadastroId);

    if (existingRowIndex !== null) {
      // UPDATE: Atualizar linha existente
      console.log(`[Sheets Handler] UPDATE: Atualizando linha ${existingRowIndex} para cadastroId=${cadastroId}`);
      await updateCadastroInSheets(spreadsheetId, accessToken, existingRowIndex, cadastroRow);
      console.log(`[Sheets Handler] ✅ UPDATE sucesso para cadastroId=${cadastroId}`);
      return res.status(200).json({ 
        success: true, 
        message: "Cadastro atualizado com sucesso",
        method: "UPDATE",
        rowIndex: existingRowIndex
      });
    } else {
      // INSERT: Adicionar nova linha
      console.log(`[Sheets Handler] INSERT: Adicionando novo cadastro cadastroId=${cadastroId}`);
      await appendCadastroToSheets(spreadsheetId, accessToken, cadastroRow);
      console.log(`[Sheets Handler] ✅ INSERT sucesso para cadastroId=${cadastroId}`);
      return res.status(200).json({ 
        success: true, 
        message: "Cadastro criado com sucesso",
        method: "INSERT"
      });
    }
  } catch (error) {
    console.error("[Sheets Handler] Erro ao sincronizar cadastro:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to sync cadastro",
      message: String(error),
    });
  }
}
