# Judge Q and A Cheat Sheet

## Why Polkadot Hub instead of a plain EVM chain?

DocuMate reads runtime identity state through a PVM precompile call from Solidity. The _isVerified function calls identityPrecompile.staticcall with IIdentityPrecompile.identity.selector. That runtime path is the Track 2 differentiator.

## What proves this is Track 2 and not mock mode?

- DEFAULT_IDENTITY_PRECOMPILE is set to 0x0000000000000000000000000000000000000818.
- Constructor sets useMockVerification = false.
- testnet config-check shows isVerified(wallet): false for zero address, which is expected under real runtime verification.

## What does the product do in one sentence?

DocuMate is a trust and enforcement layer for contract work: identity-gated templates, deterministic 75/20/5 settlement, and slashable staking for proven abuse.

## How do you prove contracts are live on testnet?

From npm run testnet:config-check:
- Config check passed.
- Marketplace and staking addresses match deployment targets.
- totalVolume and totalBurned are non-zero.
- split(1 PAS) returns the 75/20/5 values.

## What are the exact deployed addresses?

- Marketplace: 0x233FE6112E5Ad4Db1c83358B30D581F837314BB1
- Staking: 0x1cf190eabe490B50AaBE91b4567ebe88126e8D24
- Chain ID: 420420417

## How do you handle abuse or bad actors?

1. onlyVerified gates sensitive marketplace actions.
2. Purchases enforce a deterministic 75/20/5 split.
3. Breach validation can trigger slashStake behavior in staking flow.

## Is the stack production-minded?

Current proof points:
- npm audit --omit=dev reports 0 vulnerabilities.
- npm run lint passes.
- npm run build passes with expected API routes.
- npx hardhat test reports 5 passing tests.

## What is next after hackathon?

1. Harden and expand identity-proof UX on runtime verification path.
2. Improve reputation indexing and risk scoring.
3. Expand pilot integrations for real contract workflows.
