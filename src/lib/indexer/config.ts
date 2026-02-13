/**
 * Chain Indexer Configuration
 * 
 * Configuration for indexing Polkadot/Asset Hub chains
 * to derive reputation from POC-1 transactions
 * 
 * Supports both SubQuery and Squid indexer patterns
 */

// ============================================================
// NETWORK CONFIGURATION
// ============================================================

export const NETWORKS = {
    // Asset Hub Westend (Testnet)
    "asset-hub-westend": {
        name: "Asset Hub Westend",
        chainId: "asset-hub-westend",
        endpoint: "wss://westend-asset-hub-rpc.polkadot.io",
        startBlock: 1,
        isTestnet: true,
    },
    // Asset Hub (Mainnet)
    "asset-hub-polkadot": {
        name: "Asset Hub",
        chainId: "asset-hub-polkadot",
        endpoint: "wss://polkadot-asset-hub-rpc.polkadot.io",
        startBlock: 1,
        isTestnet: false,
    },
    // KILT Spiritnet
    "kilt-spiritnet": {
        name: "KILT Spiritnet",
        chainId: "kilt-spiritnet",
        endpoint: "wss://spiritnet.kilt.io",
        startBlock: 1,
        isTestnet: false,
    },
    // KILT Peregrine (Testnet)
    "kilt-peregrine": {
        name: "KILT Peregrine",
        chainId: "kilt-peregrine",
        endpoint: "wss://peregrine.kilt.io",
        startBlock: 1,
        isTestnet: true,
    },
} as const;

export type NetworkId = keyof typeof NETWORKS;

// ============================================================
// INDEXER CONFIGURATION
// ============================================================

export interface IndexerConfig {
    // Network to index
    network: NetworkId;
    
    // Starting block (0 = genesis, -1 = latest)
    startBlock: number;
    
    // Batch size for processing
    batchSize: number;
    
    // Handlers to run
    handlers: IndexerHandler[];
    
    // Database connection
    databaseUrl: string;
    
    // API endpoint (for serving indexed data)
    apiPort: number;
}

export interface IndexerHandler {
    name: string;
    module: string;
    filter: {
        specVersion?: number;
        method?: string;
        section?: string;
    };
}

// ============================================================
// POC-1 INDEXER CONFIG
// ============================================================

/**
 * Configuration for indexing POC-1 (Proof of Contract) transactions
 * Listens for system.remark calls with POC1 prefix
 */
export const POC_INDEXER_CONFIG: IndexerConfig = {
    network: "asset-hub-westend",
    startBlock: 0,
    batchSize: 100,
    handlers: [
        {
            name: "handlePOCRemark",
            module: "./handlers/poc",
            filter: {
                section: "system",
                method: "remark",
            },
        },
        {
            name: "handleTransfer",
            module: "./handlers/transfer",
            filter: {
                section: "balances",
                method: "transfer",
            },
        },
        {
            name: "handleNFTMint",
            module: "./handlers/nft",
            filter: {
                section: "nfts",
                method: "mint",
            },
        },
        {
            name: "handleNFTTransfer",
            module: "./handlers/nft",
            filter: {
                section: "nfts",
                method: "transfer",
            },
        },
    ],
    databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
    apiPort: 3001,
};

// ============================================================
// SUBQUERY PROJECT MANIFEST
// ============================================================

/**
 * SubQuery project.yaml equivalent
 * Export this to create actual SubQuery project
 */
