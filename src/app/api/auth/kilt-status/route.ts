import { NextResponse } from "next/server";

type KiltStatusPayload = {
    available: boolean;
    message: string;
    checkedAt: string;
    endpoint: string | null;
};

const CACHE_TTL_MS = 60_000;
let cached: { value: KiltStatusPayload; expiresAt: number } | null = null;

async function checkKiltAvailability(): Promise<{ available: boolean; endpoint: string | null }> {
    const endpoints = [
        "https://identity.primer.systems/.well-known/did-configuration.json",
        "https://kilt-rpc.dwellir.com/health",
        "wss://kilt-rpc.dwellir.com",
    ];

    for (const endpoint of endpoints) {
        try {
            if (endpoint.startsWith("wss")) continue;
            const response = await fetch(endpoint, {
                method: "GET",
                cache: "no-store",
                signal: AbortSignal.timeout(4000),
            });

            if (response.ok) {
                return { available: true, endpoint };
            }
        } catch {
            // continue to next endpoint
        }
    }

    return { available: false, endpoint: null };
}

async function fetchKiltStatusLive(): Promise<KiltStatusPayload> {
    const availability = await checkKiltAvailability();
    const checkedAt = new Date().toISOString();

    if (availability.available) {
        return {
            available: true,
            endpoint: availability.endpoint,
            message: "KILT network is online",
            checkedAt,
        };
    }

    return {
        available: false,
        endpoint: null,
        message:
            "KILT network infrastructure is currently migrating. Identity verification is temporarily unavailable.",
        checkedAt,
    };
}

export async function GET() {
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
        return NextResponse.json(cached.value);
    }

    const live = await fetchKiltStatusLive();
    cached = {
        value: live,
        expiresAt: now + CACHE_TTL_MS,
    };

    return NextResponse.json(live);
}
