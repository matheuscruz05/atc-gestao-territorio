/**
 * Serviço de sincronização com Google Sheets API v4
 * 
 * Este módulo implementa a integração completa com Google Sheets:
 * - Sincronização de dados de referência (USUARIOS, PRODUTOS, CANAIS, UNIDADES)
 * - Envio de cadastros em tempo real
 * - Autenticação de usuários via Sheets
 * - Fetch de dashboards em tempo real
 * 
 * IMPORTANTE: Para usar este serviço, é necessário:
 * 1. Criar um projeto no Google Cloud Console
 * 2. Ativar a Google Sheets API
 * 3. Criar credenciais (Service Account para escrita, API Key para leitura)
 * 4. Compartilhar a planilha com o service account email
 * 5. Configurar as variáveis de ambiente:
 *    - EXPO_PUBLIC_GOOGLE_SHEETS_ID
 *    - EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY (para leitura)
 *    - (Opcional) GOOGLE_SERVICE_ACCOUNT_JSON (para escrita em produção)
 */

import type {
  Usuario,
  Produto,
  Canal,
  Unidade,
  Cadastro,
} from "@/types/models";

// Configuração (deve vir de variáveis de ambiente)
// Usar getters para avaliar em tempo de execução
const getConfig = () => ({
  spreadsheetId: process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID || "",
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY || "",
});

// URLs da API
const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

// --- Service Account / OAuth helpers ---
import { SignJWT } from "jose";
import { webcrypto } from "crypto";

// Ensure WebCrypto is available for jose in Node
if (typeof (globalThis as any).crypto === 'undefined') {
  try {
    const runningInNode = typeof process !== 'undefined' && (process as any).versions && (process as any).versions.node;
    if (runningInNode) {
      (globalThis as any).crypto = webcrypto;
    }
  } catch (e) {
    // ignore
  }
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function loadServiceAccount() {
  const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;

  if (jsonEnv) {
    try {
      return JSON.parse(jsonEnv);
    } catch (e) {
      console.warn("GOOGLE_SERVICE_ACCOUNT_JSON is invalid JSON");
      return null;
    }
  }

  if (keyFile) {
    try {
      const runningInNode =
        typeof process !== "undefined" && (process as any).versions && (process as any).versions.node;

      if (!runningInNode) {
        console.warn(
          "GOOGLE_SERVICE_ACCOUNT_KEY_FILE is set but 'fs' is not available in this runtime. Skipping service account load."
        );
        return null;
      }

      // Use dynamic import instead of Function require
      const { readFileSync } = await import("fs");
      const raw = readFileSync(keyFile, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Could not read GOOGLE_SERVICE_ACCOUNT_KEY_FILE", e);
      return null;
    }
  }

  return null;
}

async function getServiceAccountToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30 * 1000) {
    return cachedToken.token;
  }

  const sa = await loadServiceAccount();
  if (!sa) return null;

  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({
    scope: "https://www.googleapis.com/auth/spreadsheets",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60)
    .setIssuer(sa.client_email)
    .setAudience(sa.token_uri)
    .sign(await joseKeyFromPrivateKey(sa.private_key));

  // Exchange JWT for access token
  const tokenRes = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    console.warn("Failed to obtain service account token", await tokenRes.text());
    return null;
  }

  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token;
  const expiresIn = tokenJson.expires_in || 3600;

  cachedToken = { token: accessToken, expiresAt: Date.now() + expiresIn * 1000 };
  return accessToken;
}

async function joseKeyFromPrivateKey(pem: string) {
  // jose accepts PEM private keys directly via import
  // But SignJWT.sign expects a KeyLike; createPrivateKey is only available in Node.
  const runningInNode = typeof process !== 'undefined' && (process as any).versions && (process as any).versions.node;
  if (!runningInNode) {
    throw new Error('joseKeyFromPrivateKey requires Node crypto and cannot run in this environment');
  }

  // Use dynamic import instead of Function require
  const { createPrivateKey } = await import('crypto');
  return createPrivateKey(pem);
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const token = await getServiceAccountToken();
    if (token) return { Authorization: `Bearer ${token}` };
  } catch (e) {
    console.warn('Failed to obtain service account token', e);
  }

  return {} as Record<string, string>;
}


