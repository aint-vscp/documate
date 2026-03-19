const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const rpc = process.env.POLKADOT_HUB_RPC_URL || "https://eth-rpc-testnet.polkadot.io/";
  const pk = process.env.PRIVATE_KEY;
  const walletAddressFromEnv = process.env.TEST_WALLET_ADDRESS;
  const marketplaceAddress = process.env.MARKETPLACE_CONTRACT_ADDRESS;
  const stakingAddress = process.env.STAKING_CONTRACT_ADDRESS;

  if (!marketplaceAddress || !stakingAddress) {
    throw new Error("Missing MARKETPLACE_CONTRACT_ADDRESS or STAKING_CONTRACT_ADDRESS in .env");
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const network = await provider.getNetwork();
  const wallet = pk ? new ethers.Wallet(pk, provider) : null;
  const walletAddress = walletAddressFromEnv || wallet?.address || ethers.ZeroAddress;

  const marketplace = new ethers.Contract(
    marketplaceAddress,
    [
      "function owner() view returns (address)",
      "function treasury() view returns (address)",
      "function isVerified(address) view returns (bool)",
      "function calculateSplit(uint256) pure returns (uint256,uint256,uint256)",
      "function totalVolume() view returns (uint256)",
      "function totalBurned() view returns (uint256)"
    ],
    provider
  );

  const staking = new ethers.Contract(
    stakingAddress,
    [
      "function owner() view returns (address)",
      "function getPoolStats() view returns (uint256,uint256,uint256,uint256)"
    ],
    provider
  );

  const [mOwner, treasury, verified, split, totalVolume, totalBurned, sOwner, pool] = await Promise.all([
    marketplace.owner(),
    marketplace.treasury(),
    marketplace.isVerified(walletAddress),
    marketplace.calculateSplit(ethers.parseEther("1")),
    marketplace.totalVolume(),
    marketplace.totalBurned(),
    staking.owner(),
    staking.getPoolStats()
  ]);

  console.log("Demo fallback check passed.");
  console.log("Network chainId:", network.chainId.toString());
  console.log("Wallet:", walletAddress);
  console.log("Marketplace:", marketplaceAddress);
  console.log("  owner:", mOwner);
  console.log("  treasury:", treasury);
  console.log("  isVerified(wallet):", verified);
  console.log("  split(1 PAS):", split[0].toString(), split[1].toString(), split[2].toString());
  console.log("  totalVolume:", totalVolume.toString());
  console.log("  totalBurned:", totalBurned.toString());
  console.log("Staking:", stakingAddress);
  console.log("  owner:", sOwner);
  console.log("  pool(totalStaked,totalSlashed,balance,stakerCount):", pool.map((x) => x.toString()));
}

main().catch((error) => {
  console.error("Demo fallback check failed:", error);
  process.exitCode = 1;
});
