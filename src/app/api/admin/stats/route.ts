/**
 * Admin Stats API Route
 * Returns platform statistics for the admin dashboard
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
    try {
        const [
            totalUsers,
            totalTemplates,
            verificationCount,
            breachCount,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.template.count(),
            prisma.templateVerification.count({
                where: { status: "PENDING" },
            }),
            prisma.breachReport.count({
                where: { status: "PENDING" },
            }),
        ]);

        return NextResponse.json({
            totalUsers,
            totalTemplates,
            verificationCount,
            breachCount,
        });
    } catch (error) {
        console.error("Admin stats error:", error);

        // Return fallback zeros so the admin UI renders gracefully
        return NextResponse.json({
            totalUsers: 0,
            totalTemplates: 0,
            verificationCount: 0,
            breachCount: 0,
        });
    }
}
