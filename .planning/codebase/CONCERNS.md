# Codebase Concerns

**Analysis Date:** 2026-03-18

## Tech Debt

**Hybrid document persistence split across localStorage + ad-hoc SQL table:**
- Issue: Document data is persisted both in browser localStorage and in a manually managed `SharedDocument` SQL table created at runtime, instead of a single Prisma-managed model.
- Files: `src/lib/document/documentStore.ts`, `src/app/api/documents/route.ts`, `src/app/api/documents/[id]/route.ts`, `prisma/schema.prisma`
- Impact: Higher risk of data drift, duplicate conflict logic, brittle migrations, and hard-to-debug state mismatches between client and server records.
- Fix approach: Add a first-class `SharedDocument` Prisma model, migrate APIs to parameterized Prisma queries, and keep localStorage as a cache only.

**Production-critical flows still use MVP placeholders/comments:**
- Issue: Core auth/indexer paths include explicit "In production" placeholders and non-persistent behavior.
- Files: `src/lib/auth/siwp.ts`, `src/app/api/auth/challenge/route.ts`, `src/app/api/auth/verify/route.ts`, `src/lib/indexer/handlers/poc.ts`
- Impact: Replay protection, session integrity, and reputation indexing are not fully implemented in runtime behavior.
- Fix approach: Replace placeholder logic with persisted challenge/session storage and complete indexer write paths.

**Very large page modules with mixed responsibilities:**
- Issue: Several UI pages exceed 500 to 1100 LOC and combine data loading, business logic, blockchain calls, and rendering in single files.
- Files: `src/app/dashboard/filing/page.tsx`, `src/app/dashboard/profile/page.tsx`, `src/app/dashboard/studio/page.tsx`, `src/app/dashboard/market/page.tsx`, `src/app/admin/breaches/page.tsx`
- Impact: Regression risk rises with every change, reviewability drops, and component-level testing becomes difficult.
- Fix approach: Extract route-level hooks/services and split UI into focused components (form state, blockchain orchestration, presentation).

## Known Bugs

**SIWP message parser rejects valid non-5xx Polkadot addresses:**
- Symptoms: Login verification can fail with "Address mismatch" for valid addresses that do not start with `5`.
- Files: `src/lib/auth/siwp.ts`, `src/app/api/auth/challenge/route.ts`, `src/app/api/auth/verify/route.ts`
- Trigger: `parseSignInMessage()` only accepts line 2 if `line.startsWith("5")`, while challenge endpoint accepts a broader address pattern.
- Workaround: Use addresses starting with `5` only, or bypass this parser check in local testing.

**Indexer config references handlers that do not exist in repo:**
- Symptoms: Any real indexer runtime that loads configured handlers fails when resolving transfer/NFT handler modules.
- Files: `src/lib/indexer/config.ts`, `src/lib/indexer/handlers/poc.ts`
- Trigger: `POC_INDEXER_CONFIG.handlers` declares `./handlers/transfer` and `./handlers/nft`, but only `poc.ts` exists.
- Workaround: Limit runtime to POC remark handler or create missing modules before enabling those handlers.

**Contract address helper throws by default with empty constants:**
- Symptoms: Features relying on `getContractAddress()` fail fast unless deploy addresses are manually injected into constants.
- Files: `src/config/contracts.ts`
- Trigger: `CONTRACTS.testnet/mainnet` placeholders are empty strings and helper throws "not deployed".
- Workaround: Patch constants per environment before using helper-based calls.

## Security Considerations

**Admin API routes have no server-side authorization enforcement:**
- Risk: Any caller can hit admin endpoints directly, list data, and submit state-changing actions by crafting HTTP requests.
- Files: `src/app/api/admin/breaches/route.ts`, `src/app/api/admin/verification/route.ts`, `src/app/api/admin/users/route.ts`, `src/app/api/admin/templates/route.ts`, `src/app/api/admin/logs/route.ts`, `src/app/api/admin/stats/route.ts`
- Current mitigation: Client-side gate in admin layout checks wallet against hardcoded address list.
- Recommendations: Enforce signed-session or wallet-signature auth in route handlers/middleware and verify admin role server-side.

**Reviewer/admin identity is request-body trust, enabling spoofed audit logs:**
- Risk: Callers can provide arbitrary `reviewerAddress` values to impersonate admin actions in DB logs and review fields.
- Files: `src/app/api/admin/breaches/route.ts`, `src/app/api/admin/verification/route.ts`
- Current mitigation: Optional lookup of reviewer user record when address is provided.
- Recommendations: Derive actor identity exclusively from authenticated session or signed request; ignore client-provided reviewer identity.

**Raw SQL execution uses unsafe API with interpolated strings:**
- Risk: SQL injection surface and long-term maintenance risk, even with manual single-quote escaping.
- Files: `src/app/api/documents/route.ts`, `src/app/api/documents/[id]/route.ts`
- Current mitigation: Basic quote escaping with `.replace(/'/g, "''")`.
- Recommendations: Replace `$queryRawUnsafe`/`$executeRawUnsafe` with parameterized Prisma SQL tagged templates or Prisma model methods.

**Session tokens are issued but not persisted or validated on protected APIs:**
- Risk: Cookie issuance does not translate into centralized authorization checks; privilege boundaries remain unenforced.
- Files: `src/app/api/auth/verify/route.ts`, `src/lib/auth/siwp.ts`, `src/app/api/admin/*`
- Current mitigation: HTTP-only cookie set on verify.
- Recommendations: Persist sessions in `Session` table, validate session on each protected endpoint, rotate/revoke tokens.

## Performance Bottlenecks

