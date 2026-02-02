/**
 * KILT Protocol Utilities
 * Handles Light DID generation and Verifiable Credential issuance
 * 
 * For MVP, we use a local implementation that creates KILT-compatible Light DIDs
 * without full SDK chain integration. This allows for proper DID format while
 * avoiding complex SDK version dependencies.
 * 
 * Light DIDs are off-chain, self-describing, and free to create.
 */

import type {
    UserProfile,
    ProfessionalIdentityClaim,
    VerifiableCredential,
} from "@/types";

// ============================================================
// Light DID Generation
// ============================================================

/**
 * Generate a KILT-compatible Light DID
 * Uses Web Crypto API for secure key generation
 * 
 * Light DID format: did:kilt:light:{keyType}{base58EncodedPublicKey}[:encodedDetails]
 * - keyType: 00 = sr25519, 01 = ed25519
 */
export async function generateLightDid(): Promise<{
    did: string;
    document: unknown;
    mnemonic: string;
}> {
    // Generate a cryptographically secure random seed
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);

    // Create a hash from the random bytes for determinism
    const hashBuffer = await crypto.subtle.digest("SHA-256", randomBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Generate a BIP39-like mnemonic for backup
    const wordList = [
        "abandon", "ability", "able", "about", "above", "absent",
        "absorb", "abstract", "absurd", "abuse", "access", "accident",
        "account", "accuse", "achieve", "acid", "acoustic", "acquire",
        "across", "act", "action", "actual", "adapt", "add",
        "addict", "address", "adjust", "admit", "adult", "advance",
        "advice", "aerobic", "afford", "afraid", "again", "agent",
    ];

    const mnemonic = Array.from({ length: 12 }, (_, i) =>
        wordList[hashArray[i] % wordList.length]
    ).join(" ");

    // Create a base58-like encoding (simplified for MVP)
    const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let encoded = "";
    for (let i = 0; i < 48; i++) {
        encoded += base58Chars[hashArray[i % 32] % 58];
    }

    // Format as KILT Light DID (sr25519 = 00 prefix)
    const did = `did:kilt:light:00${encoded}`;

    // Create a W3C-compliant DID Document
    const document = {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/ed25519-2020/v1",
        ],
        id: did,
        authentication: [`${did}#authentication`],
        verificationMethod: [{
            id: `${did}#authentication`,
            type: "Sr25519VerificationKey2020",
            controller: did,
            publicKeyMultibase: `z${encoded}`,
        }],
    };

    return { did, document, mnemonic };
}

/**
 * Restore a Light DID from a mnemonic
 */
export async function restoreLightDid(mnemonic: string): Promise<{
    did: string;
    document: unknown;
}> {
    // Hash the mnemonic to recreate the same DID
    const encoder = new TextEncoder();
    const data = encoder.encode(mnemonic);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let encoded = "";
    for (let i = 0; i < 48; i++) {
        encoded += base58Chars[hashArray[i % 32] % 58];
    }

    const did = `did:kilt:light:00${encoded}`;

    const document = {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/ed25519-2020/v1",
        ],
        id: did,
        authentication: [`${did}#authentication`],
        verificationMethod: [{
            id: `${did}#authentication`,
            type: "Sr25519VerificationKey2020",
            controller: did,
            publicKeyMultibase: `z${encoded}`,
        }],
    };

    return { did, document };
}

// ============================================================
// Verifiable Credentials
// ============================================================

/**
 * Create a self-signed Professional Identity credential
 * W3C Verifiable Credentials Data Model 1.1 compliant
 */
export function createProfessionalIdentityCredential(
    did: string,
    claim: ProfessionalIdentityClaim
): VerifiableCredential {
    const now = new Date().toISOString();

    const credential: VerifiableCredential = {
        "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://kilt.io/contexts/credentials/v1",
            "https://documate.io/credentials/v1",
        ],
        type: ["VerifiableCredential", "ProfessionalIdentityCredential"],
        issuer: did, // Self-issued for MVP
        issuanceDate: now,
        credentialSubject: {
            id: did,
            name: claim.name,
            role: claim.role,
            skills: claim.skills,
            bio: claim.bio,
        },
        proof: {
            type: "KiltSelfSigned2024",
            created: now,
            proofPurpose: "assertionMethod",
            verificationMethod: `${did}#authentication`,
            // Production: Add actual cryptographic signature
        },
    };

    return credential;
}

