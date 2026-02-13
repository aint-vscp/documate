/**
 * Network Configurations for DocuMate
 * 
 * Supported Networks:
 * - Westend Asset Hub (Testnet)
 * - Polkadot Asset Hub (Mainnet)
 * - KILT Peregrine (Testnet)
 * - KILT Spiritnet (Mainnet)
 */

export type NetworkId = 
    | "westend-asset-hub"
    | "polkadot-asset-hub"
    | "kilt-peregrine"
    | "kilt-spiritnet"
    | "phala-testnet"
    | "phala-mainnet";

export interface NetworkConfig {
    id: NetworkId;
    name: string;
    endpoint: string;
    isTestnet: boolean;
    explorer?: string;
    assetId?: number;
    symbol?: string;
    decimals?: number;
}

// ============================================================
// NETWORK CONFIGURATIONS
// ============================================================

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
    // Asset Hub (Marketplace & NFTs)
    "westend-asset-hub": {
        id: "westend-asset-hub",
        name: "Westend Asset Hub (Testnet)",
        endpoint: "wss://westend-asset-hub-rpc.polkadot.io",
        isTestnet: true,
        explorer: "https://westend.subscan.io",
        assetId: 1, // Test asset ID
        symbol: "WND",
        decimals: 12,
    },
    "polkadot-asset-hub": {
        id: "polkadot-asset-hub",
        name: "Polkadot Asset Hub",
        endpoint: "wss://polkadot-asset-hub-rpc.polkadot.io",
        isTestnet: false,
        explorer: "https://assethub-polkadot.subscan.io",
        assetId: 1984, // $DOCU asset ID (to be minted)
        symbol: "DOCU",
        decimals: 12,
    },

    // KILT Protocol (Identity & DIDs)
    "kilt-peregrine": {
        id: "kilt-peregrine",
        name: "KILT Peregrine (Testnet)",
        endpoint: "wss://peregrine.kilt.io/parachain-public-ws",
        isTestnet: true,
        explorer: "https://kilt-testnet.subscan.io",
        symbol: "PILT",
        decimals: 15,
    },
    "kilt-spiritnet": {
        id: "kilt-spiritnet",
        name: "KILT Spiritnet",
        endpoint: "wss://spiritnet.kilt.io",
        isTestnet: false,
        explorer: "https://spiritnet.subscan.io",
        symbol: "KILT",
        decimals: 15,
    },

    // Phala Network (TEE & Privacy)
    "phala-testnet": {
        id: "phala-testnet",
        name: "Phala PoC-6 (Testnet)",
        endpoint: "wss://poc6.phala.network/ws",
        isTestnet: true,
        symbol: "PHA",
        decimals: 12,
    },
    "phala-mainnet": {
        id: "phala-mainnet",
        name: "Phala Network",
        endpoint: "wss://api.phala.network/ws",
        isTestnet: false,
        explorer: "https://phala.subscan.io",
        symbol: "PHA",
        decimals: 12,
    },
};

// ============================================================
// DEFAULT NETWORKS BY ENVIRONMENT
// ============================================================

export const DEFAULT_NETWORKS = {
    development: {
        marketplace: "westend-asset-hub",
        identity: "kilt-peregrine",
        privacy: "phala-testnet",
    },
    production: {
        marketplace: "polkadot-asset-hub",
        identity: "kilt-spiritnet",
        privacy: "phala-mainnet",
    },
} as const;

/**
 * Get the default network for a specific purpose
 */
export function getDefaultNetwork(
    purpose: "marketplace" | "identity" | "privacy",
    env: "development" | "production" = process.env.NODE_ENV === "production" ? "production" : "development"
): NetworkConfig {
    const networkId = DEFAULT_NETWORKS[env][purpose] as NetworkId;
    return NETWORKS[networkId];
}

/**
 * Get network by ID
 */
export function getNetwork(id: NetworkId): NetworkConfig {
    return NETWORKS[id];
}

/**
 * Get all testnet networks
 */
export function getTestnetNetworks(): NetworkConfig[] {
    return Object.values(NETWORKS).filter((n) => n.isTestnet);
}

/**
 * Get all mainnet networks
 */
export function getMainnetNetworks(): NetworkConfig[] {
    return Object.values(NETWORKS).filter((n) => !n.isTestnet);
}
