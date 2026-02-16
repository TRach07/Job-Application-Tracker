import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isNeonUrl(url: string): boolean {
  return url.includes("neon.tech");
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

const prismaPromise = globalForPrisma.prisma
  ? Promise.resolve(globalForPrisma.prisma)
  : createClient().then((client) => {
      if (env.NODE_ENV !== "production") globalForPrisma.prisma = client;
      return client;
    });

export const prisma = await prismaPromise;
