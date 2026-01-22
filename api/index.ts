/**
 * Vercel Serverless Entry Point
 * Inicia o servidor Express que roda todas as rotas /api/*
 */

import { config } from "dotenv";
import { resolve } from "path";

// Carregar .env.local primeiro, depois .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { sheetsRouter } from "../server/sheets-sync";

const app = express();

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

// Register routes
registerOAuthRoutes(app);
app.use("/api/sheets", sheetsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
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

export default app;
