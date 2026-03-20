/**
 * Marketplace Templates API Route
 * GET - List templates with filters (category, search, verified, pagination)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const ALLOWED_CATEGORIES = new Set(["LEGAL", "CREATIVE", "ENGINEERING"]);

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

        if (category && category !== "ALL" && !ALLOWED_CATEGORIES.has(category)) {
            return NextResponse.json({
                success: true,
                data: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0,
                },
            });
        }

        const total = await prisma.template.count({ where });
        const rows = await prisma.template.findMany({
            where,
            include: {
                creator: {
                    select: {
                        walletAddress: true,
                        did: true,
                    },
                },
                _count: {
                    select: {
                        purchases: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        const ownedTemplateIds = new Set<string>();
        if (buyerAddress && rows.length > 0) {
            const ownedRows = await prisma.templateOwnership.findMany({
                where: {
                    templateId: { in: rows.map((row) => row.id) },
                    user: {
                        walletAddress: { equals: buyerAddress, mode: "insensitive" },
                    },
                },
                select: { templateId: true },
            });
            ownedRows.forEach((row) => {
                if (row?.templateId) {
                    ownedTemplateIds.add(String(row.templateId));
                }
            });
        }

        const templates = rows.map((row) => {
            const {
                creator,
                _count,
                ...template
            } = row;

            return {
                ...template,
                creator: {
                    walletAddress: creator?.walletAddress ?? null,
                    did: creator?.did ?? null,
                },
                isCreator:
                    buyerAddress && creator?.walletAddress
                        ? String(creator.walletAddress).toLowerCase() === buyerAddress
                        : false,
                alreadyOwned: buyerAddress ? ownedTemplateIds.has(String(template.id)) : false,
                _count: {
                    purchases: Number(_count.purchases ?? 0),
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
