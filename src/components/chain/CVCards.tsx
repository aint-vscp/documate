/**
 * CVCards Component
 * Renders blockchain reputation history from Proof of Contract transactions
 */
"use client";

import type { ProofOfContract, ReputationProfile } from "@/types";
import { formatBalance } from "@/lib/polkadot/assetHub";

interface CVCardsProps {
    profile: ReputationProfile | null;
    isLoading?: boolean;
}

export function CVCards({ profile, isLoading }: CVCardsProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-gray-800/50 rounded-xl p-6 animate-pulse"
                    >
                        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4" />
                        <div className="h-3 bg-gray-700 rounded w-2/3 mb-2" />
                        <div className="h-3 bg-gray-700 rounded w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    if (!profile || profile.contracts.length === 0) {
        return (
            <div className="bg-gray-800/30 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <h3 className="text-white font-semibold mb-2">No Contracts Yet</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                    Complete your first Proof of Contract payment to build your on-chain
                    professional reputation.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Total Earnings</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {formatBalance(profile.totalEarnings, 10, 2)}
                        <span className="text-pink-400 text-lg ml-1">$DOCU</span>
                    </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Completed Contracts</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {profile.contractCount}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Categories</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(profile.contractsByType).map(([type, count]) => (
                            <span
                                key={type}
                                className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full"
                            >
                                {type}: {count}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contract List */}
            <div className="space-y-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <svg
                        className="w-5 h-5 text-purple-400"
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
                    Contract History
                </h3>

                {profile.contracts.map((contract) => (
                    <ContractCard key={contract.transactionHash} contract={contract} />
                ))}
            </div>
        </div>
    );
}

function ContractCard({ contract }: { contract: ProofOfContract }) {
    const truncateHash = (hash: string) => {
        return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
    };

    const categoryColors: Record<string, string> = {
        WebDev: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        Design: "bg-pink-500/20 text-pink-300 border-pink-500/30",
        Legal: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        Engineering: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        Consulting: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    };

    const colorClass =
        categoryColors[contract.contractType] ||
        "bg-gray-500/20 text-gray-300 border-gray-500/30";

    return (
        <div className="bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700/50 rounded-xl p-4 transition-all duration-200 group">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${colorClass}`}
                        >
                            {contract.contractType}
                        </span>
                        <span className="text-gray-500 text-xs">
                            Block #{contract.blockNumber}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">From:</span>
                            <code className="text-gray-300 text-xs">
                                {truncateHash(contract.from)}
                            </code>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">Contract:</span>
                            <code className="text-purple-400 text-xs font-mono">
                                {truncateHash(contract.contractHash)}
                            </code>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-lg font-bold text-white">
                        +{formatBalance(contract.amount, 10, 2)}
                    </p>
                    <p className="text-pink-400 text-sm">$DOCU</p>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(contract.timestamp).toLocaleString()}</span>
                <a
                    href={`https://westend.subscan.io/extrinsic/${contract.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-purple-400 hover:text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    View on Explorer
                    <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                    </svg>
                </a>
            </div>
        </div>
    );
}

export default CVCards;
