"use client";

/**
 * Documents List Page
 * Shows all user's documents with status filtering
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useEVMWallet } from "@/hooks/useEVMWallet";
import { getAllDocuments, getDocumentStats, getSharedDocuments } from "@/lib/document";
import type { DocumentInstance, DocumentStatus } from "@/types";

function normalizeAddress(address: string | null | undefined): string {
    return (address || "").trim().toLowerCase();
}

const STATUS_COLORS: Record<DocumentStatus, { bg: string; text: string }> = {
    DRAFT: { bg: "bg-gray-500/20", text: "text-gray-400" },
    PENDING_SENDER_SIGN: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
    PENDING_RECEIVER_SIGN: { bg: "bg-blue-500/20", text: "text-blue-400" },
    FINALIZED: { bg: "bg-green-500/20", text: "text-green-400" },
    REJECTED: { bg: "bg-red-500/20", text: "text-red-400" },
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
    DRAFT: "Draft",
    PENDING_SENDER_SIGN: "Awaiting Your Signature",
    PENDING_RECEIVER_SIGN: "Awaiting Counterparty",
    FINALIZED: "Finalized",
    REJECTED: "Rejected",
};

type FilterType = "all" | "sent" | "received" | DocumentStatus;

export default function DocumentsPage() {
    const account = useEVMWallet((s) => s.account);
    const [documents, setDocuments] = useState<DocumentInstance[]>([]);
    const [filter, setFilter] = useState<FilterType>("all");
    const [stats, setStats] = useState({
        total: 0,
        drafts: 0,
        pending: 0,
        finalized: 0,
        sent: 0,
        received: 0,
    });

    useEffect(() => {
        let isMounted = true;

        const loadDocuments = async () => {
            if (!account) {
                if (!isMounted) return;
                setDocuments([]);
                setStats({
                    total: 0,
                    drafts: 0,
                    pending: 0,
                    finalized: 0,
                    sent: 0,
                    received: 0,
                });
                return;
            }

            try {
                const allDocs = await getSharedDocuments(account);
                if (!isMounted) return;
                setDocuments(allDocs);
            } catch {
                if (!isMounted) return;
                setDocuments(getAllDocuments());
            }

            if (!isMounted) return;
            setStats(getDocumentStats(account));
        };

        loadDocuments();

        return () => {
            isMounted = false;
        };
    }, [account]);

    const filteredDocuments = documents.filter((doc) => {
        if (!account) return false;

        const normalizedAccount = normalizeAddress(account);
        const normalizedSender = normalizeAddress(doc.sender);
        const normalizedReceiver = normalizeAddress(doc.receiver);

        const isUserDoc =
            normalizedSender === normalizedAccount ||
            normalizedReceiver === normalizedAccount;

        if (!isUserDoc) return false;

        switch (filter) {
            case "all":
                return true;
            case "sent":
                return normalizedSender === normalizedAccount;
            case "received":
                return normalizedReceiver === normalizedAccount;
            default:
                return doc.status === filter;
        }
    });

    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
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
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                    Connect Your Wallet
                </h2>
                <p className="text-gray-400 text-center max-w-md">
                    Connect your MetaMask wallet to view and manage your documents.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">My Documents</h1>
                    <p className="text-gray-400 mt-1">
                        Manage your contracts and agreements
                    </p>
                </div>
                <Link
                    href="/dashboard/documents/new"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium transition-colors flex items-center gap-2"
                >
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
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    New Document
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total" value={stats.total} color="purple" />
                <StatCard label="Drafts" value={stats.drafts} color="gray" />
                <StatCard label="Pending" value={stats.pending} color="yellow" />
                <StatCard label="Finalized" value={stats.finalized} color="green" />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {(
                    [
                        { key: "all", label: "All" },
                        { key: "sent", label: "Sent" },
                        { key: "received", label: "Received" },
                        { key: "DRAFT", label: "Drafts" },
                        { key: "PENDING_SENDER_SIGN", label: "Needs My Signature" },
                        { key: "FINALIZED", label: "Finalized" },
                    ] as const
                ).map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === key
                                ? "bg-amber-500 text-white"
                                : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Documents List */}
            {filteredDocuments.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
                    <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                        No documents found
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Create your first document to get started
                    </p>
                    <Link
                        href="/dashboard/documents/new"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
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
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Create Document
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredDocuments.map((doc) => (
                        <DocumentCard
                            key={doc.id}
                            document={doc}
                            currentUserAddress={account}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function StatCard({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: "purple" | "gray" | "yellow" | "green";
}) {
    const colors = {
        purple: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
        gray: "from-gray-500/20 to-gray-600/20 border-gray-500/30",
        yellow: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30",
        green: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    };

    return (
        <div
            className={`bg-gradient-to-br ${colors[color]} backdrop-blur rounded-xl border p-4`}
        >
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400">{label}</p>
        </div>
    );
}

function DocumentCard({
    document,
    currentUserAddress,
}: {
    document: DocumentInstance;
    currentUserAddress: string;
}) {
    const isSender = document.sender.toLowerCase() === currentUserAddress.toLowerCase();
    const statusStyle = STATUS_COLORS[document.status];

    return (
        <Link
            href={`/dashboard/documents/${document.id}`}
            className="block bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur rounded-xl border border-gray-700/50 hover:border-amber-500/50 transition-all p-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-white truncate">
                            {document.templateName}
                        </h3>
                        <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                        >
                            {STATUS_LABELS[document.status]}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span>{isSender ? "Sent to" : "From"}</span>
                        <span className="font-mono truncate max-w-[200px]">
                            {isSender ? document.receiver : document.sender}
                        </span>
                    </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                    <p>{new Date(document.createdAt).toLocaleDateString()}</p>
                    {document.status === "FINALIZED" && (
                        <p className="text-green-400 flex items-center gap-1 justify-end mt-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            On-chain
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}
