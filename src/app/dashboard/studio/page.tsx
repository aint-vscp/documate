/**
 * Template Studio / Minting Page
 * Create and mint templates as NFTs on Asset Hub
 * 
 * PRD Reference:
 * - Creators define "Master Templates" with mandatory variable fields
 * - Minting: Creators pay a gas/storage fee ($5-$10) to tokenize the template
 */
"use client";

import { useState, useCallback, useRef, type ChangeEvent } from "react";
import { useIsEVMConnected, useEVMAccount } from "@/hooks/useEVMWallet";
import { WalletConnect } from "@/components/chain";
import { RevenueSplit } from "@/components/market";
import Link from "next/link";
import Image from "next/image";

type MintingStep = "create" | "preview" | "pricing" | "mint" | "success";
type TemplateCategory = "LEGAL" | "CREATIVE" | "ENGINEERING";

interface Placeholder {
    key: string;
    label: string;
    type: "text" | "date" | "number" | "address";
    required: boolean;
}

interface TemplateForm {
    title: string;
    description: string;
    category: TemplateCategory;
    content: string;
    placeholders: Placeholder[];
    price: number;
    requestVerification: boolean;
}

const CATEGORY_OPTIONS: {
    id: TemplateCategory;
    label: string;
    code: string;
    color: string
}[] = [
        { id: "LEGAL", label: "Legal", code: "LGL", color: "from-blue-500 to-indigo-600" },
        { id: "CREATIVE", label: "Creative", code: "CR8", color: "from-pink-500 to-purple-600" },
        { id: "ENGINEERING", label: "Engineering", code: "ENG", color: "from-green-500 to-emerald-600" },
    ];

const MINTING_FEE = 5; // $5 DOCU gas/storage fee
const VERIFICATION_FEE = 50; // $50 for "Blue Check" verification

