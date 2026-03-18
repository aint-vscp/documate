---
phase: 05
slug: remotion-demo-video
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-18
---

# Phase 05 â€” Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Remotion CLI + PowerShell assertions + npm scripts |
| **Config file** | remotion/Root.tsx |
| **Quick run command** | `npx remotion compositions remotion/index.ts` |
| **Full suite command** | `npm run video:render -- --codec=h264 --crf=18 --pixel-format=yuv420p --concurrency=1 --disallow-parallel-encoding --overwrite` |
| **Estimated runtime** | ~25 seconds (task sampling) |

---

## Sampling Rate

- **After every task commit:** Run `npx remotion compositions remotion/index.ts`
- **After every plan wave:** Run `npm run video:render -- --codec=h264 --crf=18 --pixel-format=yuv420p --concurrency=1 --disallow-parallel-encoding --overwrite`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SUB-02 | integration | `npx remotion compositions remotion/index.ts` | âœ… | â¬œ pending |
| 05-01-02 | 01 | 1 | SUB-02, DOC-01, DOC-03, REP-01, REP-02, SET-03 | docs | `Select-String -Path remotion/HackathonDemoVideo.tsx -Pattern 'durationInFrames|Sequence|2700|900|75/20/5|0x0000000000000000000000000000000000000818'` | âœ… | â¬œ pending |
| 05-01-03 | 01 | 1 | SUB-02 | docs | `Select-String -Path docs/demo-script.md -Pattern '90-second|0:00|1:00 - 1:30|0x233FE6112E5Ad4Db1c83358B30D581F837314BB1|0x1cf190eabe490B50AaBE91b4567ebe88126e8D24'` | âœ… | â¬œ pending |
| 05-02-01 | 02 | 2 | SUB-02, SET-01, SET-02 | integration | `Select-String -Path remotion/HackathonDemoVideo.tsx -Pattern '0x233FE6112E5Ad4Db1c83358B30D581F837314BB1|0x1cf190eabe490B50AaBE91b4567ebe88126e8D24'` | âœ… | â¬œ pending |
| 05-02-02 | 02 | 2 | SUB-02 | integration | `Select-String -Path remotion/HackathonDemoVideo.tsx -Pattern 'from=\{1800\}|durationInFrames=\{900\}|30 seconds|live proof'` | âœ… | â¬œ pending |
| 05-02-03 | 02 | 2 | SUB-02, ID-01 | docs | `Select-String -Path docs/demo-script.md -Pattern '0x0000000000000000000000000000000000000818|Track 2|runtime'` | âœ… | â¬œ pending |
| 05-03-01 | 03 | 3 | SUB-02 | integration | `npm run video:render -- --codec=h264 --crf=18 --pixel-format=yuv420p --concurrency=1 --disallow-parallel-encoding --overwrite` | âœ… | â¬œ pending |
| 05-03-02 | 03 | 3 | SUB-03 | reproducibility | `Get-FileHash docs/demo-video.mp4 -Algorithm SHA256` | âœ… | â¬œ pending |
| 05-03-03 | 03 | 3 | SUB-03 | integration | `Test-Path docs/demo-video.mp4; Get-Item docs/demo-video.mp4 | Select-Object Length, LastWriteTime` | âœ… | â¬œ pending |

*Status: â¬œ pending Â· âœ… green Â· âŒ red Â· âš ï¸ flaky*

---

## Wave 0 Requirements

- [x] Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| YC Demo Day pacing and narrative quality | SUB-02 | Flow quality and emphasis are subjective | Play `docs/demo-video.mp4` and confirm 90-second pacing and five-system sequence |
| Final live proof readability on screen | SET-01, SET-02, ID-01 | Address readability and visual clarity need human review | Pause final hold and verify both contract addresses and precompile context are legible |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: all 9 tasks include automated verify commands
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 600s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
