/**
 * DocuMarket Page
 * NFT Template Marketplace
 */
"use client";

import { useState } from "react";
import { useIsWalletConnected } from "@/hooks/useWallet";
import type { TemplateNFT, TemplateCategory } from "@/types";

// Mock templates for MVP
const MOCK_TEMPLATES: TemplateNFT[] = [
    {
        id: "1",
        collectionId: "documate-templates",
        creator: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        price: 50,
        royaltyPercent: 10,
        ipfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        category: "Legal",
        metadata: {
            name: "Professional NDA Template",
            description:
                "A comprehensive Non-Disclosure Agreement suitable for business partnerships and client relationships.",
            version: "1.0.0",
            tags: ["NDA", "confidentiality", "legal"],
            createdAt: "2024-01-15T10:00:00Z",
        },
    },
    {
        id: "2",
        collectionId: "documate-templates",
        creator: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        price: 75,
        royaltyPercent: 15,
        ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
        category: "Engineering",
        metadata: {
            name: "Software Development Contract",
            description:
                "Complete contract template for software development projects with milestone payments.",
            version: "2.1.0",
            tags: ["software", "development", "milestones"],
            createdAt: "2024-02-20T14:30:00Z",
        },
    },
    {
        id: "3",
        collectionId: "documate-templates",
        creator: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
        price: 30,
        royaltyPercent: 8,
        ipfsHash: "QmZTR5bcpQD7cFgTorqxZDYaew1Wqgfbd2ud9QqGPAkK2V",
        category: "Creative",
        metadata: {
            name: "Freelance Design Agreement",
            description:
                "Template for graphic design, branding, and creative projects with revision clauses.",
            version: "1.2.0",
            tags: ["design", "creative", "freelance"],
            createdAt: "2024-03-10T09:15:00Z",
        },
    },
    {
        id: "4",
        collectionId: "documate-templates",
        creator: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        price: 100,
        royaltyPercent: 12,
        ipfsHash: "QmNrgEMcUygbKzZeZgYFosdd27VE9KnWbyUD73bKZJ3bGi",
        category: "Legal",
        metadata: {
            name: "Partnership Agreement",
            description:
                "Comprehensive partnership agreement for joint ventures and business collaborations.",
            version: "1.5.0",
            tags: ["partnership", "business", "joint-venture"],
            createdAt: "2024-01-28T16:45:00Z",
        },
    },
    {
        id: "5",
        collectionId: "documate-templates",
        creator: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        price: 45,
        royaltyPercent: 10,
        ipfsHash: "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB",
        category: "Engineering",
        metadata: {
            name: "Technical Consulting SOW",
            description:
                "Scope of Work template for technical consulting and advisory services.",
            version: "1.0.0",
            tags: ["consulting", "SOW", "technical"],
            createdAt: "2024-02-05T11:20:00Z",
        },
    },
    {
        id: "6",
        collectionId: "documate-templates",
        creator: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
        price: 25,
        royaltyPercent: 5,
        ipfsHash: "QmSgvgwxZGaBLq2WQWnyPqvBbTLKy6N8wFLhdyXvp2Qn5f",
        category: "Creative",
        metadata: {
            name: "Content Creation Contract",
            description:
                "Template for content creators, writers, and social media managers.",
            version: "1.1.0",
            tags: ["content", "writing", "social-media"],
            createdAt: "2024-03-15T08:00:00Z",
        },
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
    Creative: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    Engineering: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function MarketPage() {
    const isConnected = useIsWalletConnected();
    const [selectedCategory, setSelectedCategory] = useState<
        TemplateCategory | "All"
    >("All");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTemplates = MOCK_TEMPLATES.filter((template) => {
        const matchesCategory =
            selectedCategory === "All" || template.category === selectedCategory;
        const matchesSearch =
            template.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.metadata.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            template.metadata.tags.some((tag) =>
                tag.toLowerCase().includes(searchQuery.toLowerCase())
            );
        return matchesCategory && matchesSearch;
    });

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white">DocuMarket</h2>
                    <p className="text-gray-400 text-sm">
                        Browse and purchase professional document templates as NFTs
                    </p>
                </div>

                {isConnected && (
                    <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all text-sm font-medium flex items-center gap-2">
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Create Template
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search templates..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat
                                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                    <div
                        key={template.id}
                        className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl overflow-hidden hover:border-pink-500/30 transition-all duration-300"
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
                                className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full border ${categoryColors[template.category]}`}
                            >
                                {template.category}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <h3 className="text-white font-semibold mb-2 group-hover:text-pink-400 transition-colors">
                                {template.metadata.name}
                            </h3>
                            <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                                {template.metadata.description}
                            </p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mb-4">
                                {template.metadata.tags.slice(0, 3).map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            {/* Creator & Price */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full" />
                                    <span className="text-gray-500 text-xs">
                                        {truncateAddress(template.creator)}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-bold">
                                        {template.price}{" "}
                                        <span className="text-pink-400 text-sm">$DOCU</span>
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        {template.royaltyPercent}% royalty
                                    </p>
                                </div>
                            </div>

                            {/* Buy Button */}
                            {isConnected ? (
                                <button className="w-full mt-4 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 transition-all font-medium">
                                    Buy License
                                </button>
                            ) : (
                                <p className="text-center text-gray-500 text-sm mt-4">
                                    Connect wallet to purchase
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
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
        </div>
    );
}
