/**
 * Admin Verification Queue API Route
 * GET  - List verification requests (with optional status filter)
 * POST - Approve or reject a verification request
 */

import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import prisma from "@/lib/db";

const RPC_TIMEOUT_MS = 25_000;

async function withTimeout<T>(promise: Promise<T>, ms = RPC_TIMEOUT_MS): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("RPC request timed out.")), ms);
    });

    return Promise.race([promise, timeoutPromise]);
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
        const { verificationId, action, feedback, reviewerAddress, walletAddress } = body;

        if (action === "manual_verify") {
            const targetWalletAddress = String(walletAddress || "").trim();
            if (!/^0x[a-fA-F0-9]{40}$/.test(targetWalletAddress)) {
                return NextResponse.json(
                    { success: false, error: "A valid walletAddress is required for manual verification" },
                    { status: 400 }
                );
            }

            const privateKey = process.env.PRIVATE_KEY;
            const rpcUrl = process.env.POLKADOT_HUB_RPC_URL || "https://eth-rpc-testnet.polkadot.io/";
            const contractAddress = process.env.NEXT_PUBLIC_DOCUMATE_CONTRACT_ADDRESS;

            if (!privateKey) {
                return NextResponse.json(
                    { success: false, error: "PRIVATE_KEY is missing from environment" },
                    { status: 500 }
                );
            }

            if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
                return NextResponse.json(
                    { success: false, error: "NEXT_PUBLIC_DOCUMATE_CONTRACT_ADDRESS is missing or invalid" },
                    { status: 500 }
                );
            }

            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const signer = new ethers.Wallet(privateKey, provider);
            const contract = new ethers.Contract(
                contractAddress,
                [
                    "function mockKiltPrecompile(address) external",
                    "function isVerified(address) view returns (bool)",
                ],
                signer
            );

            const tx = await withTimeout(contract.mockKiltPrecompile(targetWalletAddress));
            await withTimeout(tx.wait());
            const verified = await withTimeout(contract.isVerified(targetWalletAddress));

            if (!verified) {
                return NextResponse.json(
                    {
                        success: false,
                        verified: false,
                        txHash: tx.hash,
                        address: targetWalletAddress,
                        error: "Contract call succeeded but wallet is still not verified",
                    },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                verified: true,
                txHash: tx.hash,
                address: targetWalletAddress,
            });
        }

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

        // Look up reviewer by wallet address to get user ID
        let reviewerId: string | null = null;
        if (reviewerAddress) {
            const reviewer = await prisma.user.findUnique({
                where: { walletAddress: reviewerAddress },
            });
            reviewerId = reviewer?.id || null;
        }

        const updated = await prisma.templateVerification.update({
            where: { id: verificationId },
            data: {
                status: newStatus,
                feedback: feedback || null,
                reviewedAt: new Date(),
                reviewerId,
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
