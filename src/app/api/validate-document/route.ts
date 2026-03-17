/**
 * TEE Mock API - Phala Phat Contract Simulation
 *
 * POST /api/validate-document
 *
 * Simulates a Phala Network Phat Contract execution that validates
 * document authenticity (PAdES signatures, DocuSign metadata, etc.)
 * and assigns a reputation tier.
 *
 * Tiers:
 *   Tier 1 (Gold)   - Verified digital signature / DocuSign
 *   Tier 2 (Silver) - Legal or contract document
 *   Tier 3 (Bronze) - General document
 */

import { NextRequest, NextResponse } from "next/server";
import { validatePdfSignature } from "@/lib/phala/signatureValidator";

export const runtime = "nodejs";

interface ValidationResult {
    success: boolean;
    signatureValid: boolean;
    tier: number;
    tierName: string;
    tierColor: string;
    confidence: number;
    attestation: string;
    message: string;
    processingTimeMs: number;
    phalaWorker: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ValidationResult | { success: false; error: string }>> {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false as const, error: "No file provided. Send a file with the 'file' field." },
                { status: 400 }
            );
        }
        const fileBytes = Buffer.from(await file.arrayBuffer());
        const fileSize = file.size;
        const validation = await validatePdfSignature(fileBytes);

        let tier: number;
        let tierName: string;
        let tierColor: string;
        let confidence: number;

        if (validation.isValid) {
            tier = 1;
            tierName = "Gold";
            tierColor = "#F59E0B";
            confidence = 0.98;
        } else if (validation.diagnostics.hasSignatureDictionary || validation.diagnostics.hasByteRange) {
            tier = 2;
            tierName = "Silver";
            tierColor = "#94A3B8";
            confidence = 0.7;
        } else {
            tier = 3;
            tierName = "Bronze";
            tierColor = "#CD7F32";
            confidence = 0.4;
        }

        // Generate mock attestation hash (simulates Phala TEE remote attestation)
        const attestationData = `${file.name}-${fileSize}-${Date.now()}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(attestationData);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const attestation = "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        const result: ValidationResult = {
            success: true,
            signatureValid: validation.isValid,
            tier,
            tierName,
            tierColor,
            confidence,
            attestation,
            message: validation.reason,
            processingTimeMs: 300,
            phalaWorker: "0x7068616c615f776f726b65725f6d6f636b5f6964", // "phala_worker_mock_id" hex
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error("TEE validation error:", error);
        return NextResponse.json(
            { success: false as const, error: "TEE validation failed. Worker enclave error." },
            { status: 500 }
        );
    }
}
