# Phase 1: Audit Partially-Built Systems - Research

**Researched:** 2026-03-18
**Domain:** Trust-boundary audit (on-chain vs DB-only vs UI-only)
**Confidence:** HIGH

## Summary

This phase should be executed as an evidence-first audit, not as a refactor. The goal is to prove where each claim is truly enforced: smart contract state/events, API/database state, or UI messaging only. For this codebase, the three target systems (document anchoring, TEE tier surfacing, reputation tags) are partially wired with mixed trust boundaries and multiple fallback paths.

The highest-risk finding to validate first is that document signing has an explicit off-chain fallback (`offchain-anchor:*`) and a status message that still sounds successful to users. The second is that Gold/Silver/Bronze logic exists in an API route but appears unconsumed by user-facing pages. The third is that profile reputation tags are currently loaded from local storage and directory table tags, while on-chain reputation scanning exists but is not wired into the live profile UX.

**Primary recommendation:** Run Phase 1 as three independent evidence packs (01-01, 01-02, 01-03), each producing a pass/fail verdict plus command output and file citations before any implementation in Phase 2.

## Audit Targets

| Plan | Target | Core Question | Related Requirements |
|------|--------|---------------|----------------------|
| 01-01 | Document hash anchoring | Is the final document proof written on-chain, or only stored in DB/local payload? | DOC-01 |
| 01-02 | TEE Gold/Silver/Bronze visibility | Is TEE tier output surfaced in user-facing UI flows? | DOC-03 |
| 01-03 | Reputation tag derivation | Are profile tags derived from on-chain history, not just DB/local state? | REP-01, REP-02 |

## 01-01 Audit: Document Hash Is Truly On-Chain

### Exact Files/Routes/Contracts To Inspect

- `contracts/DocuMate.sol`
- `src/config/DocuMateABI.ts`
- `src/hooks/useDocuMateContract.ts`
- `src/app/dashboard/documents/[id]/page.tsx`
- `src/app/api/documents/route.ts`
- `src/app/api/activity/route.ts`
- `prisma/schema.prisma`

### Why These Are In Scope

- Contract truth source: `uploadDocument` and `DocumentUploaded` event (`contracts/DocuMate.sol`).
- Client write path: sender signature flow calls `uploadDocument(finalHash)` but has explicit off-chain fallback in `src/app/dashboard/documents/[id]/page.tsx`.
- Storage path: shared document payload is stored in `SharedDocument.payload` (`src/app/api/documents/route.ts`) and can carry `transactionHash` independent of chain proof.
- UI evidence path: activity feed includes document anchors only when `transactionHash` matches `0x` 64-hex format (`src/app/api/activity/route.ts`), which is format-based filtering, not chain verification.

### Evidence Commands (Windows PowerShell)

```powershell
# 1) Confirm contract-level document upload capability and event
Get-ChildItem -Path .\contracts -Filter *.sol -Recurse |
  Select-String -Pattern 'function uploadDocument|event DocumentUploaded|getDocument\(' -CaseSensitive

# 2) Confirm client invokes uploadDocument and also contains off-chain fallback
Get-ChildItem -Path .\src -Recurse -File |
  Select-String -Pattern 'uploadDocument\(|offchain-anchor|Anchoring document hash on-chain|On-chain anchoring unavailable' 

# 3) Confirm shared persistence is payload-based (DB/off-chain source of truth risk)
Get-ChildItem -Path .\src\app\api -Recurse -File |
  Select-String -Pattern 'SharedDocument|payload|transactionHash|\$executeRawUnsafe|\$queryRawUnsafe'

# 4) Confirm activity endpoint trusts stored payload tx hash shape
Select-String -Path .\src\app\api\activity\route.ts -Pattern 'DOCUMENT_ANCHOR|transactionHash|\^0x\[a-fA-F0-9\]\{64\}\$'

# 5) Optional runtime check for fallback markers in local/shared data exports
Get-ChildItem -Path . -Recurse -Include *.json,*.log,*.txt |
  Select-String -Pattern 'offchain-anchor:' -SimpleMatch
```

### Pass Criteria

- Sender-sign flow requires successful contract write with real tx hash (`0x...64`) and no fallback marker used for finalized docs.
- Every displayed document anchor maps to a real on-chain transaction/event, not just payload field format.
- No finalized document in shared storage uses `offchain-anchor:*` transaction markers.

