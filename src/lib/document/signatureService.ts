/**
 * Signature Service
 * Handles document hashing, signing, and on-chain finalization
 */

import type { DocumentInstance, DocumentSignature, DocumentOnChainProof } from "@/types";
import { loadUserProfile } from "@/lib/polkadot/kilt";

const SIGNATURE_BLOB_PREFIX = "encsig:v1";

interface EncryptedReusableSignatureRecord {
    did?: string;
    signerAddress: string;
    iv: string;
    cipherText: string;
    updatedAt: string;
}

function toBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function deriveSignatureKey(signerAddress: string, did?: string): Promise<CryptoKey> {
    const material = `${signerAddress.toLowerCase()}::${did ?? "no-did"}`;
    const materialBytes = new TextEncoder().encode(material);
    const digest = await crypto.subtle.digest("SHA-256", materialBytes);
    return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptSignatureData(signatureDataUrl: string, signerAddress: string, did?: string): Promise<string> {
    const key = await deriveSignatureKey(signerAddress, did);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const payload = new TextEncoder().encode(signatureDataUrl);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);
    const encBytes = new Uint8Array(encrypted);

    return `${SIGNATURE_BLOB_PREFIX}:${toBase64(iv)}:${toBase64(encBytes)}`;
}

async function decryptSignatureData(blob: string, signerAddress: string, did?: string): Promise<string | null> {
    if (!blob.startsWith(`${SIGNATURE_BLOB_PREFIX}:`)) {
        return null;
    }

    const parts = blob.split(":");
    if (parts.length !== 4) return null;

    try {
        const iv = fromBase64(parts[2]);
        const cipherBytes = fromBase64(parts[3]);
        const key = await deriveSignatureKey(signerAddress, did);
        const ivBuffer = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer;
        const cipherBuffer = cipherBytes.buffer.slice(
            cipherBytes.byteOffset,
            cipherBytes.byteOffset + cipherBytes.byteLength
        ) as ArrayBuffer;
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivBuffer },
            key,
            cipherBuffer
        );
        return new TextDecoder().decode(decrypted);
    } catch {
        return null;
    }
}

function normalizeAddress(address: string): string {
    return (address || "").trim().toLowerCase();
}

function reusableSignatureStorageKey(signerAddress: string): string {
    return `documate-reusable-signature:${normalizeAddress(signerAddress)}`;
}

function reusableDidSignatureStorageKey(did: string): string {
    return `documate-reusable-signature-did:${did}`;
}

export async function saveReusableEncryptedSignature(
    signerAddress: string,
    signatureDataUrl: string,
    did?: string
): Promise<void> {
    if (typeof window === "undefined") return;

    const normalizedAddress = normalizeAddress(signerAddress);
    const resolvedDid = did || loadUserProfile()?.did;
    const key = reusableSignatureStorageKey(normalizedAddress);
    const encryptedBlob = await encryptSignatureData(signatureDataUrl, normalizedAddress, resolvedDid);
    const [, , iv, cipherText] = encryptedBlob.split(":");

    const payload: EncryptedReusableSignatureRecord = {
        did: resolvedDid,
        signerAddress: normalizedAddress,
        iv,
        cipherText,
        updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(payload));

    if (resolvedDid) {
        localStorage.setItem(reusableDidSignatureStorageKey(resolvedDid), JSON.stringify(payload));
    }
}

export async function loadReusableEncryptedSignature(
    signerAddress: string,
    did?: string
): Promise<string | null> {
    if (typeof window === "undefined") return null;

    const normalizedAddress = normalizeAddress(signerAddress);
    const resolvedDid = did || loadUserProfile()?.did;

    const candidateRecords: EncryptedReusableSignatureRecord[] = [];

    if (resolvedDid) {
        const didRaw = localStorage.getItem(reusableDidSignatureStorageKey(resolvedDid));
        if (didRaw) {
            try {
                candidateRecords.push(JSON.parse(didRaw) as EncryptedReusableSignatureRecord);
            } catch {
                // Ignore malformed DID-linked record.
            }
        }
    }

    const walletRaw = localStorage.getItem(reusableSignatureStorageKey(normalizedAddress));
    if (walletRaw) {
        try {
            candidateRecords.push(JSON.parse(walletRaw) as EncryptedReusableSignatureRecord);
        } catch {
            // Ignore malformed wallet-linked record.
        }
    }

    for (const record of candidateRecords) {
        const blob = `${SIGNATURE_BLOB_PREFIX}:${record.iv}:${record.cipherText}`;
        const didCandidates = [resolvedDid, record.did, undefined];

        for (const didCandidate of didCandidates) {
            const decoded = await decryptSignatureData(blob, normalizedAddress, didCandidate);
            if (decoded) {
                return decoded;
            }
        }
    }

    return null;
}

// ============================================================
// Document Hashing
// ============================================================

/**
 * Generate SHA-256 hash of document content
 */
export async function hashDocument(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `0x${hashHex}`;
}

/**
 * Verify a document hash matches its content
 */
