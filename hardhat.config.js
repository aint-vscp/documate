require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/**
 * Hardhat Configuration for DocuMate
 * Targeting Polkadot Hub EVM (Track 2: PVM Smart Contracts)
 *
 * Polkadot Hub Testnet:
 *   Chain ID: 420420417
 *   RPC: https://eth-rpc-testnet.polkadot.io/
 *   Symbol: PAS
 *   Explorer: https://blockscout-testnet.polkadot.io/
 */

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            evmVersion: "paris",
        },
    },
    networks: {
        polkadotHub: {
            url: "https://eth-rpc-testnet.polkadot.io/",
            chainId: 420420417,
            accounts: process.env.PRIVATE_KEY
                ? [process.env.PRIVATE_KEY]
                : [],
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};
