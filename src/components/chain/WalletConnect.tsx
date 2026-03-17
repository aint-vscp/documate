/**
 * WalletConnect Component
 * Handles wallet connection UI for MetaMask / Polkadot Hub EVM
 */
"use client";

import { useState } from "react";
import { useEVMWallet, useEVMAccount, useIsEVMConnected, useEVMChainId } from "@/hooks/useEVMWallet";
import { POLKADOT_HUB_TESTNET } from "@/config/DocuMateABI";

export function WalletConnect() {
    const [isOpen, setIsOpen] = useState(false);
    const { connectMetaMask, disconnect, isConnecting, error } = useEVMWallet();
    const account = useEVMAccount();
    const isConnected = useIsEVMConnected();
    const chainId = useEVMChainId();

    const isCorrectChain = chainId === POLKADOT_HUB_TESTNET.chainId;

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (isConnected && account) {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isCorrectChain ? "bg-green-400" : "bg-yellow-400"}`} />
                    <span className="font-medium">
                        {truncateAddress(account)}
                    </span>
                    {!isCorrectChain && (
                        <span className="text-xs text-yellow-300">(Wrong Network)</span>
                    )}
                    <svg
                        className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-4 border-b border-gray-700">
                            <p className="text-gray-400 text-sm">Connected Account</p>
                            <p className="text-white font-mono text-sm mt-1 break-all">
                                {account}
                            </p>
                            <p className={`text-xs mt-2 ${isCorrectChain ? "text-green-400" : "text-yellow-400"}`}>
                                {isCorrectChain ? "Polkadot Hub Testnet" : "Wrong Network - Please switch"}
                            </p>
                        </div>

                        <div className="p-2">
                            <button
                                onClick={() => {
                                    disconnect();
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-left"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                onClick={connectMetaMask}
                disabled={isConnecting}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
                {isConnecting ? (
                    <span className="flex items-center gap-2">
                        <svg
                            className="animate-spin h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Connecting...
                    </span>
                ) : (
                    "Connect MetaMask"
                )}
            </button>

            {error && (
                <p className="text-red-400 text-sm max-w-xs text-right">{error}</p>
            )}
        </div>
    );
}

export default WalletConnect;
