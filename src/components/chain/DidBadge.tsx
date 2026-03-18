/**
 * DidBadge Component
 * Displays verified DID status with a visual badge
 */
"use client";

import { useState } from "react";
import type { UserProfile } from "@/types";

interface DidBadgeProps {
    profile: UserProfile | null;
    size?: "sm" | "md" | "lg";
    showDetails?: boolean;
}

export function DidBadge({
    profile,
    size = "md",
    showDetails = false,
}: DidBadgeProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const sizeClasses = {
        sm: "text-xs px-2 py-1",
        md: "text-sm px-3 py-1.5",
        lg: "text-base px-4 py-2",
    };

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-5 h-5",
    };

    if (!profile) {
        return (
            <div
                className={`inline-flex items-center gap-1.5 bg-gray-800 text-gray-400 rounded-full ${sizeClasses[size]}`}
            >
                <svg
                    className={iconSizes[size]}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                </svg>
                <span>No DID</span>
            </div>
        );
    }

    const truncateDid = (did: string) => {
        if (did.length <= 30) return did;
        return `${did.slice(0, 20)}...${did.slice(-8)}`;
    };

    const credentialCount = profile.credentials.length;

    return (
        <div className="relative">
            <button
                onClick={() => showDetails && setIsExpanded(!isExpanded)}
                className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 rounded-full ${sizeClasses[size]} hover:from-emerald-500/30 hover:to-teal-500/30 transition-all duration-200 ${showDetails ? "cursor-pointer" : ""}`}
            >
                <svg
                    className={iconSizes[size]}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        fillRule="evenodd"
                        d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                    />
                </svg>
                <span className="font-medium">Verified DID</span>
                {credentialCount > 0 && (
                    <span className="bg-emerald-500/30 px-1.5 py-0.5 rounded-full text-xs">
                        {credentialCount}
                    </span>
                )}
                {showDetails && (
                    <svg
                        className={`${iconSizes[size]} transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                )}
            </button>

            {showDetails && isExpanded && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                        <h3 className="text-white font-semibold mb-2">
                            Decentralized Identity
                        </h3>
                        <code className="text-emerald-400 text-xs break-all">
                            {truncateDid(profile.did)}
                        </code>
                    </div>

                    {profile.web3name && (
                        <div className="px-4 py-3 border-b border-gray-700">
                            <p className="text-gray-400 text-xs">web3name</p>
                            <p className="text-white font-medium">@{profile.web3name}</p>
                        </div>
                    )}

                    <div className="p-4">
                        <p className="text-gray-400 text-xs mb-2">
                            Credentials ({credentialCount})
                        </p>
                        {profile.credentials.map((cred, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 py-2 border-b border-gray-800 last:border-0"
                            >
                                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-amber-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-white text-sm">
                                        {cred.type[cred.type.length - 1]}
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        Issued: {new Date(cred.issuanceDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="px-4 py-3 bg-gray-800/50 text-center">
                        <p className="text-gray-500 text-xs">
                            Powered by KILT Protocol
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DidBadge;
