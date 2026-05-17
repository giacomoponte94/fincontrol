export const ENV = {
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  isProduction: process.env.NODE_ENV === "production",
};