export default function TemplateStudioPage() {
    const isConnected = useIsEVMConnected();
    const account = useEVMAccount();

    const [step, setStep] = useState<MintingStep>("create");
    const [isProcessing, setIsProcessing] = useState(false);
    const [mintError, setMintError] = useState<string | null>(null);
    const [mintedTemplateId, setMintedTemplateId] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement | null>(null);

    const [form, setForm] = useState<TemplateForm>({
        title: "",
        description: "",
        category: "LEGAL",
        content: "",
        placeholders: [],
        price: 50,
        requestVerification: false,
    });

    // Placeholder management
    const [newPlaceholder, setNewPlaceholder] = useState<Placeholder>({
        key: "",
        label: "",
        type: "text",
        required: true,
    });

    const addPlaceholder = useCallback(() => {
        if (!newPlaceholder.key || !newPlaceholder.label) return;

        setForm(prev => ({
            ...prev,
            placeholders: [...prev.placeholders, { ...newPlaceholder }],
        }));
        setNewPlaceholder({ key: "", label: "", type: "text", required: true });
    }, [newPlaceholder]);

    const removePlaceholder = useCallback((key: string) => {
        setForm(prev => ({
            ...prev,
            placeholders: prev.placeholders.filter(p => p.key !== key),
        }));
    }, []);

    const appendToContent = useCallback((text: string) => {
        setForm(prev => ({
            ...prev,
            content: prev.content.trimEnd() ? `${prev.content.trimEnd()}\n\n${text}` : text,
        }));
    }, []);

    const handleInsertHeading = useCallback(() => {
        appendToContent("## Section Title\nAdd your clause details here.");
    }, [appendToContent]);

    const handleInsertClause = useCallback(() => {
        appendToContent("### Clause\n1. Add your first obligation.\n2. Add your second obligation.");
    }, [appendToContent]);

    const handleInsertSignatureBlock = useCallback(() => {
        appendToContent("---\n\nSigned by {{party_a_name}}\nDate: {{effective_date}}\n\nSigned by {{party_b_name}}\nDate: {{effective_date}}");
    }, [appendToContent]);

    const handleImageUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setMintError("Only image files can be inserted into templates.");
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMintError("Image too large. Please use an image smaller than 5MB.");
            event.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === "string" ? reader.result : "";
            if (!result) {
                setMintError("Failed to load image. Please try again.");
                return;
            }

            appendToContent(`![${file.name}](${result})`);
            setMintError(null);
        };

        reader.onerror = () => {
            setMintError("Failed to read the selected image.");
        };

        reader.readAsDataURL(file);
        event.target.value = "";
    }, [appendToContent]);

    const previewLines = form.content.split("\n");

    // Extract placeholders from content
    const detectPlaceholders = useCallback(() => {
        const regex = /\{\{(\w+)\}\}/g;
        const matches = [...form.content.matchAll(regex)];
        const detected: Placeholder[] = matches.map(match => ({
            key: match[1],
            label: match[1].replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
            type: "text",
            required: true,
        }));

        // Merge with existing, keeping user configurations
        const existingKeys = new Set(form.placeholders.map(p => p.key));
        const newPlaceholders = detected.filter(p => !existingKeys.has(p.key));

        setForm(prev => ({
            ...prev,
            placeholders: [...prev.placeholders, ...newPlaceholders],
        }));
    }, [form.content, form.placeholders]);

    // Calculate total costs
    const totalCost = MINTING_FEE + (form.requestVerification ? VERIFICATION_FEE : 0);

    // Handle minting - calls the mint API
    const handleMint = async () => {
        if (!account) return;
        setIsProcessing(true);
        setMintError(null);

        try {
            // Call the mint API to create the template in the database
            const mintResponse = await fetch("/api/market/mint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    category: form.category,
                    content: form.content,
                    price: form.price,
                    placeholders: form.placeholders,
                    creatorAddress: account,
                }),
            });

            const mintData = await mintResponse.json();

            if (!mintData.success) {
                throw new Error(mintData.error || "Minting failed");
            }

            const templateId = mintData.data.templateId;
            setMintedTemplateId(templateId);

            // If verification requested, submit to verification queue
            if (form.requestVerification) {
                await fetch("/api/verification/submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        templateId,
                        creatorAddress: account,
                        feePaid: VERIFICATION_FEE,
                    }),
                });
            }

            setStep("success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Minting failed. Please try again.";
            setMintError(message);
            console.error("Minting failed:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Not connected view
    if (!isConnected) {
        return (
            <div className="flex items-center justify-center p-6">
                <div className="surface-card text-center max-w-md p-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Template Studio</h1>
                    <p className="text-gray-400 mb-6">
                        Connect your wallet to create and mint templates as NFTs.
                    </p>
                    <WalletConnect />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="surface-card p-6 mb-8">
                    <Link href="/dashboard/market" className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Market
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Template Studio</h1>
                    <p className="text-gray-400 mt-1">Create and mint your templates as NFTs</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                    {(["create", "preview", "pricing", "mint", "success"] as MintingStep[]).map((s, i) => {
                        const isActive = step === s;
                        const isPast = ["create", "preview", "pricing", "mint", "success"].indexOf(step) > i;

                        return (
                            <div key={s} className="flex items-center">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${isActive
                                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                        : isPast
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "bg-gray-800 text-gray-500"
                                    }`}>
                                    {isPast ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        i + 1
                                    )}
                                </div>
                                <span className={`ml-2 text-sm ${isActive ? "text-white" : "text-gray-500"}`}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </span>
                                {i < 4 && (
                                    <div className={`w-12 h-0.5 mx-3 ${isPast ? "bg-emerald-500" : "bg-gray-700"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Step 1: Create */}
                {step === "create" && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="surface-card p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Template Title</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g., Professional NDA Template"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Describe what this template is for..."
                                        rows={3}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Category</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {CATEGORY_OPTIONS.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setForm(prev => ({ ...prev, category: cat.id }))}
                                                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${form.category === cat.id
                                                        ? `bg-gradient-to-br ${cat.color} border-transparent text-white`
                                                        : "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600"
                                                    }`}
                                            >
                                                <span className="text-xs font-semibold px-2 py-1 rounded-md bg-black/20 border border-white/20">{cat.code}</span>
                                                <span className="font-medium">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="surface-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Template Content</h2>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={detectPlaceholders}
                                        className="text-sm text-pink-400 hover:text-pink-300"
                                    >
                                        Detect Placeholders
                                    </button>
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        className="text-sm px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700"
                                    >
                                        Add Image
                                    </button>
                                </div>
                            </div>

                            <p className="text-gray-400 text-sm mb-4">
                                Use {`{{placeholder_name}}`} syntax for variable fields. Example: {`{{client_name}}`}, {`{{effective_date}}`}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <button
                                    onClick={handleInsertHeading}
                                    className="text-xs px-3 py-1.5 rounded-md bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700"
                                >
                                    Insert Heading
                                </button>
                                <button
                                    onClick={handleInsertClause}
                                    className="text-xs px-3 py-1.5 rounded-md bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700"
                                >
                                    Insert Clause List
                                </button>
                                <button
                                    onClick={handleInsertSignatureBlock}
                                    className="text-xs px-3 py-1.5 rounded-md bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700"
                                >
                                    Insert Signature Block
                                </button>
                            </div>

                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />

                            <textarea
                                value={form.content}
                                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                                placeholder={`NON-DISCLOSURE AGREEMENT\n\nThis Agreement is entered into as of {{effective_date}} between:\n\nParty A: {{party_a_name}}\nParty B: {{party_b_name}}\n\n...`}
                                rows={15}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-pink-500 focus:outline-none resize-y leading-7"
                            />
                            <p className="mt-3 text-xs text-gray-500">
                                Tip: uploaded images are embedded directly into your template. Keep visuals lightweight for faster loading.
                            </p>
                        </div>

                        {/* Placeholders */}
                        <div className="surface-card p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Placeholders</h2>

                            {/* Detected/Added Placeholders */}
                            {form.placeholders.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    {form.placeholders.map((p) => (
                                        <div
                                            key={p.key}
                                            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                <code className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-sm">
                                                    {`{{${p.key}}}`}
                                                </code>
                                                <span className="text-gray-300">{p.label}</span>
                                                <span className="text-gray-500 text-xs px-2 py-0.5 bg-gray-700/50 rounded">
                                                    {p.type}
                                                </span>
                                                {p.required && (
                                                    <span className="text-red-400 text-xs">required</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removePlaceholder(p.key)}
                                                className="text-gray-500 hover:text-red-400"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add new placeholder */}
                            <div className="flex items-end gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">Key</label>
                                    <input
                                        type="text"
                                        value={newPlaceholder.key}
                                        onChange={(e) => setNewPlaceholder(prev => ({ ...prev, key: e.target.value.toLowerCase().replace(/\s/g, "_") }))}
                                        placeholder="client_name"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">Label</label>
                                    <input
                                        type="text"
                                        value={newPlaceholder.label}
                                        onChange={(e) => setNewPlaceholder(prev => ({ ...prev, label: e.target.value }))}
                                        placeholder="Client Name"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                                    <select
                                        value={newPlaceholder.type}
                                        onChange={(e) => setNewPlaceholder(prev => ({ ...prev, type: e.target.value as Placeholder["type"] }))}
                                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                                    >
                                        <option value="text">Text</option>
                                        <option value="date">Date</option>
                                        <option value="number">Number</option>
                                        <option value="address">Address</option>
                                    </select>
                                </div>
                                <button
                                    onClick={addPlaceholder}
                                    disabled={!newPlaceholder.key || !newPlaceholder.label}
                                    className="px-4 py-2 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={() => setStep("preview")}
                            disabled={!form.title || !form.content}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue to Preview
                        </button>
                    </div>
                )}

                {/* Step 2: Preview */}
                {step === "preview" && (
                    <div className="space-y-6">
                        <div className="surface-card p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Preview Your Template</h2>

                            <div className="flex items-start gap-4 mb-6">
                                <div className={`w-16 h-16 bg-gradient-to-br ${CATEGORY_OPTIONS.find(c => c.id === form.category)?.color} rounded-xl flex items-center justify-center`}>
                                    <span className="text-3xl">
                                        {CATEGORY_OPTIONS.find(c => c.id === form.category)?.code}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{form.title}</h3>
                                    <p className="text-gray-400 mt-1">{form.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">
                                            {form.category}
                                        </span>
                                        <span className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">
                                            {form.placeholders.length} variables
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 max-h-[32rem] overflow-y-auto space-y-3">
                                {previewLines.map((line, index) => {
                                    const imageMatch = line.match(/^!\[(.*?)\]\((.+)\)$/);
                                    if (imageMatch) {
                                        const [, alt, src] = imageMatch;
                                        return (
                                            <div key={`img-${index}`} className="inline-block rounded-lg border border-gray-700/60 overflow-hidden">
                                                <Image
                                                    src={src}
                                                    alt={alt || "Template image"}
                                                    width={720}
                                                    height={400}
                                                    unoptimized
                                                    className="h-auto max-h-72 w-auto"
                                                />
                                            </div>
                                        );
                                    }

                                    if (line.startsWith("## ")) {
                                        return <h3 key={`h2-${index}`} className="text-lg font-semibold text-white">{line.replace(/^##\s*/, "")}</h3>;
                                    }

                                    if (line.startsWith("### ")) {
                                        return <h4 key={`h3-${index}`} className="text-base font-semibold text-gray-100">{line.replace(/^###\s*/, "")}</h4>;
                                    }

                                    if (!line.trim()) {
                                        return <div key={`spacer-${index}`} className="h-2" />;
                                    }

                                    return <p key={`p-${index}`} className="text-gray-300 text-sm whitespace-pre-wrap">{line}</p>;
                                })}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep("create")}
                                className="flex-1 py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                            >
                                Back to Edit
                            </button>
                            <button
                                onClick={() => setStep("pricing")}
                                className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                            >
                                Set Pricing
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Pricing */}
                {step === "pricing" && (
                    <div className="space-y-6">
                        <div className="surface-card p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Set Your Price</h2>

                            <div className="mb-6">
                                <label className="block text-sm text-gray-400 mb-2">Listing Price ($DOCU)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={(e) => setForm(prev => ({ ...prev, price: Math.max(1, parseInt(e.target.value) || 0) }))}
                                        min={1}
                                        max={10000}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-4 text-2xl font-bold text-white focus:border-pink-500 focus:outline-none"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">$DOCU</span>
                                </div>
                            </div>

                            {/* Revenue Split Preview */}
                            <RevenueSplit price={form.price} detailed />
                        </div>

                        {/* Verification Option */}
                        <div className="surface-card p-6">
                            <label className="flex items-start gap-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.requestVerification}
                                    onChange={(e) => setForm(prev => ({ ...prev, requestVerification: e.target.checked }))}
                                    className="mt-1 w-5 h-5 accent-pink-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-white">Request &quot;Blue Check&quot; Verification</span>
                                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">+${VERIFICATION_FEE}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Verified templates sell 3-5x more. Your template will be reviewed by our legal team for accuracy and quality.
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep("preview")}
                                className="flex-1 py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep("mint")}
                                className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                            >
                                Review &amp; Mint
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Mint */}
                {step === "mint" && (
                    <div className="space-y-6">
                        <div className="surface-card p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Confirm Minting</h2>

                            {/* Summary */}
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Template</span>
                                    <span className="text-white font-medium">{form.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Category</span>
                                    <span className="text-white">{form.category}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Listing Price</span>
                                    <span className="text-white font-medium">{form.price} $DOCU</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Your Earnings (75%)</span>
                                    <span className="text-emerald-400 font-medium">{(form.price * 0.75).toFixed(2)} $DOCU per sale</span>
                                </div>
                            </div>

                            <hr className="border-gray-700/50 my-4" />

                            {/* Costs */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Minting Fee</span>
                                    <span className="text-white">{MINTING_FEE} $DOCU</span>
                                </div>
                                {form.requestVerification && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Verification Fee</span>
                                        <span className="text-white">{VERIFICATION_FEE} $DOCU</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold">
                                    <span className="text-white">Total Cost</span>
                                    <span className="text-pink-400">{totalCost} $DOCU</span>
                                </div>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-yellow-400 text-sm">
                                    This action will mint your template as an NFT on Asset Hub.
                                    The content will be encrypted and stored on IPFS.
                                </p>
                            </div>
                        </div>

                        {mintError && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-red-400 text-sm">{mintError}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep("pricing")}
                                disabled={isProcessing}
                                className="flex-1 py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleMint}
                                disabled={isProcessing}
                                className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Minting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Mint Template ({totalCost} $DOCU)
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Success */}
                {step === "success" && (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Template Minted!</h1>
                        <p className="text-gray-400 mb-6">
                            Your template is now live on DocuMarket
                        </p>

                        {mintedTemplateId && (
                            <p className="text-gray-500 text-sm mb-8 font-mono">
                                Template ID: {mintedTemplateId}
                            </p>
                        )}

                        {form.requestVerification && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-6">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-blue-400 text-sm">Verification request submitted</span>
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <Link
                                href="/dashboard/market"
                                className="px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
                            >
                                View in Market
                            </Link>
                            <button
                                onClick={() => {
                                    setStep("create");
                                    setForm({
                                        title: "",
                                        description: "",
                                        category: "LEGAL",
                                        content: "",
                                        placeholders: [],
                                        price: 50,
                                        requestVerification: false,
                                    });
                                    setMintedTemplateId(null);
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                            >
                                Create Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
