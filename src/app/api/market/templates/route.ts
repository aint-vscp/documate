/**
 * Marketplace Templates API Route
 * GET - List templates with filters (category, search, verified, pagination)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const category = searchParams.get("category");
        const search = searchParams.get("search");
        const verified = searchParams.get("verified");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "20", 10);

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

        const [templates, total] = await Promise.all([
            prisma.template.findMany({
                where,
                include: {
                    creator: {
                        select: {
                            walletAddress: true,
                            did: true,
                        },
                    },
                    _count: {
                        select: { purchases: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.template.count({ where }),
        ]);

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
