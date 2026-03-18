---
phase: 06
slug: codebase-cleanup
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-18
---

# Phase 06 - Validation Strategy

> Validation contract for cleanup safety and no-regression proof.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | npm scripts + PowerShell assertions + grep-based reference checks |
| Quick run command | npm run lint |
| Full suite command | npm run build ; npm run contracts:compile ; npm run contracts:test ; npm run testnet:config-check |
| Estimated runtime | ~5-12 minutes |

---

## Sampling Rate

- After every task commit: run task verify command(s)
- After every plan wave: run npm run lint
- Before gsd-verify-work: full suite must pass
- Max feedback latency: 600 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | SUB-03 | static | `git ls-files ; git ls-files --others --ignored --exclude-standard` | yes | pending |
| 06-01-02 | 01 | 1 | SUB-03 | static | `Select-String -Path .gitignore -Pattern '^/remotion$|remotion'` | yes | pending |
| 06-01-03 | 01 | 1 | SUB-03 | static | `git diff --name-status` | yes | pending |
| 06-02-01 | 02 | 2 | SUB-03 | static | `npx depcheck --json` | yes | pending |
| 06-02-02 | 02 | 2 | SUB-03 | integration | `npm prune ; npm install` | yes | pending |
| 06-02-03 | 02 | 2 | SUB-03 | integration | `npm ls --depth=0` | yes | pending |
| 06-03-01 | 03 | 3 | SUB-03 | integration | `npm run lint` | yes | pending |
| 06-03-02 | 03 | 3 | SUB-03 | integration | `npm run build ; npm run contracts:compile ; npm run contracts:test` | yes | pending |
| 06-03-03 | 03 | 3 | SUB-03 | integration | `npm run testnet:config-check ; npx remotion compositions remotion/index.ts` | yes | pending |

Status legend: pending, green, red, flaky

---

## Wave 0 Requirements

- [x] Existing repo scripts and test tooling are already present.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Removed files are truly obsolete | SUB-03 | Business relevance and future roadmap intent need human judgment | Review cleanup diff and confirm each removal has explicit rationale |
| Dependency removals do not weaken submission story | SUB-03 | Narrative/tooling confidence is context-sensitive | Review package.json and lockfile diff against release checklist |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependency
- [x] Sampling continuity across all plans
- [x] No watch-mode flags
- [x] nyquist_compliant set in frontmatter

Approval: pending
