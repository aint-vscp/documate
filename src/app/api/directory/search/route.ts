import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

async function ensureDirectoryTable(): Promise<void> {
    await prisma.$executeRaw`
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
    `;
}

export async function GET(request: NextRequest) {
    try {
        await ensureDirectoryTable();

        const search = (request.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
        const entityType = (request.nextUrl.searchParams.get("entityType") || "").trim().toUpperCase();
        const engagementType = (request.nextUrl.searchParams.get("engagementType") || "").trim().toUpperCase();
        const includeUnverified = (request.nextUrl.searchParams.get("includeUnverified") || "").trim().toLowerCase() === "true";

        const rows = await prisma.directoryProfile.findMany({
            where: {
                ...(includeUnverified
                    ? {}
                    : {
                        AND: [
                            { did: { not: null } },
                            { did: { not: "" } },
                        ],
                    }),
                ...(search
                    ? {
                        OR: [
                            { displayName: { contains: search, mode: "insensitive" } },
                            { role: { contains: search, mode: "insensitive" } },
                            { bio: { contains: search, mode: "insensitive" } },
                            { skillsJson: { contains: search, mode: "insensitive" } },
                            { tagsJson: { contains: search, mode: "insensitive" } },
                        ],
                    }
                    : {}),
                ...(entityType ? { entityType } : {}),
                ...(engagementType ? { engagementType } : {}),
            },
            orderBy: { updatedAt: "desc" },
            take: 100,
        });

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

        const verifiedProfilesCount = await prisma.directoryProfile.count({
            where: {
                AND: [
                    { did: { not: null } },
                    { did: { not: "" } },
                ],
            },
        });
        const emptyReason = data.length > 0
            ? null
            : (verifiedProfilesCount === 0
                ? "NO_VERIFIED_USERS"
                : "NO_MATCHING_PROFILES");

        return NextResponse.json({
            success: true,
            data,
            meta: {
                includeUnverified,
                verifiedProfilesCount,
                emptyReason,
            },
        });
    } catch (error) {
        console.error("Directory search error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to search directory" },
            { status: 500 }
        );
    }
}
