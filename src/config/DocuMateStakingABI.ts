/**
 * DocuMateStaking ABI - Reputation Staking & Slashing
 * Human-readable ABI for ethers.js v6
 */

// UPDATE THIS after deploying with: npx hardhat run scripts/deploy.js --network polkadotHub
export const STAKING_CONTRACT_ADDRESS = "0x1cf190eabe490B50AaBE91b4567ebe88126e8D24";

export const STAKING_ABI = [
    // Constants
    "function STAKE_AMOUNT() external view returns (uint256)",
    "function LOCK_PERIOD() external view returns (uint256)",

    // State
    "function owner() external view returns (address)",
    "function docuMateContract() external view returns (address)",
    "function isStaked(address) external view returns (bool)",
    "function stakes(address) external view returns (uint256)",
    "function stakedAt(address) external view returns (uint256)",
    "function totalStaked() external view returns (uint256)",
    "function totalSlashed() external view returns (uint256)",
    "function stakerCount() external view returns (uint256)",

    // Staking
    "function stakeReputation() external payable",
    "function unstake() external",

    // Slashing (owner only)
    "function slashStake(address _user, string calldata _reason) external",
    "function withdrawSlashed(address _treasury) external",

    // Views
    "function getStakeInfo(address _user) external view returns (bool staked, uint256 amount, uint256 since)",
    "function getPoolStats() external view returns (uint256 totalStaked, uint256 totalSlashed, uint256 poolBalance, uint256 stakerCount)",

    // Events
    "event Staked(address indexed user, uint256 amount, uint256 timestamp)",
    "event Unstaked(address indexed user, uint256 amount, uint256 timestamp)",
    "event Slashed(address indexed user, uint256 amount, string reason, uint256 timestamp)",
    "event SlashedFundsWithdrawn(address indexed treasury, uint256 amount, uint256 timestamp)",
] as const;
