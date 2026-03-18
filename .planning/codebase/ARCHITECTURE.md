# Architecture

**Analysis Date:** 2026-03-18

## Pattern Overview

**Overall:** Next.js App Router modular monolith with domain-organized service modules and hybrid on-chain/off-chain execution.

**Key Characteristics:**
- Route-driven application boundary: UI pages and API handlers are defined under `src/app/**` (`page.tsx`, `layout.tsx`, `route.ts`).
- Domain service modules under `src/lib/**` encapsulate auth, chain calls, document operations, validation, and rate limiting.
- Dual persistence model: relational/off-chain operational state in Prisma SQLite (`prisma/schema.prisma` + `src/lib/db/index.ts`) and blockchain state via EVM + Polkadot clients (`contracts/*.sol`, `src/lib/polkadot/assetHub.ts`, `src/hooks/useDocuMateContract.ts`).

## Layers

**Presentation Layer (App Router UI):**
- Purpose: Render user and admin experiences; trigger API calls and wallet-driven actions.
- Location: `src/app/page.tsx`, `src/app/dashboard/**`, `src/app/admin/**`, `src/app/whitepaper/page.tsx`.
- Contains: Client components, dashboard/admin layouts, page-level state and user flows.
- Depends on: `src/components/**`, `src/hooks/**`, browser `fetch` to `/api/*`.
- Used by: Browser clients.

**Component and Hook Layer:**
- Purpose: Reusable UI widgets and client-side adapters for wallet/contract interactions.
- Location: `src/components/**`, `src/hooks/**`.
- Contains: Wallet UI (`src/components/chain/WalletConnect.tsx`), feature widgets, Zustand wallet store (`src/hooks/useWallet.ts`), ethers contract hook (`src/hooks/useDocuMateContract.ts`).
- Depends on: `src/config/**`, external SDKs (`ethers`, `@polkadot/extension-dapp`, `zustand`).
- Used by: App Router pages/layouts.

**API Route Layer:**
- Purpose: Server-side orchestration, validation, rate limiting, persistence, and chain adapter calls.
- Location: `src/app/api/**/route.ts`.
- Contains: CRUD and workflow endpoints for auth, documents, market, admin, directory, reputation, validation.
- Depends on: `src/lib/**`, `src/types/index.ts`, `next/server`.
- Used by: UI pages, client-side stores, and admin dashboard.

**Domain Service Layer:**
- Purpose: Business logic and integration wrappers independent of route files.
- Location: `src/lib/auth/**`, `src/lib/document/**`, `src/lib/contracts/**`, `src/lib/phala/**`, `src/lib/polkadot/**`, `src/lib/security/**`, `src/lib/reputation/**`, `src/lib/indexer/**`.
- Contains: SIWP auth flow, template rendering/store, chain utilities, PDF signature verification, in-memory rate limiter, indexer exports.
- Depends on: Prisma client, Polkadot SDK, ethers, node-forge, browser APIs (for client-side localStorage modules).
- Used by: API handlers and some client components/hooks.

**Persistence Layer:**
- Purpose: Model and access off-chain operational data.
- Location: `prisma/schema.prisma`, `src/lib/db/index.ts`.
- Contains: User, Session, Template, Purchase, verification, breach, reputation tag, indexer state models.
- Depends on: SQLite datasource via `DATABASE_URL`.
- Used by: API routes (`src/app/api/**/route.ts`) and admin stats workflows.

**Smart Contract Layer (Track 2):**
- Purpose: Enforce on-chain economics and staking mechanics.
- Location: `contracts/DocuMate.sol`, `contracts/DocuMateMarketplace.sol`, `contracts/DocuMateStaking.sol`, ABI/config files in `src/config/*.ts`.
- Contains: Revenue split logic, template mint/purchase logic, staking and breach validation.
- Depends on: Hardhat build/test pipeline (`hardhat.config.js`, `test/documate-track2.test.js`).
- Used by: On-chain clients in hooks and deployment scripts.

## Data Flow

**Flow: Wallet Auth (SIWP)**

1. Client requests challenge via `POST /api/auth/challenge` (`src/app/api/auth/challenge/route.ts`).
2. Route applies rate limit (`src/lib/security/rateLimit.ts`) and creates challenge via `generateChallenge` (`src/lib/auth/siwp.ts`).
3. Client signs message in wallet extension and submits to `POST /api/auth/verify` (`src/app/api/auth/verify/route.ts`).
4. Route parses/validates message (`parseSignInMessage`), verifies signature (`verifySignedChallenge`), creates session (`createSession`), then sets `session_token` cookie.

**Flow: Document Create/Sync/Fetch**

1. UI builds document/template content using `src/lib/document/templateService.ts` and local state in `src/lib/document/documentStore.ts`.
2. Client syncs document to shared storage via `POST /api/documents` (`src/app/api/documents/route.ts`).
3. Route ensures `SharedDocument` table, upserts serialized payload through Prisma raw SQL.
4. Client fetches merged data via `GET /api/documents?walletAddress=...` and merges by latest update (`mergeByLatestUpdate` in `src/lib/document/documentStore.ts`).

**Flow: Marketplace Purchase and Revenue Split**

1. UI triggers purchase through contract hook (`src/hooks/useDocuMateContract.ts`) and/or API record endpoint.
2. Server endpoint `POST /api/market/purchase` (`src/app/api/market/purchase/route.ts`) validates request + rate limit.
3. Route loads template/user records via Prisma, prevents self-purchase, computes split using constants from `src/lib/contracts/marketplace.ts`.
4. Transaction persists purchase + ownership + sales counter in a Prisma transaction.
5. On-chain economic enforcement path is validated in `test/documate-track2.test.js` against `contracts/DocuMateMarketplace.sol`.

