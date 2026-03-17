# DocuMate Current Architecture (Track 2)

## Runtime Topology

- Frontend: Next.js app for dashboard, market, profile, and admin workflows.
- Backend: Next.js API routes for validation and admin breach actions.
- Smart contracts: Solidity contracts on Polkadot Hub testnet.

## Smart Contract Layer

- `DocuMateMarketplace.sol`
  - Template mint/list/purchase flows.
  - Deterministic revenue split logic.
  - Verification gate (`onlyVerified`) with mock/precompile mode toggle.

- `DocuMateStaking.sol`
  - Reputation stake lock.
  - Breach reporting.
  - Admin validation and slashing lifecycle.

## Verification and Trust Layer

- Identity verification in marketplace:
  - Demo mode: owner-managed mock verification map.
  - Production path: precompile-backed verification call.

- Document validation API:
  - Parses PDF signature structures.
  - Attempts PKCS#7/CMS verification.
  - Assigns trust tier based on cryptographic evidence.

## Data and App Layer

- Prisma models for users, templates, purchases, and breach records.
- Admin breach endpoint can trigger on-chain slash transaction when configured.
- Frontend reads configured contract addresses and calls contracts via ethers.js.

## Operational Validation

- `test/documate-track2.test.js`: contract behavior regression checks.
- `scripts/testnet-smoke-track2.js`: live deploy + interaction smoke flow.
- `scripts/testnet-config-check.js`: read-state and config consistency checks.
- `scripts/demo-fallback-check.js`: read-only proof for demo resiliency.
