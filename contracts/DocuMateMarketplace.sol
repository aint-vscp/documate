// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IIdentityPrecompile} from "./interfaces/IIdentityPrecompile.sol";

/**
 * @title DocuMateMarketplace
 * @notice Solidity migration of the marketplace core for PVM deployment.
 */
contract DocuMateMarketplace {
    uint256 public constant CREATOR_SHARE = 75;
    uint256 public constant TREASURY_SHARE = 20;
    uint256 public constant BURN_SHARE = 5;

    address public constant DEFAULT_BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    address public constant DEFAULT_IDENTITY_PRECOMPILE = 0x0000000000000000000000000000000000000818;

    address public owner;
    address public treasury;
    address public burnAddress;
    address public identityPrecompile;

    bool public useMockVerification;
    mapping(address => bool) public mockVerified;

    struct Template {
        uint256 id;
        address creator;
        address owner;
        uint256 price;
        string ipfsCid;
        string category;
        bool isListed;
        uint256 salesCount;
        uint256 createdAt;
    }

    uint256 public nextTemplateId = 1;
    uint256 public totalVolume;
    uint256 public totalBurned;

    mapping(uint256 => Template) public templates;
    mapping(address => uint256[]) public userTemplates;

    event TemplateMinted(uint256 indexed templateId, address indexed creator, uint256 price, string ipfsCid);
    event TemplatePurchased(
        uint256 indexed templateId,
        address indexed buyer,
        address indexed seller,
        uint256 totalPrice,
        uint256 creatorAmount,
        uint256 treasuryAmount,
        uint256 burnAmount
    );
    event RevenueSplitExecuted(
        address indexed buyer,
        address indexed creator,
        uint256 totalAmount,
        uint256 creatorAmount,
        uint256 treasuryAmount,
        uint256 burnAmount
    );
    event MockVerificationUpdated(address indexed account, bool verified);
    event VerificationModeUpdated(bool useMockVerification);

    error NotOwner();
    error NotVerified();
    error ZeroAddress();
    error InvalidPrice();
    error ZeroPayment();
    error TemplateNotFound();
    error NotTemplateOwner();
    error NotListed();
    error CannotBuyOwnTemplate();
    error InsufficientPayment();
    error TransferFailed(string recipient);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyVerified() {
        if (!_isVerified(msg.sender)) revert NotVerified();
        _;
    }

    constructor(address _treasury, address _burnAddress, address _identityPrecompile) {
        if (_treasury == address(0)) revert ZeroAddress();
        owner = msg.sender;
        treasury = _treasury;
        burnAddress = _burnAddress == address(0) ? DEFAULT_BURN_ADDRESS : _burnAddress;
        identityPrecompile = _identityPrecompile == address(0) ? DEFAULT_IDENTITY_PRECOMPILE : _identityPrecompile;

        // Mock mode is enabled for local tests and can be disabled on testnet/mainnet.
        useMockVerification = true;
    }

    function setUseMockVerification(bool enabled) external onlyOwner {
        useMockVerification = enabled;
        emit VerificationModeUpdated(enabled);
    }

    function setMockVerified(address account, bool verified) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        mockVerified[account] = verified;
        emit MockVerificationUpdated(account, verified);
    }

    function setIdentityPrecompile(address precompile) external onlyOwner {
        if (precompile == address(0)) revert ZeroAddress();
        identityPrecompile = precompile;
    }

    function mintTemplate(
        string calldata ipfsCid,
        string calldata category,
        uint256 price
    ) external onlyVerified returns (uint256 templateId) {
        if (bytes(ipfsCid).length == 0) revert InvalidPrice();
        if (price == 0) revert InvalidPrice();

        templateId = nextTemplateId++;

        templates[templateId] = Template({
            id: templateId,
            creator: msg.sender,
            owner: msg.sender,
            price: price,
            ipfsCid: ipfsCid,
            category: category,
            isListed: true,
            salesCount: 0,
            createdAt: block.timestamp
        });

        userTemplates[msg.sender].push(templateId);

        emit TemplateMinted(templateId, msg.sender, price, ipfsCid);
    }

    /// @notice Exact split entry point requested by the migration spec.
    /// @dev 75% Creator, 20% Treasury, 5% Burn.
    function purchase(address creator) external payable onlyVerified {
        if (creator == address(0)) revert ZeroAddress();
        if (msg.value == 0) revert ZeroPayment();

        uint256 amount = msg.value;
        (uint256 creatorAmount, uint256 treasuryAmount, uint256 burnAmount) = _calculateSplit(amount);

        _safeTransfer(payable(creator), creatorAmount, "creator");
        _safeTransfer(payable(treasury), treasuryAmount, "treasury");
        _safeTransfer(payable(burnAddress), burnAmount, "burn");

        totalVolume += amount;
        totalBurned += burnAmount;

        emit RevenueSplitExecuted(msg.sender, creator, amount, creatorAmount, treasuryAmount, burnAmount);
    }

    function purchaseTemplate(uint256 templateId) external payable onlyVerified {
        Template storage template = templates[templateId];
        if (template.id == 0) revert TemplateNotFound();
        if (!template.isListed) revert NotListed();
        if (template.owner == msg.sender) revert CannotBuyOwnTemplate();
        if (msg.value < template.price) revert InsufficientPayment();

        address seller = template.owner;
        uint256 totalPrice = template.price;
        (uint256 creatorAmount, uint256 treasuryAmount, uint256 burnAmount) = _calculateSplit(totalPrice);

        _safeTransfer(payable(template.creator), creatorAmount, "creator");
        _safeTransfer(payable(treasury), treasuryAmount, "treasury");
        _safeTransfer(payable(burnAddress), burnAmount, "burn");

        template.owner = msg.sender;
        template.isListed = false;
        template.salesCount += 1;

        userTemplates[msg.sender].push(templateId);

        totalVolume += totalPrice;
        totalBurned += burnAmount;

        if (msg.value > totalPrice) {
            _safeTransfer(payable(msg.sender), msg.value - totalPrice, "refund");
        }

        emit TemplatePurchased(
            templateId,
            msg.sender,
            seller,
            totalPrice,
            creatorAmount,
            treasuryAmount,
            burnAmount
        );
    }

    function listTemplate(uint256 templateId, uint256 price) external {
        Template storage template = templates[templateId];
        if (template.id == 0) revert TemplateNotFound();
        if (template.owner != msg.sender) revert NotTemplateOwner();
        if (price == 0) revert InvalidPrice();

        template.price = price;
        template.isListed = true;
    }

    function delistTemplate(uint256 templateId) external {
        Template storage template = templates[templateId];
        if (template.id == 0) revert TemplateNotFound();
        if (template.owner != msg.sender) revert NotTemplateOwner();

        template.isListed = false;
    }

    function calculateSplit(uint256 amount)
        external
        pure
        returns (uint256 creatorAmount, uint256 treasuryAmount, uint256 burnAmount)
    {
        return _calculateSplit(amount);
    }

    function isVerified(address account) external view returns (bool) {
        return _isVerified(account);
    }

    function _isVerified(address account) internal view returns (bool) {
        if (useMockVerification) {
            return mockVerified[account];
        }

        // We use a low-level staticcall to avoid tight coupling with full runtime structs.
        // The first 32-byte word in the return payload corresponds to `isValid`.
        (bool ok, bytes memory data) = identityPrecompile.staticcall(
            abi.encodeWithSelector(IIdentityPrecompile.identity.selector, account)
        );

        if (!ok || data.length < 32) {
            return false;
        }

        return abi.decode(data, (bool));
    }

    function _calculateSplit(uint256 amount)
        internal
        pure
        returns (uint256 creatorAmount, uint256 treasuryAmount, uint256 burnAmount)
    {
        creatorAmount = (amount * CREATOR_SHARE) / 100;
        treasuryAmount = (amount * TREASURY_SHARE) / 100;
        burnAmount = amount - creatorAmount - treasuryAmount;
    }

    function _safeTransfer(address payable recipient, uint256 amount, string memory recipientLabel) internal {
        (bool sent, ) = recipient.call{value: amount}("");
        if (!sent) revert TransferFailed(recipientLabel);
    }
}
