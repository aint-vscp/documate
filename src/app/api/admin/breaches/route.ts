/**
 * Admin Breach Management API Route
 * GET  - List breach reports (with optional status filter)
 * POST - Investigate, confirm, or dismiss a breach report
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ethers } from "ethers";
import { withRateLimit } from "@/lib/security/rateLimit";

const STAKING_ABI = [
    "function slashStake(address _user, string _reason) external",
];

async function slashStakeOnChain(targetWallet: string, reason: string): Promise<string | null> {
    const rpcUrl = process.env.POLKADOT_HUB_RPC_URL ?? "https://eth-rpc-testnet.polkadot.io/";
    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    const stakingAddress = process.env.STAKING_CONTRACT_ADDRESS;

    if (!privateKey || !stakingAddress) {
        return null;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(stakingAddress, STAKING_ABI, wallet);

    const tx = await contract.slashStake(targetWallet, reason);
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash ?? null;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const status = searchParams.get("status");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};
        if (status && status !== "ALL") {
            where.status = status;
        }

        const breaches = await prisma.breachReport.findMany({
            where,
            include: {
                reporter: {
                    select: {
                        walletAddress: true,
                        did: true,
                    },
                },
                target: {
                    select: {
                        walletAddress: true,
                        did: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, data: breaches });
    } catch (error) {
        console.error("Breach list error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch breach reports" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const limited = withRateLimit(request, "admin-breaches-post", {
            windowMs: 60_000,
            maxRequests: 20,
        });
        if (limited) return limited;

        const body = await request.json();
        const { breachId, action, severity, resolution, reviewerAddress } = body;

        if (!breachId || !action) {
            return NextResponse.json(
                { success: false, error: "breachId and action are required" },
                { status: 400 }
            );
        }

        if (!["investigate", "confirm", "dismiss"].includes(action)) {
            return NextResponse.json(
                { success: false, error: "action must be 'investigate', 'confirm', or 'dismiss'" },
                { status: 400 }
            );
        }

        if ((action === "confirm" || action === "dismiss") && !resolution?.trim()) {
            return NextResponse.json(
                { success: false, error: "Resolution is required for confirm/dismiss" },
                { status: 400 }
            );
        }

        let newStatus: string;
        switch (action) {
            case "investigate":
                newStatus = "INVESTIGATING";
                break;
            case "confirm":
                newStatus = "CONFIRMED";
                break;
            case "dismiss":
                newStatus = "DISMISSED";
                break;
            default:
                newStatus = "PENDING";
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {
            status: newStatus,
        };

        if (resolution) updateData.resolution = resolution;
        if (severity) updateData.severity = severity;
        if (action !== "investigate") {
            updateData.reviewedAt = new Date();
            updateData.reviewedBy = reviewerAddress || null;
        }

        const updated = await prisma.breachReport.update({
            where: { id: breachId },
            data: updateData,
        });

        let onChainSlashTx: string | null = null;

        // If confirmed, create a negative reputation tag for the target
        if (action === "confirm" && updated.targetId) {
            const tagValue = severity === "CRITICAL" ? -100 : severity === "HIGH" ? -50 : -25;
            const tagName = severity === "CRITICAL" ? "Breach - Critical" : "High Risk";

            await prisma.reputationTag.create({
                data: {
                    userId: updated.targetId,
                    tag: tagName,
                    source: "BREACH",
                    value: tagValue,
                },
            });

            const targetUser = await prisma.user.findUnique({
                where: { id: updated.targetId },
                select: { walletAddress: true },
            });

            if (targetUser?.walletAddress) {
                try {
                    onChainSlashTx = await slashStakeOnChain(
                        targetUser.walletAddress,
                        resolution || "Admin confirmed breach"
                    );
                } catch (chainError) {
                    console.error("On-chain slash failed:", chainError);
                }
            }
        }

        // Log admin action
        if (reviewerAddress) {
            await prisma.adminLog.create({
                data: {
                    adminAddress: reviewerAddress,
                    action: `BREACH_${newStatus}`,
                    targetId: breachId,
                    details: resolution || `Breach ${action}d`,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: updated,
            onChainSlashTx,
        });
    } catch (error) {
        console.error("Breach action error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process breach action" },
            { status: 500 }
        );
    }
}
