/**
 * Marketplace Contract Service
 * TypeScript wrapper for interacting with the DocuMarketplace Ink! contract
 * 
 * THE IRON RULES - Revenue Split (Enforced by Smart Contract):
 * - 75% → Creator
 * - 20% → DocuMate Treasury  
 * - 5%  → Burn Address
 */

import type { ApiPromise } from "@polkadot/api";
import type { InjectedExtension } from "@polkadot/extension-inject/types";
import type { ISubmittableResult } from "@polkadot/types/types";

// We'll dynamically import ContractPromise to avoid SSR issues
type ContractPromiseType = InstanceType<typeof import("@polkadot/api-contract").ContractPromise>;

// ============================================================
// CONSTANTS - THE IRON RULES
// ============================================================

export const REVENUE_SPLIT = {
    CREATOR: 75,
    COMPANY: 20,
    BURN: 5,
} as const;

// Contract addresses (to be updated after deployment)
export const CONTRACT_ADDRESSES = {
    testnet: {
        marketplace: "", // Deploy and fill this
        treasury: "",    // Company treasury wallet
        burn: "0x0000000000000000000000000000000000000000000000000000000000000000",
    },
    mainnet: {
        marketplace: "",
        treasury: "",
        burn: "0x0000000000000000000000000000000000000000000000000000000000000000",
    },
};

// ============================================================
// TYPES
// ============================================================

export interface Template {
    id: string;
    creator: string;
    owner: string;
    price: string;
    ipfsCid: string;
    category: string;
    isVerified: boolean;
    isListed: boolean;
    salesCount: number;
    createdAt: number;
}

export interface PurchaseReceipt {
    templateId: string;
    buyer: string;
    seller: string;
    totalPrice: string;
    creatorAmount: string;
    companyAmount: string;
    burnAmount: string;
    timestamp: number;
}

export interface RevenueSplit {
    creatorAmount: string;
    companyAmount: string;
    burnAmount: string;
    total: string;
}

export interface PlatformStats {
    totalVolume: string;
    totalBurned: string;
    totalTemplates: number;
}

// ============================================================
// MARKETPLACE SERVICE
// ============================================================

export class MarketplaceService {
    private contract: ContractPromiseType | null = null;
    private api: ApiPromise;
    private network: "testnet" | "mainnet";

    constructor(api: ApiPromise, network: "testnet" | "mainnet" = "testnet") {
        this.api = api;
        this.network = network;
    }

    /**
     * Initialize the contract instance
     * Must be called before any other methods
     */
    async initialize(contractAbi: string | Record<string, unknown>): Promise<void> {
        const address = CONTRACT_ADDRESSES[this.network].marketplace;
        if (!address) {
            throw new Error(`Marketplace contract not deployed on ${this.network}`);
        }
        // Dynamic import to avoid SSR issues
        const { ContractPromise } = await import("@polkadot/api-contract");
        this.contract = new ContractPromise(this.api, contractAbi, address);
    }

    // --------------------------------------------------------
    // REVENUE SPLIT CALCULATIONS (Client-side preview)
    // --------------------------------------------------------

    /**
     * Calculate the 75/20/5 revenue split for a given price
     * This mirrors the on-chain calculation for UI display
     * 
     * @param priceInSmallestUnit - Price in smallest token unit (e.g., 10^12 for DOT)
     * @returns The split amounts for creator, company, and burn
     */
    calculateRevenueSplit(priceInSmallestUnit: bigint): RevenueSplit {
        const price = priceInSmallestUnit;
        const hundred = BigInt(100);
        
        // Calculate using integer math (same as contract)
        const creatorAmount = (price * BigInt(REVENUE_SPLIT.CREATOR)) / hundred;
        const companyAmount = (price * BigInt(REVENUE_SPLIT.COMPANY)) / hundred;
        const burnAmount = price - creatorAmount - companyAmount; // Remainder to burn
        
        return {
            creatorAmount: creatorAmount.toString(),
            companyAmount: companyAmount.toString(),
            burnAmount: burnAmount.toString(),
            total: price.toString(),
        };
    }

