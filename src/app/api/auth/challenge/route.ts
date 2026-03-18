/**
 * Auth API - Challenge Endpoint
 * Generates a sign-in challenge for SIWP authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { generateChallenge } from "@/lib/auth";
import { withRateLimit } from "@/lib/security/rateLimit";

export async function POST(request: NextRequest) {
    try {
        const limited = withRateLimit(request, "auth-challenge", {
            windowMs: 60_000,
            maxRequests: 20,
        });
        if (limited) return limited;

        const body = await request.json();
        const { address, chainId } = body;

        if (!address) {
            return NextResponse.json(
                { error: "Address is required" },
                { status: 400 }
            );
        }

        if (typeof chainId !== "undefined" && ![null, ""].includes(chainId) && !Number.isFinite(Number(chainId))) {
            return NextResponse.json(
                { error: "Invalid chainId format" },
                { status: 400 }
            );
        }

        // Validate address format (Polkadot addresses start with 1, 5, etc.)
        if (!address.match(/^[1-9A-HJ-NP-Za-km-z]{47,48}$/)) {
            return NextResponse.json(
                { error: "Invalid Polkadot address format" },
                { status: 400 }
            );
        }

        // Generate challenge
        const challenge = generateChallenge(address, chainId);

        // In production, store challenge in database or Redis
        // await prisma.authChallenge.create({ data: challenge });

        return NextResponse.json({
            message: challenge.message,
            nonce: challenge.nonce,
            expiresAt: challenge.expiresAt.toISOString(),
        });
    } catch (error) {
        console.error("Challenge generation failed:", error);
        return NextResponse.json(
            { error: "Failed to generate challenge" },
            { status: 500 }
        );
    }
}
