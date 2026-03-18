# External Integrations

**Analysis Date:** 2026-03-18

## APIs & External Services

**Blockchain RPC and Contract Services:**
- Polkadot Hub EVM RPC - EVM read/validate calls and tx verification
  - SDK/Client: `ethers` (`src/app/api/market/mint/route.ts`, `src/app/api/admin/breaches/route.ts`)
  - Auth: `POLKADOT_HUB_RPC_URL`, plus signer keys like `ADMIN_PRIVATE_KEY` or `PRIVATE_KEY`
- Polkadot Asset Hub / Westend WS endpoints - substrate side integrations
  - SDK/Client: `@polkadot/api` (`src/lib/polkadot/assetHub.ts`, `src/lib/indexer/config.ts`)
  - Auth: public RPC/WS; wallet signing via extension on client
- KILT network endpoints (Peregrine/Spiritnet) - identity-oriented network wiring
  - SDK/Client: `@polkadot/api`, optional `@kiltprotocol/sdk-js` dependency (`src/config/chains.ts`, `src/lib/polkadot/kilt.ts`)
  - Auth: wallet/chain access (no separate API key in repo)
- Phala network endpoints (PoC-6/Mainnet) - configured as target endpoints for TEE flow
  - SDK/Client: local wrapper + proxy route (`src/lib/polkadot/phala.ts`, `src/app/api/phala-proxy/route.ts`)
  - Auth: none configured in repo for external Phala API; current mode is local mock proxy

**Content and Explorer Services:**
- IPFS gateway links for evidence/template CIDs
  - SDK/Client: direct URL usage (e.g., `https://ipfs.io/ipfs/...`) in UI (`src/app/admin/breaches/page.tsx`, `src/app/admin/verification/page.tsx`)
  - Auth: none
- Block explorer and faucet URLs
  - SDK/Client: direct links (`src/config/DocuMateABI.ts`, `src/components/chain/WalletConnect.tsx`)
  - Auth: none

## Data Storage

**Databases:**
- SQLite via Prisma datasource
  - Connection: `DATABASE_URL`
  - Client: `@prisma/client` singleton in `src/lib/db/index.ts`
- Indexer config reuses same DB URL for chain indexing services
  - Connection: `DATABASE_URL` fallback to `file:./dev.db` in `src/lib/indexer/config.ts`

**File Storage:**
- Local filesystem for app assets and generated media (`public/`, `docs/demo-video.mp4`, `out/`)
- IPFS CIDs are stored/referenced as metadata values, but direct upload client is not implemented in server code (`prisma/schema.prisma`, `src/app/api/market/mint/route.ts`)

**Caching:**
- None detected (no Redis/memcached integration)

## Authentication & Identity

**Auth Provider:**
- Custom Sign-In with Polkadot (SIWP-like flow)
  - Implementation: challenge/verify endpoints with signature verification via `@polkadot/util-crypto` and cookie session token (`src/app/api/auth/challenge/route.ts`, `src/app/api/auth/verify/route.ts`, `src/lib/auth/siwp.ts`)

Additional identity integrations:
- Runtime identity precompile for verification gating in contracts (Track 2 path documented in `README.md` and deployment scripts)
- KILT light DID and self-signed VC utilities implemented locally (`src/lib/polkadot/kilt.ts`)

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry/Datadog/newrelic SDK imports)

**Logs:**
- Application/script logging through `console.*` in API routes and scripts (`src/app/api/**`, `scripts/*.js`)
- Prisma query/error logging enabled in development mode (`src/lib/db/index.ts`)
- Administrative audit trail persisted in database via `AdminLog` model (`prisma/schema.prisma`, `src/app/api/admin/**`)

## CI/CD & Deployment

**Hosting:**
- Next.js Node deployment target is implied by app structure; platform is not explicitly pinned in repo config files
- Contract deployments target Polkadot Hub testnet via Hardhat network config (`hardhat.config.js`)

**CI Pipeline:**
- Not detected (`.github/workflows/` not present)
- Validation performed through npm scripts and manual checklist automation (`package.json`, `SUBMISSION.md`)

## Environment Configuration

**Required env vars:**
- Core app/DB/contracts: `DATABASE_URL`, `POLKADOT_HUB_RPC_URL`, `MARKETPLACE_CONTRACT_ADDRESS`, `STAKING_CONTRACT_ADDRESS`
- Signing/admin operations: `PRIVATE_KEY`, `ADMIN_PRIVATE_KEY`
- Deployment/smoke overrides: `TREASURY_ADDRESS`, `BURN_ADDRESS`, `IDENTITY_PRECOMPILE`, `USE_MOCK_VERIFICATION`, `TEST_WALLET_ADDRESS`

**Secrets location:**
- Local `.env` file present in repo root (gitignored per submission checklist); template keys in `.env.example`

## Webhooks & Callbacks

**Incoming:**
- None detected (no webhook receiver routes or signature-verification handlers)

**Outgoing:**
- None detected (no webhook dispatch clients)

---

*Integration audit: 2026-03-18*