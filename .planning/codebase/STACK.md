# Technology Stack

**Analysis Date:** 2026-03-18

## Languages

**Primary:**
- TypeScript - App and API implementation in `src/app`, `src/lib`, `src/hooks`, `src/components`.
- JavaScript - Tooling and scripts in `hardhat.config.js`, `scripts/deploy-track2.js`, `scripts/testnet-config-check.js`, `test/documate-track2.test.js`.

**Secondary:**
- Solidity (0.8.24) - Smart contracts in `contracts/DocuMate.sol`, `contracts/DocuMateMarketplace.sol`, `contracts/DocuMateStaking.sol`.
- Rust (edition 2021) - Ink! contract crate in `contracts/marketplace/Cargo.toml`, `contracts/marketplace/lib.rs`.
- CSS - Styling in `src/app/globals.css` with Tailwind config in `tailwind.config.ts`.

## Runtime

**Environment:**
- Node.js runtime for Next.js server routes, explicitly set in `src/app/api/validate-document/route.ts` (`runtime = "nodejs"`).
- Browser runtime for wallet and storage flows (`window`, `localStorage`, `sessionStorage`) in `src/hooks/useWallet.ts`, `src/hooks/useEVMWallet.ts`, `src/lib/document/documentStore.ts`.

**Package Manager:**
- npm (scripts defined in `package.json`).
- Lockfile: present (`package-lock.json`, lockfileVersion 3).

## Frameworks

**Core:**
- Next.js `^16.1.7` - App Router web app and API routes (`src/app/**`, dependency in `package.json`).
- React `^19.0.0` - UI layer (`src/app/**`, `src/components/**`, dependency in `package.json`).
- Prisma `^6.19.2` - ORM/database client (`prisma/schema.prisma`, `src/lib/db/index.ts`).

**Testing:**
- Hardhat test runner + Mocha/Chai via `@nomicfoundation/hardhat-toolbox` (`hardhat.config.js`, `test/documate-track2.test.js`).

**Build/Dev:**
- TypeScript `^5` (`tsconfig.json`, dependency in `package.json`).
- ESLint `^9` + `eslint-config-next` (`eslint.config.mjs`, lint script in `package.json`).
- Tailwind CSS `^3.4.0` + PostCSS (`tailwind.config.ts`, `postcss.config.mjs`).
- Hardhat `^2.28.6` for Solidity compile/test/deploy (`hardhat.config.js`, scripts in `package.json`).
- Remotion `^4.0.435` for pitch/demo video assets (`remotion.config.ts`, `remotion/index.ts`, scripts in `package.json`).

## Key Dependencies

**Critical:**
- `next`, `react`, `react-dom` - Web application runtime (`package.json`).
- `@prisma/client` - Data access layer used by API routes (`src/lib/db/index.ts`, `src/app/api/**/route.ts`).
- `ethers` - EVM RPC/contract interactions for server and client flows (`src/app/api/market/mint/route.ts`, `src/app/api/admin/breaches/route.ts`, `src/hooks/useDocuMateContract.ts`).
- `@polkadot/api` and `@polkadot/extension-dapp` - Polkadot/Substrate chain and wallet integration (`src/lib/polkadot/assetHub.ts`, `src/hooks/useWallet.ts`, `src/lib/auth/siwp.ts`).

**Infrastructure:**
- `dotenv` - Environment loading in node scripts/config (`hardhat.config.js`, `prisma.config.ts`, `scripts/testnet-config-check.js`).
- `node-forge` - PKCS#7/PAdES PDF signature verification (`src/lib/phala/signatureValidator.ts`).
- `zustand` - Client-side wallet state store (`src/hooks/useWallet.ts`, `src/hooks/useEVMWallet.ts`).
- `@polkadot/api-contract` - Dynamic contract wrappers for Substrate contract calls (`src/lib/contracts/marketplace.ts`).
- `@libsql/client` and `@kiltprotocol/sdk-js` are declared in `package.json`; direct imports were not detected in `src/**`.

## Configuration

**Environment:**
- Configured through environment variables consumed by app/server/scripts:
  - Chain and contracts: `POLKADOT_HUB_RPC_URL`, `MARKETPLACE_CONTRACT_ADDRESS`, `STAKING_CONTRACT_ADDRESS`, `DOCUMATE_NETWORK` (`src/app/api/market/mint/route.ts`, `src/app/api/admin/breaches/route.ts`, `src/config/contracts.ts`).
  - Secrets/keys: `PRIVATE_KEY`, `ADMIN_PRIVATE_KEY` (`hardhat.config.js`, `scripts/testnet-smoke-track2.js`, `src/app/api/admin/breaches/route.ts`).
  - Database/runtime: `DATABASE_URL`, `NODE_ENV` (`prisma.config.ts`, `src/lib/indexer/config.ts`, `src/lib/db/index.ts`).
  - Deployment toggles: `TREASURY_ADDRESS`, `BURN_ADDRESS`, `IDENTITY_PRECOMPILE`, `USE_MOCK_VERIFICATION`, `TEST_WALLET_ADDRESS` (`scripts/deploy-track2.js`, `scripts/testnet-config-check.js`).
- `.env.example` is present at repo root for environment setup.

**Build:**
- Next config and security headers: `next.config.mjs`.
- TypeScript config: `tsconfig.json`.
- ESLint config: `eslint.config.mjs`.
- Tailwind/PostCSS config: `tailwind.config.ts`, `postcss.config.mjs`.
- Hardhat config: `hardhat.config.js`.
- Prisma config/schema: `prisma.config.ts`, `prisma/schema.prisma`.
- Remotion config: `remotion.config.ts`.

## Platform Requirements

**Development:**
- Node.js + npm toolchain (`package.json` scripts).
- Polkadot-compatible wallet extension for client auth/signing (`src/hooks/useWallet.ts`, `src/lib/auth/siwp.ts`).
- Local SQLite database via Prisma (`prisma/schema.prisma`, `prisma.config.ts`).
- Access to Polkadot Hub Testnet RPC for on-chain features (`hardhat.config.js`, `src/app/api/market/mint/route.ts`).

**Production:**
- Node.js hosting for Next.js app/API routes.
- Reliable RPC connectivity to configured EVM endpoint(s) (`POLKADOT_HUB_RPC_URL`) and optional WS endpoints for Substrate integrations (`src/lib/polkadot/assetHub.ts`, `src/lib/indexer/config.ts`).
- Environment variable secret management for keys and contract addresses.

---

*Stack analysis: 2026-03-18*
