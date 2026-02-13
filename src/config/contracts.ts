/**
 * Smart Contract Addresses
 * 
 * Update these after deploying contracts to each network
 */

// ============================================================
// CONTRACT ADDRESSES
// ============================================================

export const CONTRACTS = {
    // Testnet (Westend Asset Hub)
    testnet: {
        /** DocuMarketplace contract */
        marketplace: "",
        /** Subscription NFT contract */
        subscription: "",
        /** Company treasury wallet */
        treasury: "",
        /** Burn address (zero address) */
        burn: "0x0000000000000000000000000000000000000000000000000000000000000000",
    },
    // Mainnet (Polkadot Asset Hub)
    mainnet: {
        /** DocuMarketplace contract */
        marketplace: "",
        /** Subscription NFT contract */
        subscription: "",
        /** Company treasury wallet */
        treasury: "",
        /** Burn address (zero address) */
        burn: "0x0000000000000000000000000000000000000000000000000000000000000000",
    },
} as const;

// ============================================================
// CONTRACT METADATA
// ============================================================

export const CONTRACT_METADATA = {
    marketplace: {
        name: "DocuMarketplace",
        version: "1.0.0",
        description: "NFT Template Marketplace with 75/20/5 revenue split",
    },
    subscription: {
        name: "DocuSubscription",
        version: "1.0.0",
        description: "Power User subscription NFT",
    },
} as const;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

type Network = "testnet" | "mainnet";

/**
 * Get contract address for a specific network
 */
export function getContractAddress(
    contract: "marketplace" | "subscription" | "treasury" | "burn",
    network: Network = process.env.NODE_ENV === "production" ? "mainnet" : "testnet"
): string {
    const address = CONTRACTS[network][contract];
    if (!address) {
        throw new Error(`Contract "${contract}" not deployed on ${network}`);
    }
    return address;
}

/**
 * Check if contract is deployed
 */
export function isContractDeployed(
    contract: "marketplace" | "subscription",
    network: Network = process.env.NODE_ENV === "production" ? "mainnet" : "testnet"
): boolean {
    return !!CONTRACTS[network][contract];
}
