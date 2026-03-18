# 01-01 Document Anchor Evidence

Scope: Phase 1 audit only, no fixes implemented.

## Evidence Matrix

| Claim | Source File | Command Evidence | Trust Class | Verdict |
|---|---|---|---|---|
| Smart contract has an on-chain document write function | contracts/DocuMate.sol | Transcript shows `function uploadDocument(` and `event DocumentUploaded(` matches | On-chain proven (capability exists) | PASS |
| UI can call contract upload path | src/app/dashboard/documents/[id]/page.tsx | Transcript shows `await uploadDocument(finalHash)` and status `Anchoring document hash on-chain` | Mixed | PASS |
| UI can bypass on-chain path with fallback marker | src/app/dashboard/documents/[id]/page.tsx | Transcript shows `transactionHash: offchain-anchor:*` and `On-chain anchoring unavailable` | UI-only fallback | FAIL |
| API document store is database payload persistence | src/app/api/documents/route.ts | Transcript shows `CREATE TABLE SharedDocument` and `payload TEXT NOT NULL`, with INSERT/UPDATE payload writes | DB-backed only | PASS |
| Activity route labels document anchor only for tx hashes matching 0x64 hex | src/app/api/activity/route.ts | Transcript shows regex `^0x[a-fA-F0-9]{64}$` and `type: DOCUMENT_ANCHOR` | Mixed (filters non-chain markers) | PASS |
| Repo evidence proves finalized docs are always anchored on-chain | Cross-path (UI + API + activity) | Transcript contains both on-chain call path and fallback path, but no runtime tx receipt evidence attached to a finalized document in this audit | Mixed | UNVERIFIED |

## Trust-Boundary Classes

- On-chain proven: contract capability and callable path are present in code.
- DB-backed only: state persisted as payload rows without blockchain guarantee.
- UI-only fallback: marker value indicates non-chain fallback (`offchain-anchor:*`).
- Mixed: both true on-chain and fallback/non-chain paths can occur.

## PASS/FAIL/UNVERIFIED Rubric Applied

- PASS only if chain proof exists and fallback is not treated as equivalent proof for the audited claim.
- FAIL if fallback/non-chain path is treated as equivalent to on-chain anchoring.
- UNVERIFIED when available evidence cannot prove that production runtime behavior always produced chain-backed proof for finalized records.

## Final DOC-01 Verdict

UNVERIFIED

Reason:
- The capability for on-chain anchoring exists and is callable.
- The UI also includes an explicit fallback path that writes `offchain-anchor:*` markers.
- This audit transcript does not include runtime transaction-level evidence tying a finalized document to a confirmed on-chain anchor event.

## Blocked-By List

- No captured runtime sample in this audit showing a finalized document with verifiable `0x...` tx hash and corresponding chain confirmation for `uploadDocument`.
- Presence of fallback marker path prevents blanket PASS without additional runtime proof.
