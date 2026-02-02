/**
 * AI Co-Pilot Page
 * Privacy-first AI document drafting (TEE mock for MVP)
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { useIsWalletConnected } from "@/hooks/useWallet";
import { sendToTEE, checkTEEHealth } from "@/lib/polkadot/phala";
import type { AIMessage } from "@/types";

export default function FilingPage() {
    const isConnected = useIsWalletConnected();
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [teeStatus, setTeeStatus] = useState<{
        available: boolean;
        mode: string;
    } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Check TEE health on mount
    useEffect(() => {
        checkTEEHealth().then(setTeeStatus);
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
        setInput("");
        setIsLoading(true);

        try {
            const response = await sendToTEE(input.trim());

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
        } catch {
            const errorMessage: AIMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Failed to connect to AI service. Please try again.",
                timestamp: new Date().toISOString(),
                isEncrypted: false,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickPrompts = [
        "Draft a strict NDA for my client",
        "Create a freelance service agreement",
        "Write a scope of work for web development",
        "Generate a consulting contract template",
    ];

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                    <svg
                        className="w-10 h-10 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">AI Co-Pilot</h2>
                <p className="text-gray-400 max-w-md">
                    Connect your wallet to access the privacy-first AI document drafting
                    assistant.
                </p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-white">AI Co-Pilot</h2>
                    <p className="text-gray-400 text-sm">
                        Privacy-first document drafting powered by TEE
                    </p>
                </div>
                {teeStatus && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-full">
                        <div
                            className={`w-2 h-2 rounded-full ${teeStatus.available ? "bg-green-400" : "bg-yellow-400"
                                } animate-pulse`}
                        />
                        <span className="text-xs text-gray-400">
                            TEE: {teeStatus.mode === "mock" ? "Mock Mode" : "Production"}
                        </span>
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-gray-800/30 border border-gray-700/50 rounded-2xl overflow-hidden flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                                <svg
                                    className="w-8 h-8 text-blue-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-white font-semibold mb-2">
                                Start a Conversation
                            </h3>
                            <p className="text-gray-500 text-sm max-w-md mb-6">
                                Your prompts are encrypted before being processed. Only you can
                                see the results.
                            </p>

                            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                                {quickPrompts.map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => setInput(prompt)}
                                        className="text-sm px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
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
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
                                            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                            : "bg-gray-800 text-gray-200"
                                        }`}
                                >
                                    {msg.role === "user" && msg.isEncrypted && (
                                        <div className="flex items-center gap-1 text-xs text-pink-200 mb-1">
                                            <svg
                                                className="w-3 h-3"
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
                                            Encrypted
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap text-sm">
                                        {msg.content}
                                    </div>
                                    <p
                                        className={`text-xs mt-2 ${msg.role === "user" ? "text-pink-200" : "text-gray-500"
                                            }`}
                                    >
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-800 rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-700/50">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Describe the document you need..."
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                            Send
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Messages are encrypted with TEE public key. Only the secure enclave
                        can decrypt them.
                    </p>
                </div>
            </div>
        </div>
    );
}
