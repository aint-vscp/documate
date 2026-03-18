"use client";

/**
 * Template Gallery Component
 * Displays free and purchased templates for document creation
 */

import React, { useState } from "react";
import type { DocumentTemplate, TemplateCategory } from "@/types";

interface TemplateGalleryProps {
    templates: DocumentTemplate[];
    onSelect: (template: DocumentTemplate) => void;
    showPrices?: boolean;
}

const CATEGORY_ICONS: Record<TemplateCategory, string> = {
    Legal: "⚖️",
    Creative: "🎨",
    Engineering: "⚙️",
};

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
    Legal: "from-blue-500 to-indigo-600",
    Creative: "from-orange-500 to-amber-500",
    Engineering: "from-green-500 to-emerald-600",
};

export function TemplateGallery({
    templates,
    onSelect,
    showPrices = true,
}: TemplateGalleryProps) {
    const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTemplates = templates.filter((template) => {
        const matchesCategory =
            selectedCategory === "all" || template.category === selectedCategory;
        const matchesSearch =
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categories: (TemplateCategory | "all")[] = ["all", "Legal", "Creative", "Engineering"];

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 pl-10 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                                    ? "bg-amber-500 text-white"
                                    : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                                }`}
                        >
                            {category === "all" ? "All" : `${CATEGORY_ICONS[category]} ${category}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No templates found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onSelect={onSelect}
                            showPrice={showPrices}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface TemplateCardProps {
    template: DocumentTemplate;
    onSelect: (template: DocumentTemplate) => void;
    showPrice?: boolean;
}

function TemplateCard({ template, onSelect, showPrice = true }: TemplateCardProps) {
    return (
        <div
            onClick={() => onSelect(template)}
            className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden cursor-pointer hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10"
        >
            {/* Category Badge */}
            <div
                className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${CATEGORY_COLORS[template.category]
                    } text-white`}
            >
                {CATEGORY_ICONS[template.category]} {template.category}
            </div>

            {/* Free Badge */}
            {template.isFree && (
                <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    FREE
                </div>
            )}

            {/* Content */}
            <div className="p-5 pt-12">
                <h3 className="font-semibold text-white mb-2 group-hover:text-amber-300 transition-colors">
                    {template.name}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                    {template.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{template.placeholders.length} fields</span>
                    {showPrice && !template.isFree && (
                        <span className="text-amber-400 font-medium">
                            {template.price} $DOCU
                        </span>
                    )}
                </div>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    Use Template
                </span>
            </div>
        </div>
    );
}

export default TemplateGallery;
