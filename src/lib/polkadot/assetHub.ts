/**
 * Asset Hub Utilities
 * Handles connection, balance queries, and Proof of Contract transactions
 */

import { ApiPromise, WsProvider } from "@polkadot/api";
import type {
    NetworkId,
    NetworkConfig,
    ProofOfContractMemo,
    ProofOfContract,
    TransactionResult,
    ReputationProfile,
} from "@/types";

// ============================================================
// Network Configuration
// ============================================================

export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
    "polkadot-asset-hub": {
        id: "polkadot-asset-hub",
        name: "Polkadot Asset Hub",
        endpoint: "wss://polkadot-asset-hub-rpc.polkadot.io",
        isTestnet: false,
        assetId: 1984, // Example: USDT on Asset Hub. Replace with $DOCU ID
    },
    "westend-asset-hub": {
        id: "westend-asset-hub",
        name: "Westend Asset Hub (Testnet)",
        endpoint: "wss://westend-asset-hub-rpc.polkadot.io",
        isTestnet: true,
        assetId: 1, // Test asset ID
    },
};

// ============================================================
// Connection Management
// ============================================================

// Cache for API connections
const apiCache: Map<string, ApiPromise> = new Map();

/**
 * Create or retrieve a cached connection to Asset Hub
 */
export async function createAssetHubConnection(
    network: NetworkId = "westend-asset-hub"
): Promise<ApiPromise> {
    const config = NETWORK_CONFIGS[network];
    if (!config) {
        throw new Error(`Unknown network: ${network}`);
    }

    // Return cached connection if available and connected
    const cached = apiCache.get(network);
    if (cached?.isConnected) {
        return cached;
    }

    // Create new connection
    const provider = new WsProvider(config.endpoint);
    const api = await ApiPromise.create({ provider });

    // Wait for ready
    await api.isReady;

    // Cache the connection
    apiCache.set(network, api);

    return api;
}

/**
 * Disconnect from a specific network
 */
export async function disconnectAssetHub(network: NetworkId): Promise<void> {
    const api = apiCache.get(network);
    if (api) {
        await api.disconnect();
        apiCache.delete(network);
    }
}

/**
 * Disconnect from all networks
 */
export async function disconnectAllNetworks(): Promise<void> {
    const entries = Array.from(apiCache.entries());
    for (const [network, api] of entries) {
        await api.disconnect();
        apiCache.delete(network);
    }
}

// ============================================================
// Balance Queries
// ============================================================

/**
 * Get native token balance (DOT/WND) for an address
 */
export async function getNativeBalance(
    api: ApiPromise,
    address: string
): Promise<string> {
    const account = await api.query.system.account(address);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const balance = (account as any).data.free.toString();
    return balance;
}

/**
 * Get asset balance for a specific asset ID (e.g., $DOCU)
 */
export async function getAssetBalance(
    api: ApiPromise,
    address: string,
    assetId: number
): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = await api.query.assets.account(assetId, address) as any;

    if (!account || account.isNone) {
        return "0";
    }

    const unwrapped = account.unwrap ? account.unwrap() : account;
    return unwrapped.balance?.toString() || "0";
}

/**
 * Get account balance for the configured $DOCU asset
 */
export async function getDocuBalance(
    api: ApiPromise,
    address: string,
    network: NetworkId = "westend-asset-hub"
): Promise<string> {
    const config = NETWORK_CONFIGS[network];
    if (!config?.assetId) {
        return "0";
    }
    return getAssetBalance(api, address, config.assetId);
}

// ============================================================
// Proof of Contract Transactions (POC-1 Standard)
// ============================================================

/**
 * Encode POC-1 metadata to hex string for system.remark
 */
export function encodePocMemo(
    contractHash: string,
    contractType: string
): string {
    const memo: ProofOfContractMemo = {
        std: "POC-1",
        hash: contractHash,
        type: contractType,
    };
    const jsonString = JSON.stringify(memo);
    // Convert to hex (0x prefixed)
    const hex =
        "0x" +
        Array.from(new TextEncoder().encode(jsonString))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    return hex;
}

/**
 * Decode POC-1 metadata from hex string
 */
