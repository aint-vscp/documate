/**
 * Wallet State Management Hook (Zustand)
 * Manages Polkadot wallet connection and account selection
 */
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApiPromise } from "@polkadot/api";
import type {
    InjectedAccountWithMeta,
    InjectedExtension,
} from "@polkadot/extension-inject/types";

// ============================================================
// Types
// ============================================================

interface WalletState {
    // Connection state
    accounts: InjectedAccountWithMeta[];
    selectedAccount: InjectedAccountWithMeta | null;
    injector: InjectedExtension | null;
    api: ApiPromise | null;

    // Status flags
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;

    // Actions
    connect: () => Promise<void>;
    disconnect: () => void;
    selectAccount: (account: InjectedAccountWithMeta) => void;
    setApi: (api: ApiPromise | null) => void;
    clearError: () => void;
}

interface PersistedState {
    selectedAccountAddress: string | null;
}

// ============================================================
// Store Implementation
// ============================================================

export const useWallet = create<WalletState>()(
    persist(
        (set, get) => ({
            // Initial state
            accounts: [],
            selectedAccount: null,
            injector: null,
            api: null,
            isConnected: false,
            isConnecting: false,
            error: null,

            /**
             * Connect to wallet extension (Talisman, Polkadot.js, SubWallet, etc.)
             */
            connect: async () => {
                set({ isConnecting: true, error: null });

                try {
                    // Dynamic import to avoid SSR issues
                    const { web3Enable, web3Accounts } = await import(
                        "@polkadot/extension-dapp"
                    );

                    // Request access to wallet extensions
                    const extensions = await web3Enable("DocuMate");

                    if (extensions.length === 0) {
                        throw new Error(
                            "No wallet extension found. Please install Talisman, Polkadot.js, or SubWallet."
                        );
                    }

                    // Get all accounts
                    const allAccounts = await web3Accounts();

                    if (allAccounts.length === 0) {
                        throw new Error(
                            "No accounts found. Please create an account in your wallet extension."
                        );
                    }

                    // Try to restore previously selected account
                    const persistedAddress = localStorage.getItem(
                        "documate-selected-account"
                    );
                    let selectedAccount = allAccounts[0];

                    if (persistedAddress) {
                        const found = allAccounts.find(
                            (acc) => acc.address === persistedAddress
                        );
                        if (found) {
                            selectedAccount = found;
                        }
                    }

                    // Get injector for the selected account
                    const { web3FromAddress } = await import("@polkadot/extension-dapp");
                    const injector = await web3FromAddress(selectedAccount.address);

                    set({
                        accounts: allAccounts,
                        selectedAccount,
                        injector: injector as unknown as InjectedExtension,
                        isConnected: true,
                        isConnecting: false,
                    });

                    // Persist selected account
                    localStorage.setItem(
                        "documate-selected-account",
                        selectedAccount.address
                    );
                } catch (err) {
                    const errorMessage =
                        err instanceof Error ? err.message : "Failed to connect wallet";
                    set({
                        error: errorMessage,
                        isConnecting: false,
                        isConnected: false,
                    });
                    throw err;
                }
            },

            /**
             * Disconnect wallet and clear state
             */
            disconnect: () => {
                const { api } = get();

                // Disconnect API if connected
                if (api?.isConnected) {
                    api.disconnect();
                }

                localStorage.removeItem("documate-selected-account");

                set({
                    accounts: [],
                    selectedAccount: null,
                    injector: null,
                    api: null,
                    isConnected: false,
                    isConnecting: false,
                    error: null,
                });
            },

            /**
             * Select a different account from the connected wallet
             */
            selectAccount: async (account: InjectedAccountWithMeta) => {
                try {
                    const { web3FromAddress } = await import("@polkadot/extension-dapp");
                    const injector = await web3FromAddress(account.address);

                    set({
                        selectedAccount: account,
                        injector: injector as unknown as InjectedExtension,
                    });

                    localStorage.setItem("documate-selected-account", account.address);
                } catch (err) {
                    const errorMessage =
                        err instanceof Error
                            ? err.message
                            : "Failed to select account";
                    set({ error: errorMessage });
                }
            },

            /**
             * Set the connected Polkadot API instance
             */
            setApi: (api: ApiPromise | null) => {
                set({ api });
            },

            /**
             * Clear any error state
             */
            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: "documate-wallet",
            // Only persist the selected account address
            partialize: (state): PersistedState => ({
                selectedAccountAddress: state.selectedAccount?.address ?? null,
            }),
        }
    )
);

// ============================================================
// Selector Hooks (for optimized re-renders)
// ============================================================

export const useSelectedAccount = () =>
    useWallet((state) => state.selectedAccount);

export const useWalletAccounts = () => useWallet((state) => state.accounts);

export const useIsWalletConnected = () =>
    useWallet((state) => state.isConnected);

export const useWalletError = () => useWallet((state) => state.error);

export const usePolkadotApi = () => useWallet((state) => state.api);
