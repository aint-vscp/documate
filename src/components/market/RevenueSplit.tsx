"use client";

/**
 * Revenue Split Display Component
 * Shows the 75/20/5 split breakdown for marketplace transactions
 * 
 * THE IRON RULES (Hard-coded, matches smart contract):
 * - 75% → Creator
 * - 20% → DocuMate Treasury
 * - 5%  → Community Staking
 */

import { useState, useMemo } from "react";

// ============================================================
// CONSTANTS - THE IRON RULES
// ============================================================

const REVENUE_SPLIT = {
    CREATOR: 75,
    COMPANY: 20,
    STAKING: 5,
} as const;

// ============================================================
// TYPES
// ============================================================

interface RevenueSplitProps {
    /** Price in $DOCU tokens */
    price: number;
    /** Show detailed breakdown */
    detailed?: boolean;
    /** Show as compact inline */
    compact?: boolean;
    /** Custom class name */
    className?: string;
}

interface SplitBreakdown {
    creator: number;
    company: number;
    staking: number;
}

// ============================================================
// COMPONENT
// ============================================================

export function RevenueSplit({
    price,
    detailed = false,
    compact = false,
    className = "",
}: RevenueSplitProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate the split
    const split = useMemo((): SplitBreakdown => {
        const creator = (price * REVENUE_SPLIT.CREATOR) / 100;
        const company = (price * REVENUE_SPLIT.COMPANY) / 100;
        const staking = price - creator - company; // Remainder to ensure total matches
        return { creator, company, staking };
    }, [price]);

    // Compact version (inline display)
    if (compact) {
        return (
            <div className={`flex items-center gap-1 text-sm ${className}`}>
                <span className="text-gray-400">You earn:</span>
                <span className="font-semibold text-green-400">
                    {split.creator.toFixed(2)} $DOCU
                </span>
                <span className="text-gray-500">({REVENUE_SPLIT.CREATOR}%)</span>
            </div>
        );
    }

    // Detailed version (full breakdown card)
    if (detailed) {
        return (
            <div className={`bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 ${className}`}>
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Revenue Split
                </h3>

                {/* Visual Bar */}
                <div className="h-3 rounded-full overflow-hidden flex mb-4">
                    <div
                        className="bg-gradient-to-r from-green-400 to-emerald-500"
                        style={{ width: `${REVENUE_SPLIT.CREATOR}%` }}
                        title={`Creator: ${REVENUE_SPLIT.CREATOR}%`}
                    />
                    <div
                        className="bg-gradient-to-r from-pink-500 to-purple-600"
                        style={{ width: `${REVENUE_SPLIT.COMPANY}%` }}
                        title={`DocuMate: ${REVENUE_SPLIT.COMPANY}%`}
                    />
                    <div
                        className="bg-gradient-to-r from-orange-400 to-red-500"
                        style={{ width: `${REVENUE_SPLIT.STAKING}%` }}
                        title={`Staking: ${REVENUE_SPLIT.STAKING}%`}
                    />
                </div>

                {/* Breakdown Items */}
                <div className="space-y-2">
                    {/* Creator Share */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500" />
                            <span className="text-sm text-gray-300">You Earn</span>
                            <span className="text-xs text-gray-500">({REVENUE_SPLIT.CREATOR}%)</span>
                        </div>
                        <span className="font-semibold text-green-400">
                            {split.creator.toFixed(2)} $DOCU
                        </span>
                    </div>

                    {/* Company Share */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600" />
                            <span className="text-sm text-gray-300">Platform Fee</span>
                            <span className="text-xs text-gray-500">({REVENUE_SPLIT.COMPANY}%)</span>
                        </div>
                        <span className="font-medium text-gray-400">
                            {split.company.toFixed(2)} $DOCU
                        </span>
                    </div>

                    {/* Staking Share */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
                            <span className="text-sm text-gray-300">Token Staking</span>
                            <span className="text-xs text-gray-500">({REVENUE_SPLIT.STAKING}%)</span>
                        </div>
                        <span className="font-medium text-orange-400">
                            {split.staking.toFixed(2)} $DOCU
                        </span>
                    </div>
                </div>

                {/* Total */}
                <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Sale Price</span>
                    <span className="font-semibold text-white">{price.toFixed(2)} $DOCU</span>
                </div>
            </div>
        );
    }

    // Default version (expandable summary)
    return (
        <div className={`${className}`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:border-pink-500/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="text-left">
                        <p className="text-sm text-gray-400">Your Earnings</p>
                        <p className="text-lg font-semibold text-green-400">{split.creator.toFixed(2)} $DOCU</p>
                    </div>
                </div>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Expanded details */}
            {isExpanded && (
                <div className="mt-2 px-4 py-3 bg-gray-800/30 border border-gray-700/30 rounded-xl space-y-2 animate-fade-in">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Sale Price</span>
                        <span className="text-white">{price.toFixed(2)} $DOCU</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Platform Fee ({REVENUE_SPLIT.COMPANY}%)</span>
                        <span className="text-gray-400">-{split.company.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Token Staking ({REVENUE_SPLIT.STAKING}%)</span>
                        <span className="text-orange-400">-{split.staking.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-700/30 flex justify-between">
                        <span className="text-gray-300 font-medium">Net Earnings ({REVENUE_SPLIT.CREATOR}%)</span>
                        <span className="text-green-400 font-semibold">{split.creator.toFixed(2)} $DOCU</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// EARNINGS CALCULATOR (For Creator Studio)
// ============================================================

interface EarningsCalculatorProps {
    onPriceChange?: (price: number) => void;
    initialPrice?: number;
    className?: string;
}

export function EarningsCalculator({
    onPriceChange,
    initialPrice = 50,
    className = "",
}: EarningsCalculatorProps) {
    const [price, setPrice] = useState(initialPrice);

    const handlePriceChange = (newPrice: number) => {
        setPrice(newPrice);
        onPriceChange?.(newPrice);
    };

    const earnings = (price * REVENUE_SPLIT.CREATOR) / 100;

    return (
        <div className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-6 ${className}`}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Earnings Calculator
            </h3>

            {/* Price Input */}
            <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Set Your Price ($DOCU)</label>
                <div className="relative">
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => handlePriceChange(Number(e.target.value))}
                        min={1}
                        step={5}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-xl font-semibold focus:outline-none focus:border-pink-500 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">$DOCU</span>
                </div>
            </div>

            {/* Quick Price Buttons */}
            <div className="flex gap-2 mb-6">
                {[25, 50, 100, 250, 500].map((p) => (
                    <button
                        key={p}
                        onClick={() => handlePriceChange(p)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                            price === p
                                ? "bg-pink-500 text-white"
                                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                        }`}
                    >
                        ${p}
                    </button>
                ))}
            </div>

            {/* Earnings Display */}
            <div className="text-center py-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">You Earn Per Sale</p>
                <p className="text-4xl font-bold text-green-400">{earnings.toFixed(2)}</p>
                <p className="text-sm text-green-400/70">$DOCU ({REVENUE_SPLIT.CREATOR}% of {price})</p>
            </div>

            {/* Split Breakdown */}
            <div className="mt-4">
                <RevenueSplit price={price} detailed />
            </div>
        </div>
    );
}

export default RevenueSplit;
