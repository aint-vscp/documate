---
phase: 04
slug: submission-documentation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-18
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | docs consistency checks + eslint + Next build + Hardhat/testnet proofs |
| **Config file** | package.json scripts |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run build; npm run contracts:test; npm run testnet:config-check` |
| **Estimated runtime** | ~25 seconds (task sampling) |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run build; npm run contracts:test; npm run testnet:config-check`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SUB-01 | docs | `npm run lint` | ✅ | ⬜ pending |
| 04-01-02 | 01 | 1 | SUB-01 | docs | `Select-String -Path README.md -Pattern 'Track 2|0x0000000000000000000000000000000000000818|420420417'` | ✅ | ⬜ pending |
| 04-01-03 | 01 | 1 | SUB-01 | docs | `Select-String -Path README.md -Pattern 'SUBMISSION.md|docs/precompile-integration.md|docs/judge-qa.md'` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 2 | ID-01, ID-02 | docs | `Select-String -Path docs/precompile-integration.md -Pattern 'identityPrecompile.staticcall|IIdentityPrecompile.identity.selector|useMockVerification = false'` | ✅ | ⬜ pending |
| 04-02-02 | 02 | 2 | DOC-01, DOC-03 | docs | `Select-String -Path docs/judge-qa.md -Pattern 'DOC-01|DOC-03|anchor|TEE|Gold|Silver|Bronze'` | ✅ | ⬜ pending |
| 04-02-03 | 02 | 2 | SUB-01, REP-01 | docs | `npm run lint` | ✅ | ⬜ pending |
| 04-03-01 | 03 | 3 | SUB-03, REP-02 | docs | `Select-String -Path SUBMISSION.md -Pattern 'SUB-03|REP-02|Requirement IDs|Expected Output|Status'` | ✅ | ⬜ pending |
| 04-03-02 | 03 | 3 | SET-03 | docs | `Select-String -Path SUBMISSION.md -Pattern 'SET-03|75/20/5|split\(1 PAS\)|npm run testnet:config-check'` | ✅ | ⬜ pending |
| 04-03-03 | 03 | 3 | SUB-03 | docs | `Select-String -Path SUBMISSION.md -Pattern 'DOCUMATE SUBMISSION READY|NOT VERIFIED|PENDING'; npm run lint` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Judge narrative clarity and sequencing | SUB-01 | Narrative quality cannot be fully automated | Review README flow from problem -> architecture -> proofs -> runbook |
| Demo script timing and presenter cues | SUB-01 | Presentation pacing and spoken transitions are subjective | Dry run `docs/demo-script.md` against actual app and note timing mismatches |
| Final submission checklist completeness for release gate | SUB-03 | Requires human confirmation of artifact intent and readiness | Review each checklist item in SUBMISSION.md against command output and file evidence |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: all 9 tasks include automated verify commands
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 600s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
