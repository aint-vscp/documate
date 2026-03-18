/**
 * Prisma Database Client
 * Singleton pattern for Next.js (prevents connection pool exhaustion in dev)
 * Uses Prisma native sqlite datasource config from prisma/schema.prisma
 */

import { PrismaClient } from "@prisma/client";

function makePrismaClient() {
    return new PrismaClient({
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
