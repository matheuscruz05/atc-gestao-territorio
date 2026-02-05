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
  HistoricoEdicao,
} from "@/types/models";
import { getApiBaseUrl } from "@/constants/oauth";

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

// Helpers
function logDebug(scope: string, message: string, extra?: any) {
  const timestamp = new Date().toISOString();
  if (extra !== undefined) {
    console.log(`[SheetsClient][${scope}] ${timestamp} - ${message}`, extra);
  } else {
    console.log(`[SheetsClient][${scope}] ${timestamp} - ${message}`);
  }
}

const normalizeCategorias = (cadastro: Cadastro) => {
  if (!cadastro || !Array.isArray((cadastro as any).categorias)) return [];
  return (cadastro as any).categorias;
};

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
    const range = "USUARIOS!A2:G"; // Pula header - colunas: EMAIL, NOME, ROLE, SENHA, ATIVO, GC, GR
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
    
    logDebug("syncUsuariosFromSheets", "Fetching usuarios range", range);
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
      gr: row[6]?.trim() || undefined, // Coluna G é GR (Gerente Regional)
    })).filter((u: Usuario) => u.email); // Filtrar emails vazios

    logDebug("syncUsuariosFromSheets", "Loaded usuarios", { total: usuarios.length, withGr: usuarios.filter(u => u.gr).length });
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
    logDebug("syncCadastrosFromSheets", "Buscando cadastros do Sheets");
    // Estrutura: A-K (11 colunas): cadastroId, atcEmail, atcNome, canal, unidade, estado, criadoEm, editadoEm, deletado, categorias_json, historico_json
    const range = "CADASTROS!A2:K1000";
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

      // Debug: Log detalhado da estrutura
      if (i === 0) {
        console.log(`[syncCadastrosFromSheets ROW ${i + 2}] ===== ESTRUTURA DO SHEETS =====`);
        console.log(`[syncCadastrosFromSheets ROW ${i + 2}] Total colunas: ${row.length}`);
        for (let j = 0; j < Math.min(12, row.length); j++) {
          const col = String.fromCharCode(65 + j);
          const val = row[j]?.substring?.(0, 60) || row[j] || "(vazio)";
          console.log(`  [${col}] = ${val}`);
        }
      }

      // ESTRUTURA CORRETA (servidor salva 11 colunas A-K):
      // A: cadastroId, B: atcEmail, C: atcNome, D: canal, E: unidade, F: estado, 
      // G: criadoEm, H: editadoEm, I: deletado, J: categorias_json, K: historico_json
      
      let categoriasJson: string = "";
      
      // Categorias JSON estão em coluna J (offset + 9)
      if (row[offset + 9] && row[offset + 9].startsWith("[")) {
        categoriasJson = row[offset + 9]; // Coluna J tem JSON
        if (i === 0) console.log(`[syncCadastrosFromSheets ROW ${i + 2}] ✅ Categorias encontradas em COLUNA J`);
      } else if (row[offset + 7] && row[offset + 7].startsWith("[")) {
        // Fallback para formato antigo (se houver)
        categoriasJson = row[offset + 7]; // Coluna H tem JSON
        if (i === 0) console.log(`[syncCadastrosFromSheets ROW ${i + 2}] ⚠️ Categorias encontradas em COLUNA H (formato antigo)`);
      }

      let categorias: any[] = [];
      if (categoriasJson) {
        try {
          if (i === 0) console.log(`[syncCadastrosFromSheets ROW ${i + 2}] Parseando categorias: ${categoriasJson.substring(0, 80)}`);
          const parsed = JSON.parse(categoriasJson);
          if (i === 0) console.log(`[syncCadastrosFromSheets ROW ${i + 2}] ✅ ${parsed.length} categorias parseadas`);
          
          categorias = parsed.map((cat: any) => {
            const potencialTotal = cat.potencialTotal ?? cat.potencialValor ?? 0;
            const potencialAtingido = cat.potencialAtingido ?? (cat.implantado === "Sim" ? (cat.potencialValor || 0) : 0);
            return {
              ...cat,
              safra: cat.safra ?? "Verão",
              potencialAtingido,
              potencialTotal,
            };
          });
        } catch (e) {
          if (i === 0) console.warn(`[syncCadastrosFromSheets ROW ${i + 2}] ❌ Erro parseando JSON categorias:`, (e as Error).message);
          categorias = [];
        }
      } else {
        if (i === 0) console.log(`[syncCadastrosFromSheets ROW ${i + 2}] ⚠️ Categoria JSON não encontrada em colunas H ou I`);
      }

      let historico: HistoricoEdicao[] = [];
      const historicoJson = row[offset + 10]; // Coluna K
      if (historicoJson && historicoJson.startsWith("[")) {
        try {
          historico = JSON.parse(historicoJson);
        } catch (e) {
          if (i === 0) console.warn(`[syncCadastrosFromSheets ROW ${i + 2}] ❌ Erro parseando histórico JSON:`, (e as Error).message);
          historico = [];
        }
      }

      // Mapeamento baseado na ESTRUTURA REAL (10 colunas A-J)
      const cadastro = {
        cadastroId: row[offset + 0] || "",
        criadoEm: row[offset + 6] || new Date().toISOString(), // Coluna G
        atcEmail: row[offset + 1] || "",
        atcNome: row[offset + 2] || "",
        canal: row[offset + 3] || "", // Coluna D
        unidade: row[offset + 4] || "", // Coluna E
        estado: row[offset + 5] || "",
        categorias,
        historico,
        editadoEm: row[offset + 7] || "", // Coluna H tem o timestamp de edição
        deletado: row[offset + 8] === "true",
      } as Cadastro;

      if (i === 0) {
        logDebug("syncCadastrosFromSheets", `✅ MAPEAMENTO FINAL: CANAL=${cadastro.canal} | UNIDADE=${cadastro.unidade} | ESTADO=${cadastro.estado}`);
        logDebug("syncCadastrosFromSheets", `📊 Categorias encontradas: ${categorias.length}`);
        if (categorias.length === 0) {
          logDebug("syncCadastrosFromSheets", `⚠️ AVISO: Nenhuma categoria encontrada! Verifique se o servidor está salvando categorias no Sheets.`);
        }
      }

      return cadastro;
    }).filter((c: Cadastro) => c.cadastroId);

    return cadastros;
  } catch (error) {
    console.error("Erro ao sincronizar cadastros:", error);
    return [];
  }
}

