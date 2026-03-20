import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { DocumentAnchorStatus, DocumentInstance } from "@/types";

function normalizeAddress(address: string): string {
    return (address || "").trim().toLowerCase();
}

function isValidEvmAddress(value: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
}

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;
const VALID_ANCHOR_STATUSES = new Set(["PENDING", "ANCHORED", "FAILED"] as const);

function normalizeOptionalString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function validateAnchorFields(document: DocumentInstance): string | null {
    const txHash = normalizeOptionalString(document.transactionHash);
    const anchorStatus = normalizeOptionalString(document.anchorStatus);

    if (txHash && !TX_HASH_REGEX.test(txHash)) {
        return "transactionHash must match ^0x[a-fA-F0-9]{64}$";
    }

    if (anchorStatus && !VALID_ANCHOR_STATUSES.has(anchorStatus as "PENDING" | "ANCHORED" | "FAILED")) {
        return "anchorStatus must be one of PENDING, ANCHORED, FAILED";
    }

    if (anchorStatus === "ANCHORED" && !txHash) {
        return "anchorStatus ANCHORED requires a valid transactionHash";
    }

    return null;
}

function withNormalizedAnchorMetadata(document: DocumentInstance): DocumentInstance {
    const txHash = normalizeOptionalString(document.transactionHash);
    const anchorError = normalizeOptionalString(document.anchorError);
    const incomingStatus = normalizeOptionalString(document.anchorStatus);
    const anchorStatus: DocumentAnchorStatus | undefined = incomingStatus && VALID_ANCHOR_STATUSES.has(incomingStatus as "PENDING" | "ANCHORED" | "FAILED")
        ? (incomingStatus as DocumentAnchorStatus)
        : (txHash
            ? (TX_HASH_REGEX.test(txHash) ? "ANCHORED" : "FAILED")
            : undefined);

    return {
        ...document,
        transactionHash: txHash,
        anchorStatus,
        anchorError: anchorError || (txHash && !TX_HASH_REGEX.test(txHash) ? "transactionHash is not a valid on-chain anchor hash" : undefined),
    };
}

async function ensureTable(): Promise<void> {
    await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS SharedDocument (
            id TEXT PRIMARY KEY,
            sender TEXT NOT NULL,
            receiver TEXT NOT NULL,
            status TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            payload TEXT NOT NULL
        )
    `;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_shared_document_sender ON SharedDocument(sender)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_shared_document_receiver ON SharedDocument(receiver)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_shared_document_updated_at ON SharedDocument(updatedAt DESC)`;
}

function parsePayload(payload: string): DocumentInstance | null {
    try {
        const parsed = JSON.parse(payload) as DocumentInstance;
        return withNormalizedAnchorMetadata({
            ...parsed,
            sender: normalizeAddress(parsed.sender),
            receiver: normalizeAddress(parsed.receiver),
        });
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

        const rows = await prisma.sharedDocument.findMany({
            where: {
                OR: [{ sender: normalized }, { receiver: normalized }],
            },
            orderBy: { updatedAt: "desc" },
            select: { payload: true },
        });

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

        const anchorValidationError = validateAnchorFields(normalizedDoc);
        if (anchorValidationError) {
            return NextResponse.json(
                { success: false, error: anchorValidationError },
                { status: 400 }
            );
        }

        const normalizedWithAnchor = withNormalizedAnchorMetadata(normalizedDoc);

        await ensureTable();

        await prisma.sharedDocument.upsert({
            where: { id: normalizedWithAnchor.id },
            create: {
                id: normalizedWithAnchor.id,
                sender,
                receiver,
                status: normalizedWithAnchor.status,
                createdAt: normalizedWithAnchor.createdAt,
                updatedAt: normalizedWithAnchor.updatedAt,
                payload: JSON.stringify(normalizedWithAnchor),
            },
            update: {
                sender,
                receiver,
                status: normalizedWithAnchor.status,
                updatedAt: normalizedWithAnchor.updatedAt,
                payload: JSON.stringify(normalizedWithAnchor),
            },
        });

        return NextResponse.json({ success: true, data: normalizedWithAnchor });
    } catch (error) {
        console.error("Shared documents POST error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to save document" },
            { status: 500 }
        );
    }
}