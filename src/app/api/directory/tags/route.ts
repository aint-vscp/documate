import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

function escapeSqlString(value: string): string {
    return value.replace(/'/g, "''");
}

function normalizeAddress(address: string): string {
    return (address || "").trim().toLowerCase();
}

function isValidEvmAddress(value: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
}

async function ensureDirectoryTable(): Promise<void> {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS DirectoryProfile (
            walletAddress TEXT PRIMARY KEY,
            did TEXT,
            displayName TEXT,
            role TEXT,
            bio TEXT,
            entityType TEXT,
            engagementType TEXT,
            skillsJson TEXT NOT NULL DEFAULT '[]',
            tagsJson TEXT NOT NULL DEFAULT '[]',
            updatedAt TEXT NOT NULL
        )
    `);
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as { walletAddress: string; tags: string[] };
        const walletAddress = normalizeAddress(body.walletAddress || "");
        const incomingTags = Array.isArray(body.tags) ? body.tags.filter(Boolean) : [];

        if (!isValidEvmAddress(walletAddress)) {
            return NextResponse.json(
                { success: false, error: "walletAddress must be a valid EVM address" },
                { status: 400 }
            );
        }

        await ensureDirectoryTable();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = await prisma.$queryRawUnsafe<any[]>(`
            SELECT tagsJson
            FROM DirectoryProfile
            WHERE walletAddress = '${escapeSqlString(walletAddress)}'
            LIMIT 1
        `);

        const existingTags = rows.length > 0
            ? (JSON.parse(rows[0].tagsJson ?? "[]") as string[])
            : [];

        const mergedTags = Array.from(new Set([...existingTags, ...incomingTags]));
        const now = new Date().toISOString();

        await prisma.$executeRawUnsafe(`
            INSERT INTO DirectoryProfile (
                walletAddress,
                entityType,
                engagementType,
                tagsJson,
                updatedAt
            )
            VALUES (
                '${escapeSqlString(walletAddress)}',
                'INDIVIDUAL',
                'SEEKING_WORK',
                '${escapeSqlString(JSON.stringify(mergedTags))}',
                '${escapeSqlString(now)}'
            )
            ON CONFLICT(walletAddress) DO UPDATE SET
                tagsJson = '${escapeSqlString(JSON.stringify(mergedTags))}',
                updatedAt = '${escapeSqlString(now)}'
        `);

        return NextResponse.json({ success: true, data: mergedTags });
    } catch (error) {
        console.error("Directory tags POST error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update tags" },
            { status: 500 }
        );
    }
}