**Flow: Reputation Lookup**

1. Client requests `GET /api/reputation/[id]` (`src/app/api/reputation/[id]/route.ts`).
2. Route creates/caches WS connection via `createAssetHubConnection` (`src/lib/polkadot/assetHub.ts`).
3. Service scans recent blocks and parses POC-1 memo patterns via `fetchReputationHistory`.
4. Endpoint returns aggregated profile data.

**State Management:**
- UI/session-like wallet state uses Zustand persisted store (`src/hooks/useWallet.ts`).
- Long-lived operational state uses Prisma/SQLite (`prisma/schema.prisma`).
- Collaborative document cache is hybrid: browser localStorage + server `SharedDocument` table (`src/lib/document/documentStore.ts`, `src/app/api/documents/route.ts`).
- Chain connection state is cached in-memory in `apiCache` map (`src/lib/polkadot/assetHub.ts`).

## Key Abstractions

**AuthChallenge / AuthSession Abstraction:**
- Purpose: Standardize SIWP challenge/session artifacts.
- Examples: `AuthChallenge`, `AuthSession` interfaces in `src/lib/auth/siwp.ts`.
- Pattern: Stateless creation/verification helpers consumed by thin route handlers.

**Document Template + Instance Abstraction:**
- Purpose: Separate template definitions from in-flight document instances.
- Examples: `DocumentTemplate`, `DocumentInstance` in `src/types/index.ts`; implementations in `src/lib/document/templateService.ts` and `src/lib/document/documentStore.ts`.
- Pattern: Local-first document authoring with server sync endpoint.

**Revenue Split Abstraction:**
- Purpose: Keep 75/20/5 split centralized and reused between client preview and server records.
- Examples: `REVENUE_SPLIT` and split calculators in `src/lib/contracts/marketplace.ts`; server usage in `src/app/api/market/purchase/route.ts`.
- Pattern: Shared constants + deterministic math mirrored across on-chain/off-chain boundaries.

**Rate-Limited Endpoint Wrapper:**
- Purpose: Provide consistent anti-abuse behavior in public API routes.
- Examples: `withRateLimit` in `src/lib/security/rateLimit.ts`; route usage in `src/app/api/auth/challenge/route.ts`, `src/app/api/auth/verify/route.ts`, `src/app/api/market/purchase/route.ts`.
- Pattern: Route-level guard called before business logic.

## Entry Points

**Web App Entry:**
- Location: `src/app/layout.tsx`, `src/app/page.tsx`.
- Triggers: Browser requests to site root.
- Responsibilities: Global metadata/fonts/styles and landing experience.

**Dashboard Entry:**
- Location: `src/app/dashboard/layout.tsx`.
- Triggers: Requests to `/dashboard/**` routes.
- Responsibilities: Shared dashboard shell, navigation, and wallet controls.

**Admin Entry:**
- Location: `src/app/admin/layout.tsx`.
- Triggers: Requests to `/admin/**` routes.
- Responsibilities: Wallet-gated admin shell and stats fetch orchestration.

**API Boundary Entry:**
- Location: `src/app/api/**/route.ts`.
- Triggers: HTTP requests from UI/scripts.
- Responsibilities: Input validation, rate limiting, delegation to services/db, response shaping.

**Smart Contract/Test Entry:**
- Location: `hardhat.config.js`, `contracts/*.sol`, `test/documate-track2.test.js`, `scripts/deploy.js`, `scripts/deploy-track2.js`.
- Triggers: CLI commands (`npm run contracts:compile`, `npm run contracts:test`, deployment scripts).
- Responsibilities: Build, test, and deploy EVM contracts for Track 2 workflows.

**Video Composition Entry:**
- Location: `remotion/index.ts`, `remotion/Root.tsx`.
- Triggers: Remotion commands (`npm run video:studio`, `npm run video:render`).
- Responsibilities: Register and compose pitch/demo video timelines.

## Error Handling

**Strategy:** Local try/catch in route handlers with JSON error responses and conservative fallbacks.

**Patterns:**
- API handlers wrap logic in `try/catch` and return `NextResponse.json(..., { status })` (`src/app/api/**/route.ts`).
- Validation-first guards return 400/401/404 before side effects (`src/app/api/auth/verify/route.ts`, `src/app/api/market/purchase/route.ts`).
- Services return explicit `null`/empty defaults for recoverable failures (e.g., `getPlatformStats` in `src/hooks/useDocuMateContract.ts`).
- Logging uses `console.error` within route/service catch blocks.

## Cross-Cutting Concerns

**Logging:** Route-local `console.error` statements in API handlers, plus optional Prisma query/error logs in dev mode (`src/lib/db/index.ts`).

**Validation:**
- Syntactic checks in route handlers (address regex, required fields, tx hash format).
- Signature-level validation in `src/lib/phala/signatureValidator.ts`.
- Message/challenge parsing validation in `src/lib/auth/siwp.ts`.

**Authentication/Authorization:**
- SIWP challenge-sign-verify flow in auth routes (`src/app/api/auth/**`) and service (`src/lib/auth/siwp.ts`).
- Cookie-based session token set server-side in verify route.
- Admin layout enforces address allowlist client-side (`src/app/admin/layout.tsx`).

---

*Architecture analysis: 2026-03-18*
