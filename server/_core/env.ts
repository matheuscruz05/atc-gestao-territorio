export const ENV = {
  appId: process.env.VITE_APP_ID || process.env.EXPO_PUBLIC_APP_ID || "",
  cookieSecret: process.env.JWT_SECRET || "dev-secret-DO-NOT-USE-IN-PRODUCTION",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

// Log warnings for missing critical environment variables
if (!ENV.cookieSecret || ENV.cookieSecret === "dev-secret-DO-NOT-USE-IN-PRODUCTION") {
  console.warn("[ENV] ⚠️ JWT_SECRET não definido - usando fallback INSEGURO para desenvolvimento");
  if (ENV.isProduction) {
    console.error("[ENV] ❌ ERRO CRÍTICO: JWT_SECRET é OBRIGATÓRIO em produção!");
  }
}

if (!ENV.appId) {
  console.warn("[ENV] ⚠️ VITE_APP_ID ou EXPO_PUBLIC_APP_ID não definido");
}

if (!ENV.oAuthServerUrl) {
  console.warn("[ENV] ⚠️ OAUTH_SERVER_URL não definido - autenticação OAuth não funcionará");
}

console.log("[ENV] ========== Environment Variables Status ==========");
console.log("[ENV] appId:", ENV.appId ? "✅ SET" : "❌ NOT SET");
console.log("[ENV] cookieSecret:", ENV.cookieSecret && ENV.cookieSecret !== "dev-secret-DO-NOT-USE-IN-PRODUCTION" ? "✅ SET" : "⚠️ USING FALLBACK");
console.log("[ENV] databaseUrl:", ENV.databaseUrl ? "✅ SET" : "⚠️ NOT SET (optional)");
console.log("[ENV] oAuthServerUrl:", ENV.oAuthServerUrl ? "✅ SET" : "⚠️ NOT SET");
console.log("[ENV] ownerOpenId:", ENV.ownerOpenId ? "✅ SET" : "⚠️ NOT SET");
console.log("[ENV] isProduction:", ENV.isProduction);
console.log("[ENV] ========== End Environment Variables ==========");
