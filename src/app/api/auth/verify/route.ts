/**
 * Auth API - Verify Endpoint
 * Verifies a signed challenge and creates a session
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySignedChallenge, createSession, parseSignInMessage } from "@/lib/auth";
import { cookies } from "next/headers";
import { withRateLimit } from "@/lib/security/rateLimit";

export async function POST(request: NextRequest) {
    try {
        const limited = withRateLimit(request, "auth-verify", {
            windowMs: 60_000,
            maxRequests: 15,
        });
        if (limited) return limited;

        const body = await request.json();
        const { address, message, signature } = body;

        if (!address || !message || !signature) {
            return NextResponse.json(
                { error: "Address, message, and signature are required" },
                { status: 400 }
            );
        }

        // Parse the message to validate
        const parsed = parseSignInMessage(message);
        
        // Verify message hasn't expired
        if (parsed.expiresAt && new Date() > parsed.expiresAt) {
            return NextResponse.json(
                { error: "Challenge has expired" },
                { status: 400 }
            );
        }

        // Verify address matches
        if (parsed.address !== address) {
            return NextResponse.json(
                { error: "Address mismatch" },
                { status: 400 }
            );
        }

        // Verify signature
        const verification = await verifySignedChallenge({
            address,
            message,
            signature,
        });

        if (!verification.isValid) {
            return NextResponse.json(
                { error: verification.error || "Invalid signature" },
                { status: 401 }
            );
        }

        // In production, look up or create user in database
        // const user = await prisma.user.upsert({
        //     where: { walletAddress: address },
        //     create: { walletAddress: address },
        //     update: { updatedAt: new Date() },
        // });
        const userId = `user_${address.slice(0, 8)}`;

        // Create session
        const session = createSession(userId, address);

        // In production, store session in database
        // await prisma.session.create({ data: session });

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set("session_token", session.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            expires: session.expiresAt,
            path: "/",
        });

        return NextResponse.json({
            success: true,
            userId,
            address,
            expiresAt: session.expiresAt.toISOString(),
        });
    } catch (error) {
        console.error("Verification failed:", error);
        return NextResponse.json(
            { error: "Verification failed" },
            { status: 500 }
        );
    }
}
