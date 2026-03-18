import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { DocumentAnchorStatus, DocumentInstance } from "@/types";

function normalizeAddress(address: string): string {
    return (address || "").trim().toLowerCase();
}

function parsePayload(payload: string): DocumentInstance | null {
    const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
    const validAnchorStatuses = new Set(["PENDING", "ANCHORED", "FAILED"] as const);

    try {
        const parsed = JSON.parse(payload) as DocumentInstance;
        const transactionHash = typeof parsed.transactionHash === "string" && parsed.transactionHash.trim().length > 0
            ? parsed.transactionHash.trim()
            : undefined;
        const anchorError = typeof parsed.anchorError === "string" && parsed.anchorError.trim().length > 0
            ? parsed.anchorError.trim()
            : undefined;
        const incomingStatus = typeof parsed.anchorStatus === "string" && parsed.anchorStatus.trim().length > 0
            ? parsed.anchorStatus.trim()
            : undefined;
        const anchorStatus: DocumentAnchorStatus | undefined = incomingStatus && validAnchorStatuses.has(incomingStatus as "PENDING" | "ANCHORED" | "FAILED")
            ? (incomingStatus as DocumentAnchorStatus)
            : (transactionHash
                ? (txHashRegex.test(transactionHash) ? "ANCHORED" : "FAILED")
                : undefined);

        return {
            ...parsed,
            sender: normalizeAddress(parsed.sender),
            receiver: normalizeAddress(parsed.receiver),
            transactionHash,
            anchorStatus,
            anchorError: anchorError || (transactionHash && !txHashRegex.test(transactionHash)
                ? "transactionHash is not a valid on-chain anchor hash"
                : undefined),
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