/**
 * Verificar se Google Sheets está configurado
 */
export function isGoogleSheetsConfigured(): boolean {
  const config = getConfig();
  return !!(config.spreadsheetId && config.apiKey);
}

/**
 * Interface para sincronização
 */
export interface SyncResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Sincronizar usuários do Google Sheets
 */
export async function syncUsuariosFromSheets(): Promise<Usuario[]> {
  const config = getConfig();
  if (!config.spreadsheetId || !config.apiKey) {
    console.warn("Google Sheets não configurado - usando dados locais");
    return [];
  }

  try {
    const range = "USUARIOS!A2:E"; // Pula header - agora com 5 colunas (EMAIL, NOME, ROLE, SENHA, ATIVO)
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      console.warn("Nenhum usuário encontrado no Sheets");
      return [];
    }

    const usuarios: Usuario[] = data.values.map((row: string[]) => ({
      email: row[0]?.trim() || "",
      nome: row[1]?.trim() || "",
      role: (row[2]?.trim() || "ATC") as "ATC" | "COORD",
      senha: row[3]?.trim() || "",
      ativo: row[4] === "TRUE" || row[4] === "true" || row[4] === "TRUE",
    })).filter((u: Usuario) => u.email); // Filtrar emails vazios

    return usuarios;
  } catch (error) {
    console.error("Erro ao sincronizar usuários:", error);
    return [];
  }
}

/**
 * Autenticar usuário contra Google Sheets
 * Busca o usuário na aba USUARIOS e valida a senha
 */
export async function authenticateWithSheets(
  email: string,
  senha: string
): Promise<{ success: boolean; usuario?: Usuario; error?: string }> {
  const config = getConfig();
  if (!config.spreadsheetId || !config.apiKey) {
    return {
      success: false,
      error: "Google Sheets não configurado. Use autenticação local.",
    };
  }

  try {
    const usuarios = await syncUsuariosFromSheets();
    const usuario = usuarios.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.ativo
    );

    if (!usuario) {
      return {
        success: false,
        error: "Usuário não encontrado ou inativo",
      };
    }

    // Validação de senha contra Google Sheets
    if (usuario.senha && usuario.senha === senha) {
      return {
        success: true,
        usuario,
      };
    }

    return {
      success: false,
      error: "Senha incorreta",
    };
  } catch (error) {
    console.error("Erro ao autenticar:", error);
    return {
      success: false,
      error: "Erro ao conectar com Google Sheets",
    };
  }
}

/**
 * Sincronizar produtos do Google Sheets
 */
export async function syncProdutosFromSheets(): Promise<Produto[]> {
  const config = getConfig();
  if (!config.spreadsheetId || !config.apiKey) {
    console.warn("Google Sheets não configurado");
    return [];
  }

  try {
    const range = "PRODUTOS!A2:E";
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) return [];

    const produtos: Produto[] = data.values.map((row: string[]) => ({
      produtoId: row[0] || "",
      categoria: row[1] || "",
      produto: row[2] || "",
      unidadePotencial: (row[3] || "tons") as "tons" | "litros",
      ativo: row[4] === "TRUE" || row[4] === "true",
    }));

    return produtos;
  } catch (error) {
    console.error("Erro ao sincronizar produtos:", error);
    return [];
  }
}

/**
 * Sincronizar cadastros do Google Sheets
 */
