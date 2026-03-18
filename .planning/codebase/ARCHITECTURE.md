# Architecture

**Analysis Date:** 2026-03-18

## Pattern Overview

**Overall:** Layered Next.js App Router architecture with co-located route handlers, shared domain services, and external smart-contract execution on Polkadot Hub EVM.

**Key Characteristics:**
- UI routes and API routes are co-located under `src/app/` (`page.tsx`, `layout.tsx`, `route.ts` pattern).
- Business logic is centralized in `src/lib/` modules and consumed by API routes and dashboard pages.
- Smart contract interactions are split between frontend EVM hooks (`src/hooks/useDocuMateContract.ts`, `src/hooks/useStakingContract.ts`) and Solidity contracts in `contracts/`.

## Layers

**Presentation Layer (Next.js App Router):**
- Purpose: Render landing, dashboard, admin, and whitepaper experiences.
- Location: `src/app/`
- Contains: `layout.tsx`, `page.tsx`, nested route segments such as `src/app/dashboard/*` and `src/app/admin/*`.
- Depends on: `src/components/`, `src/hooks/`, `src/lib/*` (for client-side utility calls), `src/config/*`.
- Used by: Browser clients via Next.js runtime.

**API Layer (Next.js Route Handlers):**
- Purpose: Expose backend endpoints for documents, marketplace, auth, reputation, admin, and integrations.
- Location: `src/app/api/**/route.ts`
- Contains: Request validation, rate limiting, Prisma calls, integration orchestration (`phala`, `polkadot`, auth verification).
- Depends on: `src/lib/db/index.ts`, `src/lib/security/rateLimit.ts`, `src/lib/auth/*`, `src/lib/document/*`, `src/lib/polkadot/*`, `src/lib/contracts/*`.
- Used by: Dashboard pages and other frontend clients through `fetch('/api/...')`.

**Domain/Service Layer:**
- Purpose: Encapsulate business/domain logic (document templates, auth primitives, reputation tagging, chain utilities).
- Location: `src/lib/`
- Contains: `auth`, `document`, `reputation`, `polkadot`, `phala`, `contracts`, `indexer` modules.
- Depends on: Third-party SDKs and shared types (`src/types/index.ts`).
- Used by: API layer and selected client pages.

**Data Access Layer:**
- Purpose: Persist off-chain operational state.
- Location: `src/lib/db/index.ts`, `prisma/schema.prisma`
- Contains: Prisma client singleton and relational schema (User, Template, Purchase, BreachReport, Session, etc.).
- Depends on: `@prisma/client`, sqlite datasource (`provider = "sqlite"` in `prisma/schema.prisma`).
- Used by: API routes like `src/app/api/market/purchase/route.ts`, `src/app/api/documents/route.ts`, `src/app/api/admin/*/route.ts`.

**On-Chain Contract Layer:**
- Purpose: Enforce immutable marketplace settlement and staking/slashing logic.
- Location: `contracts/`, ABI/config consumers in `src/hooks/*` and `src/config/*`.
- Contains: `contracts/DocuMateMarketplace.sol`, `contracts/DocuMateStaking.sol`, interfaces in `contracts/interfaces/`.
- Depends on: Polkadot Hub EVM runtime and identity precompile (`0x...0818` referenced in `contracts/DocuMateMarketplace.sol`).
- Used by: Client hooks `src/hooks/useDocuMateContract.ts` and `src/hooks/useStakingContract.ts`.

**Ops/Tooling Layer:**
- Purpose: Deployment, smoke-checks, and media/demo pipeline.
- Location: `scripts/`, `hardhat.config.js`, `remotion/`
- Contains: Deploy scripts (`scripts/deploy-track2.js`), testnet checks (`scripts/testnet-smoke-track2.js`), pitch video composition (`remotion/Root.tsx`).
- Depends on: Hardhat toolchain and Remotion CLI scripts in `package.json`.
- Used by: Developers and CI-style release checklist commands.

## Data Flow

**Marketplace Purchase Flow (UI → Chain → API DB Sync):**

1. User initiates purchase in `src/app/dashboard/market/page.tsx`.
2. Page calls contract through `useDocuMateContract.executeTransaction(...)` in `src/hooks/useDocuMateContract.ts`.
3. On-chain transaction executes split logic in `contracts/DocuMateMarketplace.sol` (`purchase`/`purchaseTemplate`).
4. UI posts transaction hash and purchase payload to `src/app/api/market/purchase/route.ts`.
5. API route persists purchase + ownership + counters in Prisma transaction via `src/lib/db/index.ts`.

**DID/Auth Session Flow (Wallet Signature → Session Cookie):**

1. Client requests challenge from `src/app/api/auth/challenge/route.ts`.
2. Wallet signs challenge message client-side.
3. Client submits signature to `src/app/api/auth/verify/route.ts`.
4. Route verifies SIWP primitives from `src/lib/auth/siwp.ts` (barrel exported from `src/lib/auth/index.ts`).
5. Session cookie is set with `cookies()` in `src/app/api/auth/verify/route.ts`.

