// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DocuMate - Decentralized Reputation & Marketplace Engine
 * @author DocuMate Team
 * @notice EVM smart contract layer for DocuMate on Polkadot Hub
 *
 * @dev Core contract for DocuMate's decentralized document verification
 * and marketplace with enforced revenue splitting.
 *
 * ARCHITECTURE NOTE: The `onlyVerified` modifier simulates what will be
 * a native precompile call to the KILT DID pallet on Polkadot Hub.
 * In production, `mockKiltPrecompile()` is replaced by a call to
 * the identity precompile at a reserved address (e.g., 0x0000...0403).
 *
 * REVENUE SPLIT (IMMUTABLE):
 *   75% -> Creator
 *   20% -> DocuMate Treasury
 *    5% -> Community Staking Pool
 */
contract DocuMate {
    // ================================================================
    // CONSTANTS - THE IRON RULES (NEVER CHANGE)
    // ================================================================

    uint8 public constant CREATOR_SHARE = 75;
    uint8 public constant TREASURY_SHARE = 20;
    uint8 public constant STAKING_SHARE = 5;

    // ================================================================
    // STATE
    // ================================================================

    address public owner;
    address public treasury;
    address public stakingPool;

    /// @dev Simulates the KILT DID verified-identity registry.
    /// In production, this mapping is replaced by a precompile call.
    mapping(address => bool) public verifiedAddresses;

    struct Document {
        uint256 id;
        address uploader;
        string ipfsHash;
        uint256 timestamp;
    }

    Document[] public documents;
    mapping(address => uint256[]) public userDocuments;

    uint256 public totalTransactions;
    uint256 public totalVolume;

    // ================================================================
    // EVENTS
    // ================================================================

    event DocumentUploaded(
        uint256 indexed documentId,
        address indexed uploader,
        string ipfsHash,
        uint256 timestamp
    );

    event TransactionExecuted(
        uint256 indexed txId,
        address indexed creator,
        address indexed payer,
        uint256 totalAmount,
        uint256 creatorAmount,
        uint256 treasuryAmount,
        uint256 stakingAmount
    );

    event AddressVerified(address indexed user, address indexed verifiedBy);

    event AddressUnverified(address indexed user, address indexed revokedBy);

    // ================================================================
    // ERRORS
    // ================================================================

    error NotOwner();
    error NotVerified();
    error ZeroAddress();
    error ZeroPayment();
    error TransferFailed(string recipient);
    error EmptyHash();

    // ================================================================
    // MODIFIERS
    // ================================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /**
     * @dev Simulates a KILT DID precompile check.
     * In production, this modifier would call the identity precompile:
     *   (bool verified, ) = IDENTITY_PRECOMPILE.staticcall(
     *       abi.encodeWithSelector(0x..., msg.sender)
     *   );
     *   require(verified, "DID not verified");
     */
    modifier onlyVerified() {
        if (!verifiedAddresses[msg.sender]) revert NotVerified();
        _;
    }

    // ================================================================
    // CONSTRUCTOR
    // ================================================================

    /**
     * @param _treasury Address receiving 20% of each transaction
     * @param _stakingPool Address receiving 5% of each transaction
     */
    constructor(address _treasury, address _stakingPool) {
        if (_treasury == address(0)) revert ZeroAddress();
        if (_stakingPool == address(0)) revert ZeroAddress();

        owner = msg.sender;
        treasury = _treasury;
        stakingPool = _stakingPool;
    }

    // ================================================================
    // IDENTITY SIMULATION (KILT DID PRECOMPILE MOCK)
    // ================================================================

    /**
     * @notice Simulates the KILT DID identity precompile verification.
     * @dev Owner-only. In production, this function is removed entirely
     * and replaced by on-chain identity precompile lookups.
     * Called automatically by the deploy script to verify the demo wallet.
     * @param _user The address to mark as identity-verified
     */
    function mockKiltPrecompile(address _user) external onlyOwner {
        if (_user == address(0)) revert ZeroAddress();
        verifiedAddresses[_user] = true;
        emit AddressVerified(_user, msg.sender);
    }

    /**
     * @notice Revoke a previously verified address.
     * @param _user The address to unverify
     */
    function revokeVerification(address _user) external onlyOwner {
        verifiedAddresses[_user] = false;
        emit AddressUnverified(_user, msg.sender);
    }

    /**
     * @notice Check if an address has a verified identity.
     * @param _user The address to check
     * @return True if the address is verified
     */
    function isVerified(address _user) external view returns (bool) {
        return verifiedAddresses[_user];
    }

    // ================================================================
    // DOCUMENT UPLOAD
    // ================================================================

    /**
     * @notice Upload a document hash to the chain.
     * @dev Only verified addresses can upload documents.
     * @param _ipfsHash The IPFS CID of the uploaded document
     * @return documentId The ID of the newly created document record
     */
    function uploadDocument(
        string calldata _ipfsHash
    ) external onlyVerified returns (uint256 documentId) {
        if (bytes(_ipfsHash).length == 0) revert EmptyHash();

        documentId = documents.length;

        documents.push(
            Document({
                id: documentId,
                uploader: msg.sender,
                ipfsHash: _ipfsHash,
                timestamp: block.timestamp
            })
        );

        userDocuments[msg.sender].push(documentId);

        emit DocumentUploaded(documentId, msg.sender, _ipfsHash, block.timestamp);
    }

    // ================================================================
    // MARKETPLACE - 75/20/5 REVENUE SPLIT
    // ================================================================

    /**
     * @notice Execute a marketplace transaction with the 75/20/5 split.
     * @dev THE IRON RULES - This split is immutable:
     *   75% -> Creator (the content/service provider)
     *   20% -> Treasury (DocuMate platform revenue)
     *    5% -> Community Staking Pool
     *
     * @param _creator The creator/seller address receiving 75%
     */
    function executeTransaction(
        address _creator
    ) external payable onlyVerified {
        if (_creator == address(0)) revert ZeroAddress();
        if (msg.value == 0) revert ZeroPayment();

        uint256 total = msg.value;

        // Calculate splits using integer math (remainder goes to staking)
        uint256 creatorAmount = (total * CREATOR_SHARE) / 100;
        uint256 treasuryAmount = (total * TREASURY_SHARE) / 100;
        uint256 stakingAmount = total - creatorAmount - treasuryAmount;

        // Execute transfers
        (bool s1, ) = _creator.call{value: creatorAmount}("");
        if (!s1) revert TransferFailed("creator");

        (bool s2, ) = treasury.call{value: treasuryAmount}("");
        if (!s2) revert TransferFailed("treasury");

        (bool s3, ) = stakingPool.call{value: stakingAmount}("");
        if (!s3) revert TransferFailed("stakingPool");

        totalTransactions++;
        totalVolume += total;

        emit TransactionExecuted(
            totalTransactions,
            _creator,
            msg.sender,
            total,
            creatorAmount,
            treasuryAmount,
            stakingAmount
        );
    }

    /**
     * @notice Preview the revenue split for a given amount.
     * @param _amount The total amount to split
     * @return creatorAmount Amount the creator receives (75%)
     * @return treasuryAmount Amount the treasury receives (20%)
     * @return stakingAmount Amount the staking pool receives (5%)
     */
    function calculateSplit(
        uint256 _amount
    )
        external
        pure
        returns (
            uint256 creatorAmount,
            uint256 treasuryAmount,
            uint256 stakingAmount
        )
    {
        creatorAmount = (_amount * CREATOR_SHARE) / 100;
        treasuryAmount = (_amount * TREASURY_SHARE) / 100;
        stakingAmount = _amount - creatorAmount - treasuryAmount;
    }

    // ================================================================
    // VIEW FUNCTIONS
    // ================================================================

    /**
     * @notice Get document details by ID.
     */
    function getDocument(
        uint256 _docId
    )
        external
        view
        returns (
            uint256 id,
            address uploader,
            string memory ipfsHash,
            uint256 timestamp
        )
    {
        Document storage doc = documents[_docId];
        return (doc.id, doc.uploader, doc.ipfsHash, doc.timestamp);
    }

    /**
     * @notice Get total number of documents uploaded.
     */
    function getDocumentCount() external view returns (uint256) {
        return documents.length;
    }

    /**
     * @notice Get all document IDs uploaded by a user.
     */
    function getUserDocuments(
        address _user
    ) external view returns (uint256[] memory) {
        return userDocuments[_user];
    }

    /**
     * @notice Get platform statistics.
     * @return txCount Total transactions processed
     * @return volume Total volume processed (in wei)
     */
    function getPlatformStats()
        external
        view
        returns (uint256 txCount, uint256 volume)
    {
        return (totalTransactions, totalVolume);
    }
}