export function decodePocMemo(hexString: string): ProofOfContractMemo | null {
    try {
        // Remove 0x prefix if present
        const hex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
        // Convert hex to string
        const bytes = new Uint8Array(
            hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
        );
        const jsonString = new TextDecoder().decode(bytes);
        const parsed = JSON.parse(jsonString);

        // Validate POC-1 standard
        if (parsed.std === "POC-1" && parsed.hash && parsed.type) {
            return parsed as ProofOfContractMemo;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Build a Proof of Contract transaction
 * Combines asset transfer with system.remark containing POC-1 metadata
 */
export function buildProofOfContractTx(
    api: ApiPromise,
    recipient: string,
    amount: string | number,
    assetId: number,
    contractHash: string,
    contractType: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    // Encode the POC-1 memo
    const remarkHex = encodePocMemo(contractHash, contractType);

    // Create batch transaction:
    // 1. Transfer the asset
    // 2. Add remark with contract proof
    const batchTx = api.tx.utility.batchAll([
        api.tx.assets.transferKeepAlive(assetId, recipient, amount),
        api.tx.system.remark(remarkHex),
    ]);

    return batchTx;
}

/**
 * Execute a Proof of Contract payment
 */
export async function executeProofOfContractPayment(
    api: ApiPromise,
    senderAddress: string,
    recipient: string,
    amount: string | number,
    assetId: number,
    contractHash: string,
    contractType: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer: any
): Promise<TransactionResult> {
    return new Promise((resolve) => {
        const tx = buildProofOfContractTx(
            api,
            recipient,
            amount,
            assetId,
            contractHash,
            contractType
        );

        tx.signAndSend(
            senderAddress,
            { signer },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ({ status, dispatchError, txHash }: any) => {
                if (status.isInBlock) {
                    if (dispatchError) {
                        let errorMessage = "Transaction failed";
                        if (dispatchError.isModule) {
                            const decoded = api.registry.findMetaError(
                                dispatchError.asModule
                            );
                            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
                        }
                        resolve({
                            status: "failed",
                            hash: txHash.toHex(),
                            error: errorMessage,
                        });
                    } else {
                        resolve({
                            status: "included",
                            hash: txHash.toHex(),
                            blockHash: status.asInBlock.toHex(),
                        });
                    }
                } else if (status.isFinalized) {
                    resolve({
                        status: "finalized",
                        hash: txHash.toHex(),
                        blockHash: status.asFinalized.toHex(),
                    });
                }
            }
        ).catch((error: Error) => {
            resolve({
                status: "failed",
                error: error.message || "Unknown error",
            });
        });
    });
}

// ============================================================
// Reputation History Scanning
// ============================================================

/**
 * Fetch reputation history for an address by scanning recent blocks
 * Note: For production, use an indexer (SubQuery/Subsquid) instead
 */
export async function fetchReputationHistory(
    api: ApiPromise,
    address: string,
    blockCount: number = 1000
): Promise<ReputationProfile> {
    const contracts: ProofOfContract[] = [];
    const contractsByType: Record<string, number> = {};
    let totalEarnings = BigInt(0);

    // Get current block number
    const currentHeader = await api.rpc.chain.getHeader();
    const currentBlock = currentHeader.number.toNumber();
    const startBlock = Math.max(0, currentBlock - blockCount);

    // Scan blocks (simplified - in production use indexer)
    for (let blockNum = startBlock; blockNum <= currentBlock; blockNum++) {
        try {
            const blockHash = await api.rpc.chain.getBlockHash(blockNum);
            const block = await api.rpc.chain.getBlock(blockHash);

            for (const extrinsic of block.block.extrinsics) {
                // Look for utility.batchAll calls
                if (
                    extrinsic.method.section === "utility" &&
                    extrinsic.method.method === "batchAll"
                ) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const calls = (extrinsic.method.args[0] as unknown) as any[];

                    let transferTo: string | null = null;
                    let transferAmount: string | null = null;
                    let pocMemo: ProofOfContractMemo | null = null;

                    for (const call of calls) {
                        // Check for asset transfer to our address
                        if (
                            call.section === "assets" &&
                            call.method === "transferKeepAlive"
                        ) {
                            const dest = call.args[1]?.toString();
                            const amount = call.args[2]?.toString();
                            if (dest === address) {
                                transferTo = address;
                                transferAmount = amount;
                            }
                        }

                        // Check for system.remark with POC-1 data
                        if (call.section === "system" && call.method === "remark") {
                            const remarkData = call.args[0];
                            if (remarkData && typeof remarkData.toHex === "function") {
                                pocMemo = decodePocMemo(remarkData.toHex());
                            }
                        }
                    }

                    // If we found both a transfer to us and a POC memo, record it
                    if (transferTo && transferAmount && pocMemo) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const timestamp = await api.query.timestamp.now.at(blockHash) as any;

                        contracts.push({
                            transactionHash: extrinsic.hash.toHex(),
                            blockNumber: blockNum,
                            from: extrinsic.signer.toString(),
                            to: transferTo,
                            amount: transferAmount,
                            contractHash: pocMemo.hash,
                            contractType: pocMemo.type,
                            timestamp: new Date(Number(timestamp.toString())).toISOString(),
                        });

                        totalEarnings += BigInt(transferAmount);
                        contractsByType[pocMemo.type] =
                            (contractsByType[pocMemo.type] || 0) + 1;
                    }
                }
            }
        } catch {
            // Skip blocks that fail to fetch
            continue;
        }
    }

    return {
        address,
        totalEarnings: totalEarnings.toString(),
        contractCount: contracts.length,
        contractsByType,
        contracts: contracts.sort((a, b) => b.blockNumber - a.blockNumber),
        lastUpdated: new Date().toISOString(),
    };
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Format balance with decimals (Asset Hub uses 10 decimals for DOT)
 */
export function formatBalance(
    balance: string,
    decimals: number = 10,
    precision: number = 4
): string {
    const balanceBigInt = BigInt(balance);
    const divisor = BigInt(10 ** decimals);
    const wholePart = balanceBigInt / divisor;
    const fractionalPart = balanceBigInt % divisor;

    const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    const truncatedFraction = fractionalStr.slice(0, precision);

    if (truncatedFraction === "0".repeat(precision)) {
        return wholePart.toString();
    }

    return `${wholePart}.${truncatedFraction}`;
}

/**
 * Generate SHA-256 hash of a file or string
 */
export async function generateContractHash(
    data: ArrayBuffer | string
): Promise<string> {
    let buffer: ArrayBuffer;

    if (typeof data === "string") {
        buffer = new TextEncoder().encode(data).buffer;
    } else {
        buffer = data;
    }

    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return `0x${hashHex}`;
}
