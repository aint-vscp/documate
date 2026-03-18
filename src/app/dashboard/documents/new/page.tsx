"use client";

/**
 * New Document Page
 * Template selection and AI-powered document generation
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEVMWallet } from "@/hooks/useEVMWallet";
import { TemplateGallery } from "@/components/document/TemplateGallery";
import { DocumentEditor } from "@/components/document/DocumentEditor";
import {
    getAllTemplates,
    renderTemplate,
    validatePlaceholderValues,
    createDocument,
    syncDocumentToServer,
} from "@/lib/document";
import type { DocumentTemplate, PlaceholderField } from "@/types";

type Step = "select" | "fill" | "preview";

export default function NewDocumentPage() {
    const router = useRouter();
    const account = useEVMWallet((s) => s.account);
    const [step, setStep] = useState<Step>("select");
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
    const [receiverAddress, setReceiverAddress] = useState("");
    const [renderedContent, setRenderedContent] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [errors, setErrors] = useState<string[]>([]);

    const templates = getAllTemplates();

    const handleTemplateSelect = (template: DocumentTemplate) => {
        setSelectedTemplate(template);
        // Initialize placeholder values with defaults
        const defaults: Record<string, string> = {};
        template.placeholders.forEach((p) => {
            if (p.defaultValue) {
                defaults[p.key] = p.defaultValue;
            }
        });
        setPlaceholderValues(defaults);
        setStep("fill");
    };

    const handlePlaceholderChange = (key: string, value: string) => {
        setPlaceholderValues((prev) => ({ ...prev, [key]: value }));
    };

    const formalizeText = (raw: string): string => {
        const contractions: Record<string, string> = {
            "don't": "do not", "doesn't": "does not", "didn't": "did not",
            "can't": "cannot", "couldn't": "could not", "won't": "will not",
            "wouldn't": "would not", "shouldn't": "should not", "haven't": "have not",
            "hasn't": "has not", "hadn't": "had not", "isn't": "is not",
            "aren't": "are not", "wasn't": "was not", "weren't": "were not",
            "I'm": "I am", "I've": "I have", "I'll": "I will", "I'd": "I would",
            "you're": "you are", "you've": "you have", "you'll": "you will",
            "they're": "they are", "they've": "they have", "they'll": "they will",
            "we're": "we are", "we've": "we have", "we'll": "we will",
            "it's": "it is", "it'll": "it will", "that's": "that is",
            "there's": "there is", "here's": "here is", "let's": "let us",
        };
        const informal: Record<string, string> = {
            "\blike\b": "such as", "\bget\b": "obtain", "\bgot\b": "obtained",
            "\bgetting\b": "obtaining", "\bkid\b": "child", "\bkids\b": "children",
            "\bbig\b": "significant", "\bsmall\b": "minimal", "\bbuy\b": "purchase",
            "\bshow\b": "demonstrate", "\btell\b": "inform", "\bask\b": "request",
            "\bstart\b": "commence", "\bend\b": "conclude", "\bfix\b": "rectify",
            "\bcheck\b": "verify", "\blook at\b": "review", "\bwant\b": "require",
            "\bneed\b": "necessitate", "\buse\b": "utilize", "\bhelp\b": "assist",
        };

        let text = raw.trim();

        // Expand contractions (case-sensitive for I-forms, then lowercase)
        Object.entries(contractions).forEach(([from, to]) => {
            text = text.replace(new RegExp(from, "g"), to);
        });

        // Replace informal words
        Object.entries(informal).forEach(([pattern, replacement]) => {
            text = text.replace(new RegExp(pattern, "gi"), replacement);
        });

        // Capitalize first letter of each sentence
        text = text.replace(/(?:^|[.!?]\s+)([a-z])/g, (m) => m.toUpperCase());

        // Capitalize "I" standing alone
        text = text.replace(/\bi\b/g, "I");

        // Ensure ends with a period if there is content
        if (text && !/[.!?]$/.test(text)) text += ".";

        return text;
    };

    const handleAIAssist = () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        // Client-side grammar and formality analysis
        const refined = formalizeText(aiPrompt);
        // Populate the first unfilled text placeholder with the refined content
        if (selectedTemplate) {
            const firstEmpty = selectedTemplate.placeholders.find(
                (p) => (p.type === "text" || p.type === "textarea") && !placeholderValues[p.key]
            );
            if (firstEmpty) {
                setPlaceholderValues((prev) => ({ ...prev, [firstEmpty.key]: refined }));
            }
        }
        setAiPrompt(refined);
        setIsGenerating(false);
    };

    const handlePreview = () => {
        if (!selectedTemplate) return;

        // Validate required fields
        const validation = validatePlaceholderValues(selectedTemplate, placeholderValues);
        if (!validation.valid) {
            setErrors(validation.missing);
            return;
        }

        if (!receiverAddress.trim()) {
            setErrors(["Receiver wallet address is required"]);
            return;
        }

        if (account && receiverAddress.trim().toLowerCase() === account.toLowerCase()) {
            setErrors(["Receiver must be another Docu user address (not your own wallet)"]);
            return;
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(receiverAddress.trim())) {
            setErrors(["Receiver wallet address must be a valid EVM address"]);
            return;
        }

        setErrors([]);

        // Render the template
        const content = renderTemplate(selectedTemplate, placeholderValues);
        setRenderedContent(content);
        setStep("preview");
    };

    const handleCreate = async () => {
        if (!selectedTemplate || !account) return;

        // Create document instance
        const doc = createDocument({
            templateId: selectedTemplate.id,
            templateName: selectedTemplate.name,
            sender: account,
            receiver: receiverAddress,
            content: renderedContent,
            placeholderValues,
        });

        try {
            await syncDocumentToServer(doc);
        } catch {
            // Keep local document if shared sync fails.
        }

        // Navigate to document view
        router.push(`/dashboard/documents/${doc.id}`);
    };

    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <svg
                        className="w-8 h-8 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                    Connect Your Wallet
                </h2>
                <p className="text-gray-400 text-center max-w-md">
                    Connect your MetaMask wallet to create documents.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/dashboard/documents"
                        className="text-sm text-gray-400 hover:text-white flex items-center gap-1 mb-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back to Documents
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Create New Document</h1>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-2">
                    {(["select", "fill", "preview"] as const).map((s, i) => {
                        const stepOrder = { select: 0, fill: 1, preview: 2 } as const;
                        const isPast = stepOrder[s] < stepOrder[step];
                        return (
                        <React.Fragment key={s}>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s
                                        ? "bg-amber-500 text-white"
                                        : isPast
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-700 text-gray-400"
                                    }`}
                            >
                                {isPast ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    i + 1
                                )}
                            </div>
                            {i < 2 && (
                                <div
                                    className={`w-8 h-0.5 ${(step === "fill" && s === "select") ||
                                            step === "preview"
                                            ? "bg-green-600"
                                            : "bg-gray-700"
                                        }`}
                                />
                            )}
                        </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Step: Select Template */}
            {step === "select" && (
                <div>
                    <p className="text-gray-400 mb-6">
                        Choose a template to start creating your document
                    </p>
                    <TemplateGallery templates={templates} onSelect={handleTemplateSelect} />
                </div>
            )}

            {/* Step: Fill Details */}
            {step === "fill" && selectedTemplate && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Form */}
                    <div className="space-y-6">
                        {/* AI Assist */}
                        <div className="bg-black/50 rounded-xl border border-white/[0.08] p-4">
                            <h3 className="font-semibold text-white mb-1 text-sm mono-label">Text Analyzer</h3>
                            <p className="text-xs text-white/35 mb-3">
                                Type your draft below — the analyzer will correct grammar, expand contractions,
                                and rewrite to formal professional language.
                            </p>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="E.g., I want to create an NDA with ABC Corp for a 3-year software project..."
                                className="w-full px-4 py-3 rounded-lg bg-black border border-white/[0.08] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-colors resize-none text-sm"
                                rows={3}
                            />
                            <button
                                onClick={handleAIAssist}
                                disabled={isGenerating || !aiPrompt.trim()}
                                className="mt-3 w-full py-2.5 rounded-lg bg-cyan-400 text-black font-semibold text-sm hover:bg-cyan-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>Analyze &amp; Formalize</>
                                )}
                            </button>
                        </div>

                        {/* Receiver Address */}
                        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
                            <label className="block text-sm font-medium text-white mb-2">
                                Receiver Wallet Address *
                            </label>
                            <input
                                type="text"
                                value={receiverAddress}
                                onChange={(e) => setReceiverAddress(e.target.value)}
                                placeholder="0x..."
                                className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                The counterparty who will sign this document
                            </p>
                        </div>

                        {/* Placeholder Fields */}
                        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 space-y-4">
                            <h3 className="font-semibold text-white">Document Details</h3>
                            {selectedTemplate.placeholders.map((placeholder) => (
                                <PlaceholderInput
                                    key={placeholder.key}
                                    placeholder={placeholder}
                                    value={placeholderValues[placeholder.key] || ""}
                                    onChange={(value) => handlePlaceholderChange(placeholder.key, value)}
                                />
                            ))}
                        </div>

                        {/* Errors */}
                        {errors.length > 0 && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                <p className="text-red-400 font-medium mb-2">Missing required fields:</p>
                                <ul className="text-sm text-red-300 list-disc list-inside">
                                    {errors.map((error) => (
                                        <li key={error}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep("select")}
                                className="flex-1 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700/50 font-medium transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handlePreview}
                                className="flex-1 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
                            >
                                Preview Document
                            </button>
                        </div>
                    </div>

                    {/* Right: Live Preview */}
                    <div className="hidden lg:block">
                        <div className="sticky top-4">
                            <h3 className="font-semibold text-white mb-3">Live Preview</h3>
                            <div className="transform scale-90 origin-top">
                                <DocumentEditor
                                    title={selectedTemplate.name}
                                    content={renderTemplate(selectedTemplate, placeholderValues)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step: Preview */}
            {step === "preview" && selectedTemplate && (
                <div className="space-y-6">
                    <DocumentEditor title={selectedTemplate.name} content={renderedContent} />

                    {/* Actions */}
                    <div className="flex gap-3 max-w-md mx-auto">
                        <button
                            onClick={() => setStep("fill")}
                            className="flex-1 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700/50 font-medium transition-colors"
                        >
                            Edit
                        </button>
                        <button
                            onClick={handleCreate}
                            className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium transition-colors"
                        >
                            Create Document
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function PlaceholderInput({
    placeholder,
    value,
    onChange,
}: {
    placeholder: PlaceholderField;
    value: string;
    onChange: (value: string) => void;
}) {
    const inputClasses =
        "w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors";

    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                {placeholder.label}
                {placeholder.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {placeholder.type === "textarea" ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Enter ${placeholder.label.toLowerCase()}...`}
                    className={`${inputClasses} resize-none`}
                    rows={3}
                />
            ) : placeholder.type === "date" ? (
                <input
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={inputClasses}
                />
            ) : placeholder.type === "number" ? (
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Enter ${placeholder.label.toLowerCase()}...`}
                    className={inputClasses}
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Enter ${placeholder.label.toLowerCase()}...`}
                    className={`${inputClasses} ${placeholder.type === "address" ? "font-mono text-sm" : ""}`}
                />
            )}
        </div>
    );
}
