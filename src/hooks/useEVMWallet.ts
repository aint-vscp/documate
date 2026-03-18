/**
 * EVM Wallet Hook (MetaMask / Polkadot Hub EVM)
 *
 * Separate from the existing Polkadot.js extension hook (useWallet.ts).
 * This hook targets the EVM compatibility layer on Polkadot Hub via MetaMask.
 */
"use client";

import { create } from "zustand";
import { POLKADOT_HUB_TESTNET } from "@/config/DocuMateABI";

type EthereumProvider = {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, handler: (...args: never[]) => void) => void;
    removeListener?: (event: string, handler: (...args: never[]) => void) => void;
    providers?: EthereumProvider[];
};

let boundProvider: EthereumProvider | null = null;
let accountsChangedHandler: ((...args: never[]) => void) | null = null;
let chainChangedHandler: ((...args: never[]) => void) | null = null;

// ============================================================
// Types
// ============================================================

interface EVMWalletState {
    account: string | null;
    chainId: number | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;

    connectMetaMask: () => Promise<void>;
    switchToTargetNetwork: () => Promise<void>;
    disconnect: () => void;
    clearError: () => void;
    restoreSession: () => Promise<void>;
}

// ============================================================
// Helpers
// ============================================================

function getMetaMaskProvider(): EthereumProvider | null {
    if (typeof window === "undefined" || !window.ethereum) return null;

    const injected = window.ethereum as EthereumProvider;

    if (Array.isArray(injected.providers) && injected.providers.length > 0) {
        const metamask = injected.providers.find((p) => p?.isMetaMask);
        return metamask ?? null;
    }

    return injected.isMetaMask ? injected : null;
}

function mapProviderError(error: unknown): string {
    const err = error as { code?: number; message?: string };

    if (err?.code === 4001) {
        return "Connection request was rejected in MetaMask.";
    }
    if (err?.code === -32002) {
        return "MetaMask already has a pending request. Open MetaMask and finish it first.";
    }
    if (err?.code === 4902) {
        return "Polkadot Hub network is not added in MetaMask.";
    }

    return err?.message || "Failed to connect MetaMask.";
}

const WALLET_COOKIE_KEY = "documate_evm_wallet";
const CHAIN_COOKIE_KEY = "documate_evm_chain";

function setCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 30): void {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string): void {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function readCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie ? document.cookie.split(";") : [];
    for (const cookie of cookies) {
        const [rawName, ...rest] = cookie.trim().split("=");
        if (rawName === name) {
            return decodeURIComponent(rest.join("="));
        }
    }
    return null;
}

async function switchToPolkadotHub(provider: EthereumProvider): Promise<void> {
    if (typeof window === "undefined") return;

    const chainIdHex = `0x${POLKADOT_HUB_TESTNET.chainId.toString(16)}`;

    try {
        await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainIdHex }],
        });
    } catch (switchError: unknown) {
        const err = switchError as { code?: number };
        // Chain not added yet (error code 4902)
        if (err.code === 4902) {
            await provider.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: chainIdHex,
                        chainName: POLKADOT_HUB_TESTNET.name,
                        nativeCurrency: {
                            name: POLKADOT_HUB_TESTNET.symbol,
                            symbol: POLKADOT_HUB_TESTNET.symbol,
                            decimals: POLKADOT_HUB_TESTNET.decimals,
                        },
                        rpcUrls: [POLKADOT_HUB_TESTNET.rpcUrl],
                        blockExplorerUrls: [POLKADOT_HUB_TESTNET.explorer],
                    },
                ],
            });
        } else {
            throw switchError;
        }
    }
}

// ============================================================
// Store
// ============================================================

