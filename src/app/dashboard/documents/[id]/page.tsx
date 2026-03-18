"use client";

/**
 * Document View Page
 * View document details and manage signing flow
 */

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useEVMWallet } from "@/hooks/useEVMWallet";
import { useDocuMateContract } from "@/hooks/useDocuMateContract";
import { DocumentEditor } from "@/components/document/DocumentEditor";
import { SignaturePanel } from "@/components/document/SignaturePanel";
import {
    getDocumentById,
    getSharedDocumentById,
    saveDocument,
    syncDocumentToServer,
    updateDocumentStatus,
    createSignature,
    hashDocument,
    analyzeReputationRiskForDocument,
    resolveSignatureImage,
} from "@/lib/document";
import { addReputationTagsForAddress, deriveReputationTags } from "@/lib/reputation";
import type { DocumentInstance } from "@/types";
import type { ReputationRiskSignal } from "@/lib/document/documentStore";

interface PageProps {
    params: Promise<{ id: string }>;
}

const CHAIN_TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

export default function DocumentViewPage(props: PageProps) {
    const params = use(props.params);
    const account = useEVMWallet((s) => s.account);
    const { uploadDocument, checkVerified } = useDocuMateContract();
    const [document, setDocument] = useState<DocumentInstance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [txStatus, setTxStatus] = useState<string | null>(null);
    const [earnedTags, setEarnedTags] = useState<string[]>([]);
    const [riskSignal, setRiskSignal] = useState<ReputationRiskSignal | null>(null);
    const [senderSignatureImage, setSenderSignatureImage] = useState<string | null>(null);
    const [receiverSignatureImage, setReceiverSignatureImage] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadDocument = async () => {
            try {
                const localDoc = getDocumentById(params.id);
                if (localDoc && isMounted) {
                    setDocument(localDoc);
                    setRiskSignal(analyzeReputationRiskForDocument(localDoc));
                }

                const sharedDoc = await getSharedDocumentById(params.id);
                if (!isMounted) return;

                const resolvedDoc = sharedDoc ?? localDoc;
                setDocument(resolvedDoc);
                if (resolvedDoc) {
                    setRiskSignal(analyzeReputationRiskForDocument(resolvedDoc));
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadDocument();

        return () => {
            isMounted = false;
        };
    }, [params.id]);

    useEffect(() => {
        let isMounted = true;

        const loadSignatureImages = async () => {
            if (!document) {
                if (isMounted) {
                    setSenderSignatureImage(null);
                    setReceiverSignatureImage(null);
                }
                return;
            }

            const [senderImage, receiverImage] = await Promise.all([
                resolveSignatureImage(document.senderSignature),
                resolveSignatureImage(document.receiverSignature),
            ]);

            if (!isMounted) return;
            setSenderSignatureImage(senderImage);
            setReceiverSignatureImage(receiverImage);
        };

        loadSignatureImages();

        return () => {
            isMounted = false;
        };
    }, [document]);

    const handleSend = async () => {
        if (!document) return;

        const updated = updateDocumentStatus(document.id, "PENDING_SENDER_SIGN");
        if (updated) {
            try {
                await syncDocumentToServer(updated);
            } catch {
                // Keep local progress if network sync fails.
            }
            setDocument(updated);
        }
    };

    const handleSign = async (drawnSignatureDataUrl?: string) => {
        if (!document || !account) return;

        const normalizedAccount = account.toLowerCase();
        const isSender = document.sender.toLowerCase() === normalizedAccount;
        const isReceiver = document.receiver.toLowerCase() === normalizedAccount;

        // Create signature
        const signature = await createSignature(account, document.content, drawnSignatureDataUrl);

        let updatedDoc: DocumentInstance;

        if (isSender && document.status === "PENDING_SENDER_SIGN") {
            const isVerified = await checkVerified(account);
            if (!isVerified) {
                setTxStatus("Sender wallet DID is not verified on-chain yet. Ask admin to verify your wallet first.");
                setTimeout(() => setTxStatus(null), 5000);
                return;
            }

            setTxStatus("Sender signature in progress...");
            const finalHash = await hashDocument(document.content);

            try {
                setTxStatus("Anchoring document hash on-chain (sender pays gas)...");
                const receipt = await uploadDocument(finalHash);
                const txHash = typeof receipt?.hash === "string"
                    ? receipt.hash
                    : (typeof receipt?.transactionHash === "string" ? receipt.transactionHash : "");

                if (!CHAIN_TX_HASH_REGEX.test(txHash)) {
                    const failedDoc: DocumentInstance = {
                        ...document,
                        anchorStatus: "FAILED",
                        anchorError: "On-chain anchoring did not return a valid transaction hash.",
                        updatedAt: new Date().toISOString(),
                    };

                    setTxStatus("On-chain anchoring failed to return a valid hash. Confirm wallet network and gas, then retry Sender Sign.");
                    setTimeout(() => setTxStatus(null), 6000);

                    saveDocument(failedDoc);
                    try {
                        await syncDocumentToServer(failedDoc);
                    } catch {
                        // Keep local progress if network sync fails.
                    }
                    setDocument(failedDoc);
                    return;
                }

                updatedDoc = {
                    ...document,
                    senderSignature: signature,
                    status: "PENDING_RECEIVER_SIGN",
                    finalHash,
                    transactionHash: txHash,
                    anchorStatus: "ANCHORED",
                    anchorError: undefined,
                    updatedAt: new Date().toISOString(),
                };

                setTxStatus("Hash anchored. Waiting for receiver signature...");
                setTimeout(() => setTxStatus(null), 3000);
            } catch (error) {
                const message = error instanceof Error
                    ? error.message
                    : "Sender payment/anchoring failed. Please retry sender signature.";

                const failedDoc: DocumentInstance = {
                    ...document,
                    anchorStatus: "FAILED",
                    anchorError: message,
                    updatedAt: new Date().toISOString(),
                };

                setTxStatus(`${message} Confirm wallet network, ensure gas, and retry Sender Sign.`);
                setTimeout(() => setTxStatus(null), 6000);

                saveDocument(failedDoc);
                try {
                    await syncDocumentToServer(failedDoc);
                } catch {
                    // Keep local progress if network sync fails.
                }
                setDocument(failedDoc);
                return;
            }
        } else if (isReceiver && document.status === "PENDING_RECEIVER_SIGN") {
            const hasValidAnchorProof = !!document.transactionHash
                && CHAIN_TX_HASH_REGEX.test(document.transactionHash)
                && document.anchorStatus !== "FAILED";

            if (!hasValidAnchorProof) {
                setTxStatus("Sender must complete valid on-chain anchoring before receiver finalizes. Ask sender to retry anchoring.");
                setTimeout(() => setTxStatus(null), 4000);
                return;
            }

            updatedDoc = {
                ...document,
                receiverSignature: signature,
                status: "FINALIZED",
                finalHash: document.finalHash,
                updatedAt: new Date().toISOString(),
                finalizedAt: new Date().toISOString(),
            };

            if (riskSignal?.flagged) {
                setTxStatus("Receiver signature captured. Reputation award withheld due to suspicious sender activity.");
                setEarnedTags([]);
            } else {
                // Derive and persist reputation tags for the sender
                const tags = deriveReputationTags(
                    document.templateName ?? "",
                    document.placeholderValues ?? {}
                );
                addReputationTagsForAddress(document.sender, tags);
                await fetch("/api/directory/tags", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ walletAddress: document.sender, tags }),
                });
                setEarnedTags(tags);
                setTxStatus("Receiver signature captured. Document is now immutable.");
            }
            setTimeout(() => setTxStatus(null), 3000);
        } else {
            return;
        }

        saveDocument(updatedDoc);
        try {
            await syncDocumentToServer(updatedDoc);
        } catch {
            // Keep local progress if network sync fails.
        }
        setDocument(updatedDoc);
    };

    const handleReject = async () => {
        if (!document) return;

        const updated = updateDocumentStatus(document.id, "REJECTED");
        if (updated) {
            try {
                await syncDocumentToServer(updated);
            } catch {
                // Keep local progress if network sync fails.
            }
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
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
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-amber-300">{txStatus}</span>
                </div>
            )}

            {document.status === "PENDING_RECEIVER_SIGN" && account?.toLowerCase() === document.receiver.toLowerCase() && riskSignal?.flagged && (
                <div className="rounded-lg border border-red-400/25 bg-red-500/[0.08] px-5 py-4">
                    <p className="text-sm font-semibold text-red-300 mb-1">
                        Suspicious Reputation Farming Pattern Detected ({riskSignal.level.toUpperCase()} Risk)
                    </p>
                    <p className="text-xs text-red-200/80 mb-2">
                        Please review carefully before finalizing. This sender shows unusual contract concentration patterns.
                    </p>
                    <ul className="text-xs text-red-100/85 list-disc pl-5 space-y-1">
                        {riskSignal.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Reputation Tags Banner (shown to receiver after finalizing) */}
            {earnedTags.length > 0 && (
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-5 py-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-400/10 flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-cyan-300 mb-1">Reputation tags earned by sender</p>
                            <p className="text-xs text-white/40 mb-2">Based on this document, the sender&apos;s profile has been tagged:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {earnedTags.map(tag => (
                                    <span key={tag} className="neon-tag text-xs">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
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
                        currentUserAddress={account || ""}
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
                                {document.transactionHash && (
                                    <p className="break-all">
                                        <span className="text-gray-500">Anchor Tx:</span>{" "}
                                        <span className="font-mono text-amber-300">{document.transactionHash}</span>
                                    </p>
                                )}
                                {document.anchorStatus && (
                                    <p>
                                        <span className="text-gray-500">Anchor Status:</span>{" "}
                                        <span className={document.anchorStatus === "ANCHORED" ? "text-green-400" : document.anchorStatus === "FAILED" ? "text-red-300" : "text-amber-300"}>
                                            {document.anchorStatus}
                                        </span>
                                    </p>
                                )}
                                {document.anchorError && (
                                    <p className="break-words">
                                        <span className="text-gray-500">Anchor Error:</span>{" "}
                                        <span className="text-red-300">{document.anchorError}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {(senderSignatureImage || receiverSignatureImage) && (
                        <div className="mt-4 bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
                            <h4 className="text-sm font-medium text-white mb-3">Document Signatures</h4>
                            <div className="space-y-3">
                                <div className="rounded-lg border border-gray-700/60 bg-gray-900/40 p-3">
                                    <p className="text-xs text-gray-400 mb-2">Sender Signature</p>
                                    {senderSignatureImage ? (
                                        <Image src={senderSignatureImage} alt="Sender signature" width={240} height={80} unoptimized className="max-h-20 h-auto w-auto rounded bg-white p-1" />
                                    ) : (
                                        <p className="text-xs text-gray-500">Not signed yet</p>
                                    )}
                                </div>
                                <div className="rounded-lg border border-gray-700/60 bg-gray-900/40 p-3">
                                    <p className="text-xs text-gray-400 mb-2">Receiver Signature</p>
                                    {receiverSignatureImage ? (
                                        <Image src={receiverSignatureImage} alt="Receiver signature" width={240} height={80} unoptimized className="max-h-20 h-auto w-auto rounded bg-white p-1" />
                                    ) : (
                                        <p className="text-xs text-gray-500">Not signed yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