### Fail Criteria

- Any finalized/signable path accepts `offchain-anchor:*` as equivalent to on-chain proof.
- UI/API treats tx-hash format as proof without chain/event verification.
- Contract path exists but is bypassed in common sender flow due to capability mismatch or fallback.

## 01-02 Audit: Gold/Silver/Bronze TEE Output Is User-Visible

### Exact Files/Routes/Contracts To Inspect

- `src/app/api/validate-document/route.ts`
- `src/app/dashboard/filing/page.tsx`
- `src/lib/polkadot/phala.ts`
- `src/app/api/phala-proxy/route.ts`
- `src/app/dashboard/documents/[id]/page.tsx`
- `src/components/document/SignaturePanel.tsx`

### Why These Are In Scope

- Tier generation logic (Gold/Silver/Bronze + confidence + attestation) is implemented in `src/app/api/validate-document/route.ts`.
- Current filing UI shows only TEE mode/health (`Mock`/`Live`) and chat output, not explicit tier surfacing.
- TEE proxy path is mock-oriented (`mode: mock`) and separate from `validate-document` tier endpoint.

### Evidence Commands (Windows PowerShell)

```powershell
# 1) Confirm tier model exists in API
Select-String -Path .\src\app\api\validate-document\route.ts -Pattern 'Gold|Silver|Bronze|tierName|tierColor|attestation'

# 2) Verify whether user-facing pages call validate-document endpoint
Get-ChildItem -Path .\src -Recurse -File |
  Select-String -Pattern '/api/validate-document|validate-document' -SimpleMatch

# 3) Verify what filing UI currently surfaces about TEE
Select-String -Path .\src\app\dashboard\filing\page.tsx -Pattern 'TEE:|Mock|Live|tier|Gold|Silver|Bronze|attestation'

# 4) Confirm proxy route is mock mode for MVP
Select-String -Path .\src\app\api\phala-proxy\route.ts -Pattern 'mode: "mock"|mock mode|In production'
```

### Pass Criteria

- At least one active user-facing route displays tier value (Gold/Silver/Bronze) after document validation.
- Tier is tied to actual validation response payload for that uploaded document.
- User can see enough evidence (tier + confidence/attestation or equivalent) in normal flow without developer tools.

### Fail Criteria

- Tier logic exists only in backend route and is not called by UX.
- UI displays only generic TEE health/mode, not per-document classification result.
- Gold/Silver/Bronze appears only in comments/docs, not rendered product flow.

## 01-03 Audit: Reputation Tags Derive From On-Chain History

### Exact Files/Routes/Contracts To Inspect

- `src/app/api/reputation/[id]/route.ts`
- `src/lib/polkadot/assetHub.ts`
- `src/lib/reputation/tagging.ts`
- `src/lib/indexer/handlers/poc.ts`
- `src/app/dashboard/profile/page.tsx`
- `src/app/dashboard/documents/[id]/page.tsx`
- `src/app/api/directory/tags/route.ts`
- `src/app/api/admin/breaches/route.ts`
- `prisma/schema.prisma`

### Why These Are In Scope

- On-chain scanner exists (`fetchReputationHistory`) and is exposed by API route.
- Live profile tags in UI currently load from `getReputationTagsForAddress(account)` (local storage-backed helper), then persisted into directory tags JSON.
- Tag derivation in document flow is template/placeholder heuristic (`deriveReputationTags`) not chain-history-derived.
- Indexer handler has derivation logic but DB persistence lines are commented out.
- Breach confirmation writes DB `ReputationTag` directly; optional on-chain slash tx is separate.

### Evidence Commands (Windows PowerShell)

```powershell
# 1) Confirm on-chain reputation scan path exists
Get-ChildItem -Path .\src -Recurse -File |
  Select-String -Pattern 'fetchReputationHistory|/api/reputation/\[id\]|scan recent blocks|system\.remark'

# 2) Confirm profile UI source of tags
Select-String -Path .\src\app\dashboard\profile\page.tsx -Pattern 'getReputationTagsForAddress|setReputationTags|/api/reputation'

# 3) Confirm local/DB tag write paths
Get-ChildItem -Path .\src -Recurse -File |
  Select-String -Pattern 'addReputationTagsForAddress|/api/directory/tags|tagsJson|reputationTag\.create'

# 4) Confirm indexer persistence gap
Select-String -Path .\src\lib\indexer\handlers\poc.ts -Pattern 'deriveTagsFromPOC|reputationTag.create|await prisma'

# 5) Confirm heuristic (non-chain) derivation rules in active code
Select-String -Path .\src\lib\reputation\tagging.ts -Pattern 'deriveReputationTags|templateName|placeholderValues|localStorage'
```

