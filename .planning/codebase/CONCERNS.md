# Codebase Concerns

**Analysis Date:** 2026-03-18

## Tech Debt

**MVP Mock/Placeholder Logic Embedded in Core Flows:**
- Issue: Production-facing routes and pages still rely on mock behavior and fallback values, which can hide integration failures and create misleading runtime behavior.
- Files: `src/app/api/phala-proxy/route.ts`, `src/lib/polkadot/phala.ts`, `src/app/admin/page.tsx`, `src/app/admin/verification/page.tsx`, `src/app/admin/breaches/page.tsx`, `src/app/dashboard/market/page.tsx`, `src/app/api/admin/stats/route.ts`
- Impact: Users and admins can see successful-looking flows even when real infrastructure fails; debugging and incident detection become harder.
- Fix approach: Introduce explicit environment gates for mock mode, disable mock-only paths in non-demo environments, and fail closed for admin metrics/data APIs when backing services are unavailable.

**Large Multi-Responsibility UI Modules:**
- Issue: Several page components exceed typical maintainability thresholds and contain state, orchestration, and rendering in single files.
- Files: `src/app/dashboard/filing/page.tsx` (1123 lines), `src/app/dashboard/profile/page.tsx` (987 lines), `src/app/dashboard/studio/page.tsx` (707 lines), `src/app/dashboard/market/page.tsx` (630 lines), `src/components/document/SignaturePanel.tsx` (545 lines)
- Impact: High regression risk during edits, slower onboarding, and difficult targeted testing.
- Fix approach: Extract container/hooks/presentational splits, isolate side effects into services, and add module-level tests during decomposition.

**Data Model Split Between Browser Storage and Server DB:**
- Issue: Documents, templates, profile data, signatures, and reputation data are persisted heavily in browser storage while partial server synchronization exists.
- Files: `src/lib/document/documentStore.ts`, `src/lib/document/templateService.ts`, `src/lib/document/signatureService.ts`, `src/lib/polkadot/kilt.ts`, `src/lib/reputation/tagging.ts`, `src/app/api/documents/route.ts`
- Impact: Cross-device inconsistency, weak auditability, and difficult recovery when client storage is cleared/corrupted.
- Fix approach: Define canonical persistence boundaries, migrate critical records server-side first, and keep client storage as cache-only.

## Known Bugs

**Non-Unique Derived User IDs in Auth Flow:**
- Symptoms: Different wallet addresses sharing the same first 8 chars can map to the same derived user ID.
- Files: `src/app/api/auth/verify/route.ts`, `src/lib/auth/siwp.ts`
- Trigger: SIWP login where `userId` is derived as `user_${address.slice(0, 8)}`.
- Workaround: No safe runtime workaround beyond using full-address or database-generated identifiers.

**Silent Data Drop on Shared Document Payload Parse Failure:**
- Symptoms: Corrupted or unexpected payload rows are filtered out without surfacing integrity errors.
- Files: `src/app/api/documents/route.ts`
- Trigger: `parsePayload` returns `null` and failed rows are removed by `.filter((doc): doc is DocumentInstance => !!doc)`.
- Workaround: Manual DB inspection and repair of malformed `payload` rows.

## Security Considerations

**Admin APIs Lack Authentication/Authorization Enforcement:**
- Risk: Any caller able to hit the endpoints can query or mutate admin data (verification/breach status, logs, template/admin metrics).
- Files: `src/app/api/admin/breaches/route.ts`, `src/app/api/admin/verification/route.ts`, `src/app/api/admin/logs/route.ts`, `src/app/api/admin/templates/route.ts`, `src/app/api/admin/stats/route.ts`
- Current mitigation: Minimal request shape validation and partial rate limiting only on `POST /api/admin/breaches`.
- Recommendations: Enforce session verification and `isAdmin` authorization checks server-side on all admin routes; reject unauthenticated calls before DB access.

**Unsafe Raw SQL Composition in Shared Documents API:**
- Risk: Query strings are assembled manually and executed with `$queryRawUnsafe`/`$executeRawUnsafe`, increasing injection and query integrity risk.
- Files: `src/app/api/documents/route.ts`
- Current mitigation: Manual single-quote escaping for interpolated fields.
- Recommendations: Replace unsafe raw SQL calls with parameterized Prisma APIs or prepared statements.

**Mock Encryption and Plaintext Leakage in TEE Proxy Path:**
- Risk: Base64 is used as mock encryption and plaintext responses are returned in API payloads.
- Files: `src/lib/polkadot/phala.ts`, `src/app/api/phala-proxy/route.ts`
- Current mitigation: File comments indicate MVP mock intent.
- Recommendations: Remove `plainContent` from API responses outside local demo mode, enforce real cryptography before any production exposure.

## Performance Bottlenecks

