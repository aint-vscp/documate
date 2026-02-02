/**
 * Reputation API Route
 * Fetches Proof of Contract history for a given address
 */

import { NextRequest, NextResponse } from "next/server";
import {
    createAssetHubConnection,
    fetchReputationHistory,
    disconnectAssetHub,
} from "@/lib/polkadot/assetHub";
import type { NetworkId } from "@/types";

/**
 * GET /api/reputation/[id]
 * Fetches the reputation profile for a given address
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: address } = await params;

    if (!address) {
        return NextResponse.json(
            { error: "Address parameter is required" },
            { status: 400 }
        );
    }

    // Get network from query params (default to testnet)
    const searchParams = request.nextUrl.searchParams;
    const network = (searchParams.get("network") ||
        "westend-asset-hub") as NetworkId;
    const blockCount = parseInt(searchParams.get("blocks") || "1000", 10);

    try {
        // Connect to Asset Hub
        const api = await createAssetHubConnection(network);

        // Fetch reputation history
        const profile = await fetchReputationHistory(api, address, blockCount);

        // Don't disconnect - keep connection cached for performance

        return NextResponse.json({
            success: true,
            data: profile,
            network,
            blockCount,
        });
    } catch (error) {
        console.error("Reputation API Error:", error);

        // Clean up on error
        await disconnectAssetHub(network);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch reputation",
            },
            { status: 500 }
        );
    }
}