export async function verifyDocumentHash(
    content: string,
    expectedHash: string
): Promise<boolean> {
    const actualHash = await hashDocument(content);
    return actualHash.toLowerCase() === expectedHash.toLowerCase();
}

// ============================================================
// Signature Creation
// ============================================================

/**
 * Create a signature record for a document
 */
export async function createSignature(
    signerAddress: string,
    documentContent: string
): Promise<DocumentSignature> {
    const contentHash = await hashDocument(documentContent);
    const profile = loadUserProfile();
    const signerDid = profile?.did;

    return {
        signer: signerAddress,
        signerDid,
        signedAt: new Date().toISOString(),
        contentHash,
    };
}

/**
 * Verify a signature is valid for the document content
 */
export async function verifySignature(
    signature: DocumentSignature,
    documentContent: string
): Promise<boolean> {
    const currentHash = await hashDocument(documentContent);
    return signature.contentHash === currentHash;
}

/**
 * Resolve a signature image for rendering in document views.
 * Supports both plain data URLs and legacy encrypted signature blobs.
 */
export async function resolveSignatureImage(
    signature: DocumentSignature | undefined
): Promise<string | null> {
    if (!signature?.signature) return null;

    if (signature.signature.startsWith("data:image/")) {
        return signature.signature;
    }

    if (signature.signature.startsWith(`${SIGNATURE_BLOB_PREFIX}:`)) {
        const didCandidates = [signature.signerDid, loadUserProfile()?.did, undefined];
        for (const didCandidate of didCandidates) {
            const decoded = await decryptSignatureData(signature.signature, signature.signer, didCandidate);
            if (decoded && decoded.startsWith("data:image/")) {
                return decoded;
            }
        }
    }

    return null;
}

// ============================================================
// On-Chain Finalization
// ============================================================

/**
 * Create DOC-1 proof payload for on-chain storage
 */
export function createOnChainProof(
    document: DocumentInstance,
    finalHash: string
): DocumentOnChainProof {
    return {
        std: "DOC-1",
        docHash: finalHash,
        sender: document.sender,
        receiver: document.receiver,
        templateId: document.templateId,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Encode DOC-1 proof to hex for system.remark
 */
export function encodeDocProof(proof: DocumentOnChainProof): string {
    const jsonString = JSON.stringify(proof);
    const hex =
        "0x" +
        Array.from(new TextEncoder().encode(jsonString))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    return hex;
}

/**
 * Decode DOC-1 proof from hex
 */
export function decodeDocProof(hexString: string): DocumentOnChainProof | null {
    try {
        const hex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
        const bytes = new Uint8Array(
            hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
        );
        const jsonString = new TextDecoder().decode(bytes);
        const parsed = JSON.parse(jsonString);

        if (parsed.std === "DOC-1" && parsed.docHash && parsed.sender && parsed.receiver) {
            return parsed as DocumentOnChainProof;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Build finalization transaction (system.remark with DOC-1 proof)
 * Returns the transaction hex to be signed and submitted
 */
export async function buildFinalizationTx(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api: any,
    document: DocumentInstance
): Promise<{ txHex: string; proof: DocumentOnChainProof }> {
    const finalHash = await hashDocument(document.content);
    const proof = createOnChainProof(document, finalHash);
    const remarkHex = encodeDocProof(proof);

    const tx = api.tx.system.remark(remarkHex);

    return {
        txHex: tx.toHex(),
        proof,
    };
}

// ============================================================
// Document Lifecycle Helpers
// ============================================================

/**
 * Check if a document can be signed by a specific user
 */
export function canSign(
    document: DocumentInstance,
    userAddress: string
): { canSign: boolean; reason?: string } {
    if (document.status === "FINALIZED") {
        return { canSign: false, reason: "Document is already finalized" };
    }

    if (document.status === "REJECTED") {
        return { canSign: false, reason: "Document was rejected" };
    }

    if (document.status === "DRAFT") {
        return { canSign: false, reason: "Document must be sent for signing first" };
    }

    if (document.status === "PENDING_SENDER_SIGN") {
        if (userAddress === document.sender) {
            return { canSign: true };
        }
        return { canSign: false, reason: "Waiting for sender to sign" };
    }

    if (document.status === "PENDING_RECEIVER_SIGN") {
        if (userAddress === document.receiver) {
            return { canSign: true };
        }
        return { canSign: false, reason: "Waiting for receiver to sign" };
    }

    return { canSign: false, reason: "Unknown document state" };
}

/**
 * Get the next status after an action
 */
export function getNextStatus(
    currentStatus: DocumentInstance["status"],
    action: "send" | "sign" | "reject"
): DocumentInstance["status"] {
    if (action === "reject") {
        return "REJECTED";
    }

    if (action === "send" && currentStatus === "DRAFT") {
        return "PENDING_SENDER_SIGN";
    }

    if (action === "sign") {
        if (currentStatus === "PENDING_SENDER_SIGN") {
            return "PENDING_RECEIVER_SIGN";
        }
        if (currentStatus === "PENDING_RECEIVER_SIGN") {
            return "FINALIZED";
        }
    }

    return currentStatus;
}
