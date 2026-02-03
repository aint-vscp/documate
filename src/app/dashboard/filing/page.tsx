/**
 * DocuWriter Page
 * Split-screen interface: Template Gallery/Editor + AI Chat Sidebar
 * Privacy-first AI document drafting with DID auto-personalization
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useIsWalletConnected, useSelectedAccount } from "@/hooks/useWallet";
import { sendToTEE, checkTEEHealth } from "@/lib/polkadot/phala";
import { loadUserProfile } from "@/lib/polkadot/kilt";
import { FREE_TEMPLATES, getAllTemplates } from "@/lib/document/templateService";
import { TemplateGallery } from "@/components/document/TemplateGallery";
import { DocumentEditor } from "@/components/document/DocumentEditor";
import type { AIMessage, DocumentTemplate, UserProfile } from "@/types";

type ViewMode = "gallery" | "editor";

export default function DocuWriterPage() {
    const isConnected = useIsWalletConnected();
    const selectedAccount = useSelectedAccount();

    // View state
    const [viewMode, setViewMode] = useState<ViewMode>("gallery");
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [renderedContent, setRenderedContent] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // AI Chat state
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [teeStatus, setTeeStatus] = useState<{
        available: boolean;
        mode: string;
    } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mobile chat drawer state
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

    // User profile for DID personalization
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // Load user profile and TEE status on mount
    useEffect(() => {
        checkTEEHealth().then(setTeeStatus);
        const profile = loadUserProfile();
        setUserProfile(profile);
    }, []);

    // Auto-scroll chat to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /**
     * Extract DID credential data for easy access
     */
    const getDIDData = useCallback(() => {
        const credential = userProfile?.credentials?.[0]?.credentialSubject;
        return {
            name: credential?.name as string | undefined,
            role: credential?.role as string | undefined,
            skills: credential?.skills as string[] | undefined,
            bio: credential?.bio as string | undefined,
            did: userProfile?.did,
            web3name: userProfile?.web3name,
        };
    }, [userProfile]);

    /**
     * Auto-fill placeholders with DID data
     */
    const autoFillWithDID = useCallback((template: DocumentTemplate): Record<string, string> => {
        const values: Record<string, string> = {};
        const didData = getDIDData();

        template.placeholders.forEach((placeholder) => {
            // Set default values first
            if (placeholder.defaultValue) {
                values[placeholder.key] = placeholder.defaultValue;
            }

            const keyLower = placeholder.key.toLowerCase();

            // === NAME FIELDS ===
            // Your name / sender name / freelancer name / party_a
            if (
                (keyLower.includes("name") || keyLower.includes("sender")) &&
                !keyLower.includes("client") &&
                !keyLower.includes("other") &&
                !keyLower.includes("party_b") &&
                !keyLower.includes("receiver")
            ) {
                if (didData.name) {
                    values[placeholder.key] = didData.name;
                }
            }

            // Explicit freelancer/party_a matches
            if (keyLower === "freelancer_name" || keyLower === "party_a_name" || keyLower === "sender_name") {
                if (didData.name) {
                    values[placeholder.key] = didData.name;
                }
            }

            // === WALLET ADDRESS FIELDS ===
            if (
                (keyLower.includes("wallet") || keyLower.includes("address")) &&
                placeholder.type === "address" &&
                !keyLower.includes("client") &&
                !keyLower.includes("receiver") &&
                !keyLower.includes("party_b")
            ) {
                if (selectedAccount?.address) {
                    values[placeholder.key] = selectedAccount.address;
                }
            }

            // Explicit sender/freelancer wallet
            if (keyLower === "freelancer_wallet" || keyLower === "sender_wallet" || keyLower === "party_a_wallet") {
                if (selectedAccount?.address) {
                    values[placeholder.key] = selectedAccount.address;
                }
            }

            // === ROLE / TITLE FIELDS ===
            if (keyLower.includes("role") || keyLower.includes("title") || keyLower.includes("position")) {
                if (didData.role) {
                    values[placeholder.key] = didData.role;
                }
            }

            // === SKILLS / EXPERTISE FIELDS ===
            if (keyLower.includes("skill") || keyLower.includes("expertise") || keyLower.includes("specialization")) {
                if (didData.skills && didData.skills.length > 0) {
                    values[placeholder.key] = didData.skills.join(", ");
                }
            }

            // === BIO / DESCRIPTION FIELDS ===
            if (keyLower.includes("bio") || keyLower.includes("about") || keyLower.includes("description") || keyLower.includes("summary")) {
                if (didData.bio) {
                    values[placeholder.key] = didData.bio;
                }
            }

            // === SERVICE DESCRIPTION (combine role + skills) ===
            if (keyLower === "service_description" || keyLower === "services") {
                if (didData.role && didData.skills && didData.skills.length > 0) {
                    values[placeholder.key] = `Professional ${didData.role} services including: ${didData.skills.join(", ")}.`;
                } else if (didData.role) {
                    values[placeholder.key] = `Professional ${didData.role} services.`;
                }
            }

            // === DATE FIELDS ===
            if (placeholder.type === "date") {
                const today = new Date().toISOString().split("T")[0];
                // Start dates, effective dates, agreement dates
                if (keyLower.includes("effective") || keyLower.includes("agreement") || keyLower.includes("start") || keyLower.includes("invoice")) {
                    values[placeholder.key] = today;
                }
                // Due dates (default 30 days from now)
                if (keyLower.includes("due")) {
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 30);
                    values[placeholder.key] = dueDate.toISOString().split("T")[0];
                }
                // Deadline (default 14 days from now)
                if (keyLower.includes("deadline")) {
                    const deadline = new Date();
                    deadline.setDate(deadline.getDate() + 14);
                    values[placeholder.key] = deadline.toISOString().split("T")[0];
                }
            }

            // === DID / IDENTIFIER FIELDS ===
            if (keyLower.includes("did") || keyLower === "identifier") {
                if (didData.did) {
                    values[placeholder.key] = didData.did;
                }
            }

            // === WEB3 NAME FIELDS ===
            if (keyLower.includes("web3name") || keyLower.includes("w3n")) {
                if (didData.web3name) {
                    values[placeholder.key] = didData.web3name;
                }
            }
        });

        return values;
    }, [getDIDData, selectedAccount]);

    /**
     * Render template content with placeholder values
     */
    const renderContent = useCallback((template: DocumentTemplate, values: Record<string, string>): string => {
        let content = template.content;
        template.placeholders.forEach((placeholder) => {
            const value = values[placeholder.key] || `[${placeholder.label}]`;
            content = content.replace(new RegExp(`\\{\\{${placeholder.key}\\}\\}`, "g"), value);
        });
        return content;
    }, []);

    /**
     * Handle manual template selection from gallery
     */
    const handleTemplateSelect = useCallback((template: DocumentTemplate) => {
        setSelectedTemplate(template);
        const autoFilledValues = autoFillWithDID(template);
        const content = renderContent(template, autoFilledValues);
        setRenderedContent(content);
        setViewMode("editor");

        // Build auto-fill summary message
        const didData = getDIDData();
        const filledFields: string[] = [];
        if (didData.name) filledFields.push(`Name: ${didData.name}`);
        if (didData.role) filledFields.push(`Role: ${didData.role}`);
        if (didData.skills && didData.skills.length > 0) filledFields.push(`Skills: ${didData.skills.slice(0, 3).join(", ")}${didData.skills.length > 3 ? "..." : ""}`);
        if (selectedAccount?.address) filledFields.push(`Wallet: ${selectedAccount.address.slice(0, 8)}...${selectedAccount.address.slice(-6)}`);

        const autoFillSummary = filledFields.length > 0
            ? `\n\nAuto-filled from your DID:\n${filledFields.map(f => `- ${f}`).join("\n")}`
            : "";

        // Add AI message about the selection
        const assistantMessage: AIMessage = {
            id: Date.now().toString(),
            role: "assistant",
            content: `I've loaded the "${template.name}" template for you.${autoFillSummary}\n\nThe document is ready in the editor. Would you like me to make any changes?`,
            timestamp: new Date().toISOString(),
            isEncrypted: false,
        };
        setMessages((prev) => [...prev, assistantMessage]);
    }, [autoFillWithDID, renderContent, getDIDData, selectedAccount]);

    /**
     * Find template by keyword matching
     */
    const findTemplateByKeyword = useCallback((text: string): DocumentTemplate | null => {
        const textLower = text.toLowerCase();
        const allTemplates = getAllTemplates();

        // Direct keyword matches
        const keywordMap: Record<string, string[]> = {
            "nda-basic": ["nda", "non-disclosure", "confidential"],
            "freelance-agreement": ["freelance", "service agreement", "contractor", "freelancer"],
            "invoice-simple": ["invoice", "billing", "payment request"],
            "sow-technical": ["scope of work", "sow", "project scope"],
            "consulting-agreement": ["consulting", "consultant"],
        };

        for (const [templateId, keywords] of Object.entries(keywordMap)) {
            if (keywords.some((kw) => textLower.includes(kw))) {
                const found = allTemplates.find((t) => t.id === templateId);
                if (found) return found;
            }
        }

        // Fallback: search by template name/description
        return allTemplates.find(
            (t) =>
                t.name.toLowerCase().includes(textLower) ||
                t.description.toLowerCase().includes(textLower)
        ) || null;
    }, []);

    /**
     * Handle AI chat message send
     */
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: AIMessage = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
            timestamp: new Date().toISOString(),
            isEncrypted: true,
        };

        setMessages((prev) => [...prev, userMessage]);
        const userInput = input.trim();
        setInput("");
        setIsLoading(true);

        try {
            // Check if user is asking for a specific template
            const matchedTemplate = findTemplateByKeyword(userInput);

            if (matchedTemplate) {
                // Auto-load the matched template
                setSelectedTemplate(matchedTemplate);
                setIsGenerating(true);

                const autoFilledValues = autoFillWithDID(matchedTemplate);
                const content = renderContent(matchedTemplate, autoFilledValues);

                // Simulate a brief processing delay for UX
                await new Promise((resolve) => setTimeout(resolve, 800));

                setRenderedContent(content);
                setViewMode("editor");
                setIsGenerating(false);

                // Build detailed auto-fill summary
                const didData = getDIDData();
                const filledFields: string[] = [];
                if (didData.name) filledFields.push(`Name: ${didData.name}`);
                if (didData.role) filledFields.push(`Role: ${didData.role}`);
                if (didData.skills && didData.skills.length > 0) filledFields.push(`Skills: ${didData.skills.slice(0, 3).join(", ")}${didData.skills.length > 3 ? "..." : ""}`);
                if (didData.bio) filledFields.push(`Bio: ${didData.bio.slice(0, 50)}${didData.bio.length > 50 ? "..." : ""}`);
                if (selectedAccount?.address) filledFields.push(`Wallet: ${selectedAccount.address.slice(0, 8)}...${selectedAccount.address.slice(-6)}`);

                const autoFillSummary = filledFields.length > 0
                    ? `\n\nAuto-filled from your DID profile:\n${filledFields.map(f => `- ${f}`).join("\n")}`
                    : "\n\n(Set up your DID profile to enable auto-fill)";

                const assistantMessage: AIMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: `I found the perfect template for you: "${matchedTemplate.name}"!${autoFillSummary}\n\nThe document is now loaded in the editor. Would you like me to modify any sections?`,
                    timestamp: new Date().toISOString(),
                    isEncrypted: false,
                };
                setMessages((prev) => [...prev, assistantMessage]);
            } else {
                // No template match - use TEE for general AI response
                const response = await sendToTEE(userInput);

                const assistantMessage: AIMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: response.success
                        ? response.plainContent || "Response received."
                        : response.error || "An error occurred.",
                    timestamp: new Date().toISOString(),
                    isEncrypted: false,
                };
                setMessages((prev) => [...prev, assistantMessage]);
            }
        } catch {
            const errorMessage: AIMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Failed to process your request. Please try again.",
                timestamp: new Date().toISOString(),
                isEncrypted: false,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Reset to gallery view
     */
    const handleBackToGallery = () => {
        setViewMode("gallery");
        setSelectedTemplate(null);
        setRenderedContent("");
    };

    const quickPrompts = [
        "I need an NDA for my client",
        "Create a freelance contract",
        "Generate an invoice template",
        "Draft a scope of work",
    ];

    // Not connected state
    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6">
                    <svg
                        className="w-10 h-10 text-pink-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">DocuWriter</h2>
                <p className="text-gray-400 max-w-md">
                    Connect your wallet to access AI-powered document creation with automatic DID personalization.
                </p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                    {viewMode === "editor" && (
                        <button
                            onClick={handleBackToGallery}
                            className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl font-semibold text-white">DocuWriter</h2>
                        <p className="text-gray-400 text-sm">
                            {viewMode === "gallery"
                                ? "Select a template or chat with AI to create documents"
                                : selectedTemplate?.name || "Document Editor"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* DID Status Badge */}
                    {userProfile && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                            <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-xs text-green-400">DID Active</span>
                        </div>
                    )}
                    {/* TEE Status */}
                    {teeStatus && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-full">
                            <div className={`w-2 h-2 rounded-full ${teeStatus.available ? "bg-green-400" : "bg-yellow-400"} animate-pulse`} />
                            <span className="text-xs text-gray-400">
                                TEE: {teeStatus.mode === "mock" ? "Mock" : "Live"}
                            </span>
                        </div>
                    )}
                    {/* Mobile chat toggle */}
                    <button
                        onClick={() => setIsMobileChatOpen(true)}
                        className="lg:hidden p-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-white shadow-lg shadow-purple-500/25"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
                {/* Main Panel (Gallery or Editor) - 80-85% on desktop, 100% on mobile */}
                <div className="flex-1 lg:w-[82%] overflow-hidden">
                    {viewMode === "gallery" ? (
                        <div className="h-full overflow-y-auto pr-2">
                            <TemplateGallery
                                templates={getAllTemplates()}
                                onSelect={handleTemplateSelect}
                                showPrices={false}
                            />
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto">
                            <DocumentEditor
                                content={renderedContent}
                                title={selectedTemplate?.name}
                                isLoading={isGenerating}
                            />
                        </div>
                    )}
                </div>

                {/* AI Sidebar - Desktop (15-18% width) */}
                <div className="hidden lg:flex w-[18%] min-w-[280px] max-w-[360px] flex-col bg-gray-800/30 border border-gray-700/50 rounded-2xl overflow-hidden">
                    <AIChatPanel
                        messages={messages}
                        input={input}
                        setInput={setInput}
                        isLoading={isLoading}
                        onSend={handleSend}
                        quickPrompts={quickPrompts}
                        messagesEndRef={messagesEndRef}
                    />
                </div>
            </div>

            {/* Mobile Chat Drawer */}
            {isMobileChatOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileChatOpen(false)}
                    />
                    {/* Drawer */}
                    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-gray-900 border-l border-gray-700/50 flex flex-col animate-slide-in-right">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                            <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
                            <button
                                onClick={() => setIsMobileChatOpen(false)}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {/* Chat Content */}
                        <AIChatPanel
                            messages={messages}
                            input={input}
                            setInput={setInput}
                            isLoading={isLoading}
                            onSend={handleSend}
                            quickPrompts={quickPrompts}
                            messagesEndRef={messagesEndRef}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * AI Chat Panel Component
 * Reusable chat interface for both desktop sidebar and mobile drawer
 */
interface AIChatPanelProps {
    messages: AIMessage[];
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    onSend: () => void;
    quickPrompts: string[];
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

function AIChatPanel({
    messages,
    input,
    setInput,
    isLoading,
    onSend,
    quickPrompts,
    messagesEndRef,
}: AIChatPanelProps) {
    return (
        <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-medium text-sm mb-1">Ask me anything</h3>
                        <p className="text-gray-500 text-xs mb-4">
                            I can help you find templates and create documents.
                        </p>
                        <div className="flex flex-col gap-2 w-full">
                            {quickPrompts.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => setInput(prompt)}
                                    className="text-xs px-3 py-2 bg-gray-800/80 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors text-left"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[90%] rounded-xl px-3 py-2 ${
                                    msg.role === "user"
                                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                        : "bg-gray-800 text-gray-200"
                                }`}
                            >
                                {msg.role === "user" && msg.isEncrypted && (
                                    <div className="flex items-center gap-1 text-[10px] text-pink-200 mb-1">
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Encrypted
                                    </div>
                                )}
                                <div className="whitespace-pre-wrap text-xs leading-relaxed">
                                    {msg.content}
                                </div>
                                <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-pink-200" : "text-gray-500"}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-xl px-3 py-2">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100" />
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-700/50">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onSend()}
                        placeholder="Ask about documents..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                    <button
                        onClick={onSend}
                        disabled={isLoading || !input.trim()}
                        className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 text-center">
                    Messages processed via TEE
                </p>
            </div>
        </>
    );
}
