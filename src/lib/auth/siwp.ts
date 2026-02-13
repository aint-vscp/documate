/**
 * Sign-In With Polkadot (SIWP) Authentication
 * 
 * Wallet-based authentication without passwords
 * Similar to SIWE (Sign-In With Ethereum) but for Polkadot wallets
 * 
 * Flow:
 * 1. Server generates a challenge nonce
 * 2. User signs the challenge with their wallet
 * 3. Server verifies signature and creates session
 */

import { signatureVerify, cryptoWaitReady } from "@polkadot/util-crypto";
import { u8aToHex, hexToU8a } from "@polkadot/util";

// ============================================================
// TYPES
// ============================================================

export interface AuthChallenge {
    nonce: string;
    message: string;
    issuedAt: Date;
    expiresAt: Date;
    domain: string;
    address: string;
}

export interface SignedChallenge {
    address: string;
    message: string;
    signature: string;
}

export interface AuthSession {
    id: string;
    userId: string;
    address: string;
    token: string;
    createdAt: Date;
    expiresAt: Date;
}

export interface VerificationResult {
    isValid: boolean;
    address?: string;
    error?: string;
}

// ============================================================
// CONFIGURATION
// ============================================================

const AUTH_CONFIG = {
    // Challenge expires in 5 minutes
    challengeExpiryMs: 5 * 60 * 1000,
    // Session expires in 7 days
    sessionExpiryMs: 7 * 24 * 60 * 60 * 1000,
    // Domain for message
    domain: "documate.io",
    // Statement in message
    statement: "Sign in to DocuMate",
} as const;

// ============================================================
// CHALLENGE GENERATION
// ============================================================

/**
 * Generate a random nonce for the challenge
 */
function generateNonce(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return u8aToHex(array);
}

/**
 * Create the sign-in message following SIWE-like format
 */
function createSignInMessage(params: {
    domain: string;
    address: string;
    statement: string;
    nonce: string;
    issuedAt: Date;
    expiresAt: Date;
    chainId?: string;
}): string {
    const lines = [
        `${params.domain} wants you to sign in with your Polkadot account:`,
        params.address,
        "",
        params.statement,
        "",
        `URI: https://${params.domain}`,
        `Version: 1`,
        `Chain ID: ${params.chainId || "polkadot:asset-hub"}`,
        `Nonce: ${params.nonce}`,
        `Issued At: ${params.issuedAt.toISOString()}`,
        `Expiration Time: ${params.expiresAt.toISOString()}`,
    ];
    
    return lines.join("\n");
}

/**
 * Generate an authentication challenge for a wallet address
 */
export function generateChallenge(address: string, chainId?: string): AuthChallenge {
    const nonce = generateNonce();
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + AUTH_CONFIG.challengeExpiryMs);

    const message = createSignInMessage({
        domain: AUTH_CONFIG.domain,
        address,
        statement: AUTH_CONFIG.statement,
        nonce,
        issuedAt,
        expiresAt,
        chainId,
    });

    return {
        nonce,
        message,
        issuedAt,
        expiresAt,
        domain: AUTH_CONFIG.domain,
        address,
    };
}

// ============================================================
// SIGNATURE VERIFICATION
// ============================================================

/**
 * Verify a signed challenge
 */
export async function verifySignedChallenge(
    signed: SignedChallenge
): Promise<VerificationResult> {
    try {
        // Ensure crypto is ready
        await cryptoWaitReady();

        // Convert message to bytes for verification
        const messageBytes = new TextEncoder().encode(signed.message);
        
        // Verify the signature
        const result = signatureVerify(
            messageBytes,
            hexToU8a(signed.signature),
            signed.address
        );

        if (result.isValid) {
            return {
                isValid: true,
                address: signed.address,
            };
        } else {
            return {
                isValid: false,
                error: "Invalid signature",
            };
        }
    } catch (error) {
        return {
            isValid: false,
            error: error instanceof Error ? error.message : "Verification failed",
        };
    }
}

