"use client";

/**
 * Signature Panel Component
 * Shows document status and allows signing actions
 */

import React, { useState } from "react";
import type { DocumentInstance } from "@/types";

interface SignaturePanelProps {
    document: DocumentInstance;
    currentUserAddress: string;
    onSign: () => Promise<void>;
    onSend?: () => Promise<void>;
    onReject?: () => Promise<void>;
    isLoading?: boolean;
}

export function SignaturePanel({
    document,
    currentUserAddress,
    onSign,
    onSend,
    onReject,
    isLoading = false,
}: SignaturePanelProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const isSender = document.sender === currentUserAddress;
    const isReceiver = document.receiver === currentUserAddress;

    const handleAction = async (action: () => Promise<void>) => {
        setIsProcessing(true);
        try {
            await action();
        } catch (error) {
            console.error("Action failed:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusColor = () => {
        switch (document.status) {
            case "DRAFT":
                return "bg-gray-500";
            case "PENDING_SENDER_SIGN":
                return "bg-yellow-500";
            case "PENDING_RECEIVER_SIGN":
                return "bg-blue-500";
            case "FINALIZED":
                return "bg-green-500";
            case "REJECTED":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    const getStatusLabel = () => {
        switch (document.status) {
            case "DRAFT":
                return "Draft";
            case "PENDING_SENDER_SIGN":
                return "Awaiting Sender Signature";
            case "PENDING_RECEIVER_SIGN":
                return "Awaiting Receiver Signature";
            case "FINALIZED":
                return "Finalized";
            case "REJECTED":
                return "Rejected";
            default:
                return document.status;
        }
    };

    const canSenderSign =
        document.status === "PENDING_SENDER_SIGN" && isSender;
    const canReceiverSign =
        document.status === "PENDING_RECEIVER_SIGN" && isReceiver;
    const canSend = document.status === "DRAFT" && isSender && onSend;
    const canReject =
        document.status === "PENDING_RECEIVER_SIGN" && isReceiver && onReject;

    if (isLoading) {
        return (
            <div className="bg-gray-800/50 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-24 bg-gray-700 rounded mb-4"></div>
                <div className="h-10 bg-gray-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
            {/* Status Header */}
            <div className="px-6 py-4 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Document Status</h3>
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor()}`}
                    >
                        {getStatusLabel()}
                    </span>
                </div>
            </div>

            {/* Parties */}
            <div className="px-6 py-4 space-y-4">
                {/* Sender */}
                <div className="flex items-start gap-3">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${document.senderSignature
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-700 text-gray-400"
                            }`}
                    >
                        {document.senderSignature ? (
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
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        ) : (
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
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                            Sender {isSender && "(You)"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{document.sender}</p>
                        {document.senderSignature && (
                            <p className="text-xs text-green-400 mt-1">
                                Signed {new Date(document.senderSignature.signedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                    <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                    </svg>
                </div>

                {/* Receiver */}
                <div className="flex items-start gap-3">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${document.receiverSignature
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-700 text-gray-400"
                            }`}
                    >
                        {document.receiverSignature ? (
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
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        ) : (
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
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                            Receiver {isReceiver && "(You)"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{document.receiver}</p>
                        {document.receiverSignature && (
                            <p className="text-xs text-green-400 mt-1">
                                Signed {new Date(document.receiverSignature.signedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Finalization Info */}
            {document.status === "FINALIZED" && document.finalHash && (
                <div className="px-6 py-4 bg-green-500/10 border-t border-green-500/20">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                        <span className="font-medium text-sm">Blockchain Verified</span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono break-all">
                        Hash: {document.finalHash}
                    </p>
                    {document.blockNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                            Block #{document.blockNumber}
                        </p>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-700/50 space-y-3">
                {canSend && (
                    <button
                        onClick={() => handleAction(onSend!)}
                        disabled={isProcessing}
                        className="w-full py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? "Sending..." : "Send for Signature"}
                    </button>
                )}

                {canSenderSign && (
                    <button
                        onClick={() => handleAction(onSign)}
                        disabled={isProcessing}
                        className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? "Signing..." : "Sign as Sender"}
                    </button>
                )}

                {canReceiverSign && (
                    <>
                        <button
                            onClick={() => handleAction(onSign)}
                            disabled={isProcessing}
                            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? "Signing & Finalizing..." : "Sign & Finalize"}
                        </button>
                        {canReject && (
                            <button
                                onClick={() => handleAction(onReject!)}
                                disabled={isProcessing}
                                className="w-full py-2 px-4 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? "Rejecting..." : "Reject Document"}
                            </button>
                        )}
                    </>
                )}

                {document.status === "FINALIZED" && (
                    <div className="text-center text-sm text-gray-400">
                        This document is immutable and cannot be modified.
                    </div>
                )}

                {document.status === "REJECTED" && (
                    <div className="text-center text-sm text-red-400">
                        This document was rejected by the receiver.
                    </div>
                )}
            </div>
        </div>
    );
}

export default SignaturePanel;
