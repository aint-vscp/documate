# Phase 2: Wire Gaps Found in Audit - Research

**Researched:** 2026-03-18
**Domain:** Document anchoring integrity, TEE trust-tier UX, reputation evidence wiring
**Confidence:** HIGH

## Summary

Phase 1 audit evidence shows three concrete gaps are real and reproducible: document finalization can record `offchain-anchor:*` markers instead of chain tx hashes, Gold/Silver/Bronze tiering exists only in an API route with no consumer in dashboard flows, and reputation tags shown in UI are local/client-derived while on-chain/staking evidence is displayed separately without a unified provenance panel.

The safest implementation strategy is to preserve current user flows, then tighten proof boundaries in this order: (1) make document anchoring fail-closed for sender-sign finalization when chain upload is unavailable, (2) introduce a typed validation result object and render tier badges where users already finalize trust actions, and (3) switch reputation rendering from local-only tags to evidence-backed aggregation that joins DB tags, activity txs, and breach/slash outcomes.

**Primary recommendation:** Implement 02-01 first as a data-integrity gate, then 02-02 for visible trust classification, then 02-03 for evidence-linked reputation; do not run 02-03 before the anchoring and tier data contracts are stable.

## User Constraints

- Keep current stack and architecture for speed before hackathon deadline.
- Prioritize demonstrable testnet proof over speculative expansion.
- Keep `.env` local and untracked.
- Every claim must be command-backed and evidence-backed.

## Phase Requirements

| Plan ID | Description | Research Support |
|---|---|---|
| 02-01 | Fix document hash on-chain write path and verification references | Anchoring/fallback path and tx filtering points identified in UI hook, doc API, and activity API |
| 02-02 | Make TEE Gold/Silver/Bronze tier clearly visible in UI flows | Tier producer route identified; missing consumer points and shared type surface identified |
| 02-03 | Connect reputation tags to contract history signals and evidence panels | Current local tags + DB breach tags + tx activity sources mapped; aggregation gap identified |

## Standard Stack

### Core (already in repo)

| Library | Version | Purpose | Why Standard Here |
|---|---|---|---|
| next | 16.1.7 | App Router UI + API routes | Existing app surface and deployment assumptions are already built around this |
| ethers | 6.16.0 | EVM contract calls and tx receipts | Existing hooks, scripts, and contract interactions use ethers v6 patterns |
| prisma + sqlite | 6.19.2 | Off-chain persistence for operational/evidence records | Existing APIs already persist documents, breaches, purchases, tags in Prisma-managed DB |

### Supporting

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| hardhat | 2.28.6 | Solidity compile/test and deterministic contract validation | For regression checks on contract behavior before UI/API integration changes |
| eslint | 9.x | Fast code-quality gate before proof captures | Run on every plan completion to prevent obvious defects before evidence collection |

## Architecture Patterns

### Pattern 1: Fail-Closed Trust Boundary for Anchoring (02-01)
**What:** Sender signing should not progress to receiver-sign state unless a valid on-chain tx hash is captured and stored.
**When to use:** Any path that currently writes fallback marker values (`offchain-anchor:*`) as if they were equivalent proof.

**Likely files/modules to modify:**
- `src/app/dashboard/documents/[id]/page.tsx`
- `src/hooks/useDocuMateContract.ts`
- `src/config/DocuMateABI.ts`
- `src/app/api/documents/route.ts`
- `src/app/api/documents/[id]/route.ts`
- `src/app/api/activity/route.ts`
- `src/types/index.ts`

**Implementation notes:**
- Remove fallback marker write path and block transition with explicit actionable error.
- Ensure `transactionHash` is always strict `0x` 64-hex when status is `PENDING_RECEIVER_SIGN` or `FINALIZED`.
- Add explicit `anchorStatus`/`anchorError` (typed) instead of overloading `transactionHash` semantics.
- Confirm configured contract/address path really exposes `uploadDocument`; current selector check is correct but configured address may still point to non-upload contract.

### Pattern 2: Producer-Consumer Contract for TEE Tier Visibility (02-02)
**What:** Introduce a typed validation result object shared by API producer and UI consumers, then render tier badge and attestation wherever document trust is presented.
**When to use:** Any trust signal generated server-side but not rendered in user-visible decision points.

**Likely files/modules to modify:**
- `src/app/api/validate-document/route.ts`
- `src/types/index.ts`
- `src/app/dashboard/documents/new/page.tsx` (pre-sign flow)
- `src/app/dashboard/documents/[id]/page.tsx` (document info/evidence area)
- `src/app/dashboard/profile/page.tsx` (activity/evidence summary)

**Implementation notes:**
- Persist tier metadata into `DocumentInstance` (e.g., `validationTier`, `validationTierName`, `validationAttestation`, `validationConfidence`).
- Add a reusable tier badge component to avoid divergence in visual semantics.
- Do not conflate subscription "tier" with validation tier; use explicit naming (`validationTierName`).

