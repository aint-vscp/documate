import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

interface DirectoryProfilePayload {
    walletAddress: string;
    did?: string;
    displayName?: string;
    role?: string;
    bio?: string;
    entityType?: "FREELANCER" | "HIRING_COMPANY" | "SERVICE_COMPANY" | "INDIVIDUAL";
    engagementType?: "SEEKING_WORK" | "HIRING" | "BOTH";
    skills?: string[];
    tags?: string[];
}

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

    await prisma.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_directory_profile_name ON DirectoryProfile(displayName)"
    );
    await prisma.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_directory_profile_role ON DirectoryProfile(role)"
    );
    await prisma.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_directory_profile_entity ON DirectoryProfile(entityType)"
    );
}

export async function GET(request: NextRequest) {
    try {
        const walletAddress = request.nextUrl.searchParams.get("walletAddress") || "";
        if (!isValidEvmAddress(walletAddress)) {
            return NextResponse.json(
                { success: false, error: "walletAddress must be a valid EVM address" },
                { status: 400 }
            );
        }

        await ensureDirectoryTable();

        const normalizedAddress = normalizeAddress(walletAddress);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = await prisma.$queryRawUnsafe<any[]>(`
            SELECT *
            FROM DirectoryProfile
            WHERE walletAddress = '${escapeSqlString(normalizedAddress)}'
            LIMIT 1
        `);

        if (rows.length === 0) {
            return NextResponse.json({ success: true, data: null });
        }

        const row = rows[0];
        return NextResponse.json({
            success: true,
            data: {
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
            },
        });
    } catch (error) {
        console.error("Directory profile GET error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to load directory profile" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as DirectoryProfilePayload;
        const normalizedAddress = normalizeAddress(body.walletAddress || "");

        if (!isValidEvmAddress(normalizedAddress)) {
            return NextResponse.json(
                { success: false, error: "walletAddress must be a valid EVM address" },
                { status: 400 }
            );
        }

        await ensureDirectoryTable();

        const now = new Date().toISOString();
        const did = (body.did || "").trim() || null;
        const displayName = (body.displayName || "").trim();
        const role = (body.role || "").trim();
        const bio = (body.bio || "").trim();
        const entityType = (body.entityType || "INDIVIDUAL").trim();
        const engagementType = (body.engagementType || "SEEKING_WORK").trim();
        const skillsJson = JSON.stringify(Array.isArray(body.skills) ? body.skills : []);
        const tagsJson = JSON.stringify(Array.isArray(body.tags) ? body.tags : []);

        await prisma.$executeRawUnsafe(`
            INSERT INTO DirectoryProfile (
                walletAddress,
                did,
                displayName,
                role,
                bio,
                entityType,
                engagementType,
                skillsJson,
                tagsJson,
                updatedAt
            )
            VALUES (
                '${escapeSqlString(normalizedAddress)}',
                ${did ? `'${escapeSqlString(did)}'` : "NULL"},
                '${escapeSqlString(displayName)}',
                '${escapeSqlString(role)}',
                '${escapeSqlString(bio)}',
                '${escapeSqlString(entityType)}',
                '${escapeSqlString(engagementType)}',
                '${escapeSqlString(skillsJson)}',
                '${escapeSqlString(tagsJson)}',
                '${escapeSqlString(now)}'
            )
            ON CONFLICT(walletAddress) DO UPDATE SET
                did = excluded.did,
                displayName = excluded.displayName,
                role = excluded.role,
                bio = excluded.bio,
                entityType = excluded.entityType,
                engagementType = excluded.engagementType,
                skillsJson = excluded.skillsJson,
                tagsJson = excluded.tagsJson,
                updatedAt = excluded.updatedAt
        `);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Directory profile POST error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to save directory profile" },
            { status: 500 }
        );
    }
}
