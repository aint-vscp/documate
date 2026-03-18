# DocuMate

DocuMate is a trust layer for freelance and contract work on Polkadot Hub Testnet. It converts template publishing, purchases, and breach accountability into verifiable on-chain state so disputes are settled by evidence, not screenshots.

Track: Polkadot Solidity Hackathon Track 2 (PVM Smart Contracts)
Deadline target: March 20, 2026

## Problem Statement

Contract work still breaks on trust boundaries:
- Identity claims are hard to verify at payment time.
- Revenue sharing is often off-chain and opaque.
- Proven abuse has no enforceable on-chain consequence.

DocuMate addresses these with identity-gated actions, deterministic settlement, and slashable staking.

## Track 2 Differentiator (PVM Runtime Integration)

DocuMateMarketplace performs runtime identity verification through the Polkadot Hub identity precompile at:

0x0000000000000000000000000000000000000818

The contract uses:
- identityPrecompile.staticcall(...)
- abi.encodeWithSelector(IIdentityPrecompile.identity.selector, account)

This is the critical Track 2 distinction: Solidity calling runtime-native functionality exposed by PVM precompiles. A plain EVM deployment cannot natively read Polkadot runtime identity state without an external oracle/trust bridge.

## Network and Live Contracts

- Network: Polkadot Hub Testnet
- Chain ID: 420420417
- RPC: https://eth-rpc-testnet.polkadot.io/
- Marketplace: 0x233FE6112E5Ad4Db1c83358B30D581F837314BB1
- Staking: 0x1cf190eabe490B50AaBE91b4567ebe88126e8D24

Explorer links:
- https://blockscout-testnet.polkadot.io/address/0x233FE6112E5Ad4Db1c83358B30D581F837314BB1
- https://blockscout-testnet.polkadot.io/address/0x1cf190eabe490B50AaBE91b4567ebe88126e8D24

## Local Setup

1. Install dependencies
    npm install

2. Prepare local environment
    - Copy .env.example to .env
    - Fill private values locally
    - Do not commit .env

3. Initialize Prisma and run app
    npx prisma generate
    npx prisma db push
    npm run dev

## Validation and Test Instructions

Run the final validation sequence:

1. npm audit --omit=dev
2. npm run lint
3. npm run build
4. npx hardhat test
5. npm run testnet:config-check

Expected signals:
- audit reports 0 vulnerabilities
- build includes dynamic routes for /api/market/mint and /api/market/purchase
- hardhat suite reports 5 passing tests
- config-check reports Config check passed, correct contract addresses, non-zero totalVolume and totalBurned, and 75/20/5 split output

## Documentation for Judges

- Precompile proof: docs/precompile-integration.md
- Demo flow: docs/demo-script.md
- Judge Q and A: docs/judge-qa.md
- Submission evidence checklist: SUBMISSION.md

## License

MIT