/**
 * Verify that the challenge hasn't expired
 */
export function verifyChallengeExpiry(challenge: AuthChallenge): boolean {
    return new Date() < challenge.expiresAt;
}

/**
 * Parse the message to extract nonce and address
 */
export function parseSignInMessage(message: string): {
    address?: string;
    nonce?: string;
    issuedAt?: Date;
    expiresAt?: Date;
} {
    const lines = message.split("\n");
    const result: {
        address?: string;
        nonce?: string;
        issuedAt?: Date;
        expiresAt?: Date;
    } = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Address is on second line
        if (i === 1 && line.startsWith("5")) {
            result.address = line;
        }
        
        // Parse key-value pairs
        if (line.startsWith("Nonce: ")) {
            result.nonce = line.replace("Nonce: ", "");
        }
        if (line.startsWith("Issued At: ")) {
            result.issuedAt = new Date(line.replace("Issued At: ", ""));
        }
        if (line.startsWith("Expiration Time: ")) {
            result.expiresAt = new Date(line.replace("Expiration Time: ", ""));
        }
    }

    return result;
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

/**
 * Generate a session token
 */
function generateSessionToken(): string {
    const array = new Uint8Array(48);
    crypto.getRandomValues(array);
    return u8aToHex(array);
}

/**
 * Create a new session for a verified user
 */
export function createSession(userId: string, address: string): AuthSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + AUTH_CONFIG.sessionExpiryMs);
    
    return {
        id: generateNonce(),
        userId,
        address,
        token: generateSessionToken(),
        createdAt: now,
        expiresAt,
    };
}

/**
 * Verify that a session is still valid
 */
export function isSessionValid(session: AuthSession): boolean {
    return new Date() < session.expiresAt;
}

// ============================================================
// FULL AUTH FLOW
// ============================================================

/**
 * Complete authentication flow
 * 
 * @param address - User's wallet address
 * @param signMessage - Function to sign message with wallet
 * @returns Session if successful
 */
export async function authenticate(
    address: string,
    signMessage: (message: string) => Promise<string>
): Promise<{ session: AuthSession; userId: string } | { error: string }> {
    try {
        // 1. Generate challenge
        const challenge = generateChallenge(address);
        
        // 2. Request signature from wallet
        const signature = await signMessage(challenge.message);
        
        // 3. Verify signature
        const verification = await verifySignedChallenge({
            address,
            message: challenge.message,
            signature,
        });
        
        if (!verification.isValid) {
            return { error: verification.error || "Verification failed" };
        }
        
        // 4. Create or get user ID
        // In production, this would look up/create user in database
        const userId = `user_${address.slice(0, 8)}`;
        
        // 5. Create session
        const session = createSession(userId, address);
        
        // 6. Store session in database
        // await prisma.session.create({ data: session });
        
        return { session, userId };
    } catch (error) {
        return { 
            error: error instanceof Error ? error.message : "Authentication failed" 
        };
    }
}

// ============================================================
// CLIENT-SIDE HELPERS
// ============================================================

/**
 * Sign a message using Polkadot.js extension
 * This would be called from the client
 */
export async function signWithPolkadotExtension(
    message: string,
    address: string,
    extensionName: string = "polkadot-js"
): Promise<string> {
    // This must run in browser
    if (typeof window === "undefined") {
        throw new Error("signWithPolkadotExtension must be called in browser");
    }

    // Dynamic import for client-side only
    const { web3FromSource } = await import("@polkadot/extension-dapp");
    
    // Get the signer from the extension
    const injector = await web3FromSource(extensionName);
    
    if (!injector.signer.signRaw) {
        throw new Error("Signer does not support raw signing");
    }
    
    // Sign the message
    const { signature } = await injector.signer.signRaw({
        address,
        data: u8aToHex(new TextEncoder().encode(message)),
        type: "bytes",
    });
    
    return signature;
}
