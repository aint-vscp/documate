/**
 * Breach Management Page
 * Admin interface for reviewing and managing contract breach reports
 * 
 * Workflow:
 * 1. User reports breach against another user
 * 2. Admin investigates with evidence
 * 3. Admin confirms or dismisses breach
 * 4. If confirmed: Apply negative reputation tag ("High Risk" / "Breach")
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useEVMAccount } from "@/hooks/useEVMWallet";

type BreachStatus = "PENDING" | "INVESTIGATING" | "CONFIRMED" | "DISMISSED" | "APPEALED";
type BreachSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type BreachReason = "NON_DELIVERY" | "QUALITY_ISSUE" | "PAYMENT_DISPUTE" | "CONFIDENTIALITY_BREACH" | "FRAUD" | "OTHER";

interface BreachReport {
    id: string;
    reporterId: string;
    reporterAddress: string;
    targetId: string;
    targetAddress: string;
    targetDid?: string;
    contractHash?: string;
    txHash?: string;
    reason: BreachReason;
    description: string;
    evidence?: string;
    status: BreachStatus;
    severity?: BreachSeverity;
    resolution?: string;
    createdAt: string;
    reviewedAt?: string;
}

// Mock data for MVP
const MOCK_BREACHES: BreachReport[] = [
    {
        id: "breach_1",
        reporterId: "user_1",
        reporterAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        targetId: "user_2",
        targetAddress: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        targetDid: "did:kilt:4rT7m...xyz",
        contractHash: "0xabc123...def",
        txHash: "0x1234...5678",
        reason: "NON_DELIVERY",
        description: "Freelancer accepted the contract for React development but never delivered the work after receiving 50% upfront payment. No communication since January 15th.",
        evidence: "QmEvidence1...",
        status: "PENDING",
        createdAt: "2026-02-10T14:30:00Z",
    },
    {
        id: "breach_2",
        reporterId: "user_3",
        reporterAddress: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
        targetId: "user_4",
        targetAddress: "5HGjWAeFDfFC...8Bk2",
        contractHash: "0xdef456...abc",
        reason: "QUALITY_ISSUE",
        description: "Delivered smart contract contains critical security vulnerabilities that the auditor failed to disclose. Lost 50 ETH due to exploit.",
        evidence: "QmEvidence2...",
        status: "INVESTIGATING",
        severity: "HIGH",
        createdAt: "2026-02-08T09:15:00Z",
    },
    {
        id: "breach_3",
        reporterId: "user_5",
        reporterAddress: "5CiPPseXPEc...7nQw",
        targetId: "user_6",
        targetAddress: "5EYCAe5ijAx...5yGf",
        reason: "CONFIDENTIALITY_BREACH",
        description: "Client shared our proprietary code with competitors despite NDA agreement.",
        status: "CONFIRMED",
        severity: "CRITICAL",
        resolution: "Permanent 'Breach' tag applied. User banned from platform.",
        createdAt: "2026-01-25T11:00:00Z",
        reviewedAt: "2026-02-01T16:30:00Z",
    },
];

const STATUS_CONFIG: Record<BreachStatus, { bg: string; text: string; label: string }> = {
    PENDING: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Pending" },
    INVESTIGATING: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Investigating" },
    CONFIRMED: { bg: "bg-red-500/20", text: "text-red-400", label: "Confirmed" },
    DISMISSED: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Dismissed" },
    APPEALED: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Appealed" },
};

const SEVERITY_CONFIG: Record<BreachSeverity, { bg: string; text: string }> = {
    LOW: { bg: "bg-green-500/20", text: "text-green-400" },
    MEDIUM: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
    HIGH: { bg: "bg-orange-500/20", text: "text-orange-400" },
    CRITICAL: { bg: "bg-red-500/20", text: "text-red-400" },
};

const REASON_LABELS: Record<BreachReason, string> = {
    NON_DELIVERY: "Non-Delivery",
    QUALITY_ISSUE: "Quality Issue",
    PAYMENT_DISPUTE: "Payment Dispute",
    CONFIDENTIALITY_BREACH: "Confidentiality Breach",
    FRAUD: "Fraud",
    OTHER: "Other",
};

export default function BreachManagementPage() {
    const account = useEVMAccount();
    const [breaches, setBreaches] = useState<BreachReport[]>(MOCK_BREACHES);
    const [selectedBreach, setSelectedBreach] = useState<BreachReport | null>(null);
    const [filterStatus, setFilterStatus] = useState<BreachStatus | "ALL">("ALL");
    const [isProcessing, setIsProcessing] = useState(false);
    const [resolution, setResolution] = useState("");
    const [selectedSeverity, setSelectedSeverity] = useState<BreachSeverity>("MEDIUM");

    // Fetch breach reports from API
    const fetchBreaches = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/breaches");
            const data = await response.json();
            if (data.success && data.data.length > 0) {
                setBreaches(data.data.map((b: { id: string; reporterId: string; reporter?: { walletAddress?: string; did?: string | null }; targetId: string; target?: { walletAddress?: string; did?: string | null }; contractHash?: string; txHash?: string; reason: BreachReason; description: string; evidence?: string; status: BreachStatus; severity?: BreachSeverity; resolution?: string; createdAt?: string; reviewedAt?: string }) => ({
                    id: b.id,
                    reporterId: b.reporterId,
                    reporterAddress: b.reporter?.walletAddress || "",
                    targetId: b.targetId,
                    targetAddress: b.target?.walletAddress || "",
                    targetDid: b.target?.did || undefined,
                    contractHash: b.contractHash,
                    txHash: b.txHash,
                    reason: b.reason,
                    description: b.description,
                    evidence: b.evidence,
                    status: b.status,
                    severity: b.severity,
                    resolution: b.resolution,
                    createdAt: b.createdAt || new Date().toISOString(),
                    reviewedAt: b.reviewedAt,
                })));
            }
        } catch (error) {
            console.error("Failed to fetch breach reports:", error);
        }
    }, []);

    useEffect(() => {
        fetchBreaches();
    }, [fetchBreaches]);

    const filteredBreaches = filterStatus === "ALL"
        ? breaches
        : breaches.filter(b => b.status === filterStatus);

    const pendingCount = breaches.filter(b => b.status === "PENDING").length;
    const investigatingCount = breaches.filter(b => b.status === "INVESTIGATING").length;

    const handleStartInvestigation = async (breach: BreachReport) => {
        setSelectedBreach(breach);
        try {
            await fetch("/api/admin/breaches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    breachId: breach.id,
                    action: "investigate",
                    reviewerAddress: account || "",
                }),
            });
            setBreaches(prev => prev.map(b =>
                b.id === breach.id ? { ...b, status: "INVESTIGATING" as const } : b
            ));
        } catch (error) {
            console.error("Investigate error:", error);
        }
    };

    const handleConfirmBreach = async () => {
        if (!selectedBreach || !resolution.trim()) return;
        setIsProcessing(true);

        try {
            const response = await fetch("/api/admin/breaches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    breachId: selectedBreach.id,
                    action: "confirm",
                    severity: selectedSeverity,
                    resolution,
                    reviewerAddress: account || "",
                }),
            });
            const data = await response.json();

            if (data.success) {
                setBreaches(prev => prev.map(b =>
                    b.id === selectedBreach.id
                        ? {
                            ...b,
                            status: "CONFIRMED" as const,
                            severity: selectedSeverity,
                            resolution,
                            reviewedAt: new Date().toISOString()
                        }
                        : b
                ));
            }
        } catch (error) {
            console.error("Confirm breach error:", error);
        }

        setSelectedBreach(null);
        setIsProcessing(false);
        setResolution("");
    };

    const handleDismiss = async () => {
        if (!selectedBreach || !resolution.trim()) return;
        setIsProcessing(true);

        try {
            const response = await fetch("/api/admin/breaches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    breachId: selectedBreach.id,
                    action: "dismiss",
                    resolution,
                    reviewerAddress: account || "",
                }),
            });
            const data = await response.json();

            if (data.success) {
                setBreaches(prev => prev.map(b =>
                    b.id === selectedBreach.id
                        ? { ...b, status: "DISMISSED" as const, resolution, reviewedAt: new Date().toISOString() }
                        : b
                ));
            }
        } catch (error) {
            console.error("Dismiss breach error:", error);
        }

        setSelectedBreach(null);
        setIsProcessing(false);
        setResolution("");
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Breach Management</h1>
                    <p className="text-gray-400 mt-1">
                        Review and manage contract breach reports
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                        <span className="text-yellow-400 font-semibold">{pendingCount}</span>
                        <span className="text-gray-400 text-sm">pending</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <span className="text-blue-400 font-semibold">{investigatingCount}</span>
                        <span className="text-gray-400 text-sm">investigating</span>
                    </div>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Important: Reputation is Immutable</h3>
                        <p className="text-gray-400 text-sm mt-1">
                            Confirmed breaches result in <span className="text-red-400 font-medium">permanent</span> negative
                            reputation tags. This action cannot be undone. Review all evidence carefully before confirming.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(["ALL", "PENDING", "INVESTIGATING", "CONFIRMED", "DISMISSED", "APPEALED"] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            filterStatus === status
                                ? "bg-gradient-to-r from-red-500 to-orange-600 text-white"
                                : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                        }`}
                    >
                        {status === "ALL" ? "All Reports" : STATUS_CONFIG[status].label}
                    </button>
                ))}
            </div>

            {/* Breach List */}
            <div className="space-y-4">
                {filteredBreaches.length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl">
                        <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Reports</h3>
                        <p className="text-gray-400">No breach reports match this filter.</p>
                    </div>
                ) : (
                    filteredBreaches.map((breach) => (
                        <div
                            key={breach.id}
                            className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 border rounded-2xl p-6 transition-all ${
                                selectedBreach?.id === breach.id
                                    ? "border-red-500/50 ring-2 ring-red-500/20"
                                    : "border-gray-700/50 hover:border-gray-600/50"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* Report Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[breach.status].bg} ${STATUS_CONFIG[breach.status].text}`}>
                                            {STATUS_CONFIG[breach.status].label}
                                        </span>
                                        {breach.severity && (
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${SEVERITY_CONFIG[breach.severity].bg} ${SEVERITY_CONFIG[breach.severity].text}`}>
                                                {breach.severity}
                                            </span>
                                        )}
                                        <span className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm">
                                            {REASON_LABELS[breach.reason]}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-6 mt-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500 text-sm">Reporter:</span>
                                            <span className="text-gray-300 text-sm font-mono">
                                                {truncateAddress(breach.reporterAddress)}
                                            </span>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500 text-sm">Target:</span>
                                            <span className="text-red-400 text-sm font-mono font-medium">
                                                {truncateAddress(breach.targetAddress)}
                                            </span>
                                            {breach.targetDid && (
                                                <span className="text-emerald-400 text-xs">(DID)</span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-gray-400 text-sm mt-3 line-clamp-2">{breach.description}</p>

                                    <div className="flex items-center gap-4 mt-3">
                                        <span className="text-gray-500 text-xs">{formatDate(breach.createdAt)}</span>
                                        {breach.contractHash && (
                                            <span className="text-gray-500 text-xs font-mono">
                                                Contract: {breach.contractHash.slice(0, 10)}...
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    {breach.status === "PENDING" && (
                                        <button
                                            onClick={() => handleStartInvestigation(breach)}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                                        >
                                            Investigate
                                        </button>
                                    )}

                                    {breach.status === "INVESTIGATING" && selectedBreach?.id !== breach.id && (
                                        <button
                                            onClick={() => setSelectedBreach(breach)}
                                            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/30 transition-colors"
                                        >
                                            Continue
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Investigation Panel */}
                            {selectedBreach?.id === breach.id && (
                                <div className="mt-6 pt-6 border-t border-gray-700/50">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Evidence & Details */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                                Report Details
                                            </h4>
                                            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 space-y-4">
                                                <div>
                                                    <span className="text-gray-500 text-xs uppercase">Description</span>
                                                    <p className="text-gray-300 text-sm mt-1">{breach.description}</p>
                                                </div>

                                                {breach.evidence && (
                                                    <div>
                                                        <span className="text-gray-500 text-xs uppercase">Evidence (IPFS)</span>
                                                        <a
                                                            href={`https://ipfs.io/ipfs/${breach.evidence}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 mt-1 text-orange-400 hover:text-orange-300 text-sm"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                            View Evidence
                                                        </a>
                                                    </div>
                                                )}

                                                {breach.txHash && (
                                                    <div>
                                                        <span className="text-gray-500 text-xs uppercase">On-Chain Evidence</span>
                                                        <p className="text-gray-300 text-sm font-mono mt-1">{breach.txHash}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Decision Panel */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                                Investigation Decision
                                            </h4>

                                            {/* Severity Selection */}
                                            <div className="mb-4">
                                                <label className="block text-sm text-gray-400 mb-2">
                                                    Severity Level (if confirming)
                                                </label>
                                                <div className="flex gap-2">
                                                    {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as BreachSeverity[]).map((sev) => (
                                                        <button
                                                            key={sev}
                                                            onClick={() => setSelectedSeverity(sev)}
                                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                                selectedSeverity === sev
                                                                    ? `${SEVERITY_CONFIG[sev].bg} ${SEVERITY_CONFIG[sev].text} ring-2 ring-current`
                                                                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
                                                            }`}
                                                        >
                                                            {sev}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Resolution Input */}
                                            <div className="mb-4">
                                                <label className="block text-sm text-gray-400 mb-2">
                                                    Resolution / Notes (required)
                                                </label>
                                                <textarea
                                                    value={resolution}
                                                    onChange={(e) => setResolution(e.target.value)}
                                                    placeholder="Document your findings and decision rationale..."
                                                    className="w-full h-24 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-red-500 focus:outline-none resize-none"
                                                />
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleConfirmBreach}
                                                    disabled={isProcessing || !resolution.trim()}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                                >
                                                    {isProcessing ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                            Confirm Breach
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={handleDismiss}
                                                    disabled={isProcessing || !resolution.trim()}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700/50 text-gray-300 rounded-xl font-medium hover:bg-gray-600/50 transition-colors disabled:opacity-50"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Dismiss
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => setSelectedBreach(null)}
                                                className="w-full mt-3 px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Resolution Display */}
                            {(breach.status === "CONFIRMED" || breach.status === "DISMISSED") && breach.resolution && (
                                <div className={`mt-4 p-4 rounded-xl ${
                                    breach.status === "CONFIRMED"
                                        ? "bg-red-500/10 border border-red-500/30"
                                        : "bg-gray-700/30 border border-gray-600/30"
                                }`}>
                                    <p className={`text-sm font-medium mb-1 ${
                                        breach.status === "CONFIRMED" ? "text-red-400" : "text-gray-400"
                                    }`}>
                                        {breach.status === "CONFIRMED" ? "Breach Confirmed" : "Report Dismissed"}:
                                    </p>
                                    <p className="text-gray-300 text-sm">{breach.resolution}</p>
                                    {breach.reviewedAt && (
                                        <p className="text-gray-500 text-xs mt-2">
                                            Reviewed on {formatDate(breach.reviewedAt)}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
