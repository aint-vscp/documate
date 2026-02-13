/**
 * Marketplace Purchase API Route
 * POST - Record a template purchase with 75/20/5 revenue split
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { REVENUE_SPLIT } from "@/lib/contracts/marketplace";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { templateId, buyerAddress, txHash } = body;

        if (!templateId || !buyerAddress) {
            return NextResponse.json(
                { success: false, error: "templateId and buyerAddress are required" },
                { status: 400 }
            );
        }

        // Fetch the template
        const template = await prisma.template.findUnique({
            where: { id: templateId },
            include: {
                creator: { select: { id: true, walletAddress: true } },
            },
        });

        if (!template) {
            return NextResponse.json(
                { success: false, error: "Template not found" },
                { status: 404 }
            );
        }

        if (!template.isListed) {
            return NextResponse.json(
                { success: false, error: "Template is not listed for sale" },
                { status: 400 }
            );
        }

        // Find or create buyer user record
        let buyer = await prisma.user.findUnique({
            where: { walletAddress: buyerAddress },
        });

        if (!buyer) {
            buyer = await prisma.user.create({
                data: { walletAddress: buyerAddress },
            });
        }

        // Check if buyer already owns this template
        const existingOwnership = await prisma.templateOwnership.findFirst({
            where: {
                templateId,
                userId: buyer.id,
            },
        });

        if (existingOwnership) {
            return NextResponse.json(
                { success: false, error: "You already own this template" },
                { status: 400 }
            );
        }

        // Calculate 75/20/5 revenue split
        const price = template.price;
        const creatorAmount = (price * REVENUE_SPLIT.CREATOR) / 100;
        const companyAmount = (price * REVENUE_SPLIT.COMPANY) / 100;
        const burnAmount = (price * REVENUE_SPLIT.BURN) / 100;

        // Create purchase record and ownership in a transaction
        const [purchase] = await prisma.$transaction([
            prisma.purchase.create({
                data: {
                    templateId,
                    buyerAddress,
                    sellerAddress: template.creator.walletAddress,
                    buyerId: buyer.id,
                    sellerId: template.creatorId,
                    totalPrice: price,
                    price,
                    creatorAmount,
                    companyAmount,
                    burnAmount,
                    txHash: txHash || null,
                    status: "COMPLETED",
                },
            }),
            prisma.templateOwnership.create({
                data: {
                    templateId,
                    userId: buyer.id,
                },
            }),
            prisma.template.update({
                where: { id: templateId },
                data: {
                    salesCount: { increment: 1 },
                },
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                purchaseId: purchase.id,
                templateId,
                price,
                split: {
                    creator: creatorAmount,
                    company: companyAmount,
                    burn: burnAmount,
                },
            },
        });
    } catch (error) {
        console.error("Purchase error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process purchase" },
            { status: 500 }
        );
    }
}
