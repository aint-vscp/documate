const { ethers } = require("hardhat");

/**
 * Deploy Track 2 prototype contracts to Polkadot Hub testnet.
 *
 * Usage:
 *   $env:PRIVATE_KEY="0x..." ; npx hardhat run scripts/deploy-track2.js --network polkadotHub
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  const burnAddress = process.env.BURN_ADDRESS || "0x000000000000000000000000000000000000dEaD";
  const identityPrecompile = process.env.IDENTITY_PRECOMPILE || "0x0000000000000000000000000000000000000818";

  console.log("Deploying with:");
  console.log(`  Deployer:  ${deployer.address}`);
  console.log(`  Treasury:  ${treasuryAddress}`);
  console.log(`  Burn:      ${burnAddress}`);
  console.log(`  Identity:  ${identityPrecompile}`);

  const Staking = await ethers.getContractFactory("DocuMateStaking");
  const staking = await Staking.deploy(deployer.address);
  await staking.waitForDeployment();

  const Marketplace = await ethers.getContractFactory("DocuMateMarketplace");
  const marketplace = await Marketplace.deploy(treasuryAddress, burnAddress, identityPrecompile);
  await marketplace.waitForDeployment();

  console.log("\nDeployment complete:");
  console.log(`  DocuMateStaking:    ${await staking.getAddress()}`);
  console.log(`  DocuMateMarketplace:${await marketplace.getAddress()}`);

  console.log("\nPost-deploy testnet checklist:");
  console.log("  1. Disable mock verification: setUseMockVerification(false)");
  console.log("  2. Verify Identity precompile address for your runtime");
  console.log("  3. Configure STAKING_CONTRACT_ADDRESS and MARKETPLACE_CONTRACT_ADDRESS in backend env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
