import { defineConfig } from "prisma/config";

/**
 * Prisma 7 CLI config — connection URL lives here, not in schema.prisma.
 * Fallback URL is for validate/generate when DATABASE_URL is unset locally.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/rankboost",
  },
});