export async function syncCadastrosFromSheets(): Promise<Cadastro[]> {
  const config = getConfig();
  if (!config.spreadsheetId || !config.apiKey) {
    console.warn("Google Sheets não configurado");
    return [];
  }

  try {
    const range = "CADASTROS!A2:O";
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
    
    const headers = await getAuthHeaders();
    const response = await fetch(url, { headers });
    const data = await response.json();

    if (!data.values) return [];

    const cadastros: Cadastro[] = data.values.map((row: string[], i: number) => {
      // Detect if sheet has an empty first column (offset by one)
      const offset = row.length > 1 && row[0] === "" ? 1 : 0;
      if (offset === 1) {
        console.warn(`Detected leading empty column in CADASTROS row ${i + 2} — shifting values by 1.`);
      }
      return {
        cadastroId: row[offset + 0] || "",
        criadoEm: row[offset + 1] || new Date().toISOString(),
        atcEmail: row[offset + 2] || "",
        atcNome: row[offset + 3] || "",
        canal: row[offset + 4] || "",
        unidade: row[offset + 5] || "",
        estado: row[offset + 6] || "",
        categoria: row[offset + 7] || "",
        produtoRef: row[offset + 8] || "",
        produtoNomeLivre: row[offset + 9] || undefined,
        nomeCliente: (row[offset + 9] || row[offset + 8] || "") as string,
        unidadePotencial: (row[offset + 10] || "tons") as "tons" | "litros",
        implantado: (row[offset + 11] || "Não") as "Sim" | "Não",
        potencialValor: parseFloat(row[offset + 12]) || 0,
        concorrentes: row[offset + 13] || "",
        observacao: row[offset + 14] || "",
      } as Cadastro;
    }).filter((c: Cadastro) => c.cadastroId);

    return cadastros;
  } catch (error) {
    console.error("Erro ao sincronizar cadastros:", error);
    return [];
  }
}

/**
 * Buscar cadastros de um ATC específico
 */
export async function getCadastrosByAtc(atcEmail: string): Promise<Cadastro[]> {
  const cadastros = await syncCadastrosFromSheets();
  return cadastros.filter(c => c.atcEmail.toLowerCase() === atcEmail.toLowerCase());
}

/**
 * Buscar métricas resumidas para dashboard
 * Aceita cadastros locais como parâmetro para usar como fallback
 */
export async function getDashboardMetricas(cadastrosLocais?: Cadastro[], usuariosLocais?: Usuario[]): Promise<{
  totalCadastros: number;
  totalAtcs: number;
  totalImplantados: number;
  potencialTotal: number;
  cadastrosPorCategoria: Record<string, number>;
  cadastrosPorUnidade: Record<string, number>;
  cadastrosPorAtc: Record<string, number>;
  cadastrosPorProduto: Record<string, number>;
}> {
  try {
    // Usar dados locais como fallback ou tentar buscar do Sheets
    let cadastros: Cadastro[] = cadastrosLocais || [];
    let usuarios: Usuario[] = usuariosLocais || [];

    // Se não recebeu dados locais, tenta buscar do Sheets
    if (!cadastrosLocais || !usuariosLocais) {
      const [cadastrosSheets, usuariosSheets] = await Promise.all([
        syncCadastrosFromSheets(),
        syncUsuariosFromSheets(),
      ]);
      
      cadastros = cadastrosLocais || cadastrosSheets;
      usuarios = usuariosLocais || usuariosSheets;
    }

    const metricas = {
      totalCadastros: cadastros.length,
      totalAtcs: usuarios.filter(u => u.role === "ATC" && u.ativo).length,
      totalImplantados: cadastros.filter(c => c.implantado === "Sim").length,
      potencialTotal: cadastros.reduce((sum, c) => sum + c.potencialValor, 0),
      cadastrosPorCategoria: {} as Record<string, number>,
      cadastrosPorUnidade: {} as Record<string, number>,
      cadastrosPorAtc: {} as Record<string, number>,
      cadastrosPorProduto: {} as Record<string, number>,
    };

    // Contar por categoria
    cadastros.forEach((c: Cadastro) => {
      metricas.cadastrosPorCategoria[c.categoria] = 
        (metricas.cadastrosPorCategoria[c.categoria] || 0) + 1;
    });

    // Contar por unidade
    cadastros.forEach((c: Cadastro) => {
      metricas.cadastrosPorUnidade[c.unidade] = 
        (metricas.cadastrosPorUnidade[c.unidade] || 0) + 1;
    });

    // Contar por ATC
    cadastros.forEach((c: Cadastro) => {
      metricas.cadastrosPorAtc[c.atcNome] = 
        (metricas.cadastrosPorAtc[c.atcNome] || 0) + 1;
    });

    // Contar por produto
    cadastros.forEach((c: Cadastro) => {
      const produtoNome = c.produtoNomeLivre || c.produtoRef;
      metricas.cadastrosPorProduto[produtoNome] = 
        (metricas.cadastrosPorProduto[produtoNome] || 0) + 1;
    });

    return metricas;
  } catch (error) {
    console.error("Erro ao buscar métricas:", error);
    return {
      totalCadastros: 0,
      totalAtcs: 0,
      totalImplantados: 0,
      potencialTotal: 0,
      cadastrosPorCategoria: {},
      cadastrosPorUnidade: {},
      cadastrosPorAtc: {},
      cadastrosPorProduto: {},
    };
  }
}
export async function syncCanaisFromSheets(): Promise<Canal[]> {
  const config = getConfig();
  if (!config.spreadsheetId || !config.apiKey) {
    console.warn("Google Sheets não configurado");
    return [];
  }

  try {
    const range = "CANAIS!A2:C";
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) return [];

    const canais: Canal[] = data.values.map((row: string[]) => ({
      canalId: row[0] || "",
      canal: row[1] || "",
      ativo: row[2] === "TRUE" || row[2] === "true",
    }));

    return canais;
  } catch (error) {
    console.error("Erro ao sincronizar canais:", error);
    return [];
  }
}

