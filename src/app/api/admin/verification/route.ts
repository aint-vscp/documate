/**
 * Admin Verification Queue API Route
 * GET  - List verification requests (with optional status filter)
 * POST - Approve or reject a verification request
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const status = searchParams.get("status");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};
        if (status && status !== "ALL") {
            where.status = status;
        }

        const requests = await prisma.templateVerification.findMany({
            where,
            include: {
                template: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        ipfsCid: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, data: requests });
    } catch (error) {
        console.error("Verification list error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch verification requests" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { verificationId, action, feedback, reviewerAddress } = body;

        if (!verificationId || !action) {
            return NextResponse.json(
                { success: false, error: "verificationId and action are required" },
                { status: 400 }
            );
        }

        if (!["approve", "reject"].includes(action)) {
            return NextResponse.json(
                { success: false, error: "action must be 'approve' or 'reject'" },
                { status: 400 }
            );
        }

        if (action === "reject" && !feedback?.trim()) {
            return NextResponse.json(
                { success: false, error: "Feedback is required for rejection" },
                { status: 400 }
            );
        }

        const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

        const updated = await prisma.templateVerification.update({
            where: { id: verificationId },
            data: {
                status: newStatus,
                feedback: feedback || null,
                reviewedAt: new Date(),
                reviewerId: reviewerAddress || null,
            },
        });

        // If approved, mark the template as verified
        if (action === "approve" && updated.templateId) {
            await prisma.template.update({
                where: { id: updated.templateId },
                data: { isVerified: true },
            });
        }

        // Log admin action
        if (reviewerAddress) {
            await prisma.adminLog.create({
                data: {
                    adminAddress: reviewerAddress,
                    action: `VERIFICATION_${newStatus}`,
                    targetId: verificationId,
                    details: feedback || `Verification ${action}d`,
                },
            });
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Verification action error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process verification action" },
            { status: 500 }
        );
    }
}
