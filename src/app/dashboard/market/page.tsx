/**
 * DocuMarket Page
 * NFT Template Marketplace - connected to backend APIs
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useIsEVMConnected, useEVMAccount } from "@/hooks/useEVMWallet";
import { useDocuMateContract } from "@/hooks/useDocuMateContract";
import type { TemplateCategory } from "@/types";

interface MarketTemplate {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    royaltyPercent: number;
    ipfsCid: string;
    isVerified: boolean;
    salesCount: number;
    creator?: {
        walletAddress: string;
        did?: string | null;
    };
    _count?: {
        purchases: number;
    };
    isCreator?: boolean;
    alreadyOwned?: boolean;
}

type TxPhase = "idle" | "submitting" | "confirming" | "recording" | "confirmed" | "failed";

// Fallback templates shown when the DB is empty (for first-run experience)
const FALLBACK_TEMPLATES: MarketTemplate[] = [
    {
        id: "fallback-1",
        title: "Professional NDA Template",
        description:
            "A comprehensive Non-Disclosure Agreement suitable for business partnerships and client relationships.",
        category: "Legal",
        price: 50,
        royaltyPercent: 10,
        ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        isVerified: true,
        salesCount: 14,
        creator: { walletAddress: "0xA800416b8D59eeb320E0f2D374B5C55895345f15" },
    },
    {
        id: "fallback-2",
        title: "Software Development Contract",
        description:
            "Complete contract template for software development projects with milestone payments.",
        category: "Engineering",
        price: 75,
        royaltyPercent: 15,
        ipfsCid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
        isVerified: true,
        salesCount: 8,
        creator: { walletAddress: "0x1234567890abcdef1234567890abcdef12345678" },
    },
    {
        id: "fallback-3",
        title: "Freelance Design Agreement",
        description:
            "Template for graphic design, branding, and creative projects with revision clauses.",
        category: "Creative",
        price: 30,
        royaltyPercent: 8,
        ipfsCid: "QmZTR5bcpQD7cFgTorqxZDYaew1Wqgfbd2ud9QqGPAkK2V",
        isVerified: false,
        salesCount: 22,
        creator: { walletAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
    },
    {
        id: "fallback-4",
        title: "Partnership Agreement",
        description:
            "Comprehensive partnership agreement for joint ventures and business collaborations.",
        category: "Legal",
        price: 100,
        royaltyPercent: 12,
        ipfsCid: "QmNrgEMcUygbKzZeZgYFosdd27VE9KnWbyUD73bKZJ3bGi",
        isVerified: true,
        salesCount: 5,
        creator: { walletAddress: "0xA800416b8D59eeb320E0f2D374B5C55895345f15" },
    },
    {
        id: "fallback-5",
        title: "Technical Consulting SOW",
        description:
            "Scope of Work template for technical consulting and advisory services.",
        category: "Engineering",
        price: 45,
        royaltyPercent: 10,
        ipfsCid: "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB",
        isVerified: false,
        salesCount: 11,
        creator: { walletAddress: "0x1234567890abcdef1234567890abcdef12345678" },
    },
    {
        id: "fallback-6",
        title: "Content Creation Contract",
        description:
            "Template for content creators, writers, and social media managers.",
        category: "Creative",
        price: 25,
        royaltyPercent: 5,
        ipfsCid: "QmSgvgwxZGaBLq2WQWnyPqvBbTLKy6N8wFLhdyXvp2Qn5f",
        isVerified: false,
        salesCount: 37,
        creator: { walletAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
    },
];

const categories: (TemplateCategory | "All")[] = [
    "All",
    "Legal",
    "Creative",
    "Engineering",
];

const categoryColors: Record<TemplateCategory, string> = {
    Legal: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Creative: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    Engineering: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function MarketPage() {
    const isConnected = useIsEVMConnected();
    const account = useEVMAccount();
    const { executeTransaction, checkVerified } = useDocuMateContract();
    const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "All">("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [templates, setTemplates] = useState<MarketTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Debounce search input
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 300);
    };

    // Purchase modal state
    const [purchaseTarget, setPurchaseTarget] = useState<MarketTemplate | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseResult, setPurchaseResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    // Fetch templates from API
    const fetchTemplates = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCategory !== "All") params.set("category", selectedCategory);
            if (debouncedSearch) params.set("search", debouncedSearch);
            if (account) params.set("buyerAddress", account);

            const response = await fetch(`/api/market/templates?${params}`);
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                setTemplates(data.data);
            } else {
                // If no database templates yet, use fallback display templates
                setTemplates(FALLBACK_TEMPLATES);
            }
        } catch {
            // Fallback to display templates on fetch failure
            setTemplates(FALLBACK_TEMPLATES);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCategory, debouncedSearch, account]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // Client-side filtering for fallback templates
    const filteredTemplates = templates.filter((template) => {
        const matchesCategory =
            selectedCategory === "All" || template.category === selectedCategory;
        const matchesSearch =
            !searchQuery ||
            template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const [txStatus, setTxStatus] = useState<string | null>(null);
    const [txPhase, setTxPhase] = useState<TxPhase>("idle");
    const [lastTxHash, setLastTxHash] = useState<string | null>(null);

    const isOwnTemplate = useCallback(
        (template: MarketTemplate) => {
            if (!account || !template.creator?.walletAddress) return false;
            return template.creator.walletAddress.toLowerCase() === account.toLowerCase();
        },
        [account]
    );

    const isAlreadyOwnedTemplate = useCallback((template: MarketTemplate) => {
        return Boolean(template.alreadyOwned);
    }, []);

    const handlePurchase = async (template: MarketTemplate) => {
        if (!account) return;

        if (isOwnTemplate(template) || template.isCreator) {
            setPurchaseResult({
                success: false,
                message: "You cannot buy your own template NFT.",
            });
            return;
        }

        if (isAlreadyOwnedTemplate(template)) {
            setPurchaseResult({
                success: false,
                message: "You already own this template NFT.",
            });
            return;
        }

        if (!template.creator?.walletAddress) {
            setPurchaseResult({
                success: false,
                message: "Template creator wallet is unavailable. This listing cannot be purchased right now.",
            });
            return;
        }

        setIsPurchasing(true);
        setPurchaseResult(null);
        setTxStatus(null);
        setTxPhase("idle");
        setLastTxHash(null);

        try {
            const isVerified = await checkVerified(account);
            if (!isVerified) {
                setPurchaseResult({
                    success: false,
                    message: "Wallet DID is not verified for marketplace transactions yet. Please complete verification first.",
                });
                return;
            }

            // Step 1: Execute on-chain 75/20/5 split transaction
            const creatorAddress = template.creator.walletAddress;
            const pasAmount = (template.price / 1000).toString(); // Convert price to PAS (e.g. 50 DOCU = 0.05 PAS)

            setTxPhase("submitting");
            setTxStatus("Submitting wallet transaction...");
            const receipt = await executeTransaction(creatorAddress, pasAmount);
            const txHash = receipt?.hash || "";
            setLastTxHash(txHash || null);
            setTxPhase("confirming");
            setTxStatus("Transaction confirmed on-chain. Recording purchase...");

            // Step 2: Record purchase in database
            setTxPhase("recording");
            const response = await fetch("/api/market/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateId: template.id,
                    buyerAddress: account,
                    txHash,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setTxPhase("confirmed");
                setPurchaseResult({
                    success: true,
                    message: `Successfully purchased "${template.title}"! On-chain TX: ${txHash.slice(0, 10)}... Revenue split: 75% Creator, 20% Treasury, 5% Staking.`,
                });
                setTxStatus("Purchase finalized and synced.");
                fetchTemplates();
            } else {
                setTxPhase("failed");
                setPurchaseResult({
                    success: false,
                    message: data.error || "Purchase failed",
                });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Transaction failed";
            setTxPhase("failed");
            setPurchaseResult({
                success: false,
                message: message.includes("user rejected") ? "Transaction cancelled by user." : message,
            });
            setTxStatus(null);
        } finally {
            setIsPurchasing(false);
        }
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div className="space-y-6">
            <section className="surface-card p-6">
                <p className="mono-label text-xs text-cyan-200">Marketplace Engine</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">DocuMarket Live Purchase Flow</h2>
                <p className="mt-2 text-sm text-slate-300">
                    Browse templates and execute deterministic 75/20/5 settlement on-chain.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
                        <p className="mono-label text-[11px] text-slate-400">Templates</p>
                        <p className="mt-1 text-sm text-white font-medium">{filteredTemplates.length}</p>
                    </div>
                    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
                        <p className="mono-label text-[11px] text-slate-400">Wallet</p>
                        <p className="mt-1 text-sm text-white font-medium">{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not Connected"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
                        <p className="mono-label text-[11px] text-slate-400">Settlement Rule</p>
                        <p className="mt-1 text-sm text-orange-300 font-medium">75 / 20 / 5</p>
                    </div>
                </div>
            </section>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">DocuMarket</h1>
                    <p className="text-gray-400 mt-1">
                        Browse and purchase verified document templates as NFTs
                    </p>
                </div>
                <Link
                    href="/dashboard/studio"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                    </svg>
                    Create Template
                </Link>
            </div>

            {/* Revenue Split Banner */}
            <div className="surface-card p-4">
                <div className="flex items-center gap-6 flex-wrap">
                    <span className="text-gray-400 text-sm font-medium">
                        THE IRON RULES:
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-gray-300 text-sm">75% Creator</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-gray-300 text-sm">20% Treasury</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-gray-300 text-sm">5% Staking</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Category Tabs */}
                <div className="flex gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                                    : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                                }`}
                        >
                            {cat}
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
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                </div>
            )}

            {/* Template Grid */}
            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="group surface-card overflow-hidden hover:border-orange-500/30 transition-all duration-300"
                        >
                            {/* Preview Header */}
                            <div className="h-32 bg-gradient-to-br from-gray-700/50 to-gray-800/50 flex items-center justify-center relative">
                                <svg
                                    className="w-16 h-16 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <span
                                    className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full border ${categoryColors[template.category as TemplateCategory] ||
                                        "bg-gray-500/20 text-gray-300 border-gray-500/30"
                                        }`}
                                >
                                    {template.category}
                                </span>
                                {template.isVerified && (
                                    <span className="absolute top-3 left-3 flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Verified
                                    </span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="text-white font-semibold mb-2 group-hover:text-orange-400 transition-colors">
                                    {template.title}
                                </h3>
                                <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                                    {template.description}
                                </p>

                                {/* Sales Count */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xs text-gray-500">
                                        {template.salesCount || 0} sales
                                    </span>
                                </div>

                                {/* Creator & Price */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full" />
                                        <span className="text-gray-500 text-xs">
                                            {template.creator
                                                ? truncateAddress(template.creator.walletAddress)
                                                : "Unknown"}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">
                                            {template.price}{" "}
                                            <span className="text-orange-400 text-sm">$DOCU</span>
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            {template.royaltyPercent}% royalty
                                        </p>
                                    </div>
                                </div>

                                {/* Buy Button */}
                                {isConnected ? (
                                    isOwnTemplate(template) || template.isCreator ? (
                                        <button
                                            disabled
                                            className="w-full mt-4 py-2.5 bg-gray-800/70 text-gray-500 rounded-xl cursor-not-allowed font-medium"
                                        >
                                            Your Template
                                        </button>
                                    ) : isAlreadyOwnedTemplate(template) ? (
                                        <button
                                            disabled
                                            className="w-full mt-4 py-2.5 bg-gray-800/70 text-gray-500 rounded-xl cursor-not-allowed font-medium"
                                        >
                                            Already Owned
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setPurchaseTarget(template)}
                                            className="w-full mt-4 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-500 transition-all font-medium"
                                        >
                                            Buy License
                                        </button>
                                    )
                                ) : (
                                    <p className="text-center text-gray-500 text-sm mt-4">
                                        Connect wallet to purchase
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && filteredTemplates.length === 0 && (
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
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <p className="text-gray-400">No templates found matching your search.</p>
                </div>
            )}

            {/* Purchase Confirmation Modal */}
            {purchaseTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="surface-card p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">
                            Confirm Purchase
                        </h3>
                        <p className="text-gray-400 text-sm mb-6">
                            You are about to purchase &quot;{purchaseTarget.title}&quot;
                        </p>

                        {/* Revenue Split Display */}
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 mb-6 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total Price</span>
                                <span className="text-white font-bold">
                                    {purchaseTarget.price} $DOCU
                                </span>
                            </div>
                            <div className="border-t border-gray-700/50 pt-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-emerald-400">Creator (75%)</span>
                                    <span className="text-gray-300">
                                        {(purchaseTarget.price * 0.75).toFixed(2)} $DOCU
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-orange-400">Treasury (20%)</span>
                                    <span className="text-gray-300">
                                        {(purchaseTarget.price * 0.2).toFixed(2)} $DOCU
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-orange-400">Staking (5%)</span>
                                    <span className="text-gray-300">
                                        {(purchaseTarget.price * 0.05).toFixed(2)} $DOCU
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Result Message */}
                        {purchaseResult && (
                            <div
                                className={`p-3 rounded-xl text-sm mb-4 ${purchaseResult.success
                                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                        : "bg-red-500/10 border border-red-500/30 text-red-400"
                                    }`}
                            >
                                {purchaseResult.message}
                            </div>
                        )}

                        {(txStatus || lastTxHash) && (
                            <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-sm text-cyan-200">
                                {txStatus && <p>{txStatus}</p>}
                                {lastTxHash && (
                                    <a
                                        href={`https://blockscout-testnet.polkadot.io/tx/${lastTxHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 inline-block text-cyan-300 underline decoration-dotted underline-offset-4 hover:text-cyan-200"
                                    >
                                        View transaction on Blockscout
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            {!purchaseResult?.success && (
                                <button
                                    onClick={() => handlePurchase(purchaseTarget)}
                                    disabled={isPurchasing}
                                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isPurchasing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {txStatus && <span className="text-sm">{txStatus}</span>}
                                            {!txStatus && txPhase !== "idle" && <span className="text-sm">Processing...</span>}
                                        </>
                                    ) : (
                                        "Confirm Purchase"
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setPurchaseTarget(null);
                                    setPurchaseResult(null);
                                }}
                                className={`${purchaseResult?.success ? "flex-1" : ""
                                    } py-3 px-4 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors`}
                            >
                                {purchaseResult?.success ? "Close" : "Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
