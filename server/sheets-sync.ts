/**
 * Server-side Google Sheets Sync Routes
 * Usa Service Account para autenticação (só funciona no servidor)
 */

import { Router } from "express";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { createPrivateKey } from "crypto";

const router = Router();

// Read spreadsheet ID at runtime to ensure dotenv has loaded
function getSpreadsheetId(): string {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID ||
    process.env.GOOGLE_SHEETS_ID ||
    ""
  );
}

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
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  
  console.log("[Sheets] Loading Service Account...");
  console.log("[Sheets] GOOGLE_SERVICE_ACCOUNT_KEY_FILE:", keyFile);
  
  if (!keyFile) {
    console.error("[Sheets] ERROR: GOOGLE_SERVICE_ACCOUNT_KEY_FILE not configured");
    return null;
  }

  try {
    const fullPath = path.resolve(keyFile);
    console.log("[Sheets] Trying to read file:", fullPath);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const sa = JSON.parse(raw);
    console.log("[Sheets] ✅ Service Account loaded successfully");
    console.log("[Sheets] Client Email:", sa.client_email);
    return sa;
  } catch (e) {
    console.error("[Sheets] ERROR: Could not read GOOGLE_SERVICE_ACCOUNT_KEY_FILE", e);
    return null;
  }
}

function normalizeCategorias(cadastro: any) {
  // Mantém todas as categorias enviadas, sem truncar nem preencher com placeholders
  if (!cadastro || !Array.isArray(cadastro.categorias)) return [];
  return cadastro.categorias;
}

const implantadoFlag = (value: any) => {
  if (value === true) return "SIM";
  const lower = String(value || "").toLowerCase();
  return lower === "sim" ? "SIM" : "NÃO";
};

// POST /api/sheets/cadastros - Envia um cadastro para a planilha
router.post("/cadastros", async (req, res) => {
  console.log("[Sheets] POST /cadastros - Recebendo cadastro...");
  
  try {
    const cadastro = req.body;
    const categorias = normalizeCategorias(cadastro);

    if (!cadastro || !cadastro.cadastroId) {
      console.error("[Sheets] Erro: Invalid cadastro data");
      return res.status(400).json({ success: false, error: "Invalid cadastro data" });
    }

    console.log("[Sheets] Cadastro ID:", cadastro.cadastroId);
    console.log("[Sheets] Canal:", cadastro.canal);
    console.log("[Sheets] Categorias:", cadastro.categorias?.length || 0);

    const sa = loadServiceAccount();
    if (!sa) {
      console.error("[Sheets] Erro: Service Account not configured");
      return res.status(500).json({ success: false, error: "Service Account not configured" });
    }

    console.log("[Sheets] Gerando access token...");
    const accessToken = await getAccessToken(sa);
    console.log("[Sheets] ✅ Access token obtido");

    // Preparar dados base (colunas A-G)
    const baseRow = [
      cadastro.cadastroId,
      cadastro.criadoEm,
      cadastro.atcEmail,
      cadastro.atcNome,
      cadastro.canal,
      cadastro.unidade,
      cadastro.estado,
    ];

    // Salvar todas as categorias em JSON (coluna H)
    const categoriasJson = JSON.stringify(categorias || []);
    const row = [...baseRow, categoriasJson];

    console.log("[Sheets] Preparando dados para envio...");
    console.log("[Sheets] Total de colunas:", row.length);

    // UPSERT: Verificar se cadastro já existe para atualizar em vez de duplicar
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      console.error("[Sheets] ERROR: SPREADSHEET_ID not configured");
      return res.status(500).json({ success: false, error: "SPREADSHEET_ID not configured" });
    }
    const rowsRange = "CADASTROS!A:A";
    const rowsUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/${rowsRange}`;
    console.log("[Sheets] SPREADSHEET_ID:", spreadsheetId);
    console.log("[Sheets] rowsUrl:", rowsUrl);
    
    console.log("[Sheets] Buscando cadastros existentes...");
    const rowsRes = await fetch(rowsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const rowsData = await rowsRes.json();
    const existingRows = rowsData.values || [];
    
    // Procurar se cadastro já existe (verifica coluna A - cadastroId)
    let existingRowIndex = -1;
    for (let i = 0; i < existingRows.length; i++) {
      if (existingRows[i]?.[0] === cadastro.cadastroId) {
        existingRowIndex = i;
        break;
      }
    }
    
    let targetRow: number;
    if (existingRowIndex >= 0) {
      // UPDATE: Cadastro já existe
      targetRow = existingRowIndex + 1; // +1 porque a linha 1 é header
      console.log("[Sheets] ✏️ Cadastro já existe na linha:", targetRow, "- Atualizando...");
    } else {
      // INSERT: Cadastro não existe
      targetRow = existingRows.length + 1; // Próxima linha vazia
      console.log("[Sheets] ✨ Cadastro novo - Inserindo na linha:", targetRow);
    }

    // Proteção: nunca escrever na linha 1 (cabeçalho)
    if (targetRow < 2) targetRow = 2;

    // Enviar dados (PUT funciona tanto para insert quanto update)
    const insertRange = `CADASTROS!A${targetRow}:H${targetRow}`;
    const insertUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/${insertRange}?valueInputOption=RAW`;
    console.log("[Sheets] insertUrl:", insertUrl);

    console.log("[Sheets] Enviando para Google Sheets...");
    console.log("[Sheets] Range:", insertRange);
    
    const putResponse = await fetch(insertUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ values: [row] }),
    });

    if (!putResponse.ok) {
      const text = await putResponse.text();
      console.error("[Sheets] Erro ao enviar:", putResponse.status, text);
      throw new Error(`HTTP error! status: ${putResponse.status} body: ${text}`);
    }

    const operacao = existingRowIndex >= 0 ? "atualizado" : "inserido";
    console.log(`[Sheets] ✅ Cadastro ${operacao} com sucesso na linha ${targetRow}!`);
    return res.json({ 
      success: true, 
      message: `Cadastro ${operacao} com sucesso`,
      rowIndex: targetRow,
      isUpdate: existingRowIndex >= 0
    });
  } catch (error) {
    console.error("[Sheets] ERRO ao enviar cadastro:", error);
    return res.status(500).json({ success: false, error: String(error) });
  }
});

