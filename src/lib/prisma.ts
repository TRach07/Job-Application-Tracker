import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isNeonUrl(url?: string): boolean {
  return !!url && url.includes("neon.tech");
}

async function createClient(): Promise<PrismaClient> {
  if (isNeonUrl(env.DATABASE_URL)) {
    const { PrismaNeon } = await import("@prisma/adapter-neon");
    const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });
    return new PrismaClient({ adapter } as never);
  }

  const { PrismaPg } = await import("@prisma/adapter-pg");
  const pg = await import("pg");
  const pool = new pg.default.Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as never);
}

async function getClient(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const client = await createClient();
  if (env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

// During build phase, DATABASE_URL may not exist — use a lazy proxy
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

export const prisma: PrismaClient = isBuildPhase
  ? (new Proxy({} as PrismaClient, {
      get(_, prop) {
        throw new Error(`prisma.${String(prop)} called during build phase`);
      },
    }))
  : await getClient();