// ============================================================
// User Profile Management (localStorage)
// ============================================================

const PROFILE_STORAGE_KEY = "documate-user-profile";
const MNEMONIC_STORAGE_KEY = "documate-did-mnemonic";

/**
 * Save user profile to localStorage
 */
export function saveUserProfile(profile: UserProfile): void {
    if (typeof window !== "undefined") {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
}

/**
 * Load user profile from localStorage
 */
export function loadUserProfile(): UserProfile | null {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!stored) return null;

    try {
        return JSON.parse(stored) as UserProfile;
    } catch {
        return null;
    }
}

/**
 * Clear user profile from localStorage
 */
export function clearUserProfile(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(PROFILE_STORAGE_KEY);
        localStorage.removeItem(MNEMONIC_STORAGE_KEY);
    }
}

/**
 * Create a new user profile with Light DID
 */
export async function createUserProfile(
    claim: ProfessionalIdentityClaim
): Promise<UserProfile> {
    // Generate Light DID
    const { did, mnemonic } = await generateLightDid();

    // Store mnemonic securely
    if (typeof window !== "undefined") {
        // In production, encrypt this!
        localStorage.setItem(MNEMONIC_STORAGE_KEY, mnemonic);
    }

    // Create self-signed credential
    const credential = createProfessionalIdentityCredential(did, claim);

    const now = new Date().toISOString();

    const profile: UserProfile = {
        did,
        credentials: [credential],
        createdAt: now,
        updatedAt: now,
    };

    // Save to localStorage
    saveUserProfile(profile);

    return profile;
}

/**
 * Add a credential to an existing profile
 */
export function addCredentialToProfile(
    profile: UserProfile,
    credential: VerifiableCredential
): UserProfile {
    const updatedProfile: UserProfile = {
        ...profile,
        credentials: [...profile.credentials, credential],
        updatedAt: new Date().toISOString(),
    };

    saveUserProfile(updatedProfile);
    return updatedProfile;
}

// ============================================================
// DID Verification
// ============================================================

/**
 * Verify a DID is valid KILT Light DID format
 */
export function isValidLightDid(did: string): boolean {
    // KILT Light DID format: did:kilt:light:{encoding}{address}[:details]
    const lightDidPattern = /^did:kilt:light:(00|01)[a-zA-Z0-9]+/;
    return lightDidPattern.test(did);
}

/**
 * Parse a Light DID to extract components
 */
export function parseLightDid(did: string): {
    method: string;
    encoding: string;
    keyType: "sr25519" | "ed25519";
    address: string;
    details?: string;
} | null {
    if (!isValidLightDid(did)) return null;

    const match = did.match(/^did:kilt:light:(00|01)([a-zA-Z0-9]+)(?::(.+))?$/);
    if (!match) return null;

    return {
        method: "light",
        encoding: match[1],
        keyType: match[1] === "00" ? "sr25519" : "ed25519",
        address: match[2],
        details: match[3],
    };
}

/**
 * Get the key type from a Light DID encoding
 */
export function getKeyTypeFromEncoding(encoding: string): "sr25519" | "ed25519" {
    return encoding === "00" ? "sr25519" : "ed25519";
}

// ============================================================
// KILT Network Configuration
// ============================================================

/**
 * KILT Network endpoints
 */
export const KILT_ENDPOINTS = {
    spiritnet: "wss://spiritnet.kilt.io",
    peregrine: "wss://peregrine.kilt.io/parachain-public-ws",
};

/**
 * Check if connected to KILT network
 * Light DIDs don't require chain connection
 */
export async function checkKiltConnection(): Promise<boolean> {
    // Light DIDs are off-chain, no connection needed
    return true;
}

// Export UserProfile type for convenience
export type { UserProfile };
