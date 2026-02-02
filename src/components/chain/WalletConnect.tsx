/**
 * WalletConnect Component
 * Handles wallet connection UI for Polkadot wallets
 */
"use client";

import { useState } from "react";
import { useWallet, useSelectedAccount, useIsWalletConnected } from "@/hooks/useWallet";

export function WalletConnect() {
    const [isOpen, setIsOpen] = useState(false);
    const { connect, disconnect, accounts, selectAccount, isConnecting, error } =
        useWallet();
    const selectedAccount = useSelectedAccount();
    const isConnected = useIsWalletConnected();

    const handleConnect = async () => {
        try {
            await connect();
        } catch {
            // Error is already set in store
        }
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (isConnected && selectedAccount) {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="font-medium">
                        {selectedAccount.meta.name || truncateAddress(selectedAccount.address)}
                    </span>
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
                                {selectedAccount.address}
                            </p>
                        </div>

                        {accounts.length > 1 && (
                            <div className="p-2 border-b border-gray-700">
                                <p className="text-gray-400 text-xs px-2 py-1">Switch Account</p>
                                {accounts
                                    .filter((acc) => acc.address !== selectedAccount.address)
                                    .map((acc) => (
                                        <button
                                            key={acc.address}
                                            onClick={() => {
                                                selectAccount(acc);
                                                setIsOpen(false);
                                            }}
                                            className="w-full text-left px-2 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                                        >
                                            <span className="font-medium">
                                                {acc.meta.name || "Account"}
                                            </span>
                                            <span className="text-gray-500 text-sm ml-2">
                                                {truncateAddress(acc.address)}
                                            </span>
                                        </button>
                                    ))}
                            </div>
                        )}

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
                onClick={handleConnect}
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
                    "Connect Wallet"
                )}
            </button>

            {error && (
                <p className="text-red-400 text-sm max-w-xs text-right">{error}</p>
            )}
        </div>
    );
}

export default WalletConnect;
