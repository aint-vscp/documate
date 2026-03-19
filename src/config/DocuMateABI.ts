/**
 * DocuMate Contract ABI & Address
 *
 * Generated from contracts/DocuMate.sol
 * Update CONTRACT_ADDRESS after deployment with:
 *   PRIVATE_KEY=0x... npx hardhat run scripts/deploy.ts --network polkadotHub
 */

// Update this after running the deploy script
const DEFAULT_DOCUMATE_CONTRACT_ADDRESS = "0x233FE6112E5Ad4Db1c83358B30D581F837314BB1";

export const CONTRACT_ADDRESS =
    process.env.NEXT_PUBLIC_DOCUMATE_CONTRACT_ADDRESS?.trim() ||
    DEFAULT_DOCUMATE_CONTRACT_ADDRESS;

export const POLKADOT_HUB_TESTNET = {
    chainId: 420420417,
    chainIdHex: "0x190f1b41",
    name: "Polkadot Hub TestNet",
    rpcUrl: "https://eth-rpc-testnet.polkadot.io/",
    symbol: "PAS",
    decimals: 18,
    explorer: "https://blockscout-testnet.polkadot.io/",
};

export const DOCUMATE_ABI = [
    // Identity (KILT DID precompile mock)
    "function mockKiltPrecompile(address _user) external",
    "function revokeVerification(address _user) external",
    "function isVerified(address _user) external view returns (bool)",
    "function verifiedAddresses(address) external view returns (bool)",

    // Document Upload
    "function uploadDocument(string calldata _ipfsHash) external returns (uint256)",
    "function getDocument(uint256 _docId) external view returns (uint256 id, address uploader, string ipfsHash, uint256 timestamp)",
    "function getDocumentCount() external view returns (uint256)",
    "function getUserDocuments(address _user) external view returns (uint256[])",

    // Marketplace (75/20/5 split)
    "function purchase(address creator) external payable",
    "function executeTransaction(address _creator) external payable",
    "function calculateSplit(uint256 _amount) external pure returns (uint256 creatorAmount, uint256 treasuryAmount, uint256 stakingAmount)",

    // View
    "function owner() external view returns (address)",
    "function treasury() external view returns (address)",
    "function stakingPool() external view returns (address)",
    "function totalTransactions() external view returns (uint256)",
    "function totalVolume() external view returns (uint256)",
    "function getPlatformStats() external view returns (uint256 txCount, uint256 volume)",

    // Constants
    "function CREATOR_SHARE() external view returns (uint8)",
    "function TREASURY_SHARE() external view returns (uint8)",
    "function STAKING_SHARE() external view returns (uint8)",

    // Events
    "event DocumentUploaded(uint256 indexed documentId, address indexed uploader, string ipfsHash, uint256 timestamp)",
    "event TransactionExecuted(uint256 indexed txId, address indexed creator, address indexed payer, uint256 totalAmount, uint256 creatorAmount, uint256 treasuryAmount, uint256 stakingAmount)",
    "event AddressVerified(address indexed user, address indexed verifiedBy)",
    "event AddressUnverified(address indexed user, address indexed revokedBy)",
] as const;
