import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { DocumentInstance } from "@/types";

function normalizeAddress(address: string): string {
    return (address || "").trim().toLowerCase();
}

function isValidEvmAddress(value: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
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

    await prisma.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_shared_document_sender ON SharedDocument(sender)"
    );
    await prisma.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_shared_document_receiver ON SharedDocument(receiver)"
    );
    await prisma.$executeRawUnsafe(
        "CREATE INDEX IF NOT EXISTS idx_shared_document_updated_at ON SharedDocument(updatedAt DESC)"
    );
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

export async function GET(request: NextRequest) {
    try {
        const walletAddress = request.nextUrl.searchParams.get("walletAddress");
        if (!walletAddress || !isValidEvmAddress(walletAddress)) {
            return NextResponse.json(
                { success: false, error: "walletAddress is required and must be a valid EVM address" },
                { status: 400 }
            );
        }

        const normalized = normalizeAddress(walletAddress);
        await ensureTable();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = await prisma.$queryRawUnsafe<any[]>(
            `
                SELECT payload
                FROM SharedDocument
                WHERE sender = '${normalized.replace(/'/g, "''")}' OR receiver = '${normalized.replace(/'/g, "''")}'
                ORDER BY updatedAt DESC
            `
        );

        const documents = rows
            .map((row) => parsePayload(String(row.payload ?? "")))
            .filter((doc): doc is DocumentInstance => !!doc);

        return NextResponse.json({
            success: true,
            data: documents,
        });
    } catch (error) {
        console.error("Shared documents GET error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to load documents" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as DocumentInstance;
        if (!body?.id) {
            return NextResponse.json(
                { success: false, error: "document id is required" },
                { status: 400 }
            );
        }

        const sender = normalizeAddress(body.sender);
        const receiver = normalizeAddress(body.receiver);

        if (!isValidEvmAddress(sender) || !isValidEvmAddress(receiver)) {
            return NextResponse.json(
                { success: false, error: "sender and receiver must be valid EVM addresses" },
                { status: 400 }
            );
        }

        const normalizedDoc: DocumentInstance = {
            ...body,
            sender,
            receiver,
            createdAt: body.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await ensureTable();

        const escapedId = normalizedDoc.id.replace(/'/g, "''");
        const escapedSender = sender.replace(/'/g, "''");
        const escapedReceiver = receiver.replace(/'/g, "''");
        const escapedStatus = normalizedDoc.status.replace(/'/g, "''");
        const escapedCreatedAt = normalizedDoc.createdAt.replace(/'/g, "''");
        const escapedUpdatedAt = normalizedDoc.updatedAt.replace(/'/g, "''");
        const escapedPayload = JSON.stringify(normalizedDoc).replace(/'/g, "''");

        await prisma.$executeRawUnsafe(`
            INSERT INTO SharedDocument (id, sender, receiver, status, createdAt, updatedAt, payload)
            VALUES ('${escapedId}', '${escapedSender}', '${escapedReceiver}', '${escapedStatus}', '${escapedCreatedAt}', '${escapedUpdatedAt}', '${escapedPayload}')
            ON CONFLICT(id) DO UPDATE SET
                sender = excluded.sender,
                receiver = excluded.receiver,
                status = excluded.status,
                updatedAt = excluded.updatedAt,
                payload = excluded.payload
        `);

        return NextResponse.json({ success: true, data: normalizedDoc });
    } catch (error) {
        console.error("Shared documents POST error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to save document" },
            { status: 500 }
        );
    }
}