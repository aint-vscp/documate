/**
 * Marketplace Templates API Route
 * GET - List templates with filters (category, search, verified, pagination)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const ALLOWED_CATEGORIES = new Set(["LEGAL", "CREATIVE", "ENGINEERING"]);

function escapeSqlString(value: string): string {
    return value.replace(/'/g, "''");
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const category = searchParams.get("category");
        const search = searchParams.get("search");
        const verified = searchParams.get("verified");
        const buyerAddressQuery = searchParams.get("buyerAddress");
        const buyerAddress =
            typeof buyerAddressQuery === "string" && /^0x[a-fA-F0-9]{40}$/.test(buyerAddressQuery)
                ? buyerAddressQuery.toLowerCase()
                : null;
        const parsedPage = parseInt(searchParams.get("page") || "1", 10);
        const parsedLimit = parseInt(searchParams.get("limit") || "20", 10);
        const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;

        // Build filter conditions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {
            isListed: true,
        };

        if (category && category !== "ALL") {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
            ];
        }

        if (verified === "true") {
            where.isVerified = true;
        }

        const sqlFilters: string[] = ["t.isListed = 1"];

        if (typeof where.category === "string" && ALLOWED_CATEGORIES.has(where.category)) {
            sqlFilters.push(`t.category = '${escapeSqlString(where.category)}'`);
        }

        if (where.isVerified === true) {
            sqlFilters.push("t.isVerified = 1");
        }

        if (search) {
            const escapedSearch = escapeSqlString(search.trim().toLowerCase());
            if (escapedSearch.length > 0) {
                sqlFilters.push(
                    `(LOWER(t.title) LIKE '%${escapedSearch}%' OR LOWER(t.description) LIKE '%${escapedSearch}%')`
                );
            }
        }

        const sql = `
            SELECT
                t.*,
                u.walletAddress AS creatorWalletAddress,
                u.did AS creatorDid,
                COALESCE(p.purchaseCount, 0) AS purchaseCount
            FROM Template t
            LEFT JOIN User u ON u.id = t.creatorId
            LEFT JOIN (
                SELECT templateId, COUNT(*) AS purchaseCount
                FROM Purchase
                GROUP BY templateId
            ) p ON p.templateId = t.id
            WHERE ${sqlFilters.join(" AND ")}
            ORDER BY t.createdAt DESC
        `;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = await prisma.$queryRawUnsafe<any[]>(sql);

        const ownedTemplateIds = new Set<string>();
        if (buyerAddress) {
            const ownedSql = `
                SELECT towner.templateId AS templateId
                FROM TemplateOwnership towner
                INNER JOIN User u ON u.id = towner.userId
                WHERE LOWER(u.walletAddress) = '${escapeSqlString(buyerAddress)}'
            `;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ownedRows = await prisma.$queryRawUnsafe<any[]>(ownedSql);
            ownedRows.forEach((row) => {
                if (row?.templateId) {
                    ownedTemplateIds.add(String(row.templateId));
                }
            });
        }

        const total = rows.length;
        const offset = (page - 1) * limit;
        const templates = rows.slice(offset, offset + limit).map((row) => {
            const {
                creatorWalletAddress,
                creatorDid,
                purchaseCount,
                ...template
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }: any = row;

            return {
                ...template,
                creator: {
                    walletAddress: creatorWalletAddress ?? null,
                    did: creatorDid ?? null,
                },
                isCreator:
                    buyerAddress && creatorWalletAddress
                        ? String(creatorWalletAddress).toLowerCase() === buyerAddress
                        : false,
                alreadyOwned: buyerAddress ? ownedTemplateIds.has(String(template.id)) : false,
                _count: {
                    purchases: Number(purchaseCount ?? 0),
                },
            };
        });

        return NextResponse.json({
            success: true,
            data: templates,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Templates list error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch templates" },
            { status: 500 }
        );
    }
}
