# Phase 4: Submission Documentation - Research

**Researched:** 2026-03-18
**Domain:** Judge-facing technical documentation and evidence integrity for Track 2 submission
**Confidence:** HIGH

## Summary

Phase 4 should be executed as an evidence-packaging phase, not a feature-building phase. The highest-leverage approach is to establish a single evidence contract that every judge-facing document must satisfy, then enforce that contract with deterministic PowerShell checks. This avoids narrative drift between README, technical proof docs, and SUBMISSION checklist.

The current repository already contains the core proof ingredients: deployed contract addresses, chain ID, precompile call-path explanation, demo flow, and config-check outputs. The implementation gap is consistency and falsifiability: claims must be machine-checkable, every claim must tie to an explicit artifact, and no document may contain unverifiable forward-looking language presented as shipped behavior.

**Primary recommendation:** Implement Phase 4 as a docs-as-evidence pipeline with a strict claim schema, a plan-to-requirement evidence matrix, and mandatory consistency commands run before final submission.

## Phase Requirements Coverage Matrix

| Plan | Requirement IDs to Support | Mandatory Evidence Artifacts |
|------|----------------------------|------------------------------|
| 04-01 README rewrite | SUB-01, ID-01, ID-02, SET-03 | README sections for Track 2 differentiator, chain ID, deployed addresses, runtime precompile address, and deterministic split statement linked to command output source |
| 04-02 finalize judge docs | SUB-01, DOC-01, DOC-03, REP-01, REP-02 | docs/precompile-integration.md call-path proof, docs/demo-script.md timed flow + fallback, docs/judge-qa.md direct answers bound to artifacts and command outputs |
| 04-03 SUBMISSION checklist | SUB-03 (+ cross-check of ID-01, ID-02, SET-01, SET-02, SET-03, DOC-01, DOC-03, REP-01, REP-02) | SUBMISSION.md checklist rows containing command, exact expected output shape, artifact location, and verification status |

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| Markdown (.md) | N/A | Canonical human-readable submission artifacts | Required by hackathon judging workflows and repository-native review |
| PowerShell 5.1+ | OS-native | Deterministic evidence and consistency verification on Windows | Native shell for this workspace; supports regex, diff, and scripted checks |
| ripgrep (`rg`) | repo toolchain | Fast structured text checks across docs/code | Deterministic pattern checks for addresses, chain IDs, and claims |

### Supporting
| Library/Tool | Version | Purpose | When to Use |
|--------------|---------|---------|-------------|
| Node.js scripts (`scripts/testnet-config-check.js`) | repo local | Runtime proof snapshot (addresses, totals, split, verification signal) | Use for final evidence snapshots and fallback demo proof |
| npm scripts (`lint`, `contracts:test`, `testnet:config-check`) | repo local | Validate code and contract assumptions backing documentation claims | Use before finalizing SUBMISSION.md evidence rows |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PowerShell checks | ad-hoc manual visual review | Faster initially, but non-reproducible and error-prone under deadline |
| Single doc checklist only | distributed per-doc unstructured notes | Harder to audit; increases contradiction risk across docs |

**Installation:**
```bash
npm install
```

## Architecture Patterns

### Recommended Project Structure (Docs Evidence View)
```text
README.md                        # Top-level narrative and Track 2 differentiator
SUBMISSION.md                    # Judge-ready evidence checklist (authoritative gate)
docs/
  precompile-integration.md      # Runtime precompile proof and contract call-path
  demo-script.md                 # Time-boxed walkthrough and fallback command path
  judge-qa.md                    # Objection handling bound to concrete evidence
scripts/
  testnet-config-check.js        # Deterministic evidence producer
  demo-fallback-check.js         # Backup evidence producer
```

### Pattern 1: Claim -> Evidence -> Verification Command
**What:** Every externally visible claim must include a concrete artifact and deterministic command to re-check it.
**When to use:** For all Track 2 statements, on-chain assertions, and readiness claims.
**Example:**
```powershell
# Verify precompile address declaration and staticcall path in contract source
Select-String -Path contracts/DocuMateMarketplace.sol -Pattern 'DEFAULT_IDENTITY_PRECOMPILE|identityPrecompile\.staticcall|IIdentityPrecompile\.identity\.selector'

# Expected: matching lines for constant 0x...0818 and staticcall selector usage
```

### Pattern 2: Single-Source Constants Across Docs
**What:** Contract addresses, chain ID, and RPC endpoint must be byte-for-byte identical across README + docs + SUBMISSION.
**When to use:** Before marking any checklist item complete.
**Example:**
```powershell
$files = @('README.md','SUBMISSION.md','docs/precompile-integration.md','docs/demo-script.md','docs/judge-qa.md')
$chainHits = Select-String -Path $files -Pattern '420420417' -SimpleMatch
if ($chainHits.Count -lt 5) { throw 'Chain ID missing or inconsistent across docs.' }

# Expected: at least one hit per required doc
```