**Per-request DDL in document APIs:**
- Problem: `CREATE TABLE IF NOT EXISTS` and index creation run at request time.
- Files: `src/app/api/documents/route.ts`, `src/app/api/documents/[id]/route.ts`
- Cause: Runtime schema bootstrapping in hot path.
- Improvement path: Move schema creation to Prisma migrations/startup bootstrap; keep handlers to query/command operations only.

**Unbounded admin list queries in high-churn tables:**
- Problem: Some admin endpoints return full datasets without pagination (`breaches`, `verification`), which degrades as records grow.
- Files: `src/app/api/admin/breaches/route.ts`, `src/app/api/admin/verification/route.ts`
- Cause: Missing `skip/take` and cursor strategy.
- Improvement path: Add consistent pagination and indexed filter fields.

**Client-side heavy state/derivation in very large pages:**
- Problem: Complex parsing/derivation and many React states in single page components can degrade interaction latency on low-end devices.
- Files: `src/app/dashboard/filing/page.tsx`, `src/app/dashboard/studio/page.tsx`
- Cause: Monolithic state machines and logic in render-layer modules.
- Improvement path: Extract memoized domain hooks and isolate expensive operations behind debounced worker/service boundaries.

## Fragile Areas

**Admin gating implemented on client layout only:**
- Files: `src/app/admin/layout.tsx`, `src/app/api/admin/*`
- Why fragile: UI denies access visually, but server routes can still be invoked directly.
- Safe modification: Introduce shared `requireAdmin()` server utility and enforce at route entry for every admin endpoint.
- Test coverage: No API auth tests detected for admin route protection.

**Mint/purchase flow couples on-chain checks, DB writes, and user creation:**
- Files: `src/app/api/market/mint/route.ts`, `src/app/api/market/purchase/route.ts`
- Why fragile: Multi-system workflow can partially succeed/fail (chain receipt OK, DB write fails, or vice versa) with limited compensating logic.
- Safe modification: Add idempotency keys, unique tx replay guards across both endpoints, and explicit retry-safe transaction boundaries.
- Test coverage: No API-level integration tests detected for these flows.

**Identity verification mode can be toggled to mock on-chain contract:**
- Files: `contracts/DocuMateMarketplace.sol`, `scripts/deploy-track2.js`, `test/documate-track2.test.js`
- Why fragile: Deployment/config mistakes can leave environments using mock verification semantics.
- Safe modification: Guard mock toggles behind explicit network checks and immutable production deployment scripts.
- Test coverage: Contract tests cover mock behavior, but no deployment assertions for production-mode enforcement.

## Scaling Limits

**SQLite as primary operational DB for multi-user workload:**
- Current capacity: Suitable for local/demo and low write concurrency.
- Limit: Contention and locking become bottlenecks under concurrent API writes.
- Scaling path: Move to Postgres-compatible Prisma datasource; retain SQLite only for local dev.

**In-memory rate limiting is instance-local:**
- Current capacity: Works for a single process.
- Limit: Multi-instance/serverless deployments bypass global request quotas.
- Scaling path: Use centralized Redis-based rate limiter keyed by route and actor.

## Dependencies at Risk

**Cutting-edge framework stack increases upgrade/churn risk:**
- Risk: `next@16` + `react@19` + large override set can introduce ecosystem compatibility drift for plugins/tooling.
- Impact: Build/runtime breakage risk during dependency refreshes and uneven community support for edge versions.
- Migration plan: Lock tested versions, add CI matrix for build/test, and minimize override surface to only required transitive pins.

## Missing Critical Features

**Server-enforced RBAC for admin operations:**
- Problem: Admin trust boundary is not enforced server-side.
- Blocks: Secure production rollout of moderation, verification approvals, and breach slashing workflows.

**Durable challenge/session lifecycle management for SIWP:**
- Problem: Challenges/sessions are not persisted and nonce replay lifecycle is incomplete.
- Blocks: Production-grade wallet authentication and reliable account/session revocation.

**Complete indexer execution path (handlers + DB persistence):**
- Problem: Declared handlers and persistence pipeline are incomplete.
- Blocks: Accurate on-chain reputation derivation at scale.

## Test Coverage Gaps

**API routes (auth, admin, market, documents) largely untested:**
- What's not tested: Request validation, authz boundaries, failure/retry behavior, and data consistency in route handlers.
- Files: `src/app/api/auth/*`, `src/app/api/admin/*`, `src/app/api/market/*`, `src/app/api/documents/*`
- Risk: Security and data-integrity regressions can ship undetected.
- Priority: High

**Document sharing SQL path and migration behavior untested:**
- What's not tested: Runtime `ensureTable()` behavior, raw query safety assumptions, merge conflict semantics.
- Files: `src/app/api/documents/route.ts`, `src/app/api/documents/[id]/route.ts`, `src/lib/document/documentStore.ts`
- Risk: Data corruption and edge-case failures as dataset grows.
- Priority: High

**Large dashboard pages lack focused unit/component tests:**
- What's not tested: Placeholder parsing, signature flow, AI-assisted field extraction, and state transitions across complex UI.
- Files: `src/app/dashboard/filing/page.tsx`, `src/app/dashboard/studio/page.tsx`, `src/app/dashboard/profile/page.tsx`
- Risk: UX regressions and hidden runtime exceptions in high-change surfaces.
- Priority: Medium

**Contract tests focus on happy path, limited adversarial coverage:**
- What's not tested: Reentrancy-oriented edge cases, admin misuse paths, identity-precompile failure scenarios, and negative payment/refund abuse cases.
- Files: `test/documate-track2.test.js`, `contracts/DocuMateMarketplace.sol`, `contracts/DocuMateStaking.sol`
- Risk: On-chain logic vulnerabilities may escape before deployment.
- Priority: Medium

---

*Concerns audit: 2026-03-18*