/**
 * Sincronizar unidades do Google Sheets
 */
export async function syncUnidadesFromSheets(): Promise<Unidade[]> {
  const config = getConfig();
  if (!config.spreadsheetId || !config.apiKey) {
    console.warn("Google Sheets não configurado");
    return [];
  }

  try {
    const range = "UNIDADES!A2:D";
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) return [];

    const unidades: Unidade[] = data.values.map((row: string[]) => ({
      unidadeId: row[0] || "",
      unidade: row[1] || "",
      estadoUf: row[2] || undefined,
      ativo: row[3] === "TRUE" || row[3] === "true",
    }));

    return unidades;
  } catch (error) {
    console.error("Erro ao sincronizar unidades:", error);
    return [];
  }
}

/**
 * Enviar cadastro para Google Sheets
 */
export async function sendCadastroToSheets(
  cadastro: Cadastro
): Promise<SyncResult> {
  const config = getConfig();
  if (!config.spreadsheetId || !config.apiKey) {
    return {
      success: false,
      message: "Google Sheets não configurado",
      error: "Missing SPREADSHEET_ID or API_KEY",
    };
  }

  try {
    // Preparar dados para inserção
    const row = [
      cadastro.cadastroId,
      cadastro.criadoEm,
      cadastro.atcEmail,
      cadastro.atcNome,
      cadastro.canal,
      cadastro.unidade,
      cadastro.estado,
      cadastro.categoria,
      cadastro.produtoRef,
      cadastro.produtoNomeLivre || "",
      cadastro.unidadePotencial,
      cadastro.implantado,
      cadastro.potencialValor,
      cadastro.concorrentes,
      cadastro.observacao,
    ];

    // Escrever na próxima linha disponível explicitamente (mais robusto que append)
    const rowsRange = "CADASTROS!A:A";
    const rowsUrl = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${rowsRange}?key=${config.apiKey}`;
    const authHeaders = await getAuthHeaders();

    // Obter número da próxima linha (contar linhas existentes na coluna A)
    const rowsRes = await fetch(rowsUrl, { headers: authHeaders });
    const rowsData = await rowsRes.json();
    const nextRow = (rowsData.values?.length || 1) + 1; // se tiver apenas header, nextRow = 2

    const insertRange = `CADASTROS!A${nextRow}:O${nextRow}`;
    const insertUrl = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${insertRange}?valueInputOption=RAW${config.apiKey ? `&key=${config.apiKey}` : ""}`;

    const putResponse = await fetch(insertUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ values: [row] }),
    });

    if (!putResponse.ok) {
      const text = await putResponse.text();
      throw new Error(`HTTP error! status: ${putResponse.status} body: ${text}`);
    }

    return {
      success: true,
      message: "Cadastro sincronizado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao enviar cadastro:", error);
    return {
      success: false,
      message: "Erro ao sincronizar cadastro",
      error: String(error),
    };
  }
}

/**
 * Sincronizar todos os dados do Google Sheets
 */
