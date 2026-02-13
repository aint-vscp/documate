/**
 * Admin Templates Page
 * Lists all templates with verification status, sales, and creator info
 */
"use client";

import { useState, useEffect, useCallback } from "react";

interface AdminTemplate {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    isVerified: boolean;
    isListed: boolean;
    salesCount: number;
    totalRevenue: number;
    createdAt: string;
    creator: {
        walletAddress: string;
        did: string | null;
        web3name: string | null;
    };
    verification: {
        status: string;
        reviewedAt: string | null;
    } | null;
    _count: {
        purchases: number;
        owners: number;
    };
}

const CATEGORY_COLORS: Record<string, string> = {
    LEGAL: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    CREATIVE: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    ENGINEERING: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default function AdminTemplatesPage() {
    const [templates, setTemplates] = useState<AdminTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("ALL");
    const [filterVerified, setFilterVerified] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchTemplates = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set("search", searchQuery);
            if (filterCategory !== "ALL") params.set("category", filterCategory);
            if (filterVerified !== "all") params.set("verified", filterVerified);
            params.set("page", page.toString());

            const response = await fetch(`/api/admin/templates?${params}`);
            const data = await response.json();

            if (data.success) {
                setTemplates(data.data);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch templates:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, filterCategory, filterVerified, page]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

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
            <div>
                <h1 className="text-3xl font-bold text-white">Template Catalog</h1>
                <p className="text-gray-400 mt-1">
                    View and manage all marketplace templates
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Category Filter */}
                <div className="flex gap-2">
                    {["ALL", "LEGAL", "CREATIVE", "ENGINEERING"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => {
                                setFilterCategory(cat);
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                filterCategory === cat
                                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                    : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                            }`}
                        >
                            {cat === "ALL" ? "All" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                {/* Verification Filter */}
                <div className="flex gap-2">
                    {[
                        { value: "all", label: "All Status" },
                        { value: "true", label: "Verified" },
                        { value: "false", label: "Unverified" },
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                setFilterVerified(opt.value);
                                setPage(1);
                            }}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                filterVerified === opt.value
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="flex-1">
                    <div className="relative">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                </div>
            )}

            {/* Template Cards */}
            {!isLoading && (
                <div className="space-y-4">
                    {templates.length === 0 ? (
                        <div className="text-center py-12 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl">
                            <svg
                                className="w-12 h-12 text-gray-600 mx-auto mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-400">No templates found.</p>
                        </div>
                    ) : (
                        templates.map((template) => (
                            <div
                                key={template.id}
                                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-white">
                                                {template.title}
                                            </h3>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                                    CATEGORY_COLORS[template.category] ||
                                                    "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                                }`}
                                            >
                                                {template.category}
                                            </span>
                                            {template.isVerified && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs border border-emerald-500/30">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Verified
                                                </span>
                                            )}
                                            {!template.isListed && (
                                                <span className="px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded-full text-xs">
                                                    Unlisted
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-gray-400 text-sm line-clamp-1 mb-3">
                                            {template.description}
                                        </p>

                                        <div className="flex items-center gap-6 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500">Creator:</span>
                                                <span className="text-gray-300 font-mono">
                                                    {truncateAddress(template.creator.walletAddress)}
                                                </span>
                                                {template.creator.did && (
                                                    <span className="text-emerald-400 text-xs">(DID)</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500">Created:</span>
                                                <span className="text-gray-300">
                                                    {formatDate(template.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right space-y-2">
                                        <p className="text-xl font-bold text-white">
                                            {template.price}{" "}
                                            <span className="text-pink-400 text-sm">DOCU</span>
                                        </p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-gray-400">
                                                {template.salesCount} sales
                                            </span>
                                            <span className="text-emerald-400">
                                                ${template.totalRevenue.toFixed(0)} rev
                                            </span>
                                        </div>
                                        {template.verification && (
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded text-xs ${
                                                    template.verification.status === "APPROVED"
                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                        : template.verification.status === "PENDING"
                                                        ? "bg-yellow-500/20 text-yellow-400"
                                                        : template.verification.status === "REJECTED"
                                                        ? "bg-red-500/20 text-red-400"
                                                        : "bg-blue-500/20 text-blue-400"
                                                }`}
                                            >
                                                Verification: {template.verification.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
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
