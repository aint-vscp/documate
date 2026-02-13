/**
 * Verification Queue Page
 * Admin interface for reviewing and approving "Blue Check" verification requests
 * 
 * Workflow:
 * 1. Creator submits template + $50-$100 payment
 * 2. Admin reviews template content (decrypted)
 * 3. Admin approves (issues KILT credential) or rejects (with feedback)
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelectedAccount } from "@/hooks/useWallet";

type VerificationStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";

interface VerificationRequest {
    id: string;
    templateId: string;
    templateTitle: string;
    templateCategory: string;
    creatorAddress: string;
    creatorDid?: string;
    ipfsCid: string;
    status: VerificationStatus;
    feePaid: number;
    paymentTx: string;
    requestedAt: string;
    reviewedAt?: string;
    reviewerId?: string;
    feedback?: string;
}

// Mock data for MVP
const MOCK_REQUESTS: VerificationRequest[] = [
    {
        id: "ver_1",
        templateId: "tpl_1",
        templateTitle: "Enterprise NDA Template v2.0",
        templateCategory: "LEGAL",
        creatorAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        creatorDid: "did:kilt:4rT7m...xyz",
        ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        status: "PENDING",
        feePaid: 50,
        paymentTx: "0x1234...abcd",
        requestedAt: "2026-02-11T10:30:00Z",
    },
    {
        id: "ver_2",
        templateId: "tpl_2",
        templateTitle: "Smart Contract Audit Agreement",
        templateCategory: "ENGINEERING",
        creatorAddress: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        ipfsCid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
        status: "IN_REVIEW",
        feePaid: 75,
        paymentTx: "0x5678...efgh",
        requestedAt: "2026-02-10T14:20:00Z",
    },
    {
        id: "ver_3",
        templateId: "tpl_3",
        templateTitle: "Freelance Photography Contract",
        templateCategory: "CREATIVE",
        creatorAddress: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
        creatorDid: "did:kilt:9aB2c...abc",
        ipfsCid: "QmZTR5bcpQD7cFgTorqxZDYaew1Wqgfbd2ud9QqGPAkK2V",
        status: "PENDING",
        feePaid: 50,
        paymentTx: "0x9abc...ijkl",
        requestedAt: "2026-02-09T08:15:00Z",
    },
];

const STATUS_COLORS: Record<VerificationStatus, { bg: string; text: string; label: string }> = {
    PENDING: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Pending Review" },
    IN_REVIEW: { bg: "bg-blue-500/20", text: "text-blue-400", label: "In Review" },
    APPROVED: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Approved" },
    REJECTED: { bg: "bg-red-500/20", text: "text-red-400", label: "Rejected" },
};

const CATEGORY_COLORS: Record<string, string> = {
    LEGAL: "from-blue-500 to-indigo-600",
    CREATIVE: "from-pink-500 to-purple-600",
    ENGINEERING: "from-green-500 to-emerald-600",
};

export default function VerificationQueuePage() {
    const selectedAccount = useSelectedAccount();
    const [requests, setRequests] = useState<VerificationRequest[]>(MOCK_REQUESTS);
    const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
    const [filterStatus, setFilterStatus] = useState<VerificationStatus | "ALL">("ALL");
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState("");

    // Fetch verification requests from API
    const fetchRequests = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/verification");
            const data = await response.json();
            if (data.success && data.data.length > 0) {
                setRequests(data.data.map((v: { id: string; templateId: string; template?: { title?: string; category?: string; ipfsCid?: string }; requesterId?: string; status: VerificationStatus; feePaid?: number; paymentTx?: string; requestedAt?: string; reviewedAt?: string; reviewerId?: string; feedback?: string }) => ({
                    id: v.id,
                    templateId: v.templateId,
                    templateTitle: v.template?.title || "Unknown",
                    templateCategory: v.template?.category || "LEGAL",
                    creatorAddress: v.requesterId || "",
                    ipfsCid: v.template?.ipfsCid || "",
                    status: v.status,
                    feePaid: v.feePaid || 0,
                    paymentTx: v.paymentTx || "",
                    requestedAt: v.requestedAt || new Date().toISOString(),
                    reviewedAt: v.reviewedAt,
                    reviewerId: v.reviewerId,
                    feedback: v.feedback,
                })));
            }
        } catch (error) {
            console.error("Failed to fetch verification requests:", error);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const filteredRequests = filterStatus === "ALL"
        ? requests
        : requests.filter(r => r.status === filterStatus);

    const pendingCount = requests.filter(r => r.status === "PENDING").length;
    const inReviewCount = requests.filter(r => r.status === "IN_REVIEW").length;

    const handleStartReview = async (request: VerificationRequest) => {
        setSelectedRequest(request);
        // Update status to IN_REVIEW
        setRequests(prev => prev.map(r =>
            r.id === request.id ? { ...r, status: "IN_REVIEW" as const } : r
        ));
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;
        setIsProcessing(true);

        try {
            const response = await fetch("/api/admin/verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    verificationId: selectedRequest.id,
                    action: "approve",
                    reviewerAddress: selectedAccount?.address || "",
                }),
            });
            const data = await response.json();

            if (data.success) {
                setRequests(prev => prev.map(r =>
                    r.id === selectedRequest.id
                        ? { ...r, status: "APPROVED" as const, reviewedAt: new Date().toISOString() }
                        : r
                ));
            }
        } catch (error) {
            console.error("Approve error:", error);
        }

        setSelectedRequest(null);
        setIsProcessing(false);
        setFeedback("");
    };

    const handleReject = async () => {
        if (!selectedRequest || !feedback.trim()) return;
        setIsProcessing(true);

        try {
            const response = await fetch("/api/admin/verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    verificationId: selectedRequest.id,
                    action: "reject",
                    feedback,
                    reviewerAddress: selectedAccount?.address || "",
                }),
            });
            const data = await response.json();

            if (data.success) {
                setRequests(prev => prev.map(r =>
                    r.id === selectedRequest.id
                        ? { ...r, status: "REJECTED" as const, feedback, reviewedAt: new Date().toISOString() }
                        : r
                ));
            }
        } catch (error) {
            console.error("Reject error:", error);
        }

        setSelectedRequest(null);
        setIsProcessing(false);
        setFeedback("");
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
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
                    <h1 className="text-3xl font-bold text-white">Verification Queue</h1>
                    <p className="text-gray-400 mt-1">
                        Review and approve &quot;Blue Check&quot; verification requests
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                        <span className="text-yellow-400 font-semibold">{pendingCount}</span>
                        <span className="text-gray-400 text-sm">pending</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <span className="text-blue-400 font-semibold">{inReviewCount}</span>
                        <span className="text-gray-400 text-sm">in review</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(["ALL", "PENDING", "IN_REVIEW", "APPROVED", "REJECTED"] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === status
                                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                            }`}
                    >
                        {status === "ALL" ? "All Requests" : STATUS_COLORS[status].label}
                    </button>
                ))}
            </div>

            {/* Request List */}
            <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl">
                        <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Requests</h3>
                        <p className="text-gray-400">No verification requests match this filter.</p>
                    </div>
                ) : (
                    filteredRequests.map((request) => (
                        <div
                            key={request.id}
                            className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 border rounded-2xl p-6 transition-all ${selectedRequest?.id === request.id
                                    ? "border-pink-500/50 ring-2 ring-pink-500/20"
                                    : "border-gray-700/50 hover:border-gray-600/50"
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* Template Info */}
                                <div className="flex items-start gap-4">
                                    <div className={`w-14 h-14 bg-gradient-to-br ${CATEGORY_COLORS[request.templateCategory]} rounded-xl flex items-center justify-center shrink-0`}>
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{request.templateTitle}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-gray-400 text-sm">{request.templateCategory}</span>
                                            <span className="text-gray-600">•</span>
                                            <span className="text-gray-400 text-sm font-mono">
                                                {truncateAddress(request.creatorAddress)}
                                            </span>
                                            {request.creatorDid && (
                                                <>
                                                    <span className="text-gray-600">•</span>
                                                    <span className="text-emerald-400 text-sm">DID Linked</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-3">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-gray-500 text-sm">{formatDate(request.requestedAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-emerald-400 text-sm">${request.feePaid} paid</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[request.status].bg} ${STATUS_COLORS[request.status].text}`}>
                                        {STATUS_COLORS[request.status].label}
                                    </span>

                                    {request.status === "PENDING" && (
                                        <button
                                            onClick={() => handleStartReview(request)}
                                            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                                        >
                                            Start Review
                                        </button>
                                    )}

                                    {request.status === "IN_REVIEW" && selectedRequest?.id !== request.id && (
                                        <button
                                            onClick={() => setSelectedRequest(request)}
                                            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/30 transition-colors"
                                        >
                                            Continue Review
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Review Panel */}
                            {selectedRequest?.id === request.id && (
                                <div className="mt-6 pt-6 border-t border-gray-700/50">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Template Preview */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                                Template Content
                                            </h4>
                                            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 h-64 overflow-y-auto">
                                                <p className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                                                    {/* In production, decrypt and display IPFS content */}
                                                    IPFS CID: {request.ipfsCid}
                                                    {"\n\n"}
                                                    [Template content would be decrypted and displayed here]
                                                    {"\n\n"}
                                                    NON-DISCLOSURE AGREEMENT
                                                    {"\n\n"}
                                                    This Non-Disclosure Agreement (&quot;Agreement&quot;) is entered into as of {"{{effective_date}}"} by and between:
                                                    {"\n\n"}
                                                    Party A: {"{{party_a_name}}"}
                                                    Party B: {"{{party_b_name}}"}
                                                    {"\n\n"}
                                                    1. DEFINITION OF CONFIDENTIAL INFORMATION
                                                    For the purposes of this Agreement, &quot;Confidential Information&quot; shall include...
                                                </p>
                                            </div>
                                            <a
                                                href={`https://ipfs.io/ipfs/${request.ipfsCid}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 mt-3 text-pink-400 hover:text-pink-300 text-sm"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                View on IPFS
                                            </a>
                                        </div>

                                        {/* Review Actions */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                                Review Decision
                                            </h4>

                                            {/* Verification Checklist */}
                                            <div className="space-y-2 mb-4">
                                                <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 accent-emerald-500" />
                                                    <span className="text-gray-300 text-sm">Content is legally accurate</span>
                                                </label>
                                                <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 accent-emerald-500" />
                                                    <span className="text-gray-300 text-sm">No harmful or malicious clauses</span>
                                                </label>
                                                <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 accent-emerald-500" />
                                                    <span className="text-gray-300 text-sm">Proper placeholder formatting</span>
                                                </label>
                                                <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 accent-emerald-500" />
                                                    <span className="text-gray-300 text-sm">Category matches content</span>
                                                </label>
                                            </div>

                                            {/* Feedback Input */}
                                            <div className="mb-4">
                                                <label className="block text-sm text-gray-400 mb-2">
                                                    Feedback / Notes (required for rejection)
                                                </label>
                                                <textarea
                                                    value={feedback}
                                                    onChange={(e) => setFeedback(e.target.value)}
                                                    placeholder="Enter review notes or rejection reason..."
                                                    className="w-full h-24 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-pink-500 focus:outline-none resize-none"
                                                />
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleApprove}
                                                    disabled={isProcessing}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                                >
                                                    {isProcessing ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Approve
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={handleReject}
                                                    disabled={isProcessing || !feedback.trim()}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Reject
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => setSelectedRequest(null)}
                                                className="w-full mt-3 px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                                            >
                                                Cancel Review
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Rejection Feedback Display */}
                            {request.status === "REJECTED" && request.feedback && (
                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                    <p className="text-red-400 text-sm font-medium mb-1">Rejection Reason:</p>
                                    <p className="text-gray-300 text-sm">{request.feedback}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
