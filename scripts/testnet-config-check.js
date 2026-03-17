const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const rpc = process.env.POLKADOT_HUB_RPC_URL || "https://eth-rpc-testnet.polkadot.io/";
  const marketplaceAddress = process.env.MARKETPLACE_CONTRACT_ADDRESS;
  const stakingAddress = process.env.STAKING_CONTRACT_ADDRESS;
  const pk = process.env.PRIVATE_KEY;

  if (!marketplaceAddress || !stakingAddress || !pk) {
    throw new Error("Missing MARKETPLACE_CONTRACT_ADDRESS, STAKING_CONTRACT_ADDRESS, or PRIVATE_KEY in .env");
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);

  const marketplace = new ethers.Contract(
    marketplaceAddress,
    [
      "function owner() view returns (address)",
      "function treasury() view returns (address)",
      "function isVerified(address) view returns (bool)",
      "function totalVolume() view returns (uint256)",
      "function totalBurned() view returns (uint256)",
      "function calculateSplit(uint256) pure returns (uint256,uint256,uint256)",
    ],
    wallet
  );

  const staking = new ethers.Contract(
    stakingAddress,
    [
      "function owner() view returns (address)",
      "function getPoolStats() view returns (uint256,uint256,uint256,uint256)",
    ],
    wallet
  );

  const [mOwner, treasury, verified, totalVolume, totalBurned, split, sOwner, poolStats] = await Promise.all([
    marketplace.owner(),
    marketplace.treasury(),
    marketplace.isVerified(wallet.address),
    marketplace.totalVolume(),
    marketplace.totalBurned(),
    marketplace.calculateSplit(ethers.parseEther("1")),
    staking.owner(),
    staking.getPoolStats(),
  ]);

  console.log("Config check passed.");
  console.log("Wallet:", wallet.address);
  console.log("Marketplace:", marketplaceAddress);
  console.log("  owner:", mOwner);
  console.log("  treasury:", treasury);
  console.log("  isVerified(wallet):", verified);
  console.log("  totalVolume(wei):", totalVolume.toString());
  console.log("  totalBurned(wei):", totalBurned.toString());
  console.log("  split(1 PAS):", split[0].toString(), split[1].toString(), split[2].toString());
  console.log("Staking:", stakingAddress);
  console.log("  owner:", sOwner);
  console.log("  pool(totalStaked,totalSlashed,balance,stakerCount):", poolStats.map((x) => x.toString()));
}

main().catch((e) => {
  console.error("Config check failed:", e);
  process.exitCode = 1;
});
