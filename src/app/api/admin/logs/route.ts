/**
 * Admin Audit Log API Route
 * GET - List admin action logs with optional filters
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const action = searchParams.get("action");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (action && action !== "ALL") {
            where.action = { contains: action };
        }

        const [logs, total] = await Promise.all([
            prisma.adminLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.adminLog.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Admin logs error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}
