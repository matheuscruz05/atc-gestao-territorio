import { defineConfig } from "vitest/config";
import path from "path";
import { config as loadEnv } from "dotenv";

// Carregar variáveis de .env.local
loadEnv({ path: ".env.local" });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
