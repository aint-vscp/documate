# Phase 3: End-to-End Prototype Test on Testnet - Research

**Researched:** 2026-03-18  
**Domain:** Polkadot Hub testnet end-to-end validation (identity gating, document anchoring, TEE tiering, settlement split, reputation evidence)  
**Confidence:** HIGH

## User Constraints

- Deterministic and implementation-focused.
- Support plans 03-01, 03-02, 03-03 exactly as defined in roadmap.
- Include concrete Windows PowerShell verification commands.
- Include explicit API data contracts for anchor proof, TEE tier, purchase split, and reputation provenance.
- Focus risks and mitigations on testnet reproducibility.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| DOC-01 | Document hash anchoring is fully wired and verifiable end to end in UI and API | Anchor proof contract + strict tx hash checks in `/api/documents`, `/api/documents/[id]`, `/api/activity`, and sender/receiver UI flow |
| DOC-03 | TEE Gold/Silver/Bronze classification is fully visible in UI and user flow | `/api/validate-document` producer contract and required UI consumer checkpoints in document flow |
| SET-03 | Revenue split is deterministically enforced as 75/20/5 | Contract constants/events + `calculateSplit` + purchase transaction and API reconciliation checks |
| REP-01 | Reputation tags are derived from on-chain contract history in live UX | Current tag paths + required provenance payload contract and evidence joins from activity/breach/tag sources |
| ID-01 | Runtime identity precompile integration exists at `0x...0818` | Contract/runtime config checks and testnet config check script assertions |
| ID-02 | Marketplace critical actions are gated by verification path | `checkVerified`, contract `isVerified`, and purchase/signing gate checkpoints |
</phase_requirements>

## Summary

Phase 3 should be executed as an evidence-first validation phase, not as feature invention. Core mechanics already exist in the repository: wallet/network connection on Polkadot Hub EVM, verification-gated contract interactions, strict document anchor metadata normalization, TEE classification API output, and marketplace purchase write path with persisted split values. The fastest safe path is to validate this chain end-to-end with deterministic scripts and fixed payload assertions.

The main risk is not missing primitives, but mismatched evidence boundaries: some trust signals are API-only, some UI-only, and reputation provenance is still partly tag-list based (`tagsJson`) rather than fully evidence-linked (`source`, `txHash`, `pocHash`, `breachId`). Phase 3 should therefore establish a strict acceptance contract for returned fields and explorer-verifiable transaction hashes at each step.

**Primary recommendation:** Run 03-01 -> 03-02 -> 03-03 in sequence with fixed test inputs, capture response contracts and explorer links at each transition, and fail Phase 3 if any required proof field is absent or non-deterministic.

## Standard Stack

### Core

| Library | Version in repo | Latest verified (npm) | Publish date (latest) | Purpose | Why Standard Here |
|---|---:|---:|---|---|---|
| next | 16.1.7 | 16.1.7 | 2026-03-16T22:57:23.858Z | App Router UI + API routes | All user journey checkpoints are implemented as Next pages and route handlers |
| ethers | 6.16.0 | 6.16.0 | 2025-12-03T05:30:37.088Z | EVM contract calls/receipts | Existing wallet hooks and contract calls already use ethers v6 |
| hardhat | 2.28.6 | 3.1.12 | 2026-03-11T14:41:17.943Z | Contract compile/test | Existing tests validate split and verification gate; keep current major for stability this phase |
| @prisma/client | 6.19.2 | 7.5.0 | 2026-03-11T14:44:35.031Z | Operational DB records | Purchase/breach/verification/tag evidence is persisted via Prisma |

### Supporting

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| @polkadot/api | 16.5.4 | Reputation history scanning via Asset Hub route | For `/api/reputation/[id]` evidence and POC history checks |
| eslint | 9.x | Deterministic static quality gate | Before every acceptance run to prevent noisy runtime failures |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Local API assertions only | Full Playwright E2E | Stronger UX automation but slower to stand up under deadline |
| Prisma + sqlite evidence checks | External indexer-first validation | Better scale, worse short-term determinism for current phase deadline |

**Version verification commands used:**

```powershell
node -e "const {execSync}=require('child_process'); const pkgs=['next','ethers','hardhat','@prisma/client']; for (const p of pkgs){ const v=execSync('npm view '+p+' version').toString().trim(); const t=JSON.parse(execSync('npm view '+p+' time --json').toString()); console.log(p+' '+v+' '+(t[v]||'unknown')); }"
```

