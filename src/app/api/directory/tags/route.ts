import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

function normalizeAddress(address: string): string {
    return (address || "").trim().toLowerCase();
}

function isValidEvmAddress(value: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
}

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

        const profile = await prisma.directoryProfile.findUnique({
            where: { walletAddress },
            select: { tagsJson: true },
        });

        const existingTags = profile
            ? (JSON.parse(profile.tagsJson ?? "[]") as string[])
            : [];

        const mergedTags = Array.from(new Set([...existingTags, ...incomingTags]));
        const now = new Date().toISOString();

        await prisma.directoryProfile.upsert({
            where: { walletAddress },
            create: {
                walletAddress,
                entityType: "INDIVIDUAL",
                engagementType: "SEEKING_WORK",
                tagsJson: JSON.stringify(mergedTags),
                skillsJson: "[]",
                updatedAt: now,
            },
            update: {
                tagsJson: JSON.stringify(mergedTags),
                updatedAt: now,
            },
        });

        return NextResponse.json({ success: true, data: mergedTags });
    } catch (error) {
        console.error("Directory tags POST error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update tags" },
            { status: 500 }
        );
    }
}
