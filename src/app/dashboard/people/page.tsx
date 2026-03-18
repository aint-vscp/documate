"use client";

import { useEffect, useMemo, useState } from "react";

interface DirectoryEntry {
    walletAddress: string;
    did: string | null;
    displayName: string;
    role: string;
    bio: string;
    entityType: "FREELANCER" | "HIRING_COMPANY" | "SERVICE_COMPANY" | "INDIVIDUAL";
    engagementType: "SEEKING_WORK" | "HIRING" | "BOTH";
    skills: string[];
    tags: string[];
    updatedAt: string;
}

const ENTITY_OPTIONS = [
    { value: "", label: "All Entities" },
    { value: "FREELANCER", label: "Freelancers" },
    { value: "HIRING_COMPANY", label: "Hiring Companies" },
    { value: "SERVICE_COMPANY", label: "Companies for Hire" },
    { value: "INDIVIDUAL", label: "Individuals" },
] as const;

const ENGAGEMENT_OPTIONS = [
    { value: "", label: "All Intent" },
    { value: "SEEKING_WORK", label: "Seeking Work" },
    { value: "HIRING", label: "Hiring" },
    { value: "BOTH", label: "Both" },
] as const;

function badgeLabel(entry: DirectoryEntry): string {
    if (entry.entityType === "HIRING_COMPANY") return "Hiring Company";
    if (entry.entityType === "SERVICE_COMPANY") return "Company for Hire";
    if (entry.entityType === "FREELANCER") return "Freelancer";
    return "Individual";
}

export default function PeopleDirectoryPage() {
    const [query, setQuery] = useState("");
    const [entityType, setEntityType] = useState("");
    const [engagementType, setEngagementType] = useState("");
    const [results, setResults] = useState<DirectoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const searchParams = useMemo(() => {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (entityType) params.set("entityType", entityType);
        if (engagementType) params.set("engagementType", engagementType);
        return params.toString();
    }, [engagementType, entityType, query]);

    useEffect(() => {
        let isMounted = true;

        const runSearch = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/directory/search?${searchParams}`, {
                    method: "GET",
                    cache: "no-store",
                });
                const payload = await response.json();

                if (!isMounted) return;
                if (response.ok && Array.isArray(payload?.data)) {
                    setResults(payload.data as DirectoryEntry[]);
                } else {
                    setResults([]);
                }
            } catch {
                if (!isMounted) return;
                setResults([]);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        runSearch();

        return () => {
            isMounted = false;
        };
    }, [searchParams]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">People and Companies</h1>
                <p className="text-gray-400 mt-1">Search freelancers, hiring companies, and service firms by role, skills, tags, and intent.</p>
            </div>

            <div className="surface-card p-4 grid md:grid-cols-4 gap-3">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, role, skills, tags..."
                    className="md:col-span-2 w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
                <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    aria-label="Filter by entity type"
                    title="Filter by entity type"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                >
                    {ENTITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <select
                    value={engagementType}
                    onChange={(e) => setEngagementType(e.target.value)}
                    aria-label="Filter by engagement intent"
                    title="Filter by engagement intent"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                >
                    {ENGAGEMENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                </div>
            ) : results.length === 0 ? (
                <div className="surface-card p-10 text-center">
                    <p className="text-gray-400">No matching profiles found.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {results.map((entry) => (
                        <div key={entry.walletAddress} className="surface-card p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-white font-semibold">{entry.displayName || `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`}</h3>
                                    <p className="text-sm text-gray-400 mt-0.5">{entry.role || "No role set"}</p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                    {badgeLabel(entry)}
                                </span>
                            </div>

                            <p className="text-sm text-gray-400 mt-3 line-clamp-2">{entry.bio || "No bio provided."}</p>

                            {entry.skills.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {entry.skills.slice(0, 6).map((skill) => (
                                        <span key={skill} className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">{skill}</span>
                                    ))}
                                </div>
                            )}

                            {entry.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {entry.tags.slice(0, 6).map((tag) => (
                                        <span key={tag} className="neon-tag text-[11px]">{tag}</span>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-500">
                                <span>{entry.engagementType.replace("_", " ")}</span>
                                <span className="font-mono">{entry.walletAddress.slice(0, 8)}...{entry.walletAddress.slice(-6)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
