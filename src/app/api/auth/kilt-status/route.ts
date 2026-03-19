import { NextResponse } from "next/server";

type KiltStatusPayload = {
    available: boolean;
    message: string;
    checkedAt: string;
};

const CACHE_TTL_MS = 60_000;
let cached: { value: KiltStatusPayload; expiresAt: number } | null = null;

async function fetchKiltStatusLive(): Promise<KiltStatusPayload> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch("https://identity.kilt.io/.well-known/did-configuration.json", {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
        });

        if (response.status === 200) {
            return {
                available: true,
                message: "KILT network is online",
                checkedAt: new Date().toISOString(),
            };
        }

        return {
            available: false,
            message: "KILT network is currently unavailable",
            checkedAt: new Date().toISOString(),
        };
    } catch {
        return {
            available: false,
            message: "KILT network is currently unavailable",
            checkedAt: new Date().toISOString(),
        };
    } finally {
        clearTimeout(timeout);
    }
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
