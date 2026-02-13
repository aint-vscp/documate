/**
 * Verification Submission API Route
 * POST - Submit a verification request for a minted template
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { templateId, creatorAddress, feePaid, paymentTx } = body;

        if (!templateId || !creatorAddress) {
            return NextResponse.json(
                { success: false, error: "templateId and creatorAddress are required" },
                { status: 400 }
            );
        }

        // Verify the template exists
        const template = await prisma.template.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            return NextResponse.json(
                { success: false, error: "Template not found" },
                { status: 404 }
            );
        }

        // Find the requester
        const requester = await prisma.user.findUnique({
            where: { walletAddress: creatorAddress },
        });

        if (!requester) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Check for existing pending verification
        const existing = await prisma.templateVerification.findFirst({
            where: {
                templateId,
                status: "PENDING",
            },
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: "A verification request is already pending for this template" },
                { status: 400 }
            );
        }

        // Create verification request
        const verification = await prisma.templateVerification.create({
            data: {
                templateId,
                requesterId: requester.id,
                status: "PENDING",
                feePaid: feePaid || 0,
                paymentTx: paymentTx || null,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                verificationId: verification.id,
                status: "PENDING",
                message: "Verification request submitted successfully. Our team will review your template.",
            },
        });
    } catch (error) {
        console.error("Verification submit error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to submit verification request" },
            { status: 500 }
        );
    }
}
