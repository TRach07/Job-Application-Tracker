import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: ".env" });

const url = process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // URL is required for migrate but optional for generate (Docker build has no env vars)
  ...(url ? { datasource: { url } } : {}),
});
