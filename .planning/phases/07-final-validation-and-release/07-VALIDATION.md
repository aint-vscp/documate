---
phase: 07
slug: final-validation-and-release
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-18
---

# Phase 07 - Validation Strategy

> Validation contract for final release confidence and tag safety.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | npm + hardhat + PowerShell assertions + git tag checks |
| Quick run command | npm run lint |
| Full suite command | npm run build ; npm run contracts:test ; npm run testnet:config-check |
| Estimated runtime | ~8-20 minutes |

---

## Sampling Rate

- After every task commit: run task verify command(s)
- After every plan wave: run npm run lint
- Before release tag: all full gates must be green
- Max feedback latency: 900 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | SUB-03 | integration | `npm audit --audit-level=high` | yes | pending |
| 07-01-02 | 01 | 1 | SUB-03 | integration | `npm run lint ; npm run build` | yes | pending |
| 07-01-03 | 01 | 1 | SUB-03 | integration | `npm run contracts:test ; npm run testnet:config-check` | yes | pending |
| 07-02-01 | 02 | 2 | SUB-03 | static | `Test-Path README.md,SUBMISSION.md,docs/precompile-integration.md,docs/demo-script.md,docs/judge-qa.md,docs/demo-video.mp4` | yes | pending |
| 07-02-02 | 02 | 2 | SUB-03 | static | `Select-String -Path README.md,SUBMISSION.md,docs/precompile-integration.md,docs/demo-script.md,docs/judge-qa.md -Pattern '420420417|0x233FE6112E5Ad4Db1c83358B30D581F837314BB1|0x1cf190eabe490B50AaBE91b4567ebe88126e8D24|0x0000000000000000000000000000000000000818|75/20/5'` | yes | pending |
| 07-02-03 | 02 | 2 | SUB-03 | static | `Get-Content package.json -Raw | Select-String '"video:render"\s*:\s*"npx remotion render HackathonDemo90 docs/demo-video.mp4"'` | yes | pending |
| 07-03-01 | 03 | 3 | SUB-03 | git | `git status --short` | yes | pending |
| 07-03-02 | 03 | 3 | SUB-03 | git | `git tag --list v1.0.0` | yes | pending |
| 07-03-03 | 03 | 3 | SUB-03 | git | `git tag -a v1.0.0 -m 'DocuMate v1.0.0' ; git show v1.0.0 --no-patch --oneline` | yes | pending |

Status legend: pending, green, red, flaky

---

## Wave 0 Requirements

- [x] Existing test and release command infrastructure is present.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Final submission narrative coherence | SUB-03 | Contextual consistency across evidence docs needs human review | Read README and SUBMISSION side by side and confirm no contradictory claims |
| Release note quality | SUB-03 | Tag message quality is editorial | Confirm tag annotation message is clear and specific |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependency
- [x] Sampling continuity across all plans
- [x] No watch-mode flags
- [x] nyquist_compliant set in frontmatter

Approval: pending
