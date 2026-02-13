/**
 * Breach Report API Route
 * POST - Submit a new breach report (used by regular users)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            reporterAddress,
            targetAddress,
            reason,
            description,
            evidence,
            contractHash,
            txHash,
        } = body;

        if (!reporterAddress || !targetAddress || !reason) {
            return NextResponse.json(
                {
                    success: false,
                    error: "reporterAddress, targetAddress, and reason are required",
                },
                { status: 400 }
            );
        }

        // Find or create reporter
        let reporter = await prisma.user.findUnique({
            where: { walletAddress: reporterAddress },
        });

        if (!reporter) {
            reporter = await prisma.user.create({
                data: { walletAddress: reporterAddress },
            });
        }

        // Find or create target
        let target = await prisma.user.findUnique({
            where: { walletAddress: targetAddress },
        });

        if (!target) {
            target = await prisma.user.create({
                data: { walletAddress: targetAddress },
            });
        }

        // Prevent self-reporting
        if (reporterAddress === targetAddress) {
            return NextResponse.json(
                { success: false, error: "Cannot report yourself" },
                { status: 400 }
            );
        }

        // Create breach report
        const breach = await prisma.breachReport.create({
            data: {
                reporterId: reporter.id,
                targetId: target.id,
                reason,
                description: description || "",
                evidence: evidence || null,
                contractHash: contractHash || null,
                txHash: txHash || null,
                status: "PENDING",
                severity: "MEDIUM",
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                breachId: breach.id,
                status: "PENDING",
                message:
                    "Breach report submitted. Our admin team will investigate and take action.",
            },
        });
    } catch (error) {
        console.error("Breach report error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to submit breach report" },
            { status: 500 }
        );
    }
}
