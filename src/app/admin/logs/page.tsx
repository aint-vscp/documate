/**
 * Admin Audit Log Page
 * Displays admin action history from AdminLog table
 */
"use client";

import { useState, useEffect, useCallback } from "react";

interface AuditLogEntry {
    id: string;
    adminId: string;
    adminAddress: string;
    action: string;
    targetType: string;
    targetId: string;
    details: string | null;
    createdAt: string;
}

const ACTION_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    VERIFICATION_APPROVED: { bg: "bg-emerald-500/20", text: "text-emerald-400", icon: "✓" },
    VERIFICATION_REJECTED: { bg: "bg-red-500/20", text: "text-red-400", icon: "✕" },
    BREACH_CONFIRMED: { bg: "bg-red-500/20", text: "text-red-400", icon: "⚠" },
    BREACH_DISMISSED: { bg: "bg-gray-500/20", text: "text-gray-400", icon: "—" },
    BREACH_INVESTIGATING: { bg: "bg-blue-500/20", text: "text-blue-400", icon: "🔍" },
};

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterAction, setFilterAction] = useState("ALL");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterAction !== "ALL") params.set("action", filterAction);
            params.set("page", page.toString());

            const response = await fetch(`/api/admin/logs?${params}`);
            const data = await response.json();

            if (data.success) {
                setLogs(data.data);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setIsLoading(false);
        }
    }, [filterAction, page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const truncateAddress = (addr: string) =>
        addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "System";

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

    const getActionStyle = (action: string) => {
        return (
            ACTION_COLORS[action] || {
                bg: "bg-gray-500/20",
                text: "text-gray-400",
                icon: "•",
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Audit Log</h1>
                <p className="text-gray-400 mt-1">
                    History of all admin actions on the platform
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {[
                    "ALL",
                    "VERIFICATION",
                    "BREACH",
                ].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => {
                            setFilterAction(filter);
                            setPage(1);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            filterAction === filter
                                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                        }`}
                    >
                        {filter === "ALL" ? "All Actions" : filter.charAt(0) + filter.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                </div>
            )}

            {/* Log Entries */}
            {!isLoading && (
                <div className="space-y-3">
                    {logs.length === 0 ? (
                        <div className="text-center py-12 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl">
                            <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-gray-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                No Log Entries
                            </h3>
                            <p className="text-gray-400">
                                Admin actions will appear here as they occur.
                            </p>
                        </div>
                    ) : (
                        logs.map((entry) => {
                            const style = getActionStyle(entry.action);
                            return (
                                <div
                                    key={entry.id}
                                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600/50 transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={`w-10 h-10 ${style.bg} rounded-xl flex items-center justify-center shrink-0`}
                                        >
                                            <span className={`text-lg ${style.text}`}>
                                                {style.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}
                                                >
                                                    {entry.action.replace(/_/g, " ")}
                                                </span>
                                                {entry.targetType && (
                                                    <span className="text-gray-500 text-xs">
                                                        {entry.targetType}
                                                    </span>
                                                )}
                                            </div>
                                            {entry.details && (
                                                <p className="text-gray-300 text-sm mt-1">
                                                    {entry.details}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span>
                                                    Admin: {truncateAddress(entry.adminAddress)}
                                                </span>
                                                <span>Target: {entry.targetId.slice(0, 12)}...</span>
                                                <span>{formatDate(entry.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-gray-400 text-sm px-4">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