// POST /api/sheets/cadastros/bulk - Envia múltiplos cadastros
router.post("/cadastros/bulk", async (req, res) => {
  console.log("[Sheets] POST /cadastros/bulk - Recebendo cadastros...");
  
  try {
    const { cadastros } = req.body;

    if (!cadastros || !Array.isArray(cadastros)) {
      console.error("[Sheets] Erro: Invalid cadastros data");
      return res.status(400).json({ success: false, error: "Invalid cadastros data" });
    }

    console.log("[Sheets] Total de cadastros:", cadastros.length);

    const sa = loadServiceAccount();
    if (!sa) {
      console.error("[Sheets] Erro: Service Account not configured");
      return res.status(500).json({ success: false, error: "Service Account not configured" });
    }

    console.log("[Sheets] Gerando access token...");
    const accessToken = await getAccessToken(sa);
    console.log("[Sheets] ✅ Access token obtido");

    const rows = cadastros.map((cadastro: any) => {
      const categorias = normalizeCategorias(cadastro);
      const baseRow = [
        cadastro.cadastroId,
        cadastro.criadoEm,
        cadastro.atcEmail,
        cadastro.atcNome,
        cadastro.canal,
        cadastro.unidade,
        cadastro.estado,
      ];

      const categoriasJson = JSON.stringify(categorias || []);

      return [...baseRow, categoriasJson];
    });

    // Obter todas as linhas existentes para fazer UPSERT
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      console.error("[Sheets] ERROR: SPREADSHEET_ID not configured");
      return res.status(500).json({ success: false, error: "SPREADSHEET_ID not configured" });
    }
    const rowsRange = "CADASTROS!A:A";
    const rowsUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/${rowsRange}`;
    console.log("[Sheets] SPREADSHEET_ID:", spreadsheetId);
    console.log("[Sheets] rowsUrl:", rowsUrl);
    
    console.log("[Sheets] Buscando cadastros existentes para UPSERT...");
    const rowsRes = await fetch(rowsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const rowsData = await rowsRes.json();
    const existingRows = rowsData.values || [];
    
    // Proteção: Garantir que existingRows tem pelo menos o cabeçalho
    // Se a planilha está vazia ou só tem cabeçalho, começar da linha 2
    const hasHeader = existingRows.length > 0;
    const dataRows = hasHeader ? existingRows.slice(1) : []; // Ignorar linha 1 (cabeçalho)
    
    // Construir mapa de cadastros existentes: cadastroId -> rowIndex (baseado em dataRows)
    const existingMap = new Map<string, number>();
    for (let i = 0; i < dataRows.length; i++) {
      const cadastroId = dataRows[i]?.[0];
      if (cadastroId) {
        // rowIndex é relativo aos dados (sem cabeçalho), mas usaremos i+2 para linha do Sheets
        existingMap.set(cadastroId, i + 2); // +2 porque linha 1 é cabeçalho e linhas começam em 1
      }
    }

    console.log("[Sheets] Mapa de cadastros existentes criado, total:", existingMap.size);

    // Processar cada cadastro - UPDATE ou INSERT
    let updates = 0;
    let inserts = 0;

    for (let j = 0; j < cadastros.length; j++) {
      const cadastro = cadastros[j];
      const rowData = rows[j];
      const existingRowNumber = existingMap.get(cadastro.cadastroId);
      
      // Se cadastro já existe, usar a linha dele; senão, adicionar no final (após última linha de dados)
      const targetRow = existingRowNumber !== undefined ? existingRowNumber : (dataRows.length + inserts + 2);
      const operacao = existingRowNumber !== undefined ? "UPDATE" : "INSERT";
      
      console.log(`[Sheets] ${operacao} cadastro ${cadastro.cadastroId} na linha ${targetRow}`);

      const insertRange = `CADASTROS!A${targetRow}:H${targetRow}`;
      const insertUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/${insertRange}?valueInputOption=RAW`;

      const putResponse = await fetch(insertUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ values: [rowData] }),
      });

      if (!putResponse.ok) {
        const text = await putResponse.text();
        console.error(`[Sheets] Erro ao ${operacao} cadastro ${cadastro.cadastroId}:`, putResponse.status, text);
        throw new Error(`HTTP error on ${operacao}! status: ${putResponse.status}`);
      }

      if (existingRowNumber !== undefined) {
        updates++;
      } else {
        inserts++;
      }
    }

    console.log(`[Sheets] ✅ Sincronização concluída: ${updates} atualizados, ${inserts} inseridos`);
    return res.json({
      success: true,
      message: `Sincronização concluída: ${updates} atualizados, ${inserts} inseridos`,
      updates,
      inserts,
      total: cadastros.length,
    });
  } catch (error) {
    console.error("Erro ao enviar cadastros:", error);
    return res.status(500).json({ success: false, error: String(error) });
  }
});

