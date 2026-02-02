"use client";

/**
 * Document View Page
 * View document details and manage signing flow
 */

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { DocumentEditor } from "@/components/document/DocumentEditor";
import { SignaturePanel } from "@/components/document/SignaturePanel";
import {
    getDocumentById,
    saveDocument,
    updateDocumentStatus,
    createSignature,
    hashDocument,
    encodeDocProof,
    createOnChainProof,
} from "@/lib/document";
import type { DocumentInstance } from "@/types";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function DocumentViewPage(props: PageProps) {
    const params = use(props.params);
    const router = useRouter();
    const { selectedAccount, api, injector } = useWallet();
    const [document, setDocument] = useState<DocumentInstance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [txStatus, setTxStatus] = useState<string | null>(null);

    useEffect(() => {
        const doc = getDocumentById(params.id);
        setDocument(doc);
        setIsLoading(false);
    }, [params.id]);

    const handleSend = async () => {
        if (!document) return;

        const updated = updateDocumentStatus(document.id, "PENDING_SENDER_SIGN");
        if (updated) {
            setDocument(updated);
        }
    };

    const handleSign = async () => {
        if (!document || !selectedAccount?.address) return;

        const isSender = document.sender === selectedAccount.address;
        const isReceiver = document.receiver === selectedAccount.address;

        // Create signature
        const signature = await createSignature(selectedAccount.address, document.content);

        let updatedDoc: DocumentInstance;

        if (isSender && document.status === "PENDING_SENDER_SIGN") {
            updatedDoc = {
                ...document,
                senderSignature: signature,
                status: "PENDING_RECEIVER_SIGN",
                updatedAt: new Date().toISOString(),
            };
        } else if (isReceiver && document.status === "PENDING_RECEIVER_SIGN") {
            // Finalize: create on-chain proof
            setTxStatus("Preparing transaction...");

            const finalHash = await hashDocument(document.content);

            updatedDoc = {
                ...document,
                receiverSignature: signature,
                status: "FINALIZED",
                finalHash,
                updatedAt: new Date().toISOString(),
                finalizedAt: new Date().toISOString(),
            };

            // Store on-chain if API is available
            if (api && injector) {
                try {
                    setTxStatus("Creating on-chain proof...");

                    const proof = createOnChainProof(updatedDoc, finalHash);
                    const remarkHex = encodeDocProof(proof);

                    const tx = api.tx.system.remark(remarkHex);

                    setTxStatus("Waiting for signature...");

                    await new Promise<void>((resolve, reject) => {
                        tx.signAndSend(
                            selectedAccount.address,
                            { signer: injector.signer },
                            ({ status, dispatchError }: { status: { isInBlock: boolean; isFinalized: boolean; asInBlock?: { toString: () => string } }; dispatchError?: unknown }) => {
                                if (dispatchError) {
                                    reject(new Error("Transaction failed"));
                                    return;
                                }

                                if (status.isInBlock) {
                                    setTxStatus("Included in block...");
                                    updatedDoc.transactionHash = status.asInBlock?.toString();
                                }

                                if (status.isFinalized) {
                                    setTxStatus("Finalized on-chain!");
                                    setTimeout(() => setTxStatus(null), 3000);
                                    resolve();
                                }
                            }
                        );
                    });
                } catch (error) {
                    console.error("On-chain finalization failed:", error);
                    setTxStatus("On-chain proof failed (document still finalized locally)");
                    setTimeout(() => setTxStatus(null), 5000);
                }
            }
        } else {
            return;
        }

        saveDocument(updatedDoc);
        setDocument(updatedDoc);
    };

    const handleReject = async () => {
        if (!document) return;

        const updated = updateDocumentStatus(document.id, "REJECTED");
        if (updated) {
            setDocument(updated);
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <DocumentEditor content="" isLoading />
                </div>
                <div>
                    <SignaturePanel
                        document={{} as DocumentInstance}
                        currentUserAddress=""
                        onSign={async () => { }}
                        isLoading
                    />
                </div>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                        className="w-8 h-8 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                    Document Not Found
                </h2>
                <p className="text-gray-400 mb-4">
                    The document you&apos;re looking for doesn&apos;t exist.
                </p>
                <Link
                    href="/dashboard/documents"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
                >
                    Back to Documents
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/dashboard/documents"
                        className="text-sm text-gray-400 hover:text-white flex items-center gap-1 mb-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back to Documents
                    </Link>
                    <h1 className="text-2xl font-bold text-white">{document.templateName}</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Created {new Date(document.createdAt).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Transaction Status */}
            {txStatus && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-purple-300">{txStatus}</span>
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Document Preview */}
                <div className="lg:col-span-2">
                    <DocumentEditor title={document.templateName} content={document.content} />
                </div>

                {/* Signature Panel */}
                <div>
                    <SignaturePanel
                        document={document}
                        currentUserAddress={selectedAccount?.address || ""}
                        onSign={handleSign}
                        onSend={document.status === "DRAFT" ? handleSend : undefined}
                        onReject={document.status === "PENDING_RECEIVER_SIGN" ? handleReject : undefined}
                    />

                    {/* Document Hash Info */}
                    {document.status !== "DRAFT" && (
                        <div className="mt-4 bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
                            <h4 className="text-sm font-medium text-white mb-2">Document Info</h4>
                            <div className="space-y-2 text-xs text-gray-400">
                                <p>
                                    <span className="text-gray-500">Template:</span> {document.templateId}
                                </p>
                                <p>
                                    <span className="text-gray-500">Document ID:</span>{" "}
                                    <span className="font-mono">{document.id}</span>
                                </p>
                                {document.finalHash && (
                                    <p className="break-all">
                                        <span className="text-gray-500">Hash:</span>{" "}
                                        <span className="font-mono text-green-400">{document.finalHash}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
