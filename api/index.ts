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
app.use("/api/sheets", sheetsRouter);

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

// Endpoint de status detalhado (apenas para debug)
app.get("/api/status", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    server: "Express on Vercel",
    routes: [
      "POST /api/sheets/create-or-update",
      "GET /api/health",
      "GET /api/status",
      "GET /api/trpc/:procedure"
    ],
    environment: {
      NODE_ENV: process.env.NODE_ENV || "not-set",
      VERCEL_ENV: process.env.VERCEL_ENV || "not-set",
      EXPO_PUBLIC_GOOGLE_SHEETS_ID: process.env.EXPO_PUBLIC_GOOGLE_SHEETS_ID ? "✅ SET" : "❌ NOT SET",
      GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID ? "✅ SET" : "❌ NOT SET",
      GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "✅ SET (" + process.env.GOOGLE_SERVICE_ACCOUNT_JSON.length + " chars)" : "❌ NOT SET",
      GOOGLE_SERVICE_ACCOUNT_KEY_FILE: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ? "✅ SET" : "❌ NOT SET",
    }
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