export async function syncAllFromSheets(): Promise<{
  usuarios: Usuario[];
  produtos: Produto[];
  canais: Canal[];
  unidades: Unidade[];
}> {
  const [usuarios, produtos, canais, unidades] = await Promise.all([
    syncUsuariosFromSheets(),
    syncProdutosFromSheets(),
    syncCanaisFromSheets(),
    syncUnidadesFromSheets(),
  ]);

  return { usuarios, produtos, canais, unidades };
}

/**
 * Deletar cadastro do Google Sheets
 * Remove a linha correspondente da aba CADASTROS
 */
export async function deleteCadastroFromSheets(
  cadastroId: string
): Promise<{ success: boolean; error?: string }> {
  const config = getConfig();
  if (!config.spreadsheetId || !config.apiKey) {
    // Se Sheets não configurado, apenas retorna sucesso (foi deletado localmente)
    return { success: true };
  }

  try {
    // Buscar o cadastro para encontrar a linha
    const range = "CADASTROS!A:A";
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, { headers });
    const data = await response.json();

    if (!data.values) {
      return { success: true }; // Nenhum dado para deletar
    }

    // Encontrar a linha do cadastro
    const rowIndex = data.values.findIndex(
      (row: string[]) => row[0] === cadastroId
    );

    if (rowIndex === -1) {
      return { success: true }; // Cadastro não encontrado (já pode estar deletado)
    }

    // Deletar a linha usando batchUpdate (apenas possível com Service Account)
    // Como fallback, marcar como vazio é mais seguro
    const deleteRange = `CADASTROS!A${rowIndex + 1}:O${rowIndex + 1}`;
    const deleteUrl = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${deleteRange}?key=${config.apiKey}`;

    const deleteResponse = await fetch(deleteUrl, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    });

    if (!deleteResponse.ok && deleteResponse.status !== 204) {
      // Se DELETE falhar, tentar limpar a linha (PUT com valores vazios)
      const clearUrl = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${deleteRange}?valueInputOption=RAW&key=${config.apiKey}`;
      const clearResponse = await fetch(clearUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({ values: [[]] }),
      });

      if (!clearResponse.ok) {
        console.warn("Cadastro deletado localmente mas não foi removido do Sheets");
        return { success: true }; // Mesmo assim retorna sucesso
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar cadastro do Sheets:", error);
    // Retorna sucesso mesmo com erro, pois foi deletado localmente
    return { success: true };
  }
}

/**
 * Sincronizar todos os cadastros locais para Google Sheets (ADMIN)
 * Envia todos os cadastros locais em lote para Sheets
 */
export async function syncAllCadastrosToSheets(
  cadastros: Cadastro[]
): Promise<SyncResult> {
  const config = getConfig();
  if (!config.spreadsheetId || !config.apiKey) {
    return {
      success: false,
      message: "Google Sheets não configurado",
      error: "Missing SPREADSHEET_ID or API_KEY",
    };
  }

  if (cadastros.length === 0) {
    return {
      success: true,
      message: "Nenhum cadastro para sincronizar",
    };
  }

  try {
    const rows = cadastros.map((cadastro) => [
      cadastro.cadastroId,
      cadastro.criadoEm,
      cadastro.atcEmail,
      cadastro.atcNome,
      cadastro.canal,
      cadastro.unidade,
      cadastro.estado,
      cadastro.categoria,
      cadastro.produtoRef,
      cadastro.produtoNomeLivre || "",
      cadastro.unidadePotencial,
      cadastro.implantado,
      cadastro.potencialValor,
      cadastro.concorrentes,
      cadastro.observacao,
    ]);

    // Obter o número da próxima linha
    const rowsRange = "CADASTROS!A:A";
    const rowsUrl = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${rowsRange}?key=${config.apiKey}`;
    const authHeaders = await getAuthHeaders();
    const rowsRes = await fetch(rowsUrl, { headers: authHeaders });
    const rowsData = await rowsRes.json();
    const startRow = (rowsData.values?.length || 1) + 1;

    // Escrever todos os cadastros em lote
    const insertRange = `CADASTROS!A${startRow}:O${startRow + cadastros.length - 1}`;
    const insertUrl = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${insertRange}?valueInputOption=RAW${config.apiKey ? `&key=${config.apiKey}` : ""}`;

    const putResponse = await fetch(insertUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ values: rows }),
    });

    if (!putResponse.ok) {
      const text = await putResponse.text();
      throw new Error(`HTTP error! status: ${putResponse.status} body: ${text}`);
    }

    return {
      success: true,
      message: `${cadastros.length} cadastro(s) sincronizado(s) com sucesso`,
    };
  } catch (error) {
    console.error("Erro ao sincronizar cadastros:", error);
    return {
      success: false,
      message: "Erro ao sincronizar cadastros",
      error: String(error),
    };
  }
}