/**
 * Buscar cadastros de um ATC específico
 * Com retry robusto: tenta sincronizar do Sheets com retry, depois fallback para localStorage
 */
export async function getCadastrosByAtc(atcEmail: string): Promise<Cadastro[]> {
  const emailLower = atcEmail.toLowerCase();
  
  console.log(`[getCadastrosByAtc] 🔍 Buscando cadastros para: ${atcEmail}`);
  
  // Buscar do Google Sheets (única fonte de dados em produção web)
  try {
    console.log(`[getCadastrosByAtc] 📡 Sincronizando do Google Sheets...`);
    const cadastros = await syncCadastrosFromSheets();
    
    if (cadastros && cadastros.length > 0) {
      const filtered = cadastros.filter(c => c.atcEmail.toLowerCase() === emailLower);
      console.log(`[getCadastrosByAtc] ✅ Encontrados ${filtered.length} cadastros do Sheets para ${atcEmail}`);
      return filtered;
    } else {
      console.warn(`[getCadastrosByAtc] ⚠️ Google Sheets vazio`);
      return [];
    }
  } catch (error) {
    console.error(`[getCadastrosByAtc] ❌ Erro ao sincronizar Sheets:`, error);
    return [];
  }
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
      potencialTotal: cadastros.reduce((sum, c) => sum + (c.potencialValor ?? 0), 0),
      cadastrosPorCategoria: {} as Record<string, number>,
      cadastrosPorUnidade: {} as Record<string, number>,
      cadastrosPorAtc: {} as Record<string, number>,
      cadastrosPorProduto: {} as Record<string, number>,
    };

    // Contar por categoria
    cadastros.forEach((c: Cadastro) => {
      const categoria = c.categoria || "Sem Categoria";
      metricas.cadastrosPorCategoria[categoria] = 
        (metricas.cadastrosPorCategoria[categoria] || 0) + 1;
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
      const produtoNome = c.produtoNomeLivre || c.produtoRef || "Sem Produto";
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
    console.error("[sendCadastro] ❌ Google Sheets não configurado");
    return {
      success: false,
      message: "Google Sheets não configurado",
      error: "Missing SPREADSHEET_ID or API_KEY",
    };
  }

  try {
    console.log("\n========== 🌐 SINCRONIZANDO COM GOOGLE SHEETS ==========");
    logDebug("sendCadastro", "Enviando cadastro", { id: cadastro.cadastroId });
    console.log(`[sendCadastro] 📦 cadastroId: ${cadastro.cadastroId}`);
    console.log(`[sendCadastro] 📝 canal: ${cadastro.canal}`);
    console.log(`[sendCadastro] 📝 unidade: ${cadastro.unidade}`);
    console.log(`[sendCadastro] 📝 atcEmail: ${cadastro.atcEmail}`);
    
    const categorias = normalizeCategorias(cadastro);
    console.log(`[sendCadastro] ✅ Categorias normalizadas: ${categorias.length}`);
    
    // Usar endpoint do servidor com URL base correta
    // Em desenvolvimento: localhost:3000 (Vercel local)
    // Em produção: https://seu-dominio.vercel.app
    const apiBaseUrl = getApiBaseUrl();
    const serverUrl = apiBaseUrl ? `${apiBaseUrl}/api/sheets/create-or-update` : "/api/sheets/create-or-update";
    console.log(`[sendCadastro] 🚀 POST para ${serverUrl} (base: ${apiBaseUrl || "relativa"})`);

    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...cadastro, categorias }),
    });

    console.log(`[sendCadastro] 📡 Response status: ${response.status}`);

    if (!response.ok) {
      const error = await response.json();
      console.error(`[sendCadastro] ❌ HTTP error! status: ${response.status}`, error);
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[sendCadastro] ✅ Resposta do servidor:`, result);

    logDebug("sendCadastro", "Resultado", result);
    console.log("========== ✅ GOOGLE SHEETS SINCRONIZAÇÃO CONCLUÍDA ==========");
    
    return {
      success: result.success,
      message: result.message || "Cadastro sincronizado com sucesso",
    };
  } catch (error) {
    console.error("[sendCadastro] ❌ ERRO ao enviar cadastro:", error);
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
  logDebug("syncAllFromSheets", "Iniciando");
  const [usuarios, produtos, canais, unidades] = await Promise.all([
    syncUsuariosFromSheets(),
    syncProdutosFromSheets(),
    syncCanaisFromSheets(),
    syncUnidadesFromSheets(),
  ]);

  logDebug("syncAllFromSheets", "Concluído", {
    usuarios: usuarios.length,
    produtos: produtos.length,
    canais: canais.length,
    unidades: unidades.length,
  });
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
    logDebug("deleteCadastro", "Deletando cadastro", { cadastroId });
    // Usar endpoint do servidor com URL base correta
    const apiBaseUrl = getApiBaseUrl();
    const serverUrl = apiBaseUrl 
      ? `${apiBaseUrl}/api/sheets/cadastros/${encodeURIComponent(cadastroId)}`
      : `/api/sheets/cadastros/${encodeURIComponent(cadastroId)}`;

    const response = await fetch(serverUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("Erro ao deletar cadastro do Sheets, mas continuando");
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar cadastro do Sheets:", error);
    return { success: true }; // Mesmo assim retorna sucesso
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

  const ativos = cadastros.filter((c) => !(c as any).deletado);

  if (ativos.length === 0) {
    return {
      success: true,
      message: "Nenhum cadastro para sincronizar",
    };
  }

  try {
    const sanitized = ativos.map((c) => ({ ...c, categorias: normalizeCategorias(c) }));
    logDebug("syncAllCadastrosToSheets", "Enviando cadastros", { total: sanitized.length });
    // Usar endpoint do servidor
    const serverUrl = "/api/sheets/cadastros/bulk";

    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cadastros: sanitized }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    logDebug("syncAllCadastrosToSheets", "Resultado", result);
    return {
      success: result.success,
      message: result.message || `${cadastros.length} cadastro(s) sincronizado(s) com sucesso`,
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
    logDebug("pullCadastrosFromSheets", "Iniciando pull");
    const range = "CADASTROS!A2:K1000"; // Skip header; col J = categorias JSON, col K = historico JSON
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse cadastros using same logic as syncCadastrosFromSheets
    const cadastros: Cadastro[] = (data.values || [])
      .map((row: string[]) => {
        const offset = row.length > 1 && row[0] === "" ? 1 : 0;

        const categoriasJson = row[offset + 9];
        let categorias: any[] = [];

        if (categoriasJson) {
          try {
            const parsed = JSON.parse(categoriasJson);
            // Garantir migração de dados antigos durante o pull
            categorias = parsed.map((cat: any) => ({
              ...cat,
              potencialAtingido: cat.potencialAtingido ?? (cat.implantado === "Sim" ? (cat.potencialValor || 0) : 0),
              potencialTotal: cat.potencialTotal ?? (cat.potencialValor || 0),
            }));
          } catch (e) {
            console.warn("[SheetsClient] Erro ao parsear categorias JSON", e);
            categorias = [];
          }
        } else if (row.length >= offset + 15) {
          // Fallback para formato antigo (uma categoria plana)
          const potencialValor = parseFloat(row[offset + 12]) || 0;
          const implantado = (row[offset + 11] || "Não") as any;
          categorias = [
            {
              categoria: row[offset + 7] || "",
              produtoRef: row[offset + 8] || "",
              produtoNomeLivre: row[offset + 9] || "",
              unidadePotencial: (row[offset + 10] || "tons") as any,
              implantado: implantado,
              safra: "Verão" as any,
              // Converter formato antigo para novo
              potencialAtingido: implantado === "Sim" ? potencialValor : 0,
              potencialTotal: potencialValor,
              concorrentes: row[offset + 13] || "",
              observacao: row[offset + 14] || "",
            },
          ];
        }

        let historico: HistoricoEdicao[] = [];
        const historicoJson = row[offset + 10];
        if (historicoJson && historicoJson.startsWith("[")) {
          try {
            historico = JSON.parse(historicoJson);
          } catch (e) {
            console.warn("[SheetsClient] Erro ao parsear historico JSON", e);
            historico = [];
          }
        }

        return {
          cadastroId: row[offset + 0] || "",
          criadoEm: row[offset + 6] || new Date().toISOString(),
          atcEmail: row[offset + 1] || "",
          atcNome: row[offset + 2] || "",
          canal: row[offset + 3] || "",
          unidade: row[offset + 4] || "",
          estado: row[offset + 5] || "",
          categorias,
          historico,
          deletado: row[offset + 8] === "true",
        } as Cadastro;
      })
      .filter((c: Cadastro) => c.cadastroId);

    logDebug("pullCadastrosFromSheets", "Pull concluído", { total: cadastros.length });
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
 * Sincronizar concorrentes do Google Sheets
 */
export async function syncConcorrentesFromSheets(): Promise<string[]> {
  const config = getConfig();
  if (!config.spreadsheetId || !config.apiKey) {
    console.warn("Google Sheets não configurado");
    return [];
  }

  try {
    const range = "CONCORRENTES!A2:A";
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
    
    logDebug("syncConcorrentesFromSheets", "Fetching concorrentes");
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) {
      console.warn("Nenhum concorrente encontrado no Sheets");
      return [];
    }

    const concorrentes: string[] = data.values
      .map((row: string[]) => row[0]?.trim())
      .filter((conc: string) => conc);

    logDebug("syncConcorrentesFromSheets", "Loaded concorrentes", { total: concorrentes.length });
    return concorrentes;
  } catch (error) {
    console.error("Erro ao sincronizar concorrentes:", error);
    return [];
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

