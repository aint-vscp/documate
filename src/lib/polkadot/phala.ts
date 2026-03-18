/**
 * Phala TEE Utilities (Mocked for MVP)
 * 
 * This module provides the encryption interfaces required by Phala Network
 * for confidential AI compute. For MVP, the actual TEE calls are mocked
 * but the interfaces are production-ready for "plug & play" mainnet deployment.
 */

import type { EncryptedPrompt, AIResponse } from "@/types";

interface TEESessionContext {
    activeTemplate?: {
        id: string;
        name: string;
        description: string;
        placeholders: Array<{ key: string; label: string; type: string }>;
    } | null;
    placeholderValues?: Record<string, string>;
    didProfile?: {
        name?: string;
        role?: string;
        did?: string;
        wallet?: string | null;
    };
    recentMessages?: Array<{ role: string; content: string }>;
}

// ============================================================
// Configuration
// ============================================================

// Placeholder Phala contract public key (would be fetched from chain in production)
const MOCK_TEE_PUBLIC_KEY = "0x" + "a".repeat(64);

// ============================================================
// Encryption Utilities (Mocked)
// ============================================================

/**
 * Generate a random nonce for encryption
 */
function generateNonce(): string {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    return (
        "0x" +
        Array.from(array)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
    );
}

/**
 * Encrypt a prompt for TEE processing
 * 
 * In production, this would:
 * 1. Fetch the Phat Contract's public key from chain
 * 2. Use X25519 key exchange for encryption
 * 3. Encrypt with ChaCha20-Poly1305
 * 
 * For MVP, we mock the encryption but maintain the interface
 */
export async function encryptPrompt(prompt: string): Promise<EncryptedPrompt> {
    // Mock encryption (in production, use actual crypto)
    const encoder = new TextEncoder();
    const data = encoder.encode(prompt);

    // Simple base64 "encryption" for demo (NOT secure)
    const ciphertext = btoa(String.fromCharCode(...data));

    return {
        ciphertext,
        nonce: generateNonce(),
        publicKey: MOCK_TEE_PUBLIC_KEY,
    };
}

/**
 * Decrypt a response from TEE
 * 
 * In production, this would use the user's private key
 * to decrypt the response from the TEE
 */
export async function decryptResponse(
    encryptedContent: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userPrivateKey?: string
): Promise<string> {
    // Mock decryption (reverse of mock encryption)
    try {
        const decoded = atob(encryptedContent);
        return decoded;
    } catch {
        return encryptedContent; // Return as-is if not base64
    }
}

// ============================================================
// TEE Proxy Interface
// ============================================================

/**
 * Send an encrypted prompt to the TEE for AI processing
 * 
 * In production, this would:
 * 1. Encrypt the prompt with TEE public key
 * 2. Send to Phala Phat Contract via RPC
 * 3. Contract decrypts in secure enclave
 * 4. Contract calls LLM API
 * 5. Contract encrypts response
 * 6. Return encrypted response to client
 * 
 * For MVP, we call our proxy API endpoint which mocks this flow
 */
export async function sendToTEE(prompt: string, sessionContext?: TEESessionContext): Promise<AIResponse> {
    try {
        // Encrypt the prompt
        const encryptedPrompt = await encryptPrompt(prompt);

        // Send to our proxy API (which mocks the TEE in MVP)
        const response = await fetch("/api/phala-proxy", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                encryptedPrompt,
                sessionContext,
            }),
        });

        if (!response.ok) {
            throw new Error(`TEE request failed: ${response.statusText}`);
        }

        const result = await response.json();

        // Decrypt the response (in production)
        if (result.encryptedContent) {
            const decrypted = await decryptResponse(result.encryptedContent);
            return {
                success: true,
                plainContent: decrypted,
                encryptedContent: result.encryptedContent,
            };
        }

        return result as AIResponse;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// ============================================================
// TEE Status & Health
// ============================================================

/**
 * Check if TEE service is available
 */
export async function checkTEEHealth(): Promise<{
    available: boolean;
    mode: "production" | "mock";
    publicKey: string;
}> {
    try {
        const response = await fetch("/api/phala-proxy", {
            method: "GET",
        });

        if (response.ok) {
            const data = await response.json();
            return {
                available: true,
                mode: data.mode || "mock",
                publicKey: data.publicKey || MOCK_TEE_PUBLIC_KEY,
            };
        }

        return {
            available: false,
            mode: "mock",
            publicKey: MOCK_TEE_PUBLIC_KEY,
        };
    } catch {
        return {
            available: false,
            mode: "mock",
            publicKey: MOCK_TEE_PUBLIC_KEY,
        };
    }
}

// ============================================================
// Contract Types (for future Phat Contract integration)
// ============================================================

/**
 * Phala Phat Contract configuration
 * Ready for mainnet deployment
 */
export interface PhatContractConfig {
    contractId: string;
    clusterId: string;
    endpoint: string;
}

/**
 * Production Phala endpoints
 */
export const PHALA_ENDPOINTS = {
    // Mainnet endpoint is kept as reference config only; testnet flow uses the testnet endpoint.
    mainnet: "wss://api.phala.network/ws",
    testnet: "wss://poc6.phala.network/ws",
};

/**
 * Placeholder for Phat Contract deployment
 * This would be populated after deploying the AI contract
 */
export const PHAT_CONTRACT_CONFIG: PhatContractConfig | null = null;
