import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { DocumentInstance } from "@/types";

function normalizeAddress(address: string): string {
    return (address || "").trim().toLowerCase();
}

function parsePayload(payload: string): DocumentInstance | null {
    try {
        const parsed = JSON.parse(payload) as DocumentInstance;
        return {
            ...parsed,
            sender: normalizeAddress(parsed.sender),
            receiver: normalizeAddress(parsed.receiver),
        };
    } catch {
        return null;
    }
}


async function ensureTable(): Promise<void> {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS SharedDocument (
            id TEXT PRIMARY KEY,
            sender TEXT NOT NULL,
            receiver TEXT NOT NULL,
            status TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            payload TEXT NOT NULL
        )
    `);
}

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const id = params.id;
        if (!id) {
            return NextResponse.json(
                { success: false, error: "Document id is required" },
                { status: 400 }
            );
        }

        await ensureTable();

        const escapedId = id.replace(/'/g, "''");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT payload FROM SharedDocument WHERE id = '${escapedId}' LIMIT 1`
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
        }

        const document = parsePayload(String(rows[0]?.payload ?? ""));
        if (!document) {
            return NextResponse.json(
                { success: false, error: "Stored document payload is invalid" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: document });
    } catch (error) {
        console.error("Shared document by id error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to load document" },
            { status: 500 }
        );
    }
}