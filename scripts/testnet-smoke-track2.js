const { ethers } = require("ethers");
require("dotenv").config();

const STAKING_ARTIFACT = require("../artifacts/contracts/DocuMateStaking.sol/DocuMateStaking.json");
const MARKETPLACE_ARTIFACT = require("../artifacts/contracts/DocuMateMarketplace.sol/DocuMateMarketplace.json");

async function main() {
  const rpc = process.env.POLKADOT_HUB_RPC_URL || "https://eth-rpc-testnet.polkadot.io/";
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("Missing PRIVATE_KEY in .env");
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const network = await provider.getNetwork();

  if (Number(network.chainId) !== 420420417) {
    throw new Error(`Refusing to run: expected chainId 420420417, got ${network.chainId.toString()}`);
  }

  const deployer = new ethers.Wallet(privateKey, provider);

  const balance = await provider.getBalance(deployer.address);
  console.log("Deployer:", deployer.address);
  console.log("Balance (PAS):", ethers.formatEther(balance));

  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  const burnAddress = process.env.BURN_ADDRESS || "0x000000000000000000000000000000000000dEaD";
  const identityPrecompile = process.env.IDENTITY_PRECOMPILE || "0x0000000000000000000000000000000000000818";

  console.log("\n1) Deploying contracts...");
  const StakingFactory = new ethers.ContractFactory(
    STAKING_ARTIFACT.abi,
    STAKING_ARTIFACT.bytecode,
    deployer
  );
  const staking = await StakingFactory.deploy(deployer.address);
  await staking.waitForDeployment();

  const MarketplaceFactory = new ethers.ContractFactory(
    MARKETPLACE_ARTIFACT.abi,
    MARKETPLACE_ARTIFACT.bytecode,
    deployer
  );
  const marketplace = await MarketplaceFactory.deploy(treasuryAddress, burnAddress, identityPrecompile);
  await marketplace.waitForDeployment();

  const stakingAddress = await staking.getAddress();
  const marketplaceAddress = await marketplace.getAddress();

  console.log("DocuMateStaking:", stakingAddress);
  console.log("DocuMateMarketplace:", marketplaceAddress);

  console.log("\n2) Verifying deployer in mock identity mode...");
  let tx = await marketplace.setUseMockVerification(true);
  await tx.wait();
  tx = await marketplace.setMockVerified(deployer.address, true);
  await tx.wait();
  const verified = await marketplace.isVerified(deployer.address);
  console.log("isVerified(deployer):", verified);

  console.log("\n3) Minting template...");
  tx = await marketplace.mintTemplate("ipfs://smoke-template", "LEGAL", ethers.parseEther("0.0001"));
  const mintReceipt = await tx.wait();
  console.log("Mint tx:", mintReceipt.hash);

  console.log("\n4) Testing payable purchase split...");
  tx = await marketplace.purchase(deployer.address, { value: ethers.parseEther("0.00005") });
  const purchaseReceipt = await tx.wait();
  console.log("Purchase tx:", purchaseReceipt.hash);

  console.log("\n5) Testing staking + breach + slash flow...");
  const requiredStake = ethers.parseEther("50");
  const latestBalance = await provider.getBalance(deployer.address);

  if (latestBalance > requiredStake) {
    tx = await staking.stakeReputation({ value: requiredStake });
    const stakeReceipt = await tx.wait();
    console.log("Stake tx:", stakeReceipt.hash);

    tx = await staking.reportBreach(deployer.address, "smoke-test breach report");
    const breachReceipt = await tx.wait();
    console.log("Report breach tx:", breachReceipt.hash);

    tx = await staking.validateBreach(1, true);
    const validateReceipt = await tx.wait();
    console.log("Validate breach tx:", validateReceipt.hash);

    const stakeInfo = await staking.getStakeInfo(deployer.address);
    console.log("Stake active after slash:", stakeInfo[0]);
    console.log("Stake amount after slash:", stakeInfo[1].toString());
  } else {
    console.log("Skipping staking/slashing: insufficient balance for 50 PAS stake.");
  }

  console.log("\nSmoke test complete.");
  console.log("Explorer links:");
  console.log("Staking:", `https://blockscout-testnet.polkadot.io/address/${stakingAddress}`);
  console.log("Marketplace:", `https://blockscout-testnet.polkadot.io/address/${marketplaceAddress}`);
}

main().catch((error) => {
  console.error("Smoke test failed:", error);
  process.exitCode = 1;
});
