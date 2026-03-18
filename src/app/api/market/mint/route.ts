/**
 * Template Minting API Route
 * POST - Create a new template record (simulates NFT minting for MVP)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ethers } from "ethers";
import { withRateLimit } from "@/lib/security/rateLimit";

const MARKETPLACE_ABI = ["function treasury() external view returns (address)"];

async function verifyMintPayment(
    paymentTxHash: string,
    creatorAddress: string,
    mintFeeDocu: number
): Promise<{ ok: boolean; error?: string }> {
    const rpcUrl = process.env.POLKADOT_HUB_RPC_URL ?? "https://eth-rpc-testnet.polkadot.io/";
    const marketplaceAddress = process.env.MARKETPLACE_CONTRACT_ADDRESS;

    if (!marketplaceAddress || !/^0x[a-fA-F0-9]{40}$/.test(marketplaceAddress)) {
        return { ok: false, error: "Server MARKETPLACE_CONTRACT_ADDRESS is missing or invalid." };
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(creatorAddress)) {
        return { ok: false, error: "creatorAddress must be a valid EVM address." };
    }

    if (!Number.isFinite(mintFeeDocu) || mintFeeDocu <= 0) {
        return { ok: false, error: "mintFeeDocu must be a positive number." };
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, provider);

    const [tx, receipt, treasuryAddress] = await Promise.all([
        provider.getTransaction(paymentTxHash),
        provider.getTransactionReceipt(paymentTxHash),
        marketplace.treasury() as Promise<string>,
    ]);

    if (!tx) {
        return { ok: false, error: "Mint payment transaction was not found on RPC." };
    }

    if (!receipt || receipt.status !== 1) {
        return { ok: false, error: "Mint payment transaction is not confirmed successfully." };
    }

    if (!tx.from || tx.from.toLowerCase() !== creatorAddress.toLowerCase()) {
        return { ok: false, error: "Mint payment sender does not match creatorAddress." };
    }

    if (!tx.to || tx.to.toLowerCase() !== treasuryAddress.toLowerCase()) {
        return { ok: false, error: "Mint payment recipient does not match marketplace treasury." };
    }

    const expectedFeeInPas = mintFeeDocu / 1000;
    const minimumValue = ethers.parseEther(expectedFeeInPas.toFixed(6));
    if (tx.value < minimumValue) {
        return { ok: false, error: "Mint payment value is below required fee." };
    }

    return { ok: true };
}

export async function POST(request: NextRequest) {
    try {
        const limited = withRateLimit(request, "market-mint", {
            windowMs: 60_000,
            maxRequests: 10,
        });
        if (limited) return limited;

        const body = await request.json();
        const {
            title,
            description,
            category,
            content,
            price,
            placeholders,
            creatorAddress,
            ipfsCid,
            royaltyPercent,
            paymentTxHash,
            mintFeeDocu,
        } = body;

        if (!title || !category || !creatorAddress || !price) {
            return NextResponse.json(
                {
                    success: false,
                    error: "title, category, creatorAddress, and price are required",
                },
                { status: 400 }
            );
        }

        if (!paymentTxHash || !/^0x[a-fA-F0-9]{64}$/.test(String(paymentTxHash))) {
            return NextResponse.json(
                {
                    success: false,
                    error: "A valid on-chain mint fee payment transaction hash is required.",
                },
                { status: 400 }
            );
        }

        const mintFee = Number(mintFeeDocu ?? 0);
        const paymentCheck = await verifyMintPayment(paymentTxHash, creatorAddress, mintFee);
        if (!paymentCheck.ok) {
            return NextResponse.json(
                {
                    success: false,
                    error: paymentCheck.error || "Mint payment verification failed.",
                },
                { status: 400 }
            );
        }

        // Find or create creator user record
        let creator = await prisma.user.findUnique({
            where: { walletAddress: creatorAddress },
        });

        if (!creator) {
            creator = await prisma.user.create({
                data: { walletAddress: creatorAddress },
            });
        }

        // Generate a mock IPFS CID if none provided
        const cid =
            ipfsCid ||
            `Qm${Array.from({ length: 44 }, () =>
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
                    Math.floor(Math.random() * 62)
                )
            ).join("")}`;

        // Create template record
        const template = await prisma.template.create({
            data: {
                title,
                description: description || "",
                category,
                content: content || "",
                price: typeof price === "string" ? parseFloat(price) : price,
                placeholders: JSON.stringify(placeholders || []),
                creatorId: creator.id,
                ipfsCid: cid,
                royaltyPercent: royaltyPercent || 10,
                isListed: true,
                isVerified: false,
                salesCount: 0,
            },
        });

        // Also create ownership for the creator
        await prisma.templateOwnership.create({
            data: {
                templateId: template.id,
                userId: creator.id,
            },
        });

        await prisma.adminLog.create({
            data: {
                adminAddress: creatorAddress,
                action: "MINT_TEMPLATE",
                targetType: "Template",
                targetId: template.id,
                details: JSON.stringify({ paymentTxHash, mintFeeDocu: mintFeeDocu ?? null }),
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                templateId: template.id,
                ipfsCid: cid,
                title: template.title,
                message: "Template minted successfully",
            },
        });
    } catch (error) {
        console.error("Mint error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to mint template" },
            { status: 500 }
        );
    }
}