### Pattern 3: Evidence Contract Block in SUBMISSION.md
**What:** Normalize each row to strict fields so reviewers can replay validation quickly.
**When to use:** For every mandatory submission checklist item.
**Example schema:**
```markdown
- Claim: [what is true]
- Requirement IDs: [e.g., ID-01, SUB-03]
- Artifact: [file path or explorer URL]
- Command: [exact command]
- Expected Output: [exact string or regex]
- Status: [pass/fail]
```

### Anti-Patterns to Avoid
- **Narrative-only proof:** Claiming runtime integration without code line evidence and command output.
- **Cross-doc drift:** Different addresses/chain IDs in different docs.
- **Undated/unsourced snapshots:** Output pasted without command context or timestamp.
- **Future-state phrasing:** Statements like "implemented" or "ready" when only planned.

## Evidence Contract (Strict Fields)

Every evidence entry in docs for Phase 4 must include these mandatory fields:

| Field | Required Format | Validation Rule |
|------|------------------|-----------------|
| Chain ID | `420420417` (decimal) and optional `0x1908FC31` (hex) | Must match network used by scripts/config-check output |
| Contract Address | `0x` + 40 hex chars | Regex: `^0x[a-fA-F0-9]{40}$` |
| Tx Hash | `0x` + 64 hex chars | Regex: `^0x[a-fA-F0-9]{64}$` |
| Command Used | Copy-pastable one-liner | Must run in repo root on Windows PowerShell |
| Expected Output | Stable key lines or regex | Must include at least one deterministic anchor phrase |
| Artifact Link | Relative path or explorer URL | Must resolve and correspond to same address/hash |
| Timestamp | ISO-8601 local/UTC | Required for command-output evidence snapshots |

## Anti-Hallucination Rules for Submission Claims

1. Never claim a transaction occurred unless a tx hash matching `^0x[a-fA-F0-9]{64}$` is present and linked to explorer evidence.
2. Never claim contract deployment unless the address appears in all judge docs and in `npm run testnet:config-check` output.
3. Never claim "verified user" behavior from mock mode; include explicit `useMockVerification = false` source proof.
4. Never claim deterministic split without showing `split(1 PAS)` output and exact 75/20/5 wei tuple.
5. Never claim end-to-end completion without both command evidence and user-facing doc path where judges can inspect it.
6. If evidence is unavailable, mark as `NOT VERIFIED` rather than inferred.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-file consistency auditing | Manual side-by-side scanning | PowerShell + `Select-String` + `rg` checks | Deterministic and repeatable under deadline |
| Chain proof format rules | Ad-hoc regex guesses | EIP-1474 JSON-RPC data/quantity conventions | Reduces false-positive or malformed evidence fields |
| Final readiness gate | Subjective "looks good" review | Command-backed checklist in SUBMISSION.md | Auditability and judge confidence |

**Key insight:** Documentation quality here is primarily a verification problem, not a writing problem.

## Common Pitfalls

### Pitfall 1: Address Drift Across Documents
**What goes wrong:** One doc has stale contract address while others are updated.
**Why it happens:** Manual edits in multiple markdown files.
**How to avoid:** Run a single command to extract all `0x` addresses and compare expected set.
**Warning signs:** Different explorer links or mismatched owner/treasury values in outputs.

### Pitfall 2: Unverifiable Track 2 Claims
**What goes wrong:** Track 2 narrative is asserted without staticcall and precompile selector proof.
**Why it happens:** Over-reliance on summary language.
**How to avoid:** Require source-line evidence plus command output in docs/precompile-integration.md.
**Warning signs:** No mention of `IIdentityPrecompile.identity.selector`.

### Pitfall 3: Checklist Items Without Replayable Commands
**What goes wrong:** SUBMISSION.md says pass/fail but cannot be reproduced.
**Why it happens:** Copying terminal snippets without command context.
**How to avoid:** Every checklist row must include command and expected output string.
**Warning signs:** "Pass" lines with no script/command reference.

## Code Examples

Verified patterns for this repository:

### Windows Docs Consistency Check (Addresses, Chain ID, Precompile)
```powershell
$ErrorActionPreference = 'Stop'
$files = @('README.md','SUBMISSION.md','docs/precompile-integration.md','docs/demo-script.md','docs/judge-qa.md')

# Chain ID consistency
$chain = '420420417'
$chainHits = Select-String -Path $files -Pattern $chain -SimpleMatch
if ($chainHits.Count -lt $files.Count) { throw "Chain ID mismatch: expected $chain in all docs" }

# Address format and required addresses
$required = @(
  '0x233FE6112E5Ad4Db1c83358B30D581F837314BB1',
  '0x1cf190eabe490B50AaBE91b4567ebe88126e8D24',
  '0x0000000000000000000000000000000000000818'
)
foreach ($addr in $required) {
  $hits = Select-String -Path $files -Pattern $addr -SimpleMatch
  if ($hits.Count -eq 0) { throw "Missing required address: $addr" }
}

# Precompile call-path source proof
Select-String -Path 'contracts/DocuMateMarketplace.sol' -Pattern 'DEFAULT_IDENTITY_PRECOMPILE|identityPrecompile\.staticcall|IIdentityPrecompile\.identity\.selector'

Write-Host 'Docs consistency check passed.'
```

