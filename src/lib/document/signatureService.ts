/**
 * Signature Service
 * Handles document hashing, signing, and on-chain finalization
 */

import type { DocumentInstance, DocumentSignature, DocumentOnChainProof } from "@/types";

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

    return {
        signer: signerAddress,
        signedAt: new Date().toISOString(),
        contentHash,
        // In production, this would include an actual cryptographic signature
        // from the wallet. For MVP, we use the hash as proof of agreement.
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
