---
phase: 03
slug: end-to-end-prototype-test-on-testnet
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-18
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | next build + eslint + hardhat + PowerShell API probes |
| **Config file** | hardhat.config.js |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run build; npm run contracts:test; npm run testnet:config-check` |
| **Estimated runtime** | ~420 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run build; npm run contracts:test; npm run testnet:config-check`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 420 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | ID-01, ID-02 | integration | `$ErrorActionPreference = 'Stop'; node scripts/testnet-config-check.js; npm run lint` | ✅ | ⬜ pending |
| 03-01-02 | 01 | 1 | ID-02 | integration | `$ErrorActionPreference = 'Stop'; $serverStatus = (Invoke-WebRequest -UseBasicParsing "http://localhost:3000").StatusCode; if ($serverStatus -ne 200) { throw "Precondition failed: local server must be running at http://localhost:3000" }; $Wallet = "0x1111111111111111111111111111111111111111"; $docs = Invoke-RestMethod "http://localhost:3000/api/documents?walletAddress=$Wallet"; $activity = Invoke-RestMethod "http://localhost:3000/api/activity?walletAddress=$Wallet"; if ($null -eq $docs.success) { throw "Documents envelope missing success" }; if ($null -eq $activity.success) { throw "Activity envelope missing success" }; $docs | ConvertTo-Json -Depth 10 | Out-Null; $activity | ConvertTo-Json -Depth 10 | Out-Null; npm run lint` | ✅ | ⬜ pending |
| 03-01-03 | 01 | 1 | ID-01, ID-02 | integration | `$ErrorActionPreference = 'Stop'; $serverStatus = (Invoke-WebRequest -UseBasicParsing "http://localhost:3000").StatusCode; if ($serverStatus -ne 200) { throw "Precondition failed: local server must be running at http://localhost:3000" }; $Wallet = "0x1111111111111111111111111111111111111111"; Invoke-RestMethod "http://localhost:3000/api/documents?walletAddress=$Wallet" | ConvertTo-Json -Depth 8 | Out-Null; Invoke-RestMethod "http://localhost:3000/api/activity?walletAddress=$Wallet" | ConvertTo-Json -Depth 8 | Out-Null` | ✅ | ⬜ pending |
| 03-02-01 | 02 | 2 | DOC-01 | integration | `$ErrorActionPreference = 'Stop'; $serverStatus = (Invoke-WebRequest -UseBasicParsing "http://localhost:3000").StatusCode; if ($serverStatus -ne 200) { throw "Precondition failed: local server must be running at http://localhost:3000" }; $Wallet = "0x1111111111111111111111111111111111111111"; Select-String -Path 'src/app/dashboard/documents/[id]/page.tsx','src/app/api/**/*.ts' -Pattern 'offchain-anchor:' -SimpleMatch | Out-Null; $docs = Invoke-RestMethod "http://localhost:3000/api/documents?walletAddress=$Wallet"; $activity = Invoke-RestMethod "http://localhost:3000/api/activity?walletAddress=$Wallet"; $docs | ConvertTo-Json -Depth 10 | Out-Null; $activity | ConvertTo-Json -Depth 10 | Out-Null; npm run lint` | ✅ | ⬜ pending |
| 03-02-02 | 02 | 2 | DOC-03 | integration | `$ErrorActionPreference = 'Stop'; $serverStatus = (Invoke-WebRequest -UseBasicParsing "http://localhost:3000").StatusCode; if ($serverStatus -ne 200) { throw "Precondition failed: local server must be running at http://localhost:3000" }; $form = @{ file = Get-Item ".\docs\audit\01-01-document-anchor-evidence.md" }; $tee = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/validate-document" -Form $form; if ($tee.success -ne $true) { throw "TEE validation did not return success=true" }; foreach ($k in @('tier','tierName','attestation','confidence','phalaWorker')) { if (-not $tee.PSObject.Properties.Name.Contains($k)) { throw "Missing TEE key: $k" } }; npm run build` | ✅ | ⬜ pending |
| 03-02-03 | 02 | 2 | DOC-01, DOC-03 | integration | `$ErrorActionPreference = 'Stop'; $serverStatus = (Invoke-WebRequest -UseBasicParsing "http://localhost:3000").StatusCode; if ($serverStatus -ne 200) { throw "Precondition failed: local server must be running at http://localhost:3000" }; $Wallet = "0x1111111111111111111111111111111111111111"; Invoke-RestMethod "http://localhost:3000/api/documents?walletAddress=$Wallet" | ConvertTo-Json -Depth 10 | Out-Null; Invoke-RestMethod "http://localhost:3000/api/activity?walletAddress=$Wallet" | ConvertTo-Json -Depth 10 | Out-Null; $form = @{ file = Get-Item ".\docs\audit\01-01-document-anchor-evidence.md" }; Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/validate-document" -Form $form | ConvertTo-Json -Depth 8 | Out-Null` | ✅ | ⬜ pending |
| 03-03-01 | 03 | 3 | SET-03 | integration | `$ErrorActionPreference = 'Stop'; npm run testnet:config-check; npm run contracts:test; npm run lint` | ✅ | ⬜ pending |
| 03-03-02 | 03 | 3 | SET-03 | integration | `$ErrorActionPreference = 'Stop'; $serverStatus = (Invoke-WebRequest -UseBasicParsing "http://localhost:3000").StatusCode; if ($serverStatus -ne 200) { throw "Precondition failed: local server must be running at http://localhost:3000" }; $Wallet = "0x1111111111111111111111111111111111111111"; $activity = Invoke-RestMethod "http://localhost:3000/api/activity?walletAddress=$Wallet"; if ($null -eq $activity.success) { throw "Activity envelope missing success" }; $activity | ConvertTo-Json -Depth 10 | Out-Null; npm run build` | ✅ | ⬜ pending |
| 03-03-03 | 03 | 3 | REP-01 | integration | `$ErrorActionPreference = 'Stop'; $serverStatus = (Invoke-WebRequest -UseBasicParsing "http://localhost:3000").StatusCode; if ($serverStatus -ne 200) { throw "Precondition failed: local server must be running at http://localhost:3000" }; $Wallet = "0x1111111111111111111111111111111111111111"; $profile = Invoke-RestMethod "http://localhost:3000/api/directory/profile?walletAddress=$Wallet"; if ($null -eq $profile.success) { throw "Profile envelope missing success" }; $json = $profile | ConvertTo-Json -Depth 12; if ($json -notmatch 'source') { throw "Missing provenance source in profile payload" }; npm run lint` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Wallet connect and end-user identity gating flow | ID-01, ID-02 | Browser wallet UX and chain-switch prompts are interactive | Run app with `npm run dev`, connect MetaMask on Polkadot Hub testnet, capture screenshots and API envelopes |
| TEE tier visibility in user UI | DOC-03 | Tier rendering requires visual confirmation in page flow | Submit fixture through `/api/validate-document`, then verify tier label/badge in UI and corresponding API keys |
| Marketplace purchase proof with explorer tx links | SET-03, REP-01 | Real purchase and tx confirmation depend on live testnet state | Execute purchase from UI, collect tx hash, compare split fields and profile provenance payload |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: all 9 tasks include automated verify commands
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 600s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
