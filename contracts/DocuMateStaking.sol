// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DocuMateStaking - Reputation Staking & Slashing
 * @author DocuMate Team
 * @notice Reputation staking and slashing for DocuMate on Polkadot Hub
 *
 * @dev Users lock 50 PAS to back their reputation. If a breach report is
 * validated by an admin, the stake is slashed (confiscated). This creates
 * financial consequences for lying or fraud on the platform.
 *
 * This contract also serves as the `stakingPool` address for DocuMate.sol,
 * receiving 5% of every marketplace transaction via `receive()`.
 *
 * STAKING RULES:
 *   - Stake amount: 50 PAS (fixed)
 *   - Lock period: 7 days minimum
 *   - Slashing: 100% of stake on confirmed breach
 *   - Slashed funds: Held in contract, withdrawable to treasury by owner
 */
contract DocuMateStaking {
    // ================================================================
    // CONSTANTS
    // ================================================================

    /// @notice Fixed stake amount: 50 PAS
    uint256 public constant STAKE_AMOUNT = 50 ether;

    /// @notice Minimum lock period before unstaking
    uint256 public constant LOCK_PERIOD = 7 days;

    // ================================================================
    // STATE
    // ================================================================

    address public owner;
    address public docuMateContract;

    mapping(address => uint256) public stakes;
    mapping(address => bool) public isStaked;
    mapping(address => uint256) public stakedAt;

    uint256 public totalStaked;
    uint256 public totalSlashed;
    uint256 public stakerCount;

    struct BreachReport {
        uint256 id;
        address reporter;
        address target;
        string reason;
        bool resolved;
        bool confirmed;
        uint256 createdAt;
        uint256 resolvedAt;
    }

    uint256 public breachCount;
    mapping(uint256 => BreachReport) public breachReports;

    // ================================================================
    // EVENTS
    // ================================================================

    event Staked(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );

    event Unstaked(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );

    event Slashed(
        address indexed user,
        uint256 amount,
        string reason,
        uint256 timestamp
    );

    event SlashedFundsWithdrawn(
        address indexed treasury,
        uint256 amount,
        uint256 timestamp
    );

    event BreachReported(
        uint256 indexed breachId,
        address indexed reporter,
        address indexed target,
        string reason,
        uint256 timestamp
    );

    event BreachValidated(
        uint256 indexed breachId,
        bool confirmed,
        address indexed validator,
        uint256 timestamp
    );

    // ================================================================
    // ERRORS
    // ================================================================

    error NotOwner();
    error AlreadyStaked();
    error NotStaked();
    error InvalidAmount();
    error StakeLocked();
    error TransferFailed();
    error NothingToWithdraw();
    error ZeroAddress();
    error BreachNotFound();
    error BreachAlreadyResolved();

    // ================================================================
    // MODIFIERS
    // ================================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ================================================================
    // CONSTRUCTOR
    // ================================================================

    /**
     * @param _docuMateContract Address of the main DocuMate contract
     */
    constructor(address _docuMateContract) {
        if (_docuMateContract == address(0)) revert ZeroAddress();
        owner = msg.sender;
        docuMateContract = _docuMateContract;
    }

    /**
     * @notice Accept incoming PAS from the DocuMate 5% staking split.
     */
    receive() external payable {}

    // ================================================================
    // STAKING
    // ================================================================

    /**
     * @notice Stake 50 PAS to back your reputation.
     * @dev Exactly STAKE_AMOUNT must be sent. One stake per address.
     */
    function stakeReputation() external payable {
        if (isStaked[msg.sender]) revert AlreadyStaked();
        if (msg.value != STAKE_AMOUNT) revert InvalidAmount();

        stakes[msg.sender] = msg.value;
        isStaked[msg.sender] = true;
        stakedAt[msg.sender] = block.timestamp;
        totalStaked += msg.value;
        stakerCount++;

        emit Staked(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Withdraw your stake after the lock period.
     * @dev Must wait at least LOCK_PERIOD (7 days) after staking.
     */
    function unstake() external {
        if (!isStaked[msg.sender]) revert NotStaked();
        if (block.timestamp < stakedAt[msg.sender] + LOCK_PERIOD) revert StakeLocked();

        uint256 amount = stakes[msg.sender];
        stakes[msg.sender] = 0;
        isStaked[msg.sender] = false;
        stakedAt[msg.sender] = 0;
        totalStaked -= amount;
        stakerCount--;

        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Unstaked(msg.sender, amount, block.timestamp);
    }

    // ================================================================
    // SLASHING (ADMIN ONLY)
    // ================================================================

    /**
     * @notice Slash a user's stake after a confirmed breach report.
     * @dev Owner-only. Called when an admin confirms a breach via
     * the admin panel. Slashed funds remain in the contract until
     * withdrawn to treasury.
     *
     * @param _user The address whose stake to slash
     * @param _reason Human-readable reason for the slash
     */
    function slashStake(address _user, string calldata _reason) external onlyOwner {
        _slash(_user, _reason);
    }

    /**
     * @notice Report a suspected breach by a staked user.
     * @param _target The accused user address
     * @param _reason The report reason/evidence summary
     * @return breachId Created breach report id
     */
    function reportBreach(address _target, string calldata _reason) external returns (uint256 breachId) {
        if (_target == address(0)) revert ZeroAddress();

        breachId = ++breachCount;
        breachReports[breachId] = BreachReport({
            id: breachId,
            reporter: msg.sender,
            target: _target,
            reason: _reason,
            resolved: false,
            confirmed: false,
            createdAt: block.timestamp,
            resolvedAt: 0
        });

        emit BreachReported(breachId, msg.sender, _target, _reason, block.timestamp);
    }

    /**
     * @notice Validate breach report. If confirmed, slashes target stake.
     * @dev Admin-only action intended to be triggered by your admin review flow.
     */
    function validateBreach(uint256 _breachId, bool _confirmed) external onlyOwner {
        BreachReport storage breach = breachReports[_breachId];
        if (breach.id == 0) revert BreachNotFound();
        if (breach.resolved) revert BreachAlreadyResolved();

        breach.resolved = true;
        breach.confirmed = _confirmed;
        breach.resolvedAt = block.timestamp;

        if (_confirmed) {
            _slash(breach.target, breach.reason);
        }

        emit BreachValidated(_breachId, _confirmed, msg.sender, block.timestamp);
    }

    /**
     * @notice Withdraw slashed funds to the treasury.
     * @dev Only the excess balance (slashed funds + marketplace 5%) over
     * active stakes can be withdrawn.
     *
     * @param _treasury The treasury address to receive the funds
     */
    function withdrawSlashed(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();

        uint256 withdrawable = address(this).balance - totalStaked;
        if (withdrawable == 0) revert NothingToWithdraw();

        (bool success, ) = _treasury.call{value: withdrawable}("");
        if (!success) revert TransferFailed();

        emit SlashedFundsWithdrawn(_treasury, withdrawable, block.timestamp);
    }

    // ================================================================
    // VIEW FUNCTIONS
    // ================================================================

    /**
     * @notice Get staking info for a user.
     * @param _user The address to check
     * @return staked Whether the user has an active stake
     * @return amount The staked amount (0 if not staked)
     * @return since Timestamp when the stake was placed (0 if not staked)
     */
    function getStakeInfo(
        address _user
    )
        external
        view
        returns (
            bool staked,
            uint256 amount,
            uint256 since
        )
    {
        return (isStaked[_user], stakes[_user], stakedAt[_user]);
    }

    /**
     * @notice Get overall staking pool statistics.
     * @return _totalStaked Total PAS currently staked
     * @return _totalSlashed Total PAS slashed to date
     * @return poolBalance Current contract balance (stakes + slashed + 5% fees)
     * @return _stakerCount Number of active stakers
     */
    function getPoolStats()
        external
        view
        returns (
            uint256 _totalStaked,
            uint256 _totalSlashed,
            uint256 poolBalance,
            uint256 _stakerCount
        )
    {
        return (totalStaked, totalSlashed, address(this).balance, stakerCount);
    }

    function _slash(address _user, string memory _reason) internal {
        if (!isStaked[_user]) revert NotStaked();

        uint256 amount = stakes[_user];
        stakes[_user] = 0;
        isStaked[_user] = false;
        stakedAt[_user] = 0;
        totalStaked -= amount;
        totalSlashed += amount;
        stakerCount--;

        emit Slashed(_user, amount, _reason, block.timestamp);
    }
}
