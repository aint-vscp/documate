import { NextRequest, NextResponse } from "next/server";

type RateLimitConfig = {
    windowMs: number;
    maxRequests: number;
};

type Bucket = {
    count: number;
    resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        const first = forwarded.split(",")[0]?.trim();
        if (first) return first;
    }

    return request.headers.get("x-real-ip") || "unknown";
}

function takeToken(key: string, config: RateLimitConfig): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || now > existing.resetAt) {
        buckets.set(key, {
            count: 1,
            resetAt: now + config.windowMs,
        });
        return { allowed: true, retryAfterSeconds: Math.ceil(config.windowMs / 1000) };
    }

    if (existing.count >= config.maxRequests) {
        const retryAfterMs = Math.max(0, existing.resetAt - now);
        return {
            allowed: false,
            retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        };
    }

    existing.count += 1;
    buckets.set(key, existing);
    return { allowed: true, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
}

export function withRateLimit(
    request: NextRequest,
    routeKey: string,
    config: RateLimitConfig
): NextResponse | null {
    const ip = getClientIp(request);
    const key = `${routeKey}:${ip}`;
    const result = takeToken(key, config);

    if (result.allowed) {
        return null;
    }

    return NextResponse.json(
        {
            success: false,
            error: "Too many requests. Please retry shortly.",
        },
        {
            status: 429,
            headers: {
                "Retry-After": String(result.retryAfterSeconds),
            },
        }
    );
}
