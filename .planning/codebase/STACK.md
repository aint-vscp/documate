# Technology Stack

**Analysis Date:** 2026-03-18

## Languages

**Primary:**
- TypeScript (strict mode) - Next.js app, API routes, hooks, and libraries in `src/` (`tsconfig.json`, `src/app/**`, `src/lib/**`)
- JavaScript (Node/CommonJS + ESM configs) - Hardhat config and operational scripts in `hardhat.config.js`, `scripts/*.js`, and tool configs like `next.config.mjs`

**Secondary:**
- Solidity 0.8.24 - Smart contracts in `contracts/DocuMate.sol`, `contracts/DocuMateMarketplace.sol`, `contracts/DocuMateStaking.sol`
- Rust (edition 2021) - ink! marketplace prototype in `contracts/marketplace/lib.rs` with manifest in `contracts/marketplace/Cargo.toml`
- CSS - global styles and Tailwind pipeline in `src/app/globals.css` and `tailwind.config.ts`

## Runtime

**Environment:**
- Node.js runtime for Next.js server routes and scripts (version not pinned in repo; no `.nvmrc` detected)
- Browser runtime for React client and wallet integrations (e.g., `ethers.BrowserProvider` in `src/hooks/useDocuMateContract.ts`)

**Package Manager:**
- npm (commands and lockfile present via `package-lock.json` and scripts in `package.json`)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Next.js `^16.1.7` - full-stack web app and API routing (`package.json`, `src/app/**`)
- React `^19.0.0` + React DOM `^19.0.0` - UI rendering (`package.json`, `src/components/**`)
- Prisma Client `^6.19.2` - database ORM access (`src/lib/db/index.ts`, `src/app/api/**`)
- ethers `^6.16.0` - EVM JSON-RPC and contract interaction (`src/app/api/market/mint/route.ts`, `src/app/api/admin/breaches/route.ts`)
- Polkadot SDKs (`@polkadot/api`, `@polkadot/api-contract`, `@polkadot/extension-dapp`) - chain RPC and extension interactions (`src/lib/polkadot/**`, `src/hooks/useWallet.ts`)

**Testing:**
- Hardhat test runner (`hardhat` `^2.28.6`, `@nomicfoundation/hardhat-toolbox` `^5.0.0`) for contract tests (`test/documate-track2.test.js`)

**Build/Dev:**
- Hardhat - Solidity compile/test/deploy (`hardhat.config.js`, `scripts/deploy-track2.js`)
- Tailwind CSS + PostCSS - styling pipeline (`tailwind.config.ts`, `postcss.config.mjs`)
- ESLint 9 + `eslint-config-next` - linting (`eslint.config.mjs`, `package.json`)
- Remotion (`remotion`, `@remotion/cli`, `@remotion/player`, `@remotion/renderer`) - demo video assets (`remotion/**`, `remotion.config.ts`)

## Key Dependencies

**Critical:**
- `next` `^16.1.7` - web app runtime and API framework
- `react` `^19.0.0` / `react-dom` `^19.0.0` - front-end rendering
- `ethers` `^6.16.0` - EVM contract reads/writes against Polkadot Hub RPC
- `@prisma/client` `^6.19.2` and `prisma` `^6.19.2` - SQLite-backed operational persistence
- `@polkadot/api` `^16.5.4` - substrate RPC and chain interactions

**Infrastructure:**
- `dotenv` `^17.3.1` - env loading for scripts/configs (`hardhat.config.js`, `scripts/*.js`, `prisma.config.ts`)
- `zustand` `^5.0.0` - client state management
- `node-forge` `^1.3.1` - crypto utility dependency
- `@kiltprotocol/sdk-js` `^1.0.0` - KILT SDK dependency (custom light DID implementation is currently used in `src/lib/polkadot/kilt.ts`)
- `@libsql/client` `^0.17.0` - declared, but no active imports detected in `src/**`

## Configuration

**Environment:**
- Runtime/database env configured via `process.env` in app and scripts (`src/lib/db/index.ts`, `src/lib/indexer/config.ts`, `scripts/*.js`)
- Baseline env var names provided in `.env.example` (`DATABASE_URL`, `PRIVATE_KEY`, `ADMIN_PRIVATE_KEY`, `POLKADOT_HUB_RPC_URL`, `MARKETPLACE_CONTRACT_ADDRESS`, `STAKING_CONTRACT_ADDRESS`)
- Additional script-level env toggles used in deployment/smoke flows (`TREASURY_ADDRESS`, `BURN_ADDRESS`, `IDENTITY_PRECOMPILE`, `USE_MOCK_VERIFICATION`, `TEST_WALLET_ADDRESS`)

**Build:**
- App build config: `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `tailwind.config.ts`
- Smart contract build config: `hardhat.config.js`
- Prisma config: `prisma.config.ts` + schema in `prisma/schema.prisma`
- Remotion render config: `remotion.config.ts`

## Platform Requirements

**Development:**
- Node.js + npm toolchain for Next.js, Hardhat, Prisma, and Remotion (`package.json` scripts)
- Local SQLite file configured by default (`DATABASE_URL="file:./dev.db"` in `.env.example`)
- Browser wallet extension support for Polkadot/EVM flows (`src/hooks/useWallet.ts`, `src/hooks/useEVMWallet.ts`)

**Production:**
- Next.js-compatible Node hosting target (no repo-specific platform lock-in file detected)
- Access to Polkadot Hub RPC and related chain endpoints from `src/config/chains.ts`
- Secure env/secrets management required for private keys referenced by server/admin routes (`src/app/api/admin/breaches/route.ts`, `scripts/testnet-smoke-track2.js`)

---

*Stack analysis: 2026-03-18*