## Architecture Patterns

### Recommended Project Structure for Phase 3 Validation

```text
src/
├── app/
│   ├── dashboard/                  # Wallet/document/market UX checkpoints
│   └── api/                        # Evidence-producing contracts to assert
├── hooks/                          # Wallet + contract interaction gates
├── lib/
│   ├── contracts/                  # Split constants and on-chain wrappers
│   ├── document/                   # Signature/hash/reputation risk helpers
│   └── polkadot/                   # Reputation history fetch utilities
└── types/                          # Shared payload contracts
scripts/
└── testnet-*.js                    # Deterministic chain configuration checks
```

### Pattern 1: Verification-Gated Critical Action

**What:** Any purchase/signing action touching on-chain value or trust state must pass verification first (`isVerified`).  
**When to use:** 03-01 identity gate, 03-03 purchase flow.

**Code example:**

```typescript
// Source: src/hooks/useDocuMateContract.ts
const verified = await contract.isVerified(signerAddress);
if (!verified) {
  throw new Error("Wallet DID is not verified for marketplace transactions yet. Please complete verification first.");
}
```

### Pattern 2: Fail-Closed Anchor Proof

**What:** Receiver finalization proceeds only when `transactionHash` matches `^0x[a-fA-F0-9]{64}$` and `anchorStatus !== "FAILED"`.  
**When to use:** 03-02 document mint/anchor validation.

**Code example:**

```typescript
// Source: src/app/dashboard/documents/[id]/page.tsx
const hasValidAnchorProof = !!document.transactionHash
  && /^0x[a-fA-F0-9]{64}$/.test(document.transactionHash)
  && document.anchorStatus !== "FAILED";
```

### Pattern 3: Dual-Layer Settlement Verification

**What:** Verify 75/20/5 split on chain and in persisted API payload.  
**When to use:** 03-03 marketplace purchase evidence.

**Code example:**

```typescript
// Source: src/app/api/market/purchase/route.ts
const creatorAmount = (price * REVENUE_SPLIT.CREATOR) / 100;
const companyAmount = (price * REVENUE_SPLIT.COMPANY) / 100;
const stakingAmount = (price * REVENUE_SPLIT.STAKING) / 100;
```

### Anti-Patterns to Avoid

- **Treating local tag arrays as provenance:** `tagsJson` string arrays are not sufficient for REP-01 evidence.
- **Using non-hex tx placeholders as proofs:** any value outside strict 32-byte hash format invalidates DOC-01 evidence.
- **UI-success without API-contract assertion:** all major journey checkpoints must assert returned JSON shape and required keys.

## Data Contracts (Explicit)

### 1) Anchor Proof Contract

**Primary endpoints:** `GET /api/documents?walletAddress=...`, `GET /api/documents/[id]`, `GET /api/activity?walletAddress=...`

**Expected keys and constraints:**

| Field | Type | Constraint | Source |
|---|---|---|---|
| `success` | boolean | must be `true` for successful reads | route envelopes |
| `data[].id` | string | non-empty | document payload |
| `data[].transactionHash` | string | must match `^0x[a-fA-F0-9]{64}$` when `anchorStatus=ANCHORED` | normalized in documents routes |
| `data[].anchorStatus` | enum | one of `PENDING`, `ANCHORED`, `FAILED` | shared type + route normalization |
| `data[].anchorError` | string\|undefined | required when failed/non-valid hash path | route normalization |
| `activity.data[].type` | string | `DOCUMENT_ANCHOR` entries only for strict tx hash and non-FAILED status | activity route filter |
| `activity.data[].txHash` | string | strict `0x` 64 hex | activity route filter |

### 2) TEE Tier Contract

**Primary endpoint:** `POST /api/validate-document` (multipart form with `file`)

**Expected keys and constraints:**

| Field | Type | Constraint |
|---|---|---|
| `success` | boolean | `true` on validation pass |
| `signatureValid` | boolean | signature parser output |
| `tier` | number | 1, 2, or 3 |
| `tierName` | string | `Gold`, `Silver`, `Bronze` |
| `tierColor` | string | hex color string |
| `confidence` | number | numeric confidence score |
| `attestation` | string | `0x` 64 hex hash |
| `phalaWorker` | string | non-empty worker identifier |
| `message` | string | reason/explanation |