export const useEVMWallet = create<EVMWalletState>()((set) => ({
    account: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,

    connectMetaMask: async () => {
        set({ isConnecting: true, error: null });

        try {
            const provider = getMetaMaskProvider();
            if (!provider) {
                throw new Error(
                    "MetaMask not detected. Please install MetaMask to continue."
                );
            }

            // Request accounts
            const accounts = await provider.request({
                method: "eth_requestAccounts",
            }) as string[];

            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found in MetaMask.");
            }

            // Switch to Polkadot Hub testnet
            await switchToPolkadotHub(provider);

            // Get current chain ID
            const chainIdHex = await provider.request({
                method: "eth_chainId",
            }) as string;
            const chainId = parseInt(chainIdHex, 16);

            set({
                account: accounts[0],
                chainId,
                isConnected: true,
                isConnecting: false,
            });

            setCookie(WALLET_COOKIE_KEY, accounts[0]);
            setCookie(CHAIN_COOKIE_KEY, String(chainId));

            // Remove previous listeners if we previously bound a provider.
            if (boundProvider && accountsChangedHandler && boundProvider.removeListener) {
                boundProvider.removeListener("accountsChanged", accountsChangedHandler);
            }
            if (boundProvider && chainChangedHandler && boundProvider.removeListener) {
                boundProvider.removeListener("chainChanged", chainChangedHandler);
            }

            accountsChangedHandler = (...args: never[]) => {
                const newAccounts = (args[0] as string[]) || [];
                if (!Array.isArray(newAccounts) || newAccounts.length === 0) {
                    set({
                        account: null,
                        isConnected: false,
                        chainId: null,
                    });
                    clearCookie(WALLET_COOKIE_KEY);
                    clearCookie(CHAIN_COOKIE_KEY);
                } else {
                    set({ account: newAccounts[0] });
                    setCookie(WALLET_COOKIE_KEY, newAccounts[0]);
                }
            };

            chainChangedHandler = (...args: never[]) => {
                const newChainId = args[0] as string;
                if (typeof newChainId === "string") {
                    const parsed = parseInt(newChainId, 16);
                    set({ chainId: parsed });
                    setCookie(CHAIN_COOKIE_KEY, String(parsed));
                }
            };

            provider.on?.("accountsChanged", accountsChangedHandler);
            provider.on?.("chainChanged", chainChangedHandler);
            boundProvider = provider;
        } catch (err) {
            const message = mapProviderError(err);
            set({
                error: message,
                isConnecting: false,
                isConnected: false,
            });
        }
    },

    switchToTargetNetwork: async () => {
        const provider = getMetaMaskProvider();
        if (!provider) {
            set({ error: "MetaMask not detected. Please install MetaMask to continue." });
            return;
        }

        try {
            await switchToPolkadotHub(provider);
            const chainIdHex = await provider.request({ method: "eth_chainId" }) as string;
            const chainId = parseInt(chainIdHex, 16);
            set({ chainId, error: null });
            setCookie(CHAIN_COOKIE_KEY, String(chainId));
        } catch (err) {
            set({ error: mapProviderError(err) });
        }
    },

    disconnect: () => {
        // Clean up listener bindings without wiping unrelated dapp listeners.
        if (boundProvider && accountsChangedHandler && boundProvider.removeListener) {
            boundProvider.removeListener("accountsChanged", accountsChangedHandler);
        }
        if (boundProvider && chainChangedHandler && boundProvider.removeListener) {
            boundProvider.removeListener("chainChanged", chainChangedHandler);
        }

        boundProvider = null;
        accountsChangedHandler = null;
        chainChangedHandler = null;

        set({
            account: null,
            chainId: null,
            isConnected: false,
            isConnecting: false,
            error: null,
        });

        clearCookie(WALLET_COOKIE_KEY);
        clearCookie(CHAIN_COOKIE_KEY);
    },

    clearError: () => {
        set({ error: null });
    },

    restoreSession: async () => {
        if (typeof window === "undefined") return;

        const provider = getMetaMaskProvider();
        if (!provider) return;

        const cookieWallet = readCookie(WALLET_COOKIE_KEY);

        try {
            const accounts = await provider.request({ method: "eth_accounts" }) as string[];
            if (!accounts || accounts.length === 0) {
                set({ account: null, chainId: null, isConnected: false });
                clearCookie(WALLET_COOKIE_KEY);
                clearCookie(CHAIN_COOKIE_KEY);
                return;
            }

            const account = cookieWallet
                ? accounts.find((entry) => entry.toLowerCase() === cookieWallet.toLowerCase()) ?? accounts[0]
                : accounts[0];

            const chainIdHex = await provider.request({ method: "eth_chainId" }) as string;
            const chainId = parseInt(chainIdHex, 16);

            set({
                account,
                chainId,
                isConnected: true,
                isConnecting: false,
                error: null,
            });

            setCookie(WALLET_COOKIE_KEY, account);
            setCookie(CHAIN_COOKIE_KEY, String(chainId));
        } catch {
            set({ account: null, chainId: null, isConnected: false });
        }
    },
}));

if (typeof window !== "undefined") {
    queueMicrotask(() => {
        void useEVMWallet.getState().restoreSession();
    });
}

// ============================================================
// Selector Hooks
// ============================================================

export const useEVMAccount = () => useEVMWallet((s) => s.account);
export const useEVMChainId = () => useEVMWallet((s) => s.chainId);
export const useIsEVMConnected = () => useEVMWallet((s) => s.isConnected);

// ============================================================
// Type declarations for window.ethereum
// ============================================================

declare global {
    interface Window {
        ethereum?: EthereumProvider;
    }
}
