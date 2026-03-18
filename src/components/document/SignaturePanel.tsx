"use client";

/**
 * Signature Panel Component
 * Shows document status and allows signing actions
 */

import React, { useState } from "react";
import type { DocumentInstance } from "@/types";
import { loadUserProfile } from "@/lib/polkadot/kilt";
import { loadReusableEncryptedSignature } from "@/lib/document";
import { saveReusableEncryptedSignature } from "@/lib/document";

interface SignaturePanelProps {
    document: DocumentInstance;
    currentUserAddress: string;
    onSign: (signatureDataUrl?: string) => Promise<void>;
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
    const [savedSignature, setSavedSignature] = useState<string | null>(null);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [signError, setSignError] = useState<string | null>(null);
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const drawingRef = React.useRef(false);
    const lastPointRef = React.useRef<{ x: number; y: number } | null>(null);

    const setupCanvasContext = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const rect = canvas.getBoundingClientRect();
        const targetWidth = Math.max(1, Math.round(rect.width * dpr));
        const targetHeight = Math.max(1, Math.round(rect.height * dpr));

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            const snapshot = canvas.toDataURL("image/png");
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, rect.width, rect.height);
            };
            img.src = snapshot;
        } else {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#f8fafc";
    }, []);

    React.useEffect(() => {
        if (!currentUserAddress) return;

        const canSignNow =
            (document.status === "PENDING_SENDER_SIGN" && document.sender === currentUserAddress) ||
            (document.status === "PENDING_RECEIVER_SIGN" && document.receiver === currentUserAddress);

        if (!canSignNow) return;

        const profile = loadUserProfile();
        loadReusableEncryptedSignature(currentUserAddress, profile?.did).then((sig) => {
            setSavedSignature(sig);
        });
    }, [currentUserAddress, document.receiver, document.sender, document.status]);

    React.useEffect(() => {
        setupCanvasContext();
        const onResize = () => setupCanvasContext();
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
        };
    }, [setupCanvasContext]);

    const isSender = document.sender?.toLowerCase() === currentUserAddress?.toLowerCase();
    const isReceiver = document.receiver?.toLowerCase() === currentUserAddress?.toLowerCase();

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

    const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();

        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    };

    const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setupCanvasContext();
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const point = getCanvasPoint(event);
        if (!point) return;

        canvas.setPointerCapture(event.pointerId);
        drawingRef.current = true;
        lastPointRef.current = point;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        setSignError(null);
    };

    const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawingRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const currentPoint = getCanvasPoint(event);
        if (!currentPoint) return;

        const previousPoint = lastPointRef.current ?? currentPoint;

        // Weighted smoothing to remove mouse jitter while keeping pen accuracy.
        const smoothedPoint = {
            x: previousPoint.x * 0.65 + currentPoint.x * 0.35,
            y: previousPoint.y * 0.65 + currentPoint.y * 0.35,
        };

        const midPoint = {
            x: (previousPoint.x + smoothedPoint.x) / 2,
            y: (previousPoint.y + smoothedPoint.y) / 2,
        };

        ctx.quadraticCurveTo(previousPoint.x, previousPoint.y, midPoint.x, midPoint.y);
        ctx.stroke();
        lastPointRef.current = smoothedPoint;
    };

    const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.releasePointerCapture(event.pointerId);
        }
        drawingRef.current = false;
        lastPointRef.current = null;
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        setSignatureDataUrl(null);
        lastPointRef.current = null;
    };

    const saveCurrentSignature = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setSignatureDataUrl(dataUrl);

        try {
            const profile = loadUserProfile();
            await saveReusableEncryptedSignature(currentUserAddress, dataUrl, profile?.did);
            setSavedSignature(dataUrl);
            setSignError(null);
        } catch {
            setSignError("Failed to save encrypted signature profile. Please try again.");
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
                        className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? "Sending..." : "Send for Signature"}
                    </button>
                )}

                {canSenderSign && (
                    <>
                        <div className="rounded-lg border border-gray-700/70 bg-gray-900/60 p-3 space-y-2">
                            <p className="text-xs text-gray-400">Draw signature (mouse/touch)</p>
                            <canvas
                                ref={canvasRef}
                                onPointerDown={startDrawing}
                                onPointerMove={draw}
                                onPointerUp={stopDrawing}
                                onPointerCancel={stopDrawing}
                                onPointerLeave={stopDrawing}
                                className="w-full h-28 rounded-md border border-gray-700 bg-black/50 touch-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={clearSignature}
                                    type="button"
                                    className="flex-1 py-2 text-xs rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800/70"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={() => {
                                        void saveCurrentSignature();
                                    }}
                                    type="button"
                                    className="flex-1 py-2 text-xs rounded-md bg-cyan-500 text-black font-semibold hover:bg-cyan-400"
                                >
                                    Save Signature
                                </button>
                                {savedSignature && (
                                    <button
                                        onClick={() => {
                                            setSignatureDataUrl(savedSignature);
                                            setSignError(null);
                                        }}
                                        type="button"
                                        className="flex-1 py-2 text-xs rounded-md border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
                                    >
                                        Use Saved
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500">
                                Your saved signature is encrypted and tied to your wallet/DID for reuse.
                            </p>
                        </div>

                        {signError && (
                            <p className="text-xs text-red-400">{signError}</p>
                        )}

                        <button
                            onClick={() => {
                                const selectedSignature = signatureDataUrl || savedSignature;
                                if (!selectedSignature) {
                                    setSignError("Please draw and save a signature (or use your saved one) before signing.");
                                    return;
                                }
                                void handleAction(() => onSign(selectedSignature));
                            }}
                            disabled={isProcessing}
                            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? "Signing & Anchoring..." : "Sign + Pay & Anchor On-Chain"}
                        </button>
                    </>
                )}

                {canReceiverSign && (
                    <>
                        <div className="rounded-lg border border-gray-700/70 bg-gray-900/60 p-3 space-y-2">
                            <p className="text-xs text-gray-400">Draw signature (mouse/touch)</p>
                            <canvas
                                ref={canvasRef}
                                onPointerDown={startDrawing}
                                onPointerMove={draw}
                                onPointerUp={stopDrawing}
                                onPointerCancel={stopDrawing}
                                onPointerLeave={stopDrawing}
                                className="w-full h-28 rounded-md border border-gray-700 bg-black/50 touch-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={clearSignature}
                                    type="button"
                                    className="flex-1 py-2 text-xs rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800/70"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={() => {
                                        void saveCurrentSignature();
                                    }}
                                    type="button"
                                    className="flex-1 py-2 text-xs rounded-md bg-cyan-500 text-black font-semibold hover:bg-cyan-400"
                                >
                                    Save Signature
                                </button>
                                {savedSignature && (
                                    <button
                                        onClick={() => {
                                            setSignatureDataUrl(savedSignature);
                                            setSignError(null);
                                        }}
                                        type="button"
                                        className="flex-1 py-2 text-xs rounded-md border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
                                    >
                                        Use Saved
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500">
                                Your saved signature is encrypted and tied to your wallet/DID for reuse.
                            </p>
                        </div>

                        {signError && (
                            <p className="text-xs text-red-400">{signError}</p>
                        )}

                        <button
                            onClick={() => {
                                const selectedSignature = signatureDataUrl || savedSignature;
                                if (!selectedSignature) {
                                    setSignError("Please draw and save a signature (or use your saved one) before signing.");
                                    return;
                                }
                                void handleAction(() => onSign(selectedSignature));
                            }}
                            disabled={isProcessing}
                            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? "Signing & Finalizing..." : "Receiver Sign & Finalize"}
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