### 3) Purchase Split Contract

**Primary endpoints:** on-chain `calculateSplit`, `purchase`; API `POST /api/market/purchase`

**Expected API response keys and constraints:**

| Field | Type | Constraint |
|---|---|---|
| `success` | boolean | must be `true` |
| `data.purchaseId` | string | non-empty |
| `data.templateId` | string | equals request templateId |
| `data.price` | number | equals template price at purchase time |
| `data.split.creator` | number | `price * 0.75` |
| `data.split.company` | number | `price * 0.20` |
| `data.split.staking` | number | `price * 0.05` |
| request `txHash` | string | strict `^0x[a-fA-F0-9]{64}$` |

**On-chain parity check:** `calculateSplit(1 PAS)` must return values summing exactly to input with 75/20/5 partitioning.

### 4) Reputation Provenance Contract (Phase 3 requirement target)

Current repo stores visible tags as `tagsJson` arrays in directory APIs, while richer provenance fields exist in Prisma `ReputationTag` model and breach records.

**Minimum expected provenance fields for REP-01 evidence panel in Phase 3 output:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `tag` | string | yes | label shown in UI |
| `source` | enum | yes | one of `POC_COMPLETION`, `TEMPLATE_SALES`, `VERIFICATION`, `MANUAL`, `BREACH` |
| `txHash` | string\|null | conditional | required for chain-derived tags |
| `pocHash` | string\|null | conditional | required for POC-derived tags |
| `breachId` | string\|null | conditional | required when source is breach-related |
| `issuedAt` | ISO datetime | yes | provenance timestamp |
| `value` | number\|null | optional | tag scoring/value context |

**Phase 3 validation rule:** if UI shows a reputation tag as trust evidence, at least one provenance pointer (`txHash`, `pocHash`, or `breachId`) must be present.

## Plan-Specific Guidance

### 03-01: Wallet connect -> KILT verify -> DocuWriter draft flow

- Use `useEVMWallet.connectMetaMask` to enforce Polkadot Hub chain switch (`420420417`).
- Gate sender signing and marketplace actions through `checkVerified`/`isVerified`.
- Capture both UI state and contract/API proof:
  - Wallet connected account
  - `isVerified(account)` true
  - document draft created and synced via `/api/documents`

### 03-02: On-chain hash mint + TEE classification + UI rendering

- Sender sign path must produce strict anchor hash and `anchorStatus=ANCHORED`.
- Receiver finalize must be blocked if anchor proof invalid.
- TEE flow must return tier payload and be visibly represented in the user flow (badge/text with tier + attestation snippet).

### 03-03: Marketplace purchase, split verification, reputation tag generation

- Execute on-chain purchase transaction first, then persist API purchase record with same txHash.
- Verify split in 3 places: contract constants/calc, transaction outcome, API split payload.
- Confirm reputation tag generation and provenance presence; avoid accepting tag strings without evidence pointers.

## Deterministic Windows PowerShell Verification Sequences

### Global Preflight

```powershell
$ErrorActionPreference = 'Stop'
Set-Location "C:\Users\Vash\Documents\GitHub\documate"

npm install
npx prisma generate
npx prisma db push
npm run lint
npm run contracts:test
npm run testnet:config-check
```

### 03-01 Verification (Identity + Draft)

```powershell
# Terminal A
npm run dev

# Terminal B
$Wallet = "0x1111111111111111111111111111111111111111"

# 1) Prove network/identity gating exists (SET/ID preconditions)
node scripts/testnet-config-check.js

# 2) Verify documents endpoint accepts EVM wallet and returns deterministic envelope
Invoke-RestMethod "http://localhost:3000/api/documents?walletAddress=$Wallet" | ConvertTo-Json -Depth 8

# 3) Verify activity envelope format (used later for provenance joins)
Invoke-RestMethod "http://localhost:3000/api/activity?walletAddress=$Wallet" | ConvertTo-Json -Depth 8
```

### 03-02 Verification (Anchor + TEE + Rendering Inputs)

