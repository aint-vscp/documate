/**
 * Document Store
 * Manages document instances in localStorage
 */

import type { DocumentInstance, DocumentStatus } from "@/types";

const DOCUMENTS_KEY = "documate-documents";

function normalizeAddress(address: string): string {
    return (address || "").trim().toLowerCase();
}

export interface ReputationRiskSignal {
    flagged: boolean;
    level: "low" | "medium" | "high";
    score: number;
    reasons: string[];
    metrics: {
        senderAgeDays: number;
        senderTotalSent: number;
        senderUniqueReceivers: number;
        senderToCurrentReceiverCount: number;
        senderToCurrentReceiverFinalized: number;
    };
}

// ============================================================
// Document CRUD Operations
// ============================================================

/**
 * Get all documents for the current user
 */
export function getAllDocuments(): DocumentInstance[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem(DOCUMENTS_KEY);
    if (!stored) return [];

    try {
        const parsed = JSON.parse(stored) as DocumentInstance[];

        // Auto-repair legacy records that may contain whitespace/case variance.
        let hasChanges = false;
        const normalized = parsed.map((doc) => {
            const sender = normalizeAddress(doc.sender);
            const receiver = normalizeAddress(doc.receiver);

            if (sender !== doc.sender || receiver !== doc.receiver) {
                hasChanges = true;
            }

            return {
                ...doc,
                sender,
                receiver,
            };
        });

        if (hasChanges) {
            localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(normalized));
        }

        return normalized;
    } catch {
        return [];
    }
}

/**
 * Get documents where user is the sender
 */
export function getSentDocuments(userAddress: string): DocumentInstance[] {
    const normalizedUser = normalizeAddress(userAddress);
    return getAllDocuments().filter((doc) => normalizeAddress(doc.sender) === normalizedUser);
}

/**
 * Get documents where user is the receiver
 */
export function getReceivedDocuments(userAddress: string): DocumentInstance[] {
    const normalizedUser = normalizeAddress(userAddress);
    return getAllDocuments().filter((doc) => normalizeAddress(doc.receiver) === normalizedUser);
}

/**
 * Get documents by status
 */
export function getDocumentsByStatus(status: DocumentStatus): DocumentInstance[] {
    return getAllDocuments().filter((doc) => doc.status === status);
}

/**
 * Get a document by ID
 */
export function getDocumentById(id: string): DocumentInstance | null {
    return getAllDocuments().find((doc) => doc.id === id) || null;
}

/**
 * Save a document (create or update)
 */
export function saveDocument(document: DocumentInstance): void {
    if (typeof window === "undefined") return;

    const normalizedDocument: DocumentInstance = {
        ...document,
        sender: normalizeAddress(document.sender),
        receiver: normalizeAddress(document.receiver),
    };

    const documents = getAllDocuments();
    const existingIndex = documents.findIndex((d) => d.id === normalizedDocument.id);

    if (existingIndex >= 0) {
        documents[existingIndex] = {
            ...normalizedDocument,
            updatedAt: new Date().toISOString(),
        };
    } else {
        documents.push(normalizedDocument);
    }

    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
}

function mergeByLatestUpdate(localDocs: DocumentInstance[], remoteDocs: DocumentInstance[]): DocumentInstance[] {
    const merged = new Map<string, DocumentInstance>();

    const addOrUpdate = (doc: DocumentInstance) => {
        const existing = merged.get(doc.id);
        if (!existing) {
            merged.set(doc.id, doc);
            return;
        }

        const currentTs = Date.parse(existing.updatedAt || existing.createdAt || "");
        const incomingTs = Date.parse(doc.updatedAt || doc.createdAt || "");

        if (!Number.isFinite(currentTs) || incomingTs >= currentTs) {
            merged.set(doc.id, doc);
        }
    };

    localDocs.forEach(addOrUpdate);
    remoteDocs.forEach(addOrUpdate);

    return Array.from(merged.values()).sort(
        (a, b) => Date.parse(b.updatedAt || b.createdAt || "") - Date.parse(a.updatedAt || a.createdAt || "")
    );
}

/**
 * Save a document to shared server storage.
 */