// DELETE /api/sheets/cadastros/:id - Deleta um cadastro
router.delete("/cadastros/:id", async (req, res) => {
  try {
    console.log("[Sheets] DELETE /cadastros/:id - Recebendo requisição...");
    const { id } = req.params;
    console.log("[Sheets] ID do cadastro:", id);

    console.log("[Sheets] Loading Service Account...");
    const sa = loadServiceAccount();
    if (!sa) {
      console.error("[Sheets] ❌ Service Account not configured");
      return res.status(500).json({ success: false, error: "Service Account not configured" });
    }

    console.log("[Sheets] Gerando access token...");
    const accessToken = await getAccessToken(sa);
    console.log("[Sheets] ✅ Access token obtido");

    // Buscar o cadastro
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId) {
      console.error("[Sheets] ERROR: SPREADSHEET_ID not configured");
      return res.status(500).json({ success: false, error: "SPREADSHEET_ID not configured" });
    }
    const range = "CADASTROS!A:A";
    const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}`;
    
    console.log("[Sheets] Buscando linha do cadastro...");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();

    if (!data.values || data.values.length <= 1) {
      // Se não tem valores ou só tem cabeçalho
      console.log("[Sheets] Planilha vazia ou só com cabeçalho");
      return res.json({ success: true });
    }

    // Ignorar linha 1 (cabeçalho) na busca
    const dataRows = data.values.slice(1);
    const rowIndex = dataRows.findIndex((row: string[]) => row[0] === id);

    if (rowIndex === -1) {
      console.log("[Sheets] Cadastro não encontrado na planilha");
      return res.json({ success: true });
    }

    // +2 porque: dataRows começa do índice 0, mas linha 1 é cabeçalho e Sheets começa em 1
    const sheetRow = rowIndex + 2;
    console.log("[Sheets] Cadastro encontrado na linha:", sheetRow);

    // Limpar a linha usando endpoint de clear (remove todos os valores do range)
    const deleteRange = `CADASTROS!A${sheetRow}:H${sheetRow}`;
    const clearUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/${deleteRange}:clear`;

    console.log("[Sheets] Limpando linha com clear API...");
    const clearResponse = await fetch(clearUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!clearResponse.ok) {
      const text = await clearResponse.text();
      console.warn("[Sheets] ⚠️ Erro ao deletar cadastro, body:", text);
    } else {
      console.log("[Sheets] ✅ Cadastro excluído com sucesso!");
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[Sheets] Erro ao deletar cadastro:", error);
    return res.json({ success: true }); // Retorna sucesso mesmo com erro
  }
});

export { router as sheetsRouter };
