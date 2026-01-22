/**
 * Vercel Serverless Entry Point
 * Inicia o servidor Express que roda todas as rotas /api/*
 */

// Log environment status at startup
console.log("[API] ========== SERVER STARTUP ==========");
console.log("[API] Node Env:", process.env.NODE_ENV);
console.log("[API] Timestamp:", new Date().toISOString());

import { config } from "dotenv";
import { resolve } from "path";

// Carregar .env.local primeiro, depois .env
// (Vercel ignora estas linhas, usa environment variables do dashboard)
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { sheetsRouter } from "../server/sheets-sync";

const app = express();

// Log environment variables
console.log("[API] GOOGLE_SERVICE_ACCOUNT_JSON:", process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "SET (" + process.env.GOOGLE_SERVICE_ACCOUNT_JSON.substring(0, 50) + "...)" : "NOT SET");
console.log("[API] EXPO_PUBLIC_GOOGLE_SHEETS_ID:", process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID ? "SET" : "NOT SET");
console.log("[API] GOOGLE_SHEETS_ID:", process.env.GOOGLE_SHEETS_ID ? "SET" : "NOT SET");
console.log("[API] GOOGLE_SERVICE_ACCOUNT_KEY_FILE:", process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ? "SET" : "NOT SET");
console.log("[API] ========== SERVER STARTUP END ==========");

// Enable CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Log all requests for debugging
app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// Register routes
registerOAuthRoutes(app);

// Log antes de registrar rotas
console.log("[API] Registrando rotas de sheets...");
try {
  app.use("/api/sheets", sheetsRouter);
  console.log("[API] ✅ Rotas de sheets registradas com sucesso");
} catch (e) {
  console.error("[API] ❌ ERRO ao registrar rotas de sheets:", e);
}

// Rota de teste simples
app.post("/api/sheets/create-or-update", (_req, res) => {
  console.log("[API] ❌ ROTA CORINGA ACIONADA - Isso significa que o roteador principal NÃO interceptou a requisição!");
  res.status(500).json({
    error: "Route intercepted by fallback - check router registration",
    message: "A rota /api/sheets foi registrada, mas esta rota coringa foi acionada"
  });
});

// Health check com diagnóstico
app.get("/api/health", (_req, res) => {
  const status = {
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: {
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV,
      has_sheets_id: !!process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID || !!process.env.GOOGLE_SHEETS_ID,
      has_service_account_json: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      has_service_account_file: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
    }
  };
  res.json(status);
});

// Endpoint de diagnóstico detalhado
app.get("/api/diagnose", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    server: "Express on Vercel",
    routes_registered: [
      "POST /api/sheets/create-or-update",
      "POST /api/sheets/cadastros",
      "POST /api/sheets/cadastros/bulk",
      "DELETE /api/sheets/cadastros/:id",
      "GET /api/health",
      "GET /api/status",
      "GET /api/diagnose",
      "GET /api/trpc/:procedure"
    ],
    environment_variables: {
      NODE_ENV: process.env.NODE_ENV || "not-set",
      VERCEL_ENV: process.env.VERCEL_ENV || "not-set",
      EXPO_PUBLIC_GOOGLE_SHEETS_ID: process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID ? "✅ SET (" + process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID.substring(0, 20) + "...)" : "❌ NOT SET",
      GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID ? "✅ SET" : "❌ NOT SET",
      GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "✅ SET (" + process.env.GOOGLE_SERVICE_ACCOUNT_JSON.length + " chars)" : "❌ NOT SET",
      GOOGLE_SERVICE_ACCOUNT_KEY_FILE: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ? "✅ SET" : "❌ NOT SET",
      EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY ? "✅ SET" : "❌ NOT SET",
    },
    next_step: "Se GOOGLE_SERVICE_ACCOUNT_JSON é NOT SET, adicione no Vercel Dashboard"
  });
});

// Endpoint de teste POST (sem roteador)
app.post("/api/test-sheets", (_req, res) => {
  console.log("[API] POST /api/test-sheets chamado - teste básico");
  res.json({
    test: "ok",
    message: "Endpoint de teste funcionando"
  });
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// Health check para Vercel
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// 404 Handler - antes do error handler
app.use("/api/*", (_req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "Rota não encontrada",
    path: _req.path
  });
});

// Global error handler - MUST return JSON
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[API] ❌ ERRO NÃO TRATADO:", err);
  
  // Garante que sempre retorna JSON
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: err.message || String(err),
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

export default app;