export async function syncDocumentToServer(document: DocumentInstance): Promise<void> {
    if (typeof window === "undefined") return;

    const normalizedDocument: DocumentInstance = {
        ...document,
        sender: normalizeAddress(document.sender),
        receiver: normalizeAddress(document.receiver),
        updatedAt: new Date().toISOString(),
    };

    const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedDocument),
    });

    if (!response.ok) {
        throw new Error("Failed to sync document to shared storage");
    }
}

/**
 * Fetch documents from shared storage and merge into local cache.
 */
export async function getSharedDocuments(userAddress: string): Promise<DocumentInstance[]> {
    if (typeof window === "undefined") return [];

    const normalized = normalizeAddress(userAddress);
    if (!normalized) return getAllDocuments();

    const response = await fetch(`/api/documents?walletAddress=${encodeURIComponent(normalized)}`, {
        method: "GET",
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to load shared documents");
    }

    const payload = await response.json() as { success?: boolean; data?: DocumentInstance[] };
    const remoteDocs = Array.isArray(payload?.data) ? payload.data : [];
    const merged = mergeByLatestUpdate(getAllDocuments(), remoteDocs);

    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(merged));
    return merged;
}

/**
 * Fetch a single document from shared storage by ID.
 */
export async function getSharedDocumentById(id: string): Promise<DocumentInstance | null> {
    if (typeof window === "undefined") return null;

    const local = getDocumentById(id);
    const response = await fetch(`/api/documents/${encodeURIComponent(id)}`, {
        method: "GET",
        cache: "no-store",
    });

    if (!response.ok) {
        return local;
    }

    const payload = await response.json() as { success?: boolean; data?: DocumentInstance };
    if (!payload?.data) {
        return local;
    }

    saveDocument(payload.data);
    return payload.data;
}

/**
 * Create a new document instance
 */
export function createDocument(params: {
    templateId: string;
    templateName: string;
    sender: string;
    receiver: string;
    content: string;
    placeholderValues: Record<string, string>;
}): DocumentInstance {
    const now = new Date().toISOString();

    const document: DocumentInstance = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        templateId: params.templateId,
        templateName: params.templateName,
        sender: normalizeAddress(params.sender),
        receiver: normalizeAddress(params.receiver),
        status: "DRAFT",
        content: params.content,
        placeholderValues: params.placeholderValues,
        createdAt: now,
        updatedAt: now,
    };

    saveDocument(document);
    return document;
}

/**
 * Update document status
 */
export function updateDocumentStatus(
    documentId: string,
    status: DocumentStatus
): DocumentInstance | null {
    const document = getDocumentById(documentId);
    if (!document) return null;

    const updated: DocumentInstance = {
        ...document,
        status,
        updatedAt: new Date().toISOString(),
    };

    if (status === "FINALIZED") {
        updated.finalizedAt = new Date().toISOString();
    }

    saveDocument(updated);
    return updated;
}

/**
 * Delete a document (only drafts can be deleted)
 */
export function deleteDocument(documentId: string): boolean {
    if (typeof window === "undefined") return false;

    const documents = getAllDocuments();
    const document = documents.find((d) => d.id === documentId);

    if (!document || document.status !== "DRAFT") {
        return false;
    }

    const filtered = documents.filter((d) => d.id !== documentId);
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(filtered));
    return true;
}

// ============================================================
// Document Statistics
// ============================================================

/**
 * Get document statistics for a user
 */
export function getDocumentStats(userAddress: string): {
    total: number;
    drafts: number;
    pending: number;
    finalized: number;
    sent: number;
    received: number;
    sentFinalizedByReceiver: number;
} {
    const allDocs = getAllDocuments();
    const normalizedUser = normalizeAddress(userAddress);
    const userDocs = allDocs.filter(
        (doc) => normalizeAddress(doc.sender) === normalizedUser || normalizeAddress(doc.receiver) === normalizedUser
    );

    return {
        total: userDocs.length,
        drafts: userDocs.filter((d) => d.status === "DRAFT").length,
        pending: userDocs.filter(
            (d) => d.status === "PENDING_SENDER_SIGN" || d.status === "PENDING_RECEIVER_SIGN"
        ).length,
        finalized: userDocs.filter((d) => d.status === "FINALIZED").length,
        sent: userDocs.filter((d) => normalizeAddress(d.sender) === normalizedUser).length,
        received: userDocs.filter((d) => normalizeAddress(d.receiver) === normalizedUser).length,
        sentFinalizedByReceiver: userDocs.filter(
            (d) => normalizeAddress(d.sender) === normalizedUser && d.status === "FINALIZED" && !!d.receiverSignature
        ).length,
    };
}

