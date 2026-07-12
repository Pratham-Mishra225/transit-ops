import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * Initialise PrismaClient with the Neon serverless adapter.
 * The adapter requires DATABASE_URL to be set at runtime; during `next build`
 * the DATABASE_URL may be absent, so we guard against that gracefully.
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // During build-time static analysis the env var may not be present.
    // Return a bare PrismaClient — it won't be used for actual queries.
    return new PrismaClient();
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}