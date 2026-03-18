/**
 * DocuMate Core TypeScript Interfaces
 * Contract Governance & Professional Reputation Network
 */

// ============================================================
// Identity Types (KILT Protocol)
// ============================================================

/**
 * Verifiable Credential structure following W3C VC Data Model
 */
export interface VerifiableCredential {
  "@context": string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    name?: string;
    role?: string;
    skills?: string[];
    [key: string]: unknown;
  };
  proof?: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    signature?: string;
  };
}

/**
 * User Profile with DID and Credentials
 */
export interface UserProfile {
  did: string; // "did:kilt:light:..."
  web3name?: string;
  credentials: VerifiableCredential[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Professional Identity Claim (for VC issuance)
 */
export interface ProfessionalIdentityClaim {
  name: string;
  role: string;
  skills: string[];
  bio?: string;
}

// ============================================================
// NFT Marketplace Types (Asset Hub)
// ============================================================

/**
 * Template Categories for DocuMarket
 */
export type TemplateCategory = "Legal" | "Creative" | "Engineering";

/**
 * NFT Template representing a purchasable document template
 */
export interface TemplateNFT {
  id: string;
  collectionId: string;
  creator: string; // SS58 address
  price: number; // In $DOCU tokens (smallest unit)
  royaltyPercent: number; // 0-100
  ipfsHash: string;
  category: TemplateCategory;
  metadata: TemplateMetadata;
}

/**
 * Template Metadata stored on IPFS
 */
export interface TemplateMetadata {
  name: string;
  description: string;
  previewUrl?: string;
  version: string;
  tags: string[];
  createdAt: string;
}

// ============================================================
// Proof of Contract Types (Reputation Standard)
// ============================================================

/**
 * POC-1 Standard Metadata Structure
 * Embedded in system.remark of payment transactions
 */
export interface ProofOfContractMemo {
  std: "POC-1";
  hash: string; // SHA-256 of contract document
  type: string; // Category: "WebDev", "Design", "Legal", etc.
}

/**
 * Parsed Proof of Contract record from blockchain
 */
export interface ProofOfContract {
  transactionHash: string;
  blockNumber: number;
  from: string; // Client SS58 address
  to: string; // Freelancer SS58 address
  amount: string; // Amount in smallest unit
  contractHash: string; // SHA-256 of the work
  contractType: string; // Category
  timestamp: string; // ISO timestamp
}

/**
 * Aggregated reputation profile from POC-1 transactions
 */
export interface ReputationProfile {
  address: string;
  totalEarnings: string;
  contractCount: number;
  contractsByType: Record<string, number>;
  contracts: ProofOfContract[];
  lastUpdated: string;
}

// ============================================================
// Wallet & Chain Types
// ============================================================

/**
 * Supported networks for DocuMate
 */
export type NetworkId = "polkadot-asset-hub" | "westend-asset-hub" | "kilt-spiritnet" | "kilt-peregrine";

/**
 * Network configuration
 */
export interface NetworkConfig {
  id: NetworkId;
  name: string;
  endpoint: string;
  isTestnet: boolean;
  assetId?: number; // $DOCU asset ID on Asset Hub
}

/**
 * Chain connection status
 */
export interface ChainConnectionStatus {
  network: NetworkId;
  isConnected: boolean;
  blockNumber?: number;
  latency?: number;
}

// ============================================================
// AI Co-Pilot Types (Phala TEE - Mocked for MVP)
// ============================================================

/**
 * Encrypted prompt for TEE processing
 */
export interface EncryptedPrompt {
  ciphertext: string;
  nonce: string;
  publicKey: string;
}

/**
 * AI response from TEE
 */
export interface AIResponse {
  success: boolean;
  encryptedContent?: string;
  plainContent?: string; // Only in mock mode
  error?: string;
  gasUsed?: number;
}

/**
 * AI Assistant message
 */
export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isEncrypted: boolean;
}

// ============================================================
// Transaction Types
// ============================================================

/**
 * Transaction status
 */
export type TransactionStatus = "pending" | "submitted" | "included" | "finalized" | "failed";

/**
 * Transaction result
 */
export interface TransactionResult {
  status: TransactionStatus;
  hash?: string;
  blockHash?: string;
  blockNumber?: number;
  error?: string;
}

// ============================================================
// Document Automation Types
// ============================================================

/**
 * Document lifecycle states
 */
export type DocumentStatus =
  | "DRAFT"
  | "PENDING_SENDER_SIGN"
  | "PENDING_RECEIVER_SIGN"
  | "FINALIZED"
  | "REJECTED";

export type DocumentAnchorStatus = "PENDING" | "ANCHORED" | "FAILED";

/**
 * Placeholder field in a document template
 */
export interface PlaceholderField {
  key: string; // e.g., "client_name"
  label: string; // e.g., "Client Name"
  type: "text" | "date" | "address" | "number" | "textarea";
  required: boolean;
  defaultValue?: string;
}

/**
 * Document Template (Free or Purchased)
 */
export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  content: string; // Markdown with {{placeholders}}
  placeholders: PlaceholderField[];
  isFree: boolean;
  price: number; // In $DOCU (0 if free)
  creator: string; // SS58 address or "documate" for official
  royaltyPercent: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

/**
 * Signature record for a document
 */
export interface DocumentSignature {
  signer: string; // SS58 address
  signerDid?: string; // KILT DID if available
  signedAt: string; // ISO timestamp
  contentHash: string; // Hash of document at time of signing
  signature?: string; // Cryptographic signature (optional for MVP)
}

/**
 * Active Document Instance
 */
export interface DocumentInstance {
  id: string;
  templateId: string;
  templateName: string;
  sender: string; // SS58 address (document creator)
  receiver: string; // SS58 address (counterparty)
  status: DocumentStatus;

  // Content
  content: string; // Rendered content (placeholders filled)
  placeholderValues: Record<string, string>;

  // Signatures
  senderSignature?: DocumentSignature;
  receiverSignature?: DocumentSignature;

  // Finalization (on-chain proof)
  finalHash?: string; // SHA-256 of final document
  blockNumber?: number; // Block where hash was stored
  transactionHash?: string;
  anchorStatus?: DocumentAnchorStatus;
  anchorError?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
}

/**
 * DOC-1 Standard Metadata for on-chain storage
 * Embedded in system.remark when finalizing documents
 */
export interface DocumentOnChainProof {
  std: "DOC-1";
  docHash: string; // SHA-256 of final document
  sender: string; // SS58 address
  receiver: string; // SS58 address
  templateId: string;
  timestamp: string; // ISO timestamp
}

