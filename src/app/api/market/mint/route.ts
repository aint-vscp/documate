/**
 * Template Minting API Route
 * POST - Create a new template record (simulates NFT minting for MVP)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
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
