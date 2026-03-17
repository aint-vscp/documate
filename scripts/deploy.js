const { ethers } = require("hardhat");

/**
 * DocuMate Deployment Script
 * Deploys DocuMateStaking + DocuMate contracts to Polkadot Hub testnet.
 * The staking contract is deployed first so its address can be passed
 * to DocuMate as the `stakingPool`.
 *
 * Usage:
 *   $env:PRIVATE_KEY="0x..." ; npx hardhat run scripts/deploy.js --network polkadotHub
 */
async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("=".repeat(60));
    console.log("DocuMate Full Deployment - Polkadot Hub Testnet");
    console.log("=".repeat(60));
    console.log(`Deployer: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Balance:  ${ethers.formatEther(balance)} PAS`);

    if (balance === 0n) {
        console.error("ERROR: Deployer has zero balance. Fund with PAS testnet tokens first.");
        process.exit(1);
    }

    const treasuryAddress = deployer.address;
    console.log(`Treasury: ${treasuryAddress}`);
    console.log("");

    // ================================================================
    // Step 1: Deploy DocuMateStaking
    // ================================================================

    console.log("Step 1: Deploying DocuMateStaking contract...");
    const Staking = await ethers.getContractFactory("DocuMateStaking");
    // Pass deployer as docuMateContract placeholder -- we'll update the reference
    // conceptually after DocuMate is deployed. The staking contract only uses
    // this for informational purposes, not for calling.
    const stakingContract = await Staking.deploy(deployer.address);
    await stakingContract.waitForDeployment();

    const stakingAddress = await stakingContract.getAddress();
    console.log(`Staking contract deployed at: ${stakingAddress}`);
    console.log(`Explorer: https://blockscout-testnet.polkadot.io/address/${stakingAddress}`);
    console.log("");

    // ================================================================
    // Step 2: Deploy DocuMate with real staking pool address
    // ================================================================

    console.log("Step 2: Deploying DocuMate contract...");
    const DocuMate = await ethers.getContractFactory("DocuMate");
    const docuMateContract = await DocuMate.deploy(treasuryAddress, stakingAddress);
    await docuMateContract.waitForDeployment();

    const docuMateAddress = await docuMateContract.getAddress();
    console.log(`DocuMate contract deployed at: ${docuMateAddress}`);
    console.log(`Explorer: https://blockscout-testnet.polkadot.io/address/${docuMateAddress}`);
    console.log("");

    // ================================================================
    // Step 3: Auto-verify deployer wallet
    // ================================================================

    console.log("Step 3: Calling mockKiltPrecompile() to verify deployer...");
    const tx = await docuMateContract.mockKiltPrecompile(deployer.address);
    const receipt = await tx.wait();
    console.log(`Verification TX: ${receipt?.hash}`);

    const isVerified = await docuMateContract.isVerified(deployer.address);
    console.log(`Deployer verified: ${isVerified}`);

    // ================================================================
    // Summary
    // ================================================================

    console.log("");
    console.log("=".repeat(60));
    console.log("DEPLOYMENT COMPLETE");
    console.log("=".repeat(60));
    console.log("");
    console.log("Contract Addresses:");
    console.log(`  DocuMate:        ${docuMateAddress}`);
    console.log(`  DocuMateStaking: ${stakingAddress}`);
    console.log("");
    console.log("Next steps:");
    console.log(`  1. Update CONTRACT_ADDRESS in src/config/DocuMateABI.ts`);
    console.log(`     Address: ${docuMateAddress}`);
    console.log(`  2. Update STAKING_CONTRACT_ADDRESS in src/config/DocuMateStakingABI.ts`);
    console.log(`     Address: ${stakingAddress}`);
    console.log(`  3. Start the frontend: npm run dev`);
    console.log(`  4. Open http://localhost:3000/dashboard`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
