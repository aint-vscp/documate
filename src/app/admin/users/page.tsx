/**
 * Admin Users Page
 * Lists all platform users with wallet address, DID, subscription status
 */
"use client";

import { useState, useEffect, useCallback } from "react";

interface AdminUser {
    id: string;
    walletAddress: string;
    did: string | null;
    web3name: string | null;
    email: string | null;
    isAdmin: boolean;
    createdAt: string;
    subscription: {
        tier: string;
        expiresAt: string | null;
    } | null;
    _count: {
        templatesCreated: number;
        templatesOwned: number;
        breachReports: number;
        breachesAgainst: number;
    };
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set("search", searchQuery);
            params.set("page", page.toString());

            const response = await fetch(`/api/admin/users?${params}`);
            const data = await response.json();

            if (data.success) {
                setUsers(data.data);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, page]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const truncateAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">User Management</h1>
                    <p className="text-gray-400 mt-1">View and manage platform users</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                <input
                    type="text"
                    placeholder="Search by address, DID, or name..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                />
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                </div>
            )}

            {/* Users Table */}
            {!isLoading && (
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-700/50">
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                                    User
                                </th>
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                                    DID
                                </th>
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                                    Subscription
                                </th>
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                                    Templates
                                </th>
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                                    Breaches
                                </th>
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                                    Joined
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                {user.walletAddress.slice(2, 4).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-mono">
                                                    {truncateAddress(user.walletAddress)}
                                                </p>
                                                {user.isAdmin && (
                                                    <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.did ? (
                                            <span className="text-emerald-400 text-sm flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Linked
                                            </span>
                                        ) : (
                                            <span className="text-gray-500 text-sm">None</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                user.subscription?.tier === "POWER_USER"
                                                    ? "bg-purple-500/20 text-purple-400"
                                                    : "bg-gray-700/50 text-gray-400"
                                            }`}
                                        >
                                            {user.subscription?.tier || "FREE"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <span className="text-white">{user._count.templatesCreated}</span>
                                            <span className="text-gray-500"> created</span>
                                            <span className="text-gray-600 mx-1">·</span>
                                            <span className="text-white">{user._count.templatesOwned}</span>
                                            <span className="text-gray-500"> owned</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user._count.breachesAgainst > 0 ? (
                                            <span className="text-red-400 text-sm font-medium">
                                                {user._count.breachesAgainst} against
                                            </span>
                                        ) : (
                                            <span className="text-gray-500 text-sm">Clean</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-400 text-sm">
                                            {formatDate(user.createdAt)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {users.length === 0 && (
                        <div className="text-center py-12">
                            <svg
                                className="w-12 h-12 text-gray-600 mx-auto mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                            </svg>
                            <p className="text-gray-400">No users found.</p>
                        </div>
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