**Per-Request DDL/Index Checks in Documents API:**
- Problem: `ensureTable()` runs table/index creation checks on request paths.
- Files: `src/app/api/documents/route.ts`
- Cause: Runtime schema management embedded into API request handling.
- Improvement path: Move schema creation/index management to migrations; remove DDL from hot paths.

**Monolithic Client Pages Increase Render and Hydration Cost:**
- Problem: Very large client components increase bundle and hydration pressure.
- Files: `src/app/dashboard/filing/page.tsx`, `src/app/dashboard/profile/page.tsx`, `src/app/dashboard/studio/page.tsx`, `src/app/dashboard/market/page.tsx`
- Cause: Mixed concerns and broad stateful logic per page.
- Improvement path: Split code via dynamic imports for heavy panels, extract hooks/services, and memoize expensive derived state.

**In-Memory Rate Limiter Not Shared Across Instances:**
- Problem: Rate-limit counters are process-local and reset on restart/scale-out.
- Files: `src/lib/security/rateLimit.ts`
- Cause: `Map`-based token buckets held in application memory.
- Improvement path: Move counters to shared storage (Redis/Upstash/DB) and enforce route-level limits consistently.

## Fragile Areas

**Admin Action Trusts Caller-Provided Reviewer Address:**
- Files: `src/app/api/admin/breaches/route.ts`, `src/app/api/admin/verification/route.ts`
- Why fragile: Reviewer identity is accepted from request body (`reviewerAddress`) instead of server-authenticated session context.
- Safe modification: Introduce authenticated session lookup middleware and derive reviewer identity server-side only.
- Test coverage: No admin API integration tests detected in `test/`.

**Session Lifecycle Is Incomplete Across API Surface:**
- Files: `src/app/api/auth/verify/route.ts`, `src/lib/auth/siwp.ts`
- Why fragile: Sessions are created and cookie-set, but persistence/lookup enforcement is commented or absent in route guards.
- Safe modification: Implement persisted session storage and shared auth guard for protected API namespaces.
- Test coverage: No SIWP route tests detected; only contract tests exist in `test/documate-track2.test.js`.

**Fallback-First UI Behavior Masks Backend Failures:**
- Files: `src/app/admin/page.tsx`, `src/app/admin/verification/page.tsx`, `src/app/admin/breaches/page.tsx`, `src/app/dashboard/market/page.tsx`, `src/app/api/admin/stats/route.ts`
- Why fragile: On fetch errors, UI keeps or reverts to static/mock data, reducing observability of real failures.
- Safe modification: Surface explicit degraded-state banners with error telemetry and disable state-mutating actions when backend fetch fails.
- Test coverage: No UI resilience tests detected for fallback/error modes.

## Scaling Limits

**SQLite as Primary Operational Store:**
- Current capacity: Suitable for small-scale single-node workloads.
- Limit: Concurrent writes and multi-instance deployments become contention-prone.
- Scaling path: Migrate `prisma/schema.prisma` datasource from SQLite to a networked production DB (for example Postgres) with managed connection pooling.

**Process-Local Session/Rate-Limit Assumptions:**
- Current capacity: Works for single process with sticky behavior.
- Limit: Horizontal scaling causes inconsistent auth/rate-limit enforcement.
- Scaling path: Externalize session state and throttle counters to shared infrastructure.

## Dependencies at Risk

**Hardhat + Next + On-Chain/Off-Chain Split Without End-to-End Guardrails:**
- Risk: Contract logic is tested, but application integration assumptions can drift without cross-layer E2E validation.
- Impact: Deployment can pass contract tests while failing runtime API/UI workflows.
- Migration plan: Add CI jobs that run API integration tests and critical UI/API happy-path checks in addition to `contracts:test`.

## Missing Critical Features

**Route-Level Access Control for Admin Surface:**
- Problem: No enforced authz middleware on admin API routes.
- Blocks: Safe production use of breach/verification moderation and audit log endpoints.

**Production-Grade TEE Path:**
- Problem: Core TEE flow remains mock-based with non-secure placeholder encryption.
- Blocks: Security claims around confidential AI processing in non-demo environments.

## Test Coverage Gaps

**Application/API/Security Paths Are Untested:**
- What's not tested: Next.js API routes, admin authorization logic, SIWP session lifecycle, rate limiting behavior, and fallback-mode correctness.
- Files: `src/app/api/**`, `src/lib/security/rateLimit.ts`, `src/lib/auth/siwp.ts`, `src/app/admin/**`, `src/app/dashboard/**`
- Risk: Regressions in moderation/security/business workflows can ship undetected.
- Priority: High

**Frontend State Persistence Paths Are Untested:**
- What's not tested: Browser storage synchronization and recovery behavior for documents/templates/profile/signatures.
- Files: `src/lib/document/documentStore.ts`, `src/lib/document/templateService.ts`, `src/lib/document/signatureService.ts`, `src/lib/polkadot/kilt.ts`
- Risk: Data loss, stale state, and inconsistent user experiences across reload/devices.
- Priority: Medium

---

*Concerns audit: 2026-03-18*