    /**
     * Format the revenue split for display
     * Shows the user exactly what they'll receive
     * 
     * @param price - Price in human-readable format (e.g., "100")
     * @param _decimals - Token decimals (default 12 for DOT)
     */
    formatRevenueSplitForDisplay(price: number, _decimals: number = 12): {
        creator: number;
        company: number;
        burn: number;
        creatorPercent: number;
        companyPercent: number;
        burnPercent: number;
    } {
        const creatorAmount = (price * REVENUE_SPLIT.CREATOR) / 100;
        const companyAmount = (price * REVENUE_SPLIT.COMPANY) / 100;
        const burnAmount = price - creatorAmount - companyAmount;

        return {
            creator: creatorAmount,
            company: companyAmount,
            burn: burnAmount,
            creatorPercent: REVENUE_SPLIT.CREATOR,
            companyPercent: REVENUE_SPLIT.COMPANY,
            burnPercent: REVENUE_SPLIT.BURN,
        };
    }

    // --------------------------------------------------------
    // CONTRACT READ METHODS (Queries)
    // --------------------------------------------------------

    /**
     * Get template details by ID
     */
    async getTemplate(templateId: string): Promise<Template | null> {
        if (!this.contract) throw new Error("Contract not initialized");

        const result = await this.contract.query.getTemplate(
            "", // No specific caller for queries
            { gasLimit: -1 },
            templateId
        );

        if (!result.output) return null;
        
        const output = result.output as unknown as { isNone?: boolean };
        if (output.isNone) return null;

        const data = result.output.toJSON() as unknown as Template;
        return data;
    }

    /**
     * Get all templates owned by a user
     */
    async getUserTemplates(userAddress: string): Promise<string[]> {
        if (!this.contract) throw new Error("Contract not initialized");

        const result = await this.contract.query.getUserTemplates(
            "",
            { gasLimit: -1 },
            userAddress
        );

        return (result.output?.toJSON() as string[]) || [];
    }

    /**
     * Get all templates created by a user
     */
    async getCreatorTemplates(creatorAddress: string): Promise<string[]> {
        if (!this.contract) throw new Error("Contract not initialized");

        const result = await this.contract.query.getCreatorTemplates(
            "",
            { gasLimit: -1 },
            creatorAddress
        );

        return (result.output?.toJSON() as string[]) || [];
    }

    /**
     * Get platform statistics (total volume, burned tokens, template count)
     */
    async getPlatformStats(): Promise<PlatformStats> {
        if (!this.contract) throw new Error("Contract not initialized");

        const result = await this.contract.query.getPlatformStats(
            "",
            { gasLimit: -1 }
        );

        const [totalVolume, totalBurned, totalTemplates] = result.output?.toJSON() as [string, string, number];

        return {
            totalVolume,
            totalBurned,
            totalTemplates,
        };
    }

    // --------------------------------------------------------
    // CONTRACT WRITE METHODS (Transactions)
    // --------------------------------------------------------

    /**
     * Mint a new template NFT
     * 
     * @param ipfsCid - IPFS CID of encrypted template content
     * @param category - Template category (Legal, Creative, Engineering)
     * @param price - Sale price in smallest token unit
     * @param signer - User's injected signer
     * @param callerAddress - User's wallet address
     */
    async mintTemplate(
        ipfsCid: string,
        category: string,
        price: string,
        signer: InjectedExtension["signer"],
        callerAddress: string
    ): Promise<{ templateId: string; txHash: string }> {
        if (!this.contract) throw new Error("Contract not initialized");

        return new Promise((resolve, reject) => {
            this.contract!.tx
                .mintTemplate(
                    { gasLimit: -1, value: 0 },
                    ipfsCid,
                    category,
                    price
                )
                .signAndSend(callerAddress, { signer }, (result: ISubmittableResult) => {
                    if (result.status.isInBlock || result.status.isFinalized) {
                        // Extract template ID from events
                        const mintEvent = result.events.find(
                            (record) => record.event.method === "TemplateMinted"
                        );

                        if (mintEvent) {
                            const templateId = mintEvent.event.data[0].toString();
                            resolve({
                                templateId,
                                txHash: result.txHash.toHex(),
                            });
                        } else {
                            reject(new Error("Mint event not found"));
                        }
                    }

                    if (result.status.isDropped || result.status.isInvalid) {
                        reject(new Error("Transaction failed"));
                    }
                });
        });
    }

