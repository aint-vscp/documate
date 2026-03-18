import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

function normalizeAddress(address: string): string {
    return (address || "").trim().toLowerCase();
}

function escapeSqlString(value: string): string {
    return value.replace(/'/g, "''");
}

function isValidEvmAddress(value: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
}

async function ensureSharedDocumentTable(): Promise<void> {
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

export async function GET(request: NextRequest) {
    try {
        const walletAddress = normalizeAddress(request.nextUrl.searchParams.get("walletAddress") || "");
        if (!isValidEvmAddress(walletAddress)) {
            return NextResponse.json(
                { success: false, error: "walletAddress must be a valid EVM address" },
                { status: 400 }
            );
        }

        await ensureSharedDocumentTable();

        let purchases: Array<{
            type: string;
            txHash: string;
            createdAt: string;
            referenceId: string;
            amount: string | null;
        }> = [];

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            purchases = await prisma.$queryRawUnsafe<any[]>(`
                SELECT
                    'MARKET_PURCHASE' AS type,
                    p.txHash AS txHash,
                    p.createdAt AS createdAt,
                    p.templateId AS referenceId,
                    p.totalPrice AS amount
                FROM Purchase p
                WHERE LOWER(p.buyerAddress) = '${escapeSqlString(walletAddress)}'
                   OR LOWER(p.sellerAddress) = '${escapeSqlString(walletAddress)}'
                ORDER BY p.createdAt DESC
                LIMIT 50
            `);
        } catch (error) {
            console.warn("Activity API purchase query skipped:", error);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docs = await prisma.$queryRawUnsafe<any[]>(`
            SELECT payload
            FROM SharedDocument
            WHERE sender = '${escapeSqlString(walletAddress)}' OR receiver = '${escapeSqlString(walletAddress)}'
            ORDER BY updatedAt DESC
            LIMIT 100
        `);

        const docAnchors = docs
            .map((row) => {
                try {
                    const payload = JSON.parse(String(row.payload ?? "")) as {
                        id?: string;
                        transactionHash?: string;
                        anchorStatus?: string;
                        finalizedAt?: string;
                        updatedAt?: string;
                    };

                    const txHash = String(payload.transactionHash ?? "");
                    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
                        return null;
                    }

                    if (payload.anchorStatus === "FAILED") {
                        return null;
                    }

                    return {
                        type: "DOCUMENT_ANCHOR",
                        txHash,
                        createdAt: payload.finalizedAt || payload.updatedAt || new Date().toISOString(),
                        referenceId: payload.id || "",
                        amount: null,
                    };
                } catch {
                    return null;
                }
            })
            .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

        const combined = [...purchases, ...docAnchors]
            .filter((entry) => typeof entry.txHash === "string" && entry.txHash.length > 0)
            .sort((a, b) => Date.parse(String(b.createdAt)) - Date.parse(String(a.createdAt)))
            .slice(0, 50);

        return NextResponse.json({ success: true, data: combined });
    } catch (error) {
        console.error("Activity API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to load activity" },
            { status: 500 }
        );
    }
}
