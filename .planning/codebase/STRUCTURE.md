# Codebase Structure

**Analysis Date:** 2026-03-18

## Directory Layout

```text
[project-root]/
├── src/                    # Next.js application code (UI, API routes, services, hooks, configs, types)
├── prisma/                 # Prisma schema for operational/off-chain data model
├── contracts/              # Solidity contracts and contract-side interfaces/Rust marketplace experiment
├── test/                   # Hardhat contract tests
├── scripts/                # Deployment and environment smoke/check scripts
├── remotion/               # Video composition source for hackathon assets
├── docs/                   # Demo scripts and judge-facing support docs
├── information/            # Product/business/planning notes
├── public/                 # Static assets served by Next.js
├── artifacts/              # Hardhat build artifacts (generated)
├── cache/                  # Hardhat cache (generated)
├── package.json            # Monorepo-like command surface for app/contracts/video
├── next.config.mjs         # Next.js runtime/security header config
├── hardhat.config.js       # Solidity compiler/network/test config
└── tsconfig.json           # TypeScript compiler and path alias config
```

## Directory Purposes

**src/app:**
- Purpose: Next.js App Router entrypoints and route trees.
- Contains: `layout.tsx`, `page.tsx`, nested page routes, API handlers under `api/**/route.ts`.
- Key files: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/dashboard/layout.tsx`, `src/app/admin/layout.tsx`.

**src/app/api:**
- Purpose: Server API boundary.
- Contains: Route handlers by domain (`auth`, `documents`, `market`, `admin`, `reputation`, etc.).
- Key files: `src/app/api/auth/challenge/route.ts`, `src/app/api/auth/verify/route.ts`, `src/app/api/documents/route.ts`, `src/app/api/market/purchase/route.ts`, `src/app/api/reputation/[id]/route.ts`.

**src/components:**
- Purpose: Reusable UI components.
- Contains: Domain subfolders (`chain`, `document`, `market`) and barrel exports.
- Key files: `src/components/chain/WalletConnect.tsx`, `src/components/document/DocumentEditor.tsx`, `src/components/market/RevenueSplit.tsx`.

**src/hooks:**
- Purpose: Client-side state and integration hooks.
- Contains: Wallet and contract interaction hooks.
- Key files: `src/hooks/useWallet.ts`, `src/hooks/useDocuMateContract.ts`, `src/hooks/useEVMWallet.ts`, `src/hooks/useStakingContract.ts`.

**src/lib:**
- Purpose: Service and integration layer shared by routes/components.
- Contains: Domain modules (`auth`, `db`, `document`, `polkadot`, `phala`, `contracts`, `security`, `reputation`, `indexer`).
- Key files: `src/lib/db/index.ts`, `src/lib/auth/siwp.ts`, `src/lib/document/templateService.ts`, `src/lib/document/documentStore.ts`, `src/lib/polkadot/assetHub.ts`, `src/lib/security/rateLimit.ts`.

**src/config:**
- Purpose: Chain/contract constants and ABI references.
- Contains: Chain IDs, constants, contract addresses, ABI exports.
- Key files: `src/config/contracts.ts`, `src/config/chains.ts`, `src/config/DocuMateABI.ts`, `src/config/DocuMateStakingABI.ts`.

**src/types:**
- Purpose: Shared TypeScript contracts used across app/services/routes.
- Contains: Identity, document, marketplace, network, transaction types.
- Key files: `src/types/index.ts`.

**prisma:**
- Purpose: Schema and DB model source.
- Contains: Prisma schema declarations for users, templates, purchases, admin/audit systems.
- Key files: `prisma/schema.prisma`.

**contracts:**
- Purpose: On-chain logic and blockchain integration artifacts source.
- Contains: Solidity contracts and interface files; `contracts/marketplace/` includes Rust package scaffolding.
- Key files: `contracts/DocuMateMarketplace.sol`, `contracts/DocuMate.sol`, `contracts/DocuMateStaking.sol`, `contracts/interfaces/IIdentityPrecompile.sol`.

**test:**
- Purpose: Hardhat EVM test suite.
- Contains: Contract behavior tests (e.g., revenue split, verification gates, staking/breach flows).
- Key files: `test/documate-track2.test.js`.

**scripts:**
- Purpose: Deployment and testnet readiness scripts.
- Contains: Deploy scripts and validation checks.
- Key files: `scripts/deploy.js`, `scripts/deploy-track2.js`, `scripts/testnet-smoke-track2.js`, `scripts/testnet-config-check.js`.

**remotion:**
- Purpose: Video composition source for demo and pitch output.
- Contains: Composition root, scene files, media assets.
- Key files: `remotion/index.ts`, `remotion/Root.tsx`, `remotion/HackathonDemoVideo.tsx`, `remotion/PitchVideo.tsx`.

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Global app layout and metadata.
- `src/app/page.tsx`: Landing page root.
- `src/app/dashboard/layout.tsx`: Dashboard shell entry.
- `src/app/admin/layout.tsx`: Admin shell and access gating.
- `remotion/index.ts`: Remotion root registration.
- `hardhat.config.js`: Contract project execution entry.

**Configuration:**
- `package.json`: Build/dev/test script entry commands.
- `tsconfig.json`: TypeScript options and `@/*` alias.
- `next.config.mjs`: Response headers and CSP.
- `prisma.config.ts`: Prisma runtime config.
- `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`: Styling/lint tooling.

**Core Logic:**
- `src/lib/auth/siwp.ts`: SIWP auth lifecycle.
- `src/lib/document/templateService.ts`: Template catalog/rendering.
- `src/lib/document/documentStore.ts`: Local-first document persistence/sync.
- `src/lib/polkadot/assetHub.ts`: Chain connection and POC scan logic.
- `src/lib/phala/signatureValidator.ts`: PDF signature validation.
- `src/lib/contracts/marketplace.ts`: Marketplace domain constants and client wrapper.

**Testing:**
- `test/documate-track2.test.js`: Contract validation tests.

## Naming Conventions

**Files:**
- Next.js route files use framework conventions: `page.tsx`, `layout.tsx`, `route.ts`.
- React components use PascalCase filenames: `WalletConnect.tsx`, `TemplateGallery.tsx`.
- Hooks use `useX` camelCase naming: `useWallet.ts`, `useDocuMateContract.ts`.
- Service/helper modules use camelCase filenames: `templateService.ts`, `documentStore.ts`, `rateLimit.ts`.
- Solidity contracts use PascalCase filenames: `DocuMateMarketplace.sol`.

**Directories:**
- Route/domain folders use lowercase and kebab-case where needed: `src/app/api/phala-proxy`, `src/app/api/validate-document`.
- Dynamic route segments use bracket notation: `src/app/api/reputation/[id]`, `src/app/dashboard/documents/[id]`.
- Domain grouping is by concern (`auth`, `document`, `market`, `security`) rather than technical type-only folders.

## Where to Add New Code

**New Feature (UI + API + data):**
- Primary code: add page under `src/app/dashboard/<feature>/page.tsx` (or admin route under `src/app/admin/<feature>/page.tsx`).
- API handler: add endpoint at `src/app/api/<feature>/route.ts` or nested `src/app/api/<domain>/<feature>/route.ts`.
- Service logic: place domain functions in `src/lib/<domain>/` and keep route file orchestration-thin.
- Shared types: extend `src/types/index.ts`.
- Tests: add contract tests in `test/*.test.js` for on-chain behavior; add script checks under `scripts/` when operational validation is needed.

**New Component/Module:**
- Implementation: `src/components/<domain>/<ComponentName>.tsx`.
- Barrel export update: `src/components/<domain>/index.ts`.
- If reusable across domains, prefer `src/components/<new-domain>/` over adding to `src/app/**`.

**Utilities:**
- Shared server/client helpers: `src/lib/<domain>/`.
- Chain/contract constants and addresses: `src/config/`.
- Environment-sensitive runtime wrappers (db, rate limits, adapters): keep in `src/lib/` to avoid leaking into page components.

## Special Directories

**artifacts:**
- Purpose: Hardhat contract build artifacts/metadata.
- Generated: Yes.
- Committed: Yes (currently present in repository).

**cache:**
- Purpose: Hardhat compile cache.
- Generated: Yes.
- Committed: Yes (currently present in repository).

**.next:**
- Purpose: Next.js build output and generated types.
- Generated: Yes.
- Committed: No (build/runtime local output).

**node_modules:**
- Purpose: Installed dependencies.
- Generated: Yes.
- Committed: No.

**.planning/codebase:**
- Purpose: Generated codebase mapping docs consumed by GSD planning/execution workflows.
- Generated: Yes.
- Committed: Optional workflow artifact (currently maintained in workspace).

---

*Structure analysis: 2026-03-18*
