import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { createPrivateKey } from "crypto";

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

function getSpreadsheetId(): string {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID ||
    process.env.GOOGLE_SHEETS_ID ||
    ""
  );
}

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
  // Tenta carregar JSON direto da env var (produção Vercel)
  const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  
  if (!jsonEnv) {
    console.error("[Sheets] ERROR: GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_KEY_FILE not configured");
    return null;
  }

  try {
    // Tenta parsear diretamente como JSON
    const sa = JSON.parse(jsonEnv);
    console.log("[Sheets] ✅ Service Account carregado com sucesso");
    return sa;
  } catch (parseError) {
    // Se falhar, tenta como caminho de arquivo (desenvolvimento local)
    try {
      const fullPath = path.resolve(jsonEnv);
      const raw = fs.readFileSync(fullPath, "utf-8");
      const sa = JSON.parse(raw);
      console.log("[Sheets] ✅ Service Account carregado de arquivo");
      return sa;
    } catch (fileError) {
      console.error("[Sheets] ERROR: Não foi possível carregar Service Account:", fileError);
      return null;
    }
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, error: "Missing id" });
  }

  try {
    console.log("[Sheets][Vercel] DELETE /cadastros/:id", id);

    const sa = loadServiceAccount();
    if (!sa) {
      return res.status(500).json({ success: false, error: "Service Account not configured" });
    }

    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      return res.status(500).json({ success: false, error: "SPREADSHEET_ID not configured" });
    }

    const accessToken = await getAccessToken(sa);

    // Buscar ID na coluna A
    const range = "CADASTROS!A:A";
    const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();

    if (!data.values || data.values.length <= 1) {
      return res.json({ success: true });
    }

    const dataRows: string[][] = data.values.slice(1);
    const rowIndex = dataRows.findIndex((row) => row[0] === id);
    if (rowIndex === -1) {
      return res.json({ success: true });
    }

    const sheetRow = rowIndex + 2; // +2 => pula cabeçalho
    const deleteRange = `CADASTROS!A${sheetRow}:H${sheetRow}`;
    const clearUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/${deleteRange}:clear`;

    const clearResp = await fetch(clearUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!clearResp.ok) {
      const text = await clearResp.text();
      console.error("[Sheets][Vercel] Erro ao limpar linha:", clearResp.status, text);
      return res.status(500).json({ success: false, error: "Failed to clear row" });
    }

    console.log("[Sheets][Vercel] ✅ Cadastro deletado na linha", sheetRow);
    return res.json({ success: true });
  } catch (error) {
    console.error("[Sheets][Vercel] Erro ao deletar cadastro:", error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