/**
 * Sender trust metrics based on counterparty completion behavior.
 */
export function getHirerTrustStats(userAddress: string): {
    sentToOthers: number;
    completedByReceivers: number;
    completionRate: number;
} {
    const normalizedUser = normalizeAddress(userAddress);
    const sentToOthersDocs = getAllDocuments().filter(
        (doc) => normalizeAddress(doc.sender) === normalizedUser && normalizeAddress(doc.receiver) !== normalizedUser
    );
    const completedByReceivers = sentToOthersDocs.filter(
        (doc) => doc.status === "FINALIZED" && !!doc.receiverSignature
    ).length;
    const sentToOthers = sentToOthersDocs.length;

    return {
        sentToOthers,
        completedByReceivers,
        completionRate: sentToOthers > 0 ? Math.round((completedByReceivers / sentToOthers) * 100) : 0,
    };
}

/**
 * Detect suspicious reputation-farming patterns for a document sender.
 * This is a local heuristic signal shown to the receiver before finalization.
 */
export function analyzeReputationRiskForDocument(document: DocumentInstance): ReputationRiskSignal {
    const all = getAllDocuments();
    const sender = document.sender.toLowerCase();
    const receiver = document.receiver.toLowerCase();

    const senderSent = all.filter((doc) => doc.sender.toLowerCase() === sender);
    const senderRelated = all.filter(
        (doc) => doc.sender.toLowerCase() === sender || doc.receiver.toLowerCase() === sender
    );
    const senderToCurrentReceiver = senderSent.filter(
        (doc) => doc.receiver.toLowerCase() === receiver
    );
    const senderToCurrentReceiverFinalized = senderToCurrentReceiver.filter(
        (doc) => doc.status === "FINALIZED"
    ).length;
    const uniqueReceivers = new Set(senderSent.map((doc) => doc.receiver.toLowerCase())).size;

    const firstSeenTimestamp = senderRelated.reduce<number>((min, doc) => {
        const t = Date.parse(doc.createdAt);
        if (Number.isNaN(t)) return min;
        return Math.min(min, t);
    }, Number.POSITIVE_INFINITY);

    const senderAgeDays = Number.isFinite(firstSeenTimestamp)
        ? Math.max(0, Math.floor((Date.now() - firstSeenTimestamp) / (1000 * 60 * 60 * 24)))
        : 0;

    const reasons: string[] = [];
    let score = 0;

    if (sender === receiver) {
        score += 100;
        reasons.push("Sender and receiver are the same wallet address.");
    }

    const concentrationRatio = senderSent.length > 0
        ? senderToCurrentReceiver.length / senderSent.length
        : 0;

    if (senderToCurrentReceiver.length >= 5 && concentrationRatio >= 0.75) {
        score += 40;
        reasons.push("Most sender contracts are with this same counterparty.");
    }

    if (senderAgeDays <= 14 && senderToCurrentReceiver.length >= 4) {
        score += 30;
        reasons.push("Sender account is new but already has high contract volume with this counterparty.");
    }

    if (senderSent.length >= 6 && uniqueReceivers <= 2) {
        score += 20;
        reasons.push("Sender has low counterparty diversity across many contracts.");
    }

    if (senderToCurrentReceiverFinalized >= 5) {
        score += 15;
        reasons.push("Multiple finalized contracts already exist between these same parties.");
    }

    const level: ReputationRiskSignal["level"] = score >= 70 ? "high" : score >= 40 ? "medium" : "low";

    return {
        flagged: score >= 40,
        level,
        score,
        reasons,
        metrics: {
            senderAgeDays,
            senderTotalSent: senderSent.length,
            senderUniqueReceivers: uniqueReceivers,
            senderToCurrentReceiverCount: senderToCurrentReceiver.length,
            senderToCurrentReceiverFinalized,
        },
    };
}
