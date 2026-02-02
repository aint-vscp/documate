"use client";

/**
 * New Document Page
 * Template selection and AI-powered document generation
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { TemplateGallery } from "@/components/document/TemplateGallery";
import { DocumentEditor } from "@/components/document/DocumentEditor";
import {
    getAllTemplates,
    renderTemplate,
    validatePlaceholderValues,
    createDocument,
} from "@/lib/document";
import type { DocumentTemplate, PlaceholderField } from "@/types";

type Step = "select" | "fill" | "preview";

export default function NewDocumentPage() {
    const router = useRouter();
    const { selectedAccount } = useWallet();
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

    const handleAIAssist = async () => {
        if (!selectedTemplate || !aiPrompt.trim()) return;

        setIsGenerating(true);
        try {
            // Call AI API to fill placeholders
            const response = await fetch("/api/documents/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateId: selectedTemplate.id,
                    prompt: aiPrompt,
                    currentValues: placeholderValues,
                }),
            });

            const data = await response.json();
            if (data.success && data.values) {
                setPlaceholderValues((prev) => ({ ...prev, ...data.values }));
            }
        } catch (error) {
            console.error("AI assist failed:", error);
        } finally {
            setIsGenerating(false);
        }
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

        setErrors([]);

        // Render the template
        const content = renderTemplate(selectedTemplate, placeholderValues);
        setRenderedContent(content);
        setStep("preview");
    };

    const handleCreate = async () => {
        if (!selectedTemplate || !selectedAccount?.address) return;

        // Create document instance
        const doc = createDocument({
            templateId: selectedTemplate.id,
            templateName: selectedTemplate.name,
            sender: selectedAccount.address,
            receiver: receiverAddress,
            content: renderedContent,
            placeholderValues,
        });

        // Navigate to document view
        router.push(`/dashboard/documents/${doc.id}`);
    };

    if (!selectedAccount) {
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
                    Connect your Polkadot wallet to create documents.
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
                    {(["select", "fill", "preview"] as const).map((s, i) => (
                        <React.Fragment key={s}>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s
                                        ? "bg-purple-600 text-white"
                                        : s < step || (step === "preview" && s === "fill")
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-700 text-gray-400"
                                    }`}
                            >
                                {i + 1}
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
                    ))}
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
                        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30 p-4">
                            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                                <span className="text-lg">✨</span> AI Assistant
                            </h3>
                            <p className="text-sm text-gray-400 mb-3">
                                Describe your needs and let AI fill the details
                            </p>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="E.g., Create an NDA for a software development project with ABC Corp, 3-year duration..."
                                className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                                rows={3}
                            />
                            <button
                                onClick={handleAIAssist}
                                disabled={isGenerating || !aiPrompt.trim()}
                                className="mt-3 w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Generating...
                                    </>
                                ) : (
                                    <>Generate with AI</>
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
                                placeholder="5G..."
                                className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors font-mono text-sm"
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
                                className="flex-1 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
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
                            className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-colors"
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
        "w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors";

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