### Pattern 3: Evidence-First Reputation Aggregation (02-03)
**What:** Build reputation tags from explicit evidence sources (finalized anchored docs, breach outcomes, slash tx, purchase history) and render each tag with provenance.
**When to use:** Reputation display and profile trust decisions where local-only heuristics are insufficient.

**Likely files/modules to modify:**
- `src/lib/reputation/tagging.ts`
- `src/lib/reputation/index.ts`
- `src/app/dashboard/profile/page.tsx`
- `src/app/api/activity/route.ts`
- `src/app/api/directory/tags/route.ts`
- `src/app/api/admin/breaches/route.ts`
- `src/app/dashboard/people/page.tsx`
- `prisma/schema.prisma` (optional migration for richer provenance)

**Implementation notes:**
- Preserve existing `ReputationTag` DB model but include `txHash`/`pocHash` consistently on writes.
- Keep local `deriveReputationTags` as helper only; UI should fetch evidence-backed tags API payload.
- Add an evidence panel section in profile showing tag -> source -> tx/reference link.

## Dependency Order and Migration Risk

1. 02-01 Anchoring integrity gate (highest priority)
2. 02-02 Tier data contract + UI visibility
3. 02-03 Reputation evidence wiring

### Why this order
- 02-03 depends on trustworthy finalized anchor and activity references.
- 02-02 introduces additional trust metadata that can later be incorporated into reputation evidence display.

### Migration risk notes

| Area | Risk | Level | Mitigation |
|---|---|---|---|
| Document payload shape changes | Existing records in `SharedDocument.payload` may miss new fields | MEDIUM | Treat new fields as optional and backfill lazily on load/update |
| Fallback removal | Users on misconfigured contract address lose "graceful progress" path | MEDIUM | Show explicit remediation UI + admin checklist for address/ABI alignment |
| Reputation source switch | Existing local tags may differ from evidence-backed computed tags | HIGH | Mark legacy local tags with `source=MANUAL/LEGACY` and de-emphasize in UI |
| Schema migration for provenance | Prisma migration timing near deadline | LOW-MEDIUM | Prefer additive fields/indexes only; no destructive migration in Phase 2 |

## Security and Data-Integrity Caveats

1. `src/app/api/documents/route.ts`, `src/app/api/documents/[id]/route.ts`, `src/app/api/activity/route.ts`, and directory routes use raw unsafe SQL string interpolation. Even with quote escaping, this is fragile and should be moved to parameterized Prisma query APIs.
2. Do not trust client-provided `transactionHash`, `reviewerAddress`, or tag payloads as authoritative. Server should validate format and derive actor identity from authenticated context.
3. Reputation labels must never imply chain proof unless a verifiable tx hash is present and explorer-accessible.
4. `offchain-anchor:*` markers must be excluded from any "on-chain" counts, badges, and acceptance evidence.
5. Admin breach confirmation currently writes negative reputation tags and attempts slash, but slash failure is non-fatal; UI/evidence must clearly indicate whether slash tx actually succeeded.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| EVM tx verification parsing | Custom ad-hoc hash parsing in multiple places | Shared hash validator utility + ethers receipt metadata | Prevent logic drift across API/UI |
| Trust tier rendering | Per-page ad-hoc badge logic | Shared tier badge component and shared type | Avoid inconsistent Gold/Silver/Bronze semantics |
| Reputation provenance stitching in UI only | Client-only merge from localStorage + fetch | Server-computed aggregation payload with explicit evidence fields | Reduces tampering/confusion and improves auditability |

## Common Pitfalls

### Pitfall 1: Treating selector presence as sufficient deployment proof
**What goes wrong:** `canUploadDocument()` may return false at runtime because configured address points to marketplace contract without `uploadDocument`.
**How to avoid:** Add startup/admin diagnostics and fail with remediation instructions before signature flow.

### Pitfall 2: Mixing trust classes in one field
**What goes wrong:** `transactionHash` stores both chain hashes and fallback markers.
**How to avoid:** Enforce strict hash format for `transactionHash`; move fallback/error state to explicit fields.

### Pitfall 3: Local reputation drift
**What goes wrong:** `getReputationTagsForAddress` (localStorage) diverges from DB `ReputationTag` and on-chain signals.
**How to avoid:** Profile and people views should consume evidence-backed API model first, with local tags only as non-authoritative cache.

### Pitfall 4: Evidence panels without provenance
**What goes wrong:** Tag chips appear without source, tx, or breach reference, weakening judge trust.
**How to avoid:** Every displayed tag should include source and reference id/tx hash where applicable.

## Test Strategy

### Current infrastructure detection
- Test framework present: Hardhat (`test/documate-track2.test.js`)
- No Jest/Vitest/Playwright API/UI test framework currently configured.
- Validation approach for Phase 2 should combine contract tests + endpoint checks + deterministic UI proof checklist commands.

