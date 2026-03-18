---
phase: 02-wire-gaps-found-in-audit
plan: 01
subsystem: document-anchoring
tags: [documents, anchoring, api-validation, fail-closed, doc-01]
requires:
  - phase: 02-wire-gaps-found-in-audit
    provides: plan and validation contract
provides:
  - Strict tx-hash and anchor metadata contract enforcement in document APIs
  - Fail-closed sender-sign flow with explicit remediation messaging
  - Chain-hash-only activity projection for document anchors
affects: [doc-01, document-trust-layer, activity-evidence]
tech-stack:
  added: []
  patterns: [strict-regex-validation, fail-closed-ui-flow, backward-compatible-payload-normalization]
key-files:
  created:
    - .planning/phases/02-wire-gaps-found-in-audit/02-01-SUMMARY.md
  modified:
    - src/types/index.ts
    - src/app/api/documents/route.ts
    - src/app/api/documents/[id]/route.ts
    - src/app/api/activity/route.ts
    - src/app/dashboard/documents/[id]/page.tsx
key-decisions:
  - "Removed offchain fallback marker writes from sender-sign flow; sender cannot advance without valid chain tx hash"
  - "transactionHash is now strict ^0x[a-fA-F0-9]{64}$ on write paths; invalid values are rejected"
  - "Legacy invalid transactionHash payloads are surfaced with anchorStatus=FAILED and anchorError"
patterns-established:
  - "Anchor-proof semantics are explicit via anchorStatus/anchorError, not inferred from overloaded transactionHash values"
  - "Activity endpoint only emits DOCUMENT_ANCHOR for strict chain hashes and non-failed anchor states"
requirements-completed: [DOC-01]
duration: 24min
completed: 2026-03-18
---

# Phase 2 Plan 01: Document Anchoring Integrity Wiring Summary

**DOC-01 is now fail-closed: sender-sign cannot transition to receiver-sign unless on-chain anchoring returns a strict 0x-prefixed 64-hex transaction hash.**

## Performance

- Duration: 24 min
- Completed: 2026-03-18T19:51:33.5264963+08:00
- Files modified: 5
- Files created: 1

## Accomplishments

- Added explicit `anchorStatus` and `anchorError` to shared document type contract.
- Enforced strict tx-hash gate `^0x[a-fA-F0-9]{64}$` in the shared document write API.
- Normalized read payloads to preserve legacy compatibility while exposing explicit anchor failure states.
- Removed offchain fallback marker path from sender-sign UI flow.
- Added actionable remediation messaging when anchoring is unavailable or fails.
- Preserved chain-hash-only DOCUMENT_ANCHOR projection in activity API and excluded explicitly failed anchors.
- Hardened activity endpoint for local deterministic verification by tolerating missing purchase-table query path.

## Verification Executed

1. `npm run lint` -> pass.
2. `npm run build` -> pass.
3. Offchain marker scan:
   - Command: `Select-String -Path 'src/app/dashboard/documents/[id]/page.tsx','src/app/api/**/*.ts' -Pattern 'offchain-anchor:' -SimpleMatch`
   - Result: `No matches found.`
4. Deterministic activity API check:
   - Precondition: `Invoke-WebRequest -UseBasicParsing 'http://localhost:3000'` returned `200`.
   - Request: `GET /api/activity?walletAddress=0x1111111111111111111111111111111111111111`
   - Result: `{ "success": true, "data": [] }`

## Files Created or Modified

- .planning/phases/02-wire-gaps-found-in-audit/02-01-SUMMARY.md - Execution summary and verification evidence.
- src/types/index.ts - Added `DocumentAnchorStatus`, `anchorStatus`, and `anchorError`.
- src/app/api/documents/route.ts - Added strict anchor field validation and normalized anchor metadata handling.
- src/app/api/documents/[id]/route.ts - Added by-id payload normalization for anchor semantics.
- src/app/api/activity/route.ts - Maintained strict chain-hash anchor projection and skipped failed anchors.
- src/app/dashboard/documents/[id]/page.tsx - Made sender-sign anchoring fail-closed with explicit remediation messaging.

## Deviations from Plan

None. Scope remained limited to DOC-01 anchoring integrity wiring.

## Next Phase Readiness

- Ready for `.planning/phases/02-wire-gaps-found-in-audit/02-02-PLAN.md`.
- DOC-01 trust boundary now aligns with strict chain-proof semantics required by phase validation.
