/**
 * Document Store
 * Manages document instances in localStorage
 */

import type { DocumentInstance, DocumentStatus } from "@/types";

const DOCUMENTS_KEY = "documate-documents";

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
        return JSON.parse(stored) as DocumentInstance[];
    } catch {
        return [];
    }
}

/**
 * Get documents where user is the sender
 */
export function getSentDocuments(userAddress: string): DocumentInstance[] {
    return getAllDocuments().filter((doc) => doc.sender === userAddress);
}

/**
 * Get documents where user is the receiver
 */
export function getReceivedDocuments(userAddress: string): DocumentInstance[] {
    return getAllDocuments().filter((doc) => doc.receiver === userAddress);
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

    const documents = getAllDocuments();
    const existingIndex = documents.findIndex((d) => d.id === document.id);

    if (existingIndex >= 0) {
        documents[existingIndex] = {
            ...document,
            updatedAt: new Date().toISOString(),
        };
    } else {
        documents.push(document);
    }

    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
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
        sender: params.sender,
        receiver: params.receiver,
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
} {
    const allDocs = getAllDocuments();
    const userDocs = allDocs.filter(
        (doc) => doc.sender === userAddress || doc.receiver === userAddress
    );

    return {
        total: userDocs.length,
        drafts: userDocs.filter((d) => d.status === "DRAFT").length,
        pending: userDocs.filter(
            (d) => d.status === "PENDING_SENDER_SIGN" || d.status === "PENDING_RECEIVER_SIGN"
        ).length,
        finalized: userDocs.filter((d) => d.status === "FINALIZED").length,
        sent: userDocs.filter((d) => d.sender === userAddress).length,
        received: userDocs.filter((d) => d.receiver === userAddress).length,
    };
}