### Unit tests

| Scope | Command | Expected |
|---|---|---|
| Contract logic baseline | `npm run contracts:test` | Existing settlement/staking behavior remains green |
| Targeted contract suite | `npx hardhat test test/documate-track2.test.js` | No regression while wiring UI/API proofs |

### Integration tests

| Scope | Command (PowerShell) | Expected |
|---|---|---|
| Lint/type surface sanity | `npm run lint` | No lint failures after new type and route wiring |
| Build path | `npm run build` | App compiles with new trust/tier/evidence fields |
| Testnet config | `npm run testnet:config-check` | Environment and deployed-address checks remain valid |

### E2E/Acceptance proof (PowerShell)

| Requirement | Command (PowerShell) | Proof Outcome |
|---|---|---|
| 02-01 no fallback marker path | `rg "offchain-anchor:" src/app/dashboard/documents/[id]/page.tsx src/app/api -n` | No active fallback write path in production flow |
| 02-01 tx hash integrity in activity | `Invoke-RestMethod "http://localhost:3000/api/activity?walletAddress=<WALLET>" | ConvertTo-Json -Depth 6` | Document anchors contain 0x64 tx hashes only |
| 02-02 tier visible in UI path | `Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/validate-document" -Form @{ file = Get-Item ".\docs\sample.pdf" } | ConvertTo-Json -Depth 6` | Tier payload returns Gold/Silver/Bronze + attestation and can be shown in UI |
| 02-03 tags linked to evidence | `Invoke-RestMethod "http://localhost:3000/api/directory/profile?walletAddress=<WALLET>" | ConvertTo-Json -Depth 8` | Tags and source references visible for panel rendering |

## Acceptance-Proof Command Pack (Windows PowerShell)

```powershell
# 0) Baseline gates
npm run lint
npm run build
npm run contracts:test
npm run testnet:config-check

# 1) Verify fallback markers are not used as on-chain anchors
rg "offchain-anchor:" src/app/dashboard/documents/[id]/page.tsx src/app/api -n

# 2) Run app and inspect activity payload
npm run dev
# In another terminal:
Invoke-RestMethod "http://localhost:3000/api/activity?walletAddress=<WALLET_ADDRESS>" | ConvertTo-Json -Depth 6

# 3) Validate TEE tier producer output
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/validate-document" -Form @{ file = Get-Item ".\docs\sample.pdf" } | ConvertTo-Json -Depth 6

# 4) Verify directory/profile evidence payload for reputation panel
Invoke-RestMethod "http://localhost:3000/api/directory/profile?walletAddress=<WALLET_ADDRESS>" | ConvertTo-Json -Depth 8
```

## Validation Architecture

| Property | Value |
|---|---|
| Framework | Hardhat test runner (existing) |
| Config file | `hardhat.config.js` |
| Quick run command | `npm run lint` |
| Full suite command | `npm run release:checklist` |

### Phase Requirements -> Test Map

| Requirement | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| 02-01 | Sender-sign cannot produce non-chain anchor evidence | integration | `npm run lint` + `npm run build` + `Invoke-RestMethod` activity check | Partial |
| 02-02 | Tier result appears in API and UI data model | integration | `Invoke-RestMethod -Method Post /api/validate-document` + `npm run build` | Partial |
| 02-03 | Reputation tags map to chain/contract evidence in profile panel | integration | `Invoke-RestMethod /api/activity` + `Invoke-RestMethod /api/directory/profile` | Partial |

### Wave 0 gaps

- Missing automated API/UI tests (Jest/Vitest/Playwright not configured).
- Add focused API route tests for `activity`, `documents`, `directory/tags`, and breach confirm flow before Phase 3 if time allows.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/01-audit-partially-built-systems/01-01-SUMMARY.md`
- `docs/audit/01-01-document-anchor-evidence.md`
- `docs/audit/01-01-document-anchor-commands.txt`
- `src/app/dashboard/documents/[id]/page.tsx`
- `src/hooks/useDocuMateContract.ts`
- `src/app/api/validate-document/route.ts`
- `src/app/dashboard/profile/page.tsx`
- `src/lib/reputation/tagging.ts`
- `src/app/api/admin/breaches/route.ts`
- `src/app/api/activity/route.ts`
- `package.json`

### Secondary (MEDIUM confidence)
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`

## Metadata

**Confidence breakdown:**
- Anchoring path analysis: HIGH (direct code + phase-1 evidence)
- TEE tier visibility analysis: HIGH (producer route present, no consumer found)
- Reputation evidence wiring analysis: HIGH (local vs DB/API pathways directly traced)

**Research date:** 2026-03-18
**Valid until:** 2026-03-25 (fast-moving pre-deadline implementation window)