```powershell
$Wallet = "0x1111111111111111111111111111111111111111"

# 1) Check no offchain anchor fallback marker in production path
Select-String -Path 'src/app/dashboard/documents/[id]/page.tsx','src/app/api/**/*.ts' -Pattern 'offchain-anchor:' -SimpleMatch

# 2) Pull normalized document payload and assert anchor keys
$docs = Invoke-RestMethod "http://localhost:3000/api/documents?walletAddress=$Wallet"
$docs | ConvertTo-Json -Depth 10

# 3) Assert activity only includes strict tx hashes for document anchors
$activity = Invoke-RestMethod "http://localhost:3000/api/activity?walletAddress=$Wallet"
$activity | ConvertTo-Json -Depth 10

# 4) Validate TEE contract using deterministic fixture upload
$form = @{ file = Get-Item ".\docs\audit\01-01-document-anchor-evidence.md" }
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/validate-document" -Form $form | ConvertTo-Json -Depth 8
```

### 03-03 Verification (Purchase Split + Reputation)

```powershell
$Wallet = "0x1111111111111111111111111111111111111111"

# 1) Contract-level split check (1 PAS) and config proof
npm run testnet:config-check

# 2) After a real UI purchase, verify purchase activity includes tx hash
Invoke-RestMethod "http://localhost:3000/api/activity?walletAddress=$Wallet" | ConvertTo-Json -Depth 10

# 3) Verify profile tags payload currently rendered in live UX
Invoke-RestMethod "http://localhost:3000/api/directory/profile?walletAddress=$Wallet" | ConvertTo-Json -Depth 10

# 4) (If breach path is exercised) confirm provenance-capable breach evidence + slash tx
Invoke-RestMethod "http://localhost:3000/api/admin/breaches?status=CONFIRMED" | ConvertTo-Json -Depth 10
```

## Don’t Hand-Roll

| Problem | Don’t Build | Use Instead | Why |
|---|---|---|---|
| EVM verification semantics | Custom local verification flags | Contract `isVerified` gate + existing hooks | Avoid trust divergence between UI and chain |
| Revenue split math copies | New ad-hoc split implementations | Contract `calculateSplit` + existing `REVENUE_SPLIT` constant | Prevent rounding mismatch and claim drift |
| TEE attestation hashing format | New pseudo-attestation schema | Existing `/api/validate-document` fields (`tier`, `attestation`, `phalaWorker`) | Keeps judge narrative consistent |
| Reputation proof rendering | Tag string chips only | Provenance record with `source` + proof pointer | Required for REP-01 credibility |

## Common Pitfalls

### Pitfall 1: Non-deterministic testnet identity state

**What goes wrong:** wallet appears connected but `isVerified` differs per address and session.  
**How to avoid:** use fixed verification wallet for scripted assertions and always log `isVerified(wallet)` in evidence set.

### Pitfall 2: Anchor proof accepted without strict hash check

**What goes wrong:** UI/API accidentally treats malformed tx values as anchored state.  
**How to avoid:** assert regex and `anchorStatus` contract before receiver finalize and in API evidence.

### Pitfall 3: Split proof shown only in UI text

**What goes wrong:** claim says 75/20/5 but no contract/API parity artifact is captured.  
**How to avoid:** capture `testnet:config-check` split output + purchase API split payload + tx hash explorer link.

### Pitfall 4: Reputation tag shown without provenance

**What goes wrong:** tag chip exists but no chain/breach/source evidence path.  
**How to avoid:** require provenance fields for any tag used in judge-facing proof; mark missing provenance as validation failure.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Mixed anchor semantics with fallback markers | Strict anchor metadata (`anchorStatus`, `anchorError`, tx hash regex) | Phase 2 | Stronger DOC-01 proof reliability |
| UI-only split messaging | On-chain split execution + persisted split record | Existing marketplace flow | Enables deterministic SET-03 evidence |
| Local tag-only reputation rendering | Hybrid of local tags + DB/chain evidence paths (still incomplete provenance) | In progress | REP-01 still needs explicit provenance contract in Phase 3 |

**Deprecated/outdated for proof claims:**
- Treating `tagsJson` alone as sufficient reputation evidence.
- Accepting any non-empty transaction string as chain proof.

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Hardhat + Next API/manual integration checks |
| Config file | `hardhat.config.js` |
| Quick run command | `npm run lint` |
| Full suite command | `npm run release:checklist` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| DOC-01 | Anchored docs expose strict hash + anchor status in API and activity | integration | `Invoke-RestMethod /api/documents` + `Invoke-RestMethod /api/activity` + regex assertions | Partial |
| DOC-03 | TEE returns Gold/Silver/Bronze contract and is renderable in UI flow | integration | `Invoke-RestMethod -Method Post /api/validate-document -Form @{file=...}` | Partial |
| SET-03 | Purchase split is 75/20/5 by contract and persisted API payload | contract+integration | `npm run contracts:test` + `npm run testnet:config-check` + purchase flow + `/api/market/purchase` assertion | Partial |
| REP-01 | Reputation tags in UX include provenance pointers | integration | `/api/directory/profile` + `/api/activity` (+ breach endpoint when applicable) | Gap |
| ID-01 | Identity precompile configuration and runtime address proof available | config | `npm run testnet:config-check` | Yes |
| ID-02 | Critical actions blocked when unverified and enabled when verified | integration | wallet flow + `checkVerified`/`isVerified` checkpoints during sign/purchase | Partial |

### Sampling Rate

- **Per task commit:** `npm run lint`
- **Per wave merge:** `npm run contracts:test` and `npm run testnet:config-check`
- **Phase gate:** `npm run release:checklist` plus complete PowerShell evidence pack for 03-01/02/03

### Wave 0 Gaps

- [ ] Add API contract test for `/api/validate-document` asserting exact response keys and types.
- [ ] Add API contract test for `/api/activity` asserting `DOCUMENT_ANCHOR` tx hash regex filtering.
- [ ] Add integration assertion for purchase split response parity with contract `calculateSplit`.
- [ ] Add provenance-capable reputation response endpoint (or extend existing) to include `source`, `txHash|pocHash|breachId`, and `issuedAt`.

## Risks and Mitigations (Testnet Reproducibility)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RPC instability/rate limits on Polkadot Hub testnet | Medium | High | Retry wrapper for read checks; run key proofs in low-traffic windows; keep local fallback snapshots |
| Wallet state drift between demos | Medium | Medium | Use dedicated deterministic demo wallets and record pre-run balances/verification state |
| Contract address/env mismatch | Medium | High | Enforce `npm run testnet:config-check` before every capture run |
| Chain finality timing race in evidence capture | Medium | Medium | Wait for receipt and confirm explorer visibility before logging proof |
| Reputation proof ambiguity due tag-only APIs | High | Medium | Add provenance contract assertion and reject screenshots without pointer fields |
| SQLite local state contamination between runs | Medium | Medium | Clear/reset local DB before scripted runs (`npx prisma db push` on clean state) |

## Open Questions

1. Should Phase 3 include creating a dedicated `/api/reputation/provenance` endpoint, or extend `/api/directory/profile` to return provenance objects instead of string tags only?
2. Which exact fixture file should be canonical for TEE validation runs (`.pdf` preferred) to avoid MIME/heuristic variability?
3. Should Hardhat be upgraded to 3.x before Phase 7, or held at 2.x until after submission to minimize regression risk?

## Sources

### Primary (HIGH confidence)

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/phases/02-wire-gaps-found-in-audit/02-RESEARCH.md`
- `.planning/phases/02-wire-gaps-found-in-audit/02-VALIDATION.md`
- `.planning/phases/02-wire-gaps-found-in-audit/02-01-SUMMARY.md`
- `README.md`
- `src/hooks/useEVMWallet.ts`
- `src/hooks/useDocuMateContract.ts`
- `src/app/dashboard/documents/new/page.tsx`
- `src/app/dashboard/documents/[id]/page.tsx`
- `src/app/api/documents/route.ts`
- `src/app/api/documents/[id]/route.ts`
- `src/app/api/activity/route.ts`
- `src/app/api/validate-document/route.ts`
- `src/app/api/market/purchase/route.ts`
- `src/app/api/directory/profile/route.ts`
- `src/app/api/directory/tags/route.ts`
- `src/app/api/admin/breaches/route.ts`
- `prisma/schema.prisma`
- `contracts/DocuMateMarketplace.sol`
- `scripts/testnet-config-check.js`
- `scripts/testnet-smoke-track2.js`
- `test/documate-track2.test.js`
- `package.json`

### Secondary (MEDIUM confidence)

- npm registry metadata via `npm view` for version/date verification.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (direct package and npm registry verification)
- Architecture patterns: HIGH (derived from current implementation paths)
- Pitfalls/repro risks: HIGH (grounded in existing route and testnet constraints)

**Research date:** 2026-03-18  
**Valid until:** 2026-03-25 (fast-moving pre-submission window)
