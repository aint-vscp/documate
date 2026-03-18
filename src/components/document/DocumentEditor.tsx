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
                            className="text-xs text-amber-500 hover:text-amber-600 flex items-center gap-1"
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
 * Markdown to HTML parser
 * Handles headers, bold, italic, lists, tables, and horizontal rules
 */
function parseMarkdown(markdown: string): string {
    if (!markdown) return "";

    const lines = markdown.split("\n");
    const htmlParts: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Blank line
        if (line.trim() === "") {
            htmlParts.push("");
            i++;
            continue;
        }

        // Horizontal rule
        if (/^---+$/.test(line.trim())) {
            htmlParts.push('<hr class="my-6 border-gray-300">');
            i++;
            continue;
        }

        // Headers
        if (line.startsWith("### ")) {
            htmlParts.push(`<h3 class="text-lg font-semibold mt-6 mb-2">${inlineFormat(line.slice(4))}</h3>`);
            i++;
            continue;
        }
        if (line.startsWith("## ")) {
            htmlParts.push(`<h2 class="text-xl font-bold mt-8 mb-3">${inlineFormat(line.slice(3))}</h2>`);
            i++;
            continue;
        }
        if (line.startsWith("# ")) {
            htmlParts.push(`<h1 class="text-2xl font-bold mt-4 mb-4">${inlineFormat(line.slice(2))}</h1>`);
            i++;
            continue;
        }

        // Table detection: line contains | and next line is separator
        if (line.includes("|") && i + 1 < lines.length && /^\|?[\s\-:|]+\|/.test(lines[i + 1])) {
            const tableLines: string[] = [line];
            i++; // skip header
            i++; // skip separator
            while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
                tableLines.push(lines[i]);
                i++;
            }
            htmlParts.push(buildTable(tableLines));
            continue;
        }

        // Unordered list items
        if (/^[-*] /.test(line.trim())) {
            const listItems: string[] = [];
            while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
                listItems.push(lines[i].trim().replace(/^[-*] /, ""));
                i++;
            }
            htmlParts.push(`<ul class="list-disc ml-6 mb-4 space-y-1">${listItems.map(li => `<li>${inlineFormat(li)}</li>`).join("")}</ul>`);
            continue;
        }

        // Ordered list items
        if (/^\d+\.\s/.test(line.trim())) {
            const listItems: string[] = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
                listItems.push(lines[i].trim().replace(/^\d+\.\s/, ""));
                i++;
            }
            htmlParts.push(`<ol class="list-decimal ml-6 mb-4 space-y-1">${listItems.map(li => `<li>${inlineFormat(li)}</li>`).join("")}</ol>`);
            continue;
        }

        // Regular paragraph - collect consecutive non-empty, non-special lines
        const paraLines: string[] = [];
        while (
            i < lines.length &&
            lines[i].trim() !== "" &&
            !lines[i].startsWith("#") &&
            !/^---+$/.test(lines[i].trim()) &&
            !(lines[i].includes("|") && i + 1 < lines.length && /^\|?[\s\-:|]+\|/.test(lines[i + 1] || "")) &&
            !/^[-*] /.test(lines[i].trim()) &&
            !/^\d+\.\s/.test(lines[i].trim())
        ) {
            paraLines.push(lines[i]);
            i++;
        }
        if (paraLines.length > 0) {
            htmlParts.push(`<p class="mb-4">${paraLines.map(l => inlineFormat(l)).join("<br>")}</p>`);
        }
    }

    return htmlParts.join("\n");
}

/** Format inline markdown: bold, italic, inline code */
function inlineFormat(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">$1</code>')
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

/** Build an HTML table from markdown table lines (first = header, rest = body) */
function buildTable(rows: string[]): string {
    const parseCells = (row: string) =>
        row.split("|").map(c => c.trim()).filter(c => c !== "");

    const headerCells = parseCells(rows[0]);
    const bodyRows = rows.slice(1);

    let html = '<div class="overflow-x-auto mb-4"><table class="w-full border-collapse border border-gray-300 text-sm">';
    html += "<thead><tr>";
    for (const cell of headerCells) {
        html += `<th class="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold text-gray-700">${inlineFormat(cell)}</th>`;
    }
    html += "</tr></thead><tbody>";
    for (const row of bodyRows) {
        const cells = parseCells(row);
        html += "<tr>";
        for (let j = 0; j < headerCells.length; j++) {
            html += `<td class="border border-gray-300 px-4 py-2 text-gray-600">${inlineFormat(cells[j] || "")}</td>`;
        }
        html += "</tr>";
    }
    html += "</tbody></table></div>";
    return html;
}

export default DocumentEditor;