### Pass Criteria

- Profile-visible tags are sourced from on-chain-derived transaction history (direct API/indexed chain data), not local storage or manual DB merge as primary source.
- Tag issuance includes chain evidence (tx hash/poc hash) that maps to real on-chain history.
- Breach-derived negative tags show consistent linkage between slash/breach event and surfaced profile state.

### Fail Criteria

- Profile tags come from local storage + `DirectoryProfile.tagsJson` without on-chain derivation pipeline.
- On-chain reputation API exists but is not wired into live profile UX.
- Tag derivation depends on template name heuristics rather than chain events/history.

## Known Risk Areas

- Fallback masking: UI success language can hide off-chain fallback (`offchain-anchor:*`) and create false confidence.
- Data shadowing: same conceptual field (`transactionHash`, tags) can exist in payload, DB, and chain with different truth levels.
- Mock leakage: TEE mock mode and mock attestation paths can be mistaken for production trust guarantees.
- Partial indexer implementation: derivation code present but persistence disabled, making code-level checks alone misleading.
- Route-level evidence mismatch: API response shape can look chain-backed without proving source provenance in UI path.

## False-Positive Traps

- Treating any `0x...` hash string as chain proof without verifying event/block inclusion.
- Assuming presence of `uploadDocument` ABI means active write path always reaches chain (fallback path exists).
- Seeing Gold/Silver/Bronze in route comments and assuming UX visibility.
- Seeing `fetchReputationHistory` API and assuming profile uses it.
- Counting DB `ReputationTag` entries as on-chain-derived evidence without tx-level provenance.

## Recommended Plan Decomposition (3 Executable Plan Files)

### 01-01: Confirm Document Hash Is On-Chain

- Build evidence map of contract write path, fallback path, DB payload path, and activity rendering path.
- Produce verdict matrix for each transition: sender sign, receiver finalize, profile activity view.
- Output artifacts:
  - `docs/audit/01-01-document-anchor-evidence.md`
  - Command transcript snippets
  - Pass/fail verdict with blocked-by list

### 01-02: Confirm TEE Tier Is Surfaced in UX

- Map all TEE-related endpoints and UI components; prove endpoint consumption or absence.
- Capture whether tier/confidence/attestation are visible in normal user flow.
- Output artifacts:
  - `docs/audit/01-02-tee-tier-ux-evidence.md`
  - UI route-by-route visibility table
  - Pass/fail verdict and exact missing wiring points

### 01-03: Confirm Reputation Tags Are Chain-Derived

- Trace tag lifecycle from transaction history/indexer/API to profile and directory surfaces.
- Distinguish chain-derived tags from local heuristic tags and admin/manual tags.
- Output artifacts:
  - `docs/audit/01-03-reputation-derivation-evidence.md`
  - Source-of-truth matrix (Chain vs DB vs Local)
  - Pass/fail verdict with remediation priorities for Phase 2

## Source-of-Truth Rubric For This Phase

Use this rubric in all three plans:

- **On-chain proven:** Contract storage/event or chain history query confirms claim.
- **DB-backed only:** Data exists in Prisma/SQLite tables or JSON payloads without chain proof.
- **UI-only:** Claim is rendered text/state but has no validated backing source.
- **Mixed (needs fix):** UI combines chain and off-chain paths without explicit trust labeling.

## Confidence Breakdown

- Document anchoring audit design: HIGH (contract + client + API paths are directly inspectable).
- TEE tier surfacing audit design: HIGH (tier endpoint and UI call graph clearly separable).
- Reputation derivation audit design: HIGH (on-chain API and local/DB tag paths are explicitly distinct in code).

## Ready For Planning

Research is implementation-ready for generating:

- `01-01-confirm-document-hash-is-written-on-chain-not-only-in-database-records.md`
- `01-02-confirm-gold-silver-bronze-tee-output-is-surfaced-in-user-facing-ui.md`
- `01-03-confirm-reputation-tags-derive-from-on-chain-history-not-only-db-state.md`
