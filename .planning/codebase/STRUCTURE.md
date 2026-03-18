# Codebase Structure

**Analysis Date:** 2026-03-18

## Directory Layout

```text
[project-root]/
├── src/                 # Next.js application, API routes, hooks, shared runtime modules
├── contracts/           # Solidity smart contracts and precompile interfaces
├── prisma/              # Prisma schema for sqlite-backed operational data
├── scripts/             # Deployment, smoke tests, and environment sanity scripts
├── test/                # Hardhat/contract integration tests
├── remotion/            # Demo video composition and scene components
├── docs/                # Demo/judge documentation and supporting narratives
├── artifacts/           # Hardhat compiled outputs (ABI/bytecode/build-info)
├── cache/               # Hardhat compiler cache
├── public/              # Static assets served by Next.js
├── information/         # Product and planning documents
├── hardhat.config.js    # Solidity toolchain/network configuration
├── package.json         # npm scripts and dependency graph
└── tsconfig.json        # TypeScript settings and path aliases
```

## Directory Purposes

**`src/app`:**
- Purpose: App Router UI pages, nested layouts, and HTTP route handlers.
- Contains: Route segments (`dashboard`, `admin`, `whitepaper`), API endpoints (`api/**/route.ts`), global styles and root layout.
- Key files: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/dashboard/layout.tsx`, `src/app/api/market/purchase/route.ts`.

**`src/components`:**
- Purpose: Reusable presentation components grouped by domain.
- Contains: Chain widgets, document editors/panels, marketplace visuals.
- Key files: `src/components/chain/WalletConnect.tsx`, `src/components/document/DocumentEditor.tsx`, `src/components/market/RevenueSplit.tsx`.

**`src/hooks`:**
- Purpose: Client-side state + contract/wallet integration facades.
- Contains: EVM wallet hooks, Polkadot wallet store, contract adapters.
- Key files: `src/hooks/useEVMWallet.ts`, `src/hooks/useWallet.ts`, `src/hooks/useDocuMateContract.ts`, `src/hooks/useStakingContract.ts`.

**`src/lib`:**
- Purpose: Domain/business logic and external integration helpers.
- Contains: `auth`, `db`, `document`, `phala`, `polkadot`, `reputation`, `indexer`, `security`, `contracts`.
- Key files: `src/lib/db/index.ts`, `src/lib/security/rateLimit.ts`, `src/lib/polkadot/kilt.ts`, `src/lib/contracts/marketplace.ts`.

**`src/config`:**
- Purpose: Shared constants, chain config, addresses, and ABI wiring.
- Contains: `constants.ts`, `chains.ts`, `contracts.ts`, ABI files and barrel exports.
- Key files: `src/config/constants.ts`, `src/config/DocuMateABI.ts`, `src/config/contracts.ts`, `src/config/index.ts`.

**`contracts`:**
- Purpose: Smart-contract source code for on-chain marketplace and staking logic.
- Contains: Core Solidity contracts + interface contracts for precompile interaction.
- Key files: `contracts/DocuMateMarketplace.sol`, `contracts/DocuMateStaking.sol`, `contracts/interfaces/IIdentityPrecompile.sol`.

**`prisma`:**
- Purpose: Data model and ORM contract for off-chain persistence.
- Contains: `schema.prisma` with all relational models/enums.
- Key files: `prisma/schema.prisma`.

**`scripts`:**
- Purpose: Deploy and validate runtime assumptions for demos/testnet.
- Contains: Deploy scripts, testnet smoke checks, demo fallback checks.
- Key files: `scripts/deploy-track2.js`, `scripts/testnet-smoke-track2.js`, `scripts/testnet-config-check.js`.

**`remotion`:**
- Purpose: Pitch/demo video composition pipeline.
- Contains: Root composition entry and scene components.
- Key files: `remotion/index.ts`, `remotion/Root.tsx`, `remotion/scenes/HookScene.tsx`.

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Next.js root layout entry.
- `src/app/page.tsx`: Landing/home route entry.
- `src/app/dashboard/layout.tsx`: Dashboard shell entry.
- `src/app/api/*/route.ts`: HTTP API entry points.
- `hardhat.config.js`: Contract toolchain + network entry.
- `scripts/deploy-track2.js`: Testnet deployment entry.
- `remotion/index.ts`: Remotion composition registration entry.

**Configuration:**
- `package.json`: Execution scripts (`dev`, `build`, `contracts:*`, `video:*`, `release:checklist`).
- `tsconfig.json`: Compiler options and alias `@/* -> ./src/*`.
- `next.config.mjs`: Next.js runtime/build config.
- `prisma.config.ts`: Prisma configuration.
- `tailwind.config.ts`: Tailwind token and scan config.

**Core Logic:**
- `src/lib/db/index.ts`: Prisma singleton + data access base.
- `src/lib/document/templateService.ts`: Template retrieval/business functions.
- `src/lib/polkadot/assetHub.ts`: Reputation history chain access.
- `src/lib/polkadot/kilt.ts`: DID/profile generation and persistence helpers.
- `src/lib/security/rateLimit.ts`: Reusable API throttling utility.
- `src/hooks/useDocuMateContract.ts`: EVM marketplace/stats contract adapter.

**Testing:**
- `test/documate-track2.test.js`: Smart-contract and Track 2 behavior tests.
- `scripts/testnet-smoke-track2.js`: Post-deploy chain smoke validation.
- `scripts/demo-fallback-check.js`: Demo-mode resilience checks.

## Naming Conventions

**Files:**
- Route handlers use `route.ts` in nested App Router folders: `src/app/api/market/purchase/route.ts`.
- Page/layout files follow Next.js conventions: `page.tsx`, `layout.tsx`.
- React components use PascalCase filenames: `src/components/chain/WalletConnect.tsx`.
- Hooks use camelCase with `use` prefix: `src/hooks/useEVMWallet.ts`.
- Solidity files use PascalCase contract names: `contracts/DocuMateMarketplace.sol`.

**Directories:**
- Route segment directories are lowercase kebab-case or lowercase words: `src/app/phala-proxy` (API segment), `src/app/dashboard/market`.
- Domain modules under `src/lib/` are lowercase nouns: `src/lib/reputation`, `src/lib/document`, `src/lib/security`.

## Where to Add New Code

**New Feature:**
- Primary code: Add UI routes under `src/app/dashboard/<feature>/page.tsx` for dashboard features or `src/app/<segment>/page.tsx` for top-level pages.
- API: Add HTTP handlers under `src/app/api/<feature>/route.ts` (or nested action segments).
- Domain logic: Add shared services under `src/lib/<domain>/` and export via local barrel when applicable.
- Tests: Add contract/runtime tests under `test/` and add script-based integration checks under `scripts/` when testnet behavior must be validated.

**New Component/Module:**
- Implementation: Place reusable UI under `src/components/<domain>/ComponentName.tsx`.
- Hook companion: Place feature-specific hooks under `src/hooks/use<Feature>.ts`.

**Utilities:**
- Shared helpers: Add to `src/lib/<domain>/` for domain-specific helpers, or `src/lib/index.ts` barrel exports when intended for broad reuse.
- Config constants/addresses: Add to `src/config/*.ts` rather than hardcoding in page/route files.

## Special Directories

**`artifacts`:**
- Purpose: Hardhat build artifacts (`.json` ABIs, debug metadata, build-info).
- Generated: Yes.
- Committed: Yes (present in repository tree).

**`cache`:**
- Purpose: Hardhat solidity compile cache.
- Generated: Yes.
- Committed: Yes (present in repository tree).

**`.next`:**
- Purpose: Next.js build output for local/dev runs.
- Generated: Yes.
- Committed: No (ignored in normal workflows).

**`.planning/codebase`:**
- Purpose: GSD mapping artifacts for architecture/stack/quality/concerns guidance.
- Generated: Yes.
- Committed: Expected by GSD workflow as planning state.

---

*Structure analysis: 2026-03-18*