/**
 * Pull de todos os cadastros do Google Sheets para o app (ADMIN)
 * Baixa os cadastros do Sheets e retorna sem salvar localmente
 */
export async function pullCadastrosFromSheets(): Promise<{
  success: boolean;
  cadastros: Cadastro[];
  message: string;
  error?: string;
}> {
  const config = getConfig();
  if (!config.spreadsheetId || !config.apiKey) {
    return {
      success: false,
      cadastros: [],
      message: "Google Sheets não configurado",
      error: "Missing SPREADSHEET_ID or API_KEY",
    };
  }

  try {
    const range = "CADASTROS!A2:O1000"; // Skip header
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse cadastros using same logic as syncCadastrosFromSheets
    const cadastros: Cadastro[] = (data.values || []).map((row: string[], i: number) => {
      const offset = row.length > 1 && row[0] === "" ? 1 : 0;
      return {
        cadastroId: row[offset + 0] || "",
        criadoEm: row[offset + 1] || new Date().toISOString(),
        atcEmail: row[offset + 2] || "",
        atcNome: row[offset + 3] || "",
        canal: row[offset + 4] || "",
        unidade: row[offset + 5] || "",
        estado: row[offset + 6] || "",
        categoria: row[offset + 7] || "",
        produtoRef: row[offset + 8] || "",
        produtoNomeLivre: row[offset + 9] || undefined,
        nomeCliente: (row[offset + 9] || row[offset + 8] || "") as string,
        unidadePotencial: (row[offset + 10] || "tons") as "tons" | "litros",
        implantado: (row[offset + 11] || "Não") as "Sim" | "Não",
        potencialValor: parseFloat(row[offset + 12]) || 0,
        concorrentes: row[offset + 13] || "",
        observacao: row[offset + 14] || "",
      } as Cadastro;
    }).filter((c: Cadastro) => c.cadastroId);

    return {
      success: true,
      cadastros,
      message: `${cadastros.length} cadastro(s) baixado(s) do Sheets`,
    };
  } catch (error) {
    console.error("Erro ao baixar cadastros do Sheets:", error);
    return {
      success: false,
      cadastros: [],
      message: "Erro ao baixar cadastros",
      error: String(error),
    };
  }
}

/**
 * Adicionar novo usuário ao Google Sheets
 * Insere uma nova linha na aba USUARIOS com EMAIL, NOME, ROLE, SENHA, ATIVO
 */
export async function addNovoUsuarioToSheets(
  usuario: Pick<Usuario, "email" | "nome" | "role" | "senha">
): Promise<{ success: boolean; error?: string }> {
  const config = getConfig();
  if (!config.spreadsheetId || !config.apiKey) {
    return {
      success: false,
      error: "Google Sheets não configurado",
    };
  }

  try {
    // Obter o próximo ID de linha disponível
    const range = "USUARIOS!A:A";
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, { headers });
    const data = await response.json();
    const nextRow = (data.values?.length || 1) + 1;

    // Inserir novo usuário
    const insertRange = `USUARIOS!A${nextRow}:E${nextRow}`;
    const insertUrl = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${insertRange}?valueInputOption=USER_ENTERED&key=${config.apiKey}`;
    
    const insertResponse = await fetch(insertUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        values: [[usuario.email, usuario.nome, usuario.role, usuario.senha, "TRUE"]],
      }),
    });

    if (!insertResponse.ok) {
      return {
        success: false,
        error: "Erro ao inserir usuário no Sheets",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao adicionar usuário:", error);
    return {
      success: false,
      error: "Erro ao conectar com Google Sheets",
    };
  }
}