### Tx Hash Field Validator for Submission Entries
```powershell
# Validates any tx hash listed in markdown evidence blocks
$txRegex = '^0x[a-fA-F0-9]{64}$'
$txCandidates = (Get-Content SUBMISSION.md) | Select-String -Pattern '0x[a-fA-F0-9]{64}' -AllMatches | ForEach-Object { $_.Matches.Value }
foreach ($tx in $txCandidates) {
  if ($tx -notmatch $txRegex) { throw "Invalid tx hash format: $tx" }
}
Write-Host 'Tx hash format check passed.'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hackathon README as narrative-only pitch | README + evidence-linked technical docs + replayable checklist | Current cycle (2026-03) | Improves judge trust and reduces ambiguity |
| Manual checklist completion | Command-backed evidence rows with expected outputs | Current cycle | Enables deterministic review and faster verification |

**Deprecated/outdated:**
- Unsupported claims without command/artifact linkage: replaced with strict evidence contract fields.

## Open Questions

1. **Which exact requirement IDs are mandatory for final scoring beyond SUB-01/SUB-03?**
   - What we know: Current docs already cover ID-01, ID-02, SET-03 signals.
   - What's unclear: Judge weighting for pending DOC/REP requirements in final narrative.
   - Recommendation: Keep explicit mapping to all touched IDs in SUBMISSION.md rows.

2. **Should tx hashes be embedded now or left as placeholders until final live run?**
   - What we know: Format and validation rules are clear.
   - What's unclear: Final run timing near deadline may change hashes.
   - Recommendation: Keep placeholders with strict regex contract, then fill from final recorded demo run.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | PowerShell command validation + existing npm/hardhat scripts |
| Config file | none - command-driven checks for docs phase |
| Quick run command | `npm run lint` |
| Full suite command | `npm run release:checklist` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUB-01 | Judge-facing docs are present and consistent | docs consistency | `powershell -Command "$files=@('README.md','SUBMISSION.md','docs/precompile-integration.md','docs/demo-script.md','docs/judge-qa.md'); $files | ForEach-Object { if (!(Test-Path $_)) { throw \"Missing $_\" } }; Write-Host 'Docs exist'"` | ✅ |
| SUB-03 | Final checklist contains complete evidence contract fields | schema check | `powershell -Command "$c=Get-Content SUBMISSION.md -Raw; foreach($k in 'Chain ID','Command','Expected Output','Artifact'){ if($c -notmatch [regex]::Escape($k)){ throw \"Missing field $k\" } }; Write-Host 'Evidence fields present'"` | ✅ |
| ID-01 | Precompile address + call path documented | source/doc cross-check | `powershell -Command "Select-String -Path contracts/DocuMateMarketplace.sol,docs/precompile-integration.md -Pattern '0x0000000000000000000000000000000000000818|identityPrecompile\.staticcall|IIdentityPrecompile\.identity\.selector'"` | ✅ |
| SET-03 | 75/20/5 split evidence remains consistent with runtime script | runtime command proof | `npm run testnet:config-check` | ✅ |

### Sampling Rate
- **Per task commit:** `npm run lint`
- **Per wave merge:** docs consistency PowerShell checks + `npm run testnet:config-check`
- **Phase gate:** `npm run release:checklist` green and SUBMISSION.md evidence table complete

### Wave 0 Gaps
- [ ] Add a reusable docs consistency script file (for example `scripts/docs-consistency-check.ps1`) so validation does not rely on ad-hoc terminal history.
- [ ] Add explicit tx hash placeholder rows in SUBMISSION.md with regex-validated format contract.
- [ ] Add one canonical evidence matrix table in SUBMISSION.md mapping claim -> requirement IDs -> command -> expected output.

## Sources

### Primary (HIGH confidence)
- Repository documents reviewed directly: `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `README.md`, `docs/precompile-integration.md`, `docs/demo-script.md`, `docs/judge-qa.md`, `SUBMISSION.md`
- Repository scripts reviewed directly: `scripts/testnet-config-check.js`, `scripts/demo-fallback-check.js`, `package.json`

### Secondary (MEDIUM confidence)
- EIP-1474 RPC value/data encoding and transaction hash return types: https://eips.ethereum.org/EIPS/eip-1474
- Ethereum JSON-RPC conventions (`DATA`/`QUANTITY`, `eth_chainId`): https://ethereum.org/en/developers/docs/apis/json-rpc/
- EIP-155 chain ID semantics: https://eips.ethereum.org/EIPS/eip-155

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - fully grounded in repository workflow and scripts
- Architecture: HIGH - derived from current docs structure and required plan outputs
- Pitfalls: HIGH - directly observable from multi-doc evidence synchronization risk

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (30 days; refresh if submission rules or deployed addresses change)