    /**
     * Purchase a template (executes 75/20/5 split)
     * 
     * THIS IS THE CORE FUNCTION - Revenue split happens on-chain
     * 
     * @param templateId - Template to purchase
     * @param price - Exact price to send
     * @param signer - User's injected signer
     * @param callerAddress - Buyer's wallet address
     */
    async purchaseTemplate(
        templateId: string,
        price: string,
        signer: InjectedExtension["signer"],
        callerAddress: string
    ): Promise<PurchaseReceipt> {
        if (!this.contract) throw new Error("Contract not initialized");

        return new Promise((resolve, reject) => {
            this.contract!.tx
                .purchaseTemplate(
                    { gasLimit: -1, value: price }, // value = payment amount
                    templateId
                )
                .signAndSend(callerAddress, { signer }, (result: ISubmittableResult) => {
                    if (result.status.isInBlock || result.status.isFinalized) {
                        // Extract purchase receipt from events
                        const purchaseEvent = result.events.find(
                            (record) => record.event.method === "TemplatePurchased"
                        );

                        if (purchaseEvent) {
                            const data = purchaseEvent.event.data;
                            resolve({
                                templateId: data[0].toString(),
                                buyer: data[1].toString(),
                                seller: data[2].toString(),
                                totalPrice: data[3].toString(),
                                creatorAmount: data[4].toString(),
                                companyAmount: data[5].toString(),
                                burnAmount: data[6].toString(),
                                timestamp: Date.now(),
                            });
                        } else {
                            reject(new Error("Purchase event not found"));
                        }
                    }

                    if (result.status.isDropped || result.status.isInvalid) {
                        reject(new Error("Transaction failed"));
                    }
                });
        });
    }

    /**
     * List a template for sale
     */
    async listTemplate(
        templateId: string,
        price: string,
        signer: InjectedExtension["signer"],
        callerAddress: string
    ): Promise<string> {
        if (!this.contract) throw new Error("Contract not initialized");

        return new Promise((resolve, reject) => {
            this.contract!.tx
                .listTemplate({ gasLimit: -1 }, templateId, price)
                .signAndSend(callerAddress, { signer }, (result: ISubmittableResult) => {
                    if (result.status.isFinalized) {
                        resolve(result.txHash.toHex());
                    }
                    if (result.status.isDropped || result.status.isInvalid) {
                        reject(new Error("Transaction failed"));
                    }
                });
        });
    }

    /**
     * Delist a template
     */
    async delistTemplate(
        templateId: string,
        signer: InjectedExtension["signer"],
        callerAddress: string
    ): Promise<string> {
        if (!this.contract) throw new Error("Contract not initialized");

        return new Promise((resolve, reject) => {
            this.contract!.tx
                .delistTemplate({ gasLimit: -1 }, templateId)
                .signAndSend(callerAddress, { signer }, (result: ISubmittableResult) => {
                    if (result.status.isFinalized) {
                        resolve(result.txHash.toHex());
                    }
                    if (result.status.isDropped || result.status.isInvalid) {
                        reject(new Error("Transaction failed"));
                    }
                });
        });
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let marketplaceInstance: MarketplaceService | null = null;

/**
 * Get the marketplace service instance
 */
export function getMarketplaceService(
    api: ApiPromise,
    network: "testnet" | "mainnet" = "testnet"
): MarketplaceService {
    if (!marketplaceInstance) {
        marketplaceInstance = new MarketplaceService(api, network);
    }
    return marketplaceInstance;
}

/**
 * Reset the marketplace service (for testing)
 */
export function resetMarketplaceService(): void {
    marketplaceInstance = null;
}
