# External Integrations

**Analysis Date:** 2026-03-18

## APIs & External Services

**Blockchain Networks (EVM + Substrate):**
- Polkadot Hub Testnet EVM RPC - Contract reads/writes and tx verification.
  - SDK/Client: `ethers` in `src/app/api/market/mint/route.ts`, `src/app/api/admin/breaches/route.ts`, `scripts/testnet-config-check.js`.
  - Auth: `PRIVATE_KEY`/`ADMIN_PRIVATE_KEY` for signing flows in `hardhat.config.js`, `src/app/api/admin/breaches/route.ts`.
- Asset Hub WS endpoints - Polkadot API connections for balances/POC tx flows.
  - SDK/Client: `@polkadot/api` in `src/lib/polkadot/assetHub.ts`.
  - Auth: Wallet extension signer (`@polkadot/extension-dapp`) in `src/hooks/useWallet.ts`.
- KILT network endpoints (Spiritnet/Peregrine) - DID/credential-related network configuration.
  - SDK/Client: endpoint definitions in `src/lib/polkadot/kilt.ts`, `src/config/chains.ts`.
  - Auth: No external provider token detected; uses wallet/identity data.
- Phala endpoints and mock TEE API surface - AI/validation integration path.
  - SDK/Client: local proxy route in `src/app/api/phala-proxy/route.ts`, helper in `src/lib/polkadot/phala.ts`, endpoint constants in `src/lib/polkadot/phala.ts`.
  - Auth: Not detected for MVP mock mode.

**Public Infrastructure/Reference Services:**
- Block explorer links (`blockscout`, `subscan`) in UI/config: `src/config/DocuMateABI.ts`, `src/config/chains.ts`, `src/app/dashboard/market/page.tsx`.
- IPFS gateway links used for viewing assets (`ipfs.io`) in admin UI pages: `src/app/admin/verification/page.tsx`, `src/app/admin/breaches/page.tsx`.

## Data Storage

**Databases:**
- SQLite (primary app DB through Prisma)
  - Connection: `DATABASE_URL` (`prisma.config.ts`, `src/lib/indexer/config.ts`).
  - Client: Prisma (`@prisma/client`) in `src/lib/db/index.ts`.
- Shared document table persisted through Prisma raw SQL APIs
  - Implementation: `src/app/api/documents/route.ts`, `src/app/api/documents/[id]/route.ts`.

**File Storage:**
- Local filesystem only for repository/runtime assets.
- IPFS CIDs are stored as metadata fields (`ipfsCid`, `previewCid`) in `prisma/schema.prisma`; no direct IPFS upload client implementation detected in `src/**`.

**Caching:**
- Browser local/session storage used for client-side state/documents (`src/lib/document/documentStore.ts`, `src/app/dashboard/filing/page.tsx`, `src/hooks/useWallet.ts`, `src/hooks/useEVMWallet.ts`).
- No Redis/Memcached integration detected.

## Authentication & Identity

**Auth Provider:**
- Custom wallet-based Sign-In With Polkadot (SIWP).
  - Implementation: challenge/signature/session logic in `src/lib/auth/siwp.ts`.
  - API endpoints: `src/app/api/auth/challenge/route.ts`, `src/app/api/auth/verify/route.ts`.
  - Session transport: HTTP-only cookie `session_token` in `src/app/api/auth/verify/route.ts`.

**Identity Verification:**
- Runtime precompile identity checks for marketplace contracts (Track 2 path) documented in `docs/precompile-integration.md` and implemented in Solidity contract layer (`contracts/DocuMateMarketplace.sol`, `contracts/interfaces/IIdentityPrecompile.sol`).

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry/DataDog/New Relic integration files/imports found).

**Logs:**
- Console logging in API routes and scripts (`console.error`/`console.log`) across `src/app/api/**` and `scripts/**`.
- Admin activity persisted in DB via `AdminLog` model updates (for selected actions) in routes such as `src/app/api/admin/breaches/route.ts` and `src/app/api/market/mint/route.ts`.

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured in-repo. Next.js app is buildable via npm scripts in `package.json`.

**CI Pipeline:**
- Not detected (`.github/workflows/*` not present).
- Release validation is script-driven locally via `release:checklist` in `package.json`.

## Environment Configuration

**Required env vars:**
- Chain/RPC: `POLKADOT_HUB_RPC_URL`.
- Contract addresses: `MARKETPLACE_CONTRACT_ADDRESS`, `STAKING_CONTRACT_ADDRESS`.
- Signing/admin keys: `PRIVATE_KEY`, `ADMIN_PRIVATE_KEY`.
- DB/runtime: `DATABASE_URL`, `NODE_ENV`.
- Deployment behavior: `TREASURY_ADDRESS`, `BURN_ADDRESS`, `IDENTITY_PRECOMPILE`, `USE_MOCK_VERIFICATION`, `TEST_WALLET_ADDRESS`, `DOCUMATE_NETWORK`.
- Evidence: `hardhat.config.js`, `prisma.config.ts`, `scripts/deploy-track2.js`, `scripts/testnet-config-check.js`, `src/app/api/market/mint/route.ts`, `src/app/api/admin/breaches/route.ts`, `src/config/contracts.ts`.

**Secrets location:**
- Environment-file based setup indicated by `.env.example` and `dotenv` usage in `hardhat.config.js`, `prisma.config.ts`, and scripts under `scripts/**`.

## Webhooks & Callbacks

**Incoming:**
- None detected in implemented API routes (`src/app/api/**`).
- A webhook path appears only in documentation (`ARCHITECTURE.md`) and no corresponding source route exists under `src/app/api`.

**Outgoing:**
- Chain RPC/contract calls to Polkadot Hub via `ethers` (`src/app/api/market/mint/route.ts`, `src/app/api/admin/breaches/route.ts`).
- Internal service calls from browser to app endpoints: `/api/documents`, `/api/documents/[id]`, `/api/phala-proxy` in `src/lib/document/documentStore.ts` and `src/lib/polkadot/phala.ts`.

---

*Integration audit: 2026-03-18*
