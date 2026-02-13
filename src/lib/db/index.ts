/**
 * Prisma Database Client
 * Singleton pattern for Next.js (prevents connection pool exhaustion in dev)
 * Uses libSQL driver adapter for Prisma 7 client engine
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function makePrismaClient() {
    const adapter = new PrismaLibSql({
        url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    });
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

// Re-export types for convenience
export * from "@prisma/client";
