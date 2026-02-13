/**
 * Admin Templates API Route
 * GET - List all templates with filters
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

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
        } else if (verified === "false") {
            where.isVerified = false;
        }

        const [templates, total] = await Promise.all([
            prisma.template.findMany({
                where,
                include: {
                    creator: {
                        select: {
                            walletAddress: true,
                            did: true,
                            web3name: true,
                        },
                    },
                    verification: {
                        select: {
                            status: true,
                            reviewedAt: true,
                        },
                    },
                    _count: {
                        select: { purchases: true, owners: true },
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
        console.error("Admin templates list error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch templates" },
            { status: 500 }
        );
    }
}
