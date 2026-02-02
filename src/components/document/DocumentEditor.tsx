"use client";

/**
 * Document Editor Component
 * Read-only document viewer styled like Google Docs
 * Users cannot edit - only AI can modify content
 */

import React from "react";

interface DocumentEditorProps {
    content: string;
    title?: string;
    isLoading?: boolean;
}

export function DocumentEditor({
    content,
    title,
    isLoading = false,
}: DocumentEditorProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse min-h-[600px]">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="space-y-3">
                    {[...Array(15)].map((_, i) => (
                        <div
                            key={i}
                            className="h-4 bg-gray-200 rounded"
                            style={{ width: `${Math.random() * 40 + 60}%` }}
                        ></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Document Header */}
            <div className="border-b border-gray-200 px-8 py-4 bg-gray-50">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {title || "Document Preview"}
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Read Only
                        </span>
                        <button
                            onClick={() => window.print()}
                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                            </svg>
                            Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Document Content */}
            <div
                className="px-12 py-10 min-h-[700px] max-h-[800px] overflow-y-auto"
                style={{
                    fontFamily: "'Times New Roman', serif",
                    fontSize: "14px",
                    lineHeight: "1.8",
                    color: "#1a1a1a",
                }}
            >
                <div className="max-w-[650px] mx-auto">
                    <div
                        className="document-content prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
                    />
                </div>
            </div>

            {/* Page Footer */}
            <div className="border-t border-gray-200 px-8 py-3 bg-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                    Powered by DocuMate • Blockchain Verified
                </span>
                <span className="text-xs text-gray-500">Page 1 of 1</span>
            </div>
        </div>
    );
}

/**
 * Simple Markdown to HTML parser
 * Handles headers, bold, italic, lists, tables, and horizontal rules
 */
function parseMarkdown(markdown: string): string {
    if (!markdown) return "";

    let html = markdown
        // Escape HTML
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        // Headers
        .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-4">$1</h1>')
        // Bold and Italic
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // Horizontal rules
        .replace(/^---$/gm, '<hr class="my-6 border-gray-300">')
        // Line breaks (double newline = paragraph)
        .replace(/\n\n/g, '</p><p class="mb-4">')
        // Single line breaks
        .replace(/\n/g, "<br>")
        // Lists
        .replace(
            /^- (.+)$/gm,
            '<li class="ml-4">$1</li>'
        );

    // Wrap in paragraph
    html = `<p class="mb-4">${html}</p>`;

    // Clean up empty paragraphs
    html = html.replace(/<p class="mb-4"><\/p>/g, "");

    return html;
}

export default DocumentEditor;
