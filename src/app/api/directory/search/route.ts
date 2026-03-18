import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

function escapeSqlString(value: string): string {
    return value.replace(/'/g, "''");
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

export async function GET(request: NextRequest) {
    try {
        await ensureDirectoryTable();

        const search = (request.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
        const entityType = (request.nextUrl.searchParams.get("entityType") || "").trim().toUpperCase();
        const engagementType = (request.nextUrl.searchParams.get("engagementType") || "").trim().toUpperCase();

        const filters: string[] = ["1=1"];

        if (search) {
            const q = escapeSqlString(search);
            filters.push(`(
                LOWER(displayName) LIKE '%${q}%' OR
                LOWER(role) LIKE '%${q}%' OR
                LOWER(bio) LIKE '%${q}%' OR
                LOWER(skillsJson) LIKE '%${q}%' OR
                LOWER(tagsJson) LIKE '%${q}%'
            )`);
        }

        if (entityType) {
            filters.push(`entityType = '${escapeSqlString(entityType)}'`);
        }

        if (engagementType) {
            filters.push(`engagementType = '${escapeSqlString(engagementType)}'`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = await prisma.$queryRawUnsafe<any[]>(`
            SELECT *
            FROM DirectoryProfile
            WHERE ${filters.join(" AND ")}
            ORDER BY updatedAt DESC
            LIMIT 100
        `);

        const data = rows.map((row) => ({
            walletAddress: row.walletAddress,
            did: row.did ?? null,
            displayName: row.displayName ?? "",
            role: row.role ?? "",
            bio: row.bio ?? "",
            entityType: row.entityType ?? "INDIVIDUAL",
            engagementType: row.engagementType ?? "SEEKING_WORK",
            skills: JSON.parse(row.skillsJson ?? "[]"),
            tags: JSON.parse(row.tagsJson ?? "[]"),
            updatedAt: row.updatedAt,
        }));

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Directory search error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to search directory" },
            { status: 500 }
        );
    }
}