export const SUBQUERY_MANIFEST = {
    specVersion: "1.0.0",
    name: "documate-indexer",
    version: "1.0.0",
    runner: {
        node: {
            name: "@subql/node",
            version: ">=3.0.0",
        },
        query: {
            name: "@subql/query",
            version: "*",
        },
    },
    description: "DocuMate POC-1 Transaction Indexer",
    repository: "https://github.com/documate/indexer",
    schema: {
        file: "./schema.graphql",
    },
    network: {
        chainId: "0x67f9723393ef76214df0118c34bbbd3dbebc8ed46a10973", // Asset Hub Westend
        endpoint: ["wss://westend-asset-hub-rpc.polkadot.io"],
        dictionary: "https://api.subquery.network/sq/subquery/asset-hub-westend-dictionary",
    },
    dataSources: [
        {
            kind: "substrate/Runtime",
            startBlock: 1,
            mapping: {
                file: "./dist/index.js",
                handlers: [
                    {
                        kind: "substrate/CallHandler",
                        handler: "handlePOCRemark",
                        filter: {
                            module: "system",
                            method: "remark",
                        },
                    },
                    {
                        kind: "substrate/EventHandler",
                        handler: "handleTransfer",
                        filter: {
                            module: "balances",
                            method: "Transfer",
                        },
                    },
                ],
            },
        },
    ],
};

// ============================================================
// GRAPHQL SCHEMA
// ============================================================

/**
 * GraphQL schema for indexer API
 * This defines the queryable data structure
 */
export const GRAPHQL_SCHEMA = `
"""
POC-1 Transaction record
"""
type POCTransaction @entity {
  id: ID!
  
  "Transaction hash"
  txHash: String! @index
  
  "Block number"
  blockNumber: Int! @index
  
  "Sender address"
  from: String! @index
  
  "Recipient address (freelancer)"
  to: String! @index
  
  "Transaction value in smallest unit"
  value: BigInt!
  
  "POC-1 remark data"
  remark: String!
  
  "Parsed contract hash"
  contractHash: String @index
  
  "Parsed contract type"
  contractType: String @index
  
  "Timestamp"
  timestamp: DateTime!
  
  "Derived reputation tags"
  tags: [ReputationTag] @derivedFrom(field: "transaction")
}

"""
Reputation tag derived from on-chain activity
"""
type ReputationTag @entity {
  id: ID!
  
  "User wallet address"
  userId: String! @index
  
  "Tag label"
  tag: String! @index
  
  "Tag source"
  source: TagSource!
  
  "Source transaction (if POC)"
  transaction: POCTransaction
  
  "Value associated with tag"
  value: BigInt
  
  "When tag was issued"
  issuedAt: DateTime!
  
  "Expiration (null = permanent)"
  expiresAt: DateTime
}

enum TagSource {
  POC_COMPLETION
  TEMPLATE_SALES
  VERIFICATION
  MANUAL
  BREACH
}

"""
User profile aggregation
"""
type UserProfile @entity {
  id: ID!
  
  "Wallet address"
  address: String! @index
  
  "KILT DID if linked"
  did: String @index
  
  "Total contracts completed"
  contractCount: Int!
  
  "Total earnings (DOCU)"
  totalEarnings: BigInt!
  
  "Reputation tags"
  tags: [ReputationTag]
  
  "Has negative reputation"
  hasBreachRecord: Boolean!
  
  "First seen"
  firstSeen: DateTime!
  
  "Last activity"
  lastActive: DateTime!
}

"""
Platform statistics
"""
type PlatformStats @entity {
  id: ID!
  
  "Total transaction volume"
  totalVolume: BigInt!
  
  "Total burned tokens"
  totalBurned: BigInt!
  
  "Total unique users"
  totalUsers: Int!
  
  "Total POC transactions"
  totalPOCs: Int!
  
  "Last updated"
  updatedAt: DateTime!
}
`;

// ============================================================
// INDEXER STATE MANAGEMENT
// ============================================================

export interface IndexerState {
    chainId: string;
    lastBlockNumber: number;
    lastBlockHash: string;
    lastProcessedAt: Date;
    isRunning: boolean;
}

/**
 * Get default indexer state
 */
export function getDefaultIndexerState(chainId: NetworkId): IndexerState {
    return {
        chainId,
        lastBlockNumber: NETWORKS[chainId].startBlock,
        lastBlockHash: "",
        lastProcessedAt: new Date(),
        isRunning: false,
    };
}