**Document Storage & Retrieval Flow:**

1. Client submits/reads shared documents via `/api/documents` endpoints (`src/app/api/documents/route.ts`, `src/app/api/documents/[id]/route.ts`).
2. Route ensures table/indexes and executes SQL through Prisma raw methods.
3. Payload is normalized and converted to typed `DocumentInstance` objects from `src/types/index.ts`.
4. Response is returned as JSON to dashboard pages under `src/app/dashboard/documents/*`.

**Reputation Retrieval Flow (API Proxy to Chain):**

1. Client loads reputation endpoint `src/app/api/reputation/[id]/route.ts`.
2. Route creates chain connection using `src/lib/polkadot/assetHub.ts` exports.
3. Route fetches history and maps to API response payload.
4. Response powers profile views in `src/app/dashboard/profile/page.tsx`.

**State Management:**
- Client connection/session state uses Zustand stores in `src/hooks/useWallet.ts` and EVM hook state in `src/hooks/useEVMWallet.ts`.
- Persistent local client identity profile is stored in browser localStorage through `src/lib/polkadot/kilt.ts` (`saveUserProfile`, `loadUserProfile`).
- Server-side operational state persists in SQLite through Prisma models in `prisma/schema.prisma`.

## Key Abstractions

**Contract Hook Abstraction:**
- Purpose: Hide provider/signer wiring and contract method/selector compatibility checks.
- Examples: `src/hooks/useDocuMateContract.ts`, `src/hooks/useStakingContract.ts`
- Pattern: Hook-based façade returning high-level methods (`executeTransaction`, `verifyDID`, `stakeReputation`).

**Prisma Singleton Abstraction:**
- Purpose: Avoid client re-instantiation in dev/hot-reload contexts.
- Examples: `src/lib/db/index.ts`
- Pattern: `globalThis` guarded singleton factory (`makePrismaClient`).

**Route Guard Abstraction (Rate Limiting):**
- Purpose: Reusable in-memory request throttling for sensitive endpoints.
- Examples: `src/lib/security/rateLimit.ts`, used in `src/app/api/market/purchase/route.ts`, `src/app/api/auth/verify/route.ts`.
- Pattern: Route helper `withRateLimit(request, routeKey, config)` returning `NextResponse | null`.

**Domain Barrel Abstractions:**
- Purpose: Stabilize import surface and keep route files short.
- Examples: `src/lib/document/index.ts`, `src/lib/reputation/index.ts`, `src/lib/indexer/index.ts`, `src/config/index.ts`.
- Pattern: Barrel re-exports for module namespaces.

## Entry Points

**Web App Root:**
- Location: `src/app/layout.tsx`
- Triggers: Every app route render.
- Responsibilities: Global metadata, font loading, shared body/theme classes.

**Landing Route:**
- Location: `src/app/page.tsx`
- Triggers: `GET /`.
- Responsibilities: Product narrative, quick links into dashboard and whitepaper, wallet connect CTA.

**Dashboard Shell:**
- Location: `src/app/dashboard/layout.tsx`
- Triggers: Any `/dashboard/*` route.
- Responsibilities: Sidebar navigation, active route state, top bar wallet controls.

**API Surface:**
- Location: `src/app/api/**/route.ts`
- Triggers: HTTP requests under `/api/*`.
- Responsibilities: Validate input, call domain modules, enforce limits, perform DB/chain operations.

**Contract Deployment Entry:**
- Location: `scripts/deploy-track2.js`
- Triggers: `npx hardhat run scripts/deploy-track2.js --network polkadotHub`.
- Responsibilities: Deploy `DocuMateStaking` and `DocuMateMarketplace`, optional mock verification toggles.

**Hardhat Runtime Entry:**
- Location: `hardhat.config.js`
- Triggers: `npm run contracts:compile`, `npm run contracts:test`.
- Responsibilities: Solidity compiler settings, Polkadot Hub network, artifacts/tests path config.

## Error Handling

**Strategy:** API-first defensive validation with early returns and consistent JSON error payloads.

**Patterns:**
- Input guard clauses + HTTP status mapping (400/401/404/429/500) in route handlers such as `src/app/api/market/purchase/route.ts`.
- `try/catch` wrappers with server logging (`console.error`) in API routes and client action handlers.
- Fallback UI/data behavior in client pages (e.g., fallback templates in `src/app/dashboard/market/page.tsx`).

## Cross-Cutting Concerns

**Logging:** `console.error(...)` in API routes and client-side async handlers (e.g., `src/app/api/documents/route.ts`, `src/app/dashboard/profile/page.tsx`).
**Validation:** Regex and schema-like manual checks in route handlers (`src/app/api/market/purchase/route.ts`, `src/app/api/documents/route.ts`, `src/app/api/market/templates/route.ts`).
**Authentication:** Wallet-signature flow in `src/app/api/auth/challenge/route.ts` + `src/app/api/auth/verify/route.ts` with cookie-backed session token issuance.

---

*Architecture analysis: 2026-03-18*
