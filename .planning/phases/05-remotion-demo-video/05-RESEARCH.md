# Phase 5: Remotion Demo Video - Research

**Researched:** 2026-03-18
**Domain:** Deterministic Remotion demo production for hackathon submission evidence
**Confidence:** HIGH

## Summary

Phase 5 should be implemented as a deterministic video-production pipeline, not a design-only pass. The objective is a strict 90-second composition that sequences the five product systems in a fixed order and ends with a 30-second live contract proof hold. This means timing and claims must be source-verifiable, and render output must be reproducible via a single npm script command with pinned composition settings.

Current repo state already has a short-form demo composition (`HackathonDemo75`, 75 seconds at 30fps) and a render script (`video:render`) that outputs `docs/demo-video.mp4`. The implementation gap is alignment to Phase 5 constraints: move from 2250 frames to 2700 frames, define a deterministic scene timeline for all five systems, and enforce evidence-safe narration (no claims without visible proof artifacts).

**Primary recommendation:** Introduce a dedicated 90-second composition contract (`HackathonDemo90`: 2700 frames, 30fps, 1920x1080), keep the final 900 frames as a static live-proof hold, and gate completion with PowerShell checks for composition metadata, timing assertions, render reproducibility, and output artifact integrity.

## Plan -> Requirement -> Evidence Mapping

| Plan | Requirement IDs | Why it Maps | Required Evidence Artifacts |
|------|------------------|-------------|-----------------------------|
| 05-01 Build 90-second storyline with five systems | SUB-02, DOC-01, DOC-03, REP-01, REP-02, SET-03 | Video must demonstrate the trust stack sequence and major v1 behaviors, not only visuals | `remotion/HackathonDemoVideo.tsx` (or renamed 90s file), `docs/demo-script.md` timing blocks, rendered `docs/demo-video.mp4` |
| 05-02 Add live ending frame held 30 seconds with real contract address | SUB-02, SET-01, SET-02, ID-01 | Ending frame is explicit on-chain proof: deployed addresses + runtime identity context | Final sequence timing in Remotion file, displayed addresses, Blockscout URLs, hold duration assertion commands |
| 05-03 Render + verify reproducible output from npm script | SUB-02, SUB-03 | Submission requires renderable artifact and reproducible verification procedure | `package.json` script, PowerShell verification transcript, SHA256 hash outputs, artifact existence/size checks |

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| `remotion` | `4.0.435` in repo (`4.0.436` latest npm as of 2026-03-18) | Composition, timeline, and rendering pipeline | Canonical framework already integrated in this codebase |
| `@remotion/cli` | `4.0.435` in repo (`4.0.436` latest npm) | Deterministic CLI rendering in CI/local | Supports explicit render flags (`--fps`, `--duration`, `--codec`, `--concurrency`) |
| Windows PowerShell 5.1+ | OS-native | Verification and reproducibility checks | Required for deterministic, copy-pasteable judge evidence on this machine |

### Supporting
| Library/Tool | Version | Purpose | When to Use |
|--------------|---------|---------|-------------|
| `@remotion/renderer` | `4.0.435` | Under-the-hood renderer behavior | For advanced troubleshooting/perf diagnostics |
| `Get-FileHash` | built-in | Binary reproducibility and artifact traceability | Every final render verification pass |
| `Select-String` | built-in | Source-of-truth timing/claim checks in code/docs | Pre-render and phase-gate checks |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Keep `HackathonDemo75` and override duration via CLI | New dedicated `HackathonDemo90` composition | CLI override works but increases drift risk between source truth and script expectation |
| Manual visual review only | Scripted PowerShell validation | Manual review is faster initially but non-reproducible for SUB-03 evidence |

**Installation:**
```bash
npm install
```

**Version verification (executed):**
```bash
npm view remotion version
npm view @remotion/cli version
npm view @remotion/renderer version
```
Observed latest: `4.0.436` (repo currently on `4.0.435`, patch behind).

## Composition Contract (Deterministic Targets)

### Mandatory Final Composition

| Property | Target |
|----------|--------|
| Composition ID | `HackathonDemo90` (recommended) |
| Duration | `2700` frames (`90s @ 30fps`) |
| FPS | `30` |
| Resolution | `1920x1080` |
| Output path | `docs/demo-video.mp4` |
| Render codec baseline | `h264` |

### Current Baseline Discovered

| Composition ID | Current Duration | FPS | Resolution |
|----------------|------------------|-----|------------|
| `PitchVideo` | `5400` (180s) | `30` | `1920x1080` |
| `HackathonDemo75` | `2250` (75s) | `30` | `1920x1080` |

Source command used:
```powershell
npx remotion compositions remotion/index.ts
```

## Architecture Patterns

### Recommended Project Structure

```text
remotion/
  Root.tsx                 # Register canonical 90s composition ID and fixed metadata
  HackathonDemoVideo.tsx   # Frame-exact timeline (or rename to HackathonDemo90.tsx)
  scenes/                  # Scene-level system modules, no implicit timing magic

docs/
  demo-script.md           # Narration and timing script synchronized to frame map
  demo-video.mp4           # Final rendered artifact
```

### Pattern 1: Frame-First Timeline Contract
**What:** Define each section in frames first, then narration.
**When to use:** Always for submission videos where strict duration matters.
**Example target timeline (`2700` total):**

| Segment | Frames | Seconds | Goal |
|---------|--------|---------|------|
| Intro + thesis | `0-299` | `0-10s` | Problem framing and trust thesis |
| System 1: Identity gate (precompile) | `300-599` | `10-20s` | Runtime identity verification path |
| System 2: Document anchor flow | `600-899` | `20-30s` | Document hash/verification trust layer |
| System 3: TEE tier visibility | `900-1199` | `30-40s` | Gold/Silver/Bronze user-visible output |
| System 4: Marketplace + 75/20/5 | `1200-1499` | `40-50s` | Deterministic settlement signal |
| System 5: Reputation/slash accountability | `1500-1799` | `50-60s` | Enforcement and long-term reputation impact |
| Live contract proof hold | `1800-2699` | `60-90s` | Real addresses + explorer links, static hold |

### Pattern 2: Claim-Screen Synchronization
**What:** Every spoken claim must coincide with visible proof text/UI.
**When to use:** All on-chain, identity, split, and staking claims.
**Example:** If narration says "runtime identity precompile", the frame must display `0x0000000000000000000000000000000000000818`.

### Pattern 3: Single Render Entry Point
**What:** Keep one canonical npm script for final artifact production.
**When to use:** Final demos and judge reproducibility checks.
**Command contract:** `npm run video:render` must remain sufficient to produce `docs/demo-video.mp4`.

### Anti-Patterns to Avoid
- Keeping 75-second composition ID but pretending it is 90 seconds via narration only.
- Mixing timing in seconds in docs and timing in frames in code without conversion table.
- Using dynamic/random values (timestamps, rotating claims) inside proof hold section.
- Showing placeholder addresses while narrating "live contract proof".

## Anti-Hallucination Rules (Claims and Timing)

1. Do not claim "live" proof unless both deployed addresses are shown exactly as text and match docs/config-check outputs.
2. Do not claim the full five-system coverage if any system segment is absent from the frame timeline table.
3. Do not claim 90 seconds unless composition metadata and sequence sums equal exactly 2700 frames.
4. Do not claim "30-second hold" unless the final proof sequence duration is exactly 900 frames at 30fps.
5. Do not claim deterministic split without an explicit on-screen `75/20/5` indicator.
6. Do not claim runtime identity integration without showing `0x...0818` and/or corresponding precompile phrasing.
7. If a requirement is not visibly represented, label it as "not demonstrated in this cut" instead of implying coverage.
8. If timing is changed, update both `docs/demo-script.md` and Remotion sequences in the same commit.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video timing verification | Manual stopwatch review | Frame-based sequence math + composition metadata checks | Eliminates human timing drift |
| Reproducibility proof | Ad-hoc reruns with no digest | PowerShell hash + repeat render checks | Provides auditable evidence for SUB-03 |
| Claim validation | Memory-based narration alignment | Scripted grep checks over code/docs | Prevents hallucinated or stale statements |

**Key insight:** For this phase, correctness is mostly temporal and evidentiary, not visual styling.

## Common Pitfalls

### Pitfall 1: Scene Sum Mismatch
**What goes wrong:** Individual sequences look correct but total duration is not 2700.
**Why it happens:** Multiple edits without final sum check.
**How to avoid:** Enforce a sequence ledger table in source comments and run composition metadata command.
**Warning signs:** Rendered video length not exactly 90 seconds.

### Pitfall 2: Narrative-Proof Drift
**What goes wrong:** Spoken claims diverge from on-screen values (addresses, split, chain ID).
**Why it happens:** Script edited independently from visuals.
**How to avoid:** Add pre-render grep checks for required literals.
**Warning signs:** Judge asks "where is that shown?" during review.

### Pitfall 3: Non-Reproducible Render Artifacts
**What goes wrong:** Output exists but cannot be reproduced from scripted command.
**Why it happens:** Interactive studio-only exports or undocumented flags.
**How to avoid:** Keep one deterministic command path and capture checksums.
**Warning signs:** Different team members produce structurally different outputs from same commit.

## Code Examples

### Composition Metadata Gate (Windows)
```powershell
$ErrorActionPreference = 'Stop'
$comps = npx remotion compositions remotion/index.ts
$comps | Select-String -Pattern 'HackathonDemo90\s+30\s+1920x1080\s+2700' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Composition contract mismatch: expected HackathonDemo90 30fps 1920x1080 2700 frames.' }
Write-Host 'Composition contract verified.'
```

### Deterministic Render Command (Windows)
```powershell
$ErrorActionPreference = 'Stop'
npm run video:render -- --codec=h264 --crf=18 --pixel-format=yuv420p --concurrency=1 --disallow-parallel-encoding --overwrite
if (!(Test-Path 'docs/demo-video.mp4')) { throw 'Render failed: docs/demo-video.mp4 not found.' }
(Get-Item 'docs/demo-video.mp4').Length
```

### Reproducibility Check (Two-Run Hash)
```powershell
$ErrorActionPreference = 'Stop'
Remove-Item 'docs/demo-video.mp4','docs/demo-video.run1.mp4' -ErrorAction SilentlyContinue

npm run video:render -- --codec=h264 --crf=18 --pixel-format=yuv420p --concurrency=1 --disallow-parallel-encoding --overwrite
$h1 = (Get-FileHash 'docs/demo-video.mp4' -Algorithm SHA256).Hash
Copy-Item 'docs/demo-video.mp4' 'docs/demo-video.run1.mp4' -Force

npm run video:render -- --codec=h264 --crf=18 --pixel-format=yuv420p --concurrency=1 --disallow-parallel-encoding --overwrite
$h2 = (Get-FileHash 'docs/demo-video.mp4' -Algorithm SHA256).Hash

"run1=$h1"
"run2=$h2"
if ($h1 -ne $h2) { throw 'Non-reproducible output hash. Investigate environment and dynamic content.' }
Write-Host 'Reproducibility check passed.'
```

### 30-Second Hold Assertion in Source
```powershell
$ErrorActionPreference = 'Stop'
Select-String -Path 'remotion/HackathonDemoVideo.tsx' -Pattern 'Sequence from=\{1800\} durationInFrames=\{900\}' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Missing required final live-proof hold (from=1800, duration=900).' }
Write-Host 'Final hold timing assertion passed.'
```

## Final Render Command Expectations

**Expected npm script contract (`package.json`):**
```json
"video:render": "npx remotion render HackathonDemo90 docs/demo-video.mp4"
```

**If composition rename is deferred temporarily:**
```json
"video:render": "npx remotion render HackathonDemo75 docs/demo-video.mp4 --duration=2700 --fps=30"
```
This fallback is acceptable only as an interim state; source composition ID should be normalized to avoid long-term drift.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Visual-only demo cuts with manual timing | Frame-locked timeline with scripted reproducibility checks | 2025-2026 common Remotion workflows | Stronger auditability and faster issue triage |
| Studio-only export workflow | CLI-first deterministic render pipeline | Current Remotion v4 docs/tooling | Better CI compatibility and reproducible artifacts |

**Deprecated/outdated:**
- Implicit duration assumptions without validating `durationInFrames`.
- Claiming timing guarantees without a frame ledger.

## Open Questions

1. **Should the final composition be renamed to `HackathonDemo90` or keep `HackathonDemo75` with overrides?**
   - What we know: New ID reduces ambiguity and improves maintenance.
   - What's unclear: Whether external references already depend on `HackathonDemo75`.
   - Recommendation: Rename to `HackathonDemo90` and update script/docs in same change set.

2. **Do we require binary-identical hashes across machines or per-machine reproducibility only?**
   - What we know: Same-machine deterministic flags should usually produce stable outputs.
   - What's unclear: Cross-machine encoding metadata variation tolerance.
   - Recommendation: Require same-machine hash identity; for cross-machine, enforce composition/timing/size thresholds and documented environment.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | PowerShell command validation + Remotion CLI |
| Config file | `remotion/Root.tsx` as composition source of truth |
| Quick run command | `npx remotion compositions remotion/index.ts` |
| Full suite command | `npm run video:render -- --codec=h264 --crf=18 --pixel-format=yuv420p --concurrency=1 --disallow-parallel-encoding --overwrite` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUB-02 | Video renders to `docs/demo-video.mp4` with expected composition contract | integration | `powershell -Command "$ErrorActionPreference='Stop'; npx remotion compositions remotion/index.ts | Select-String 'HackathonDemo90\s+30\s+1920x1080\s+2700' | Out-Null; npm run video:render -- --codec=h264 --crf=18 --pixel-format=yuv420p --concurrency=1 --disallow-parallel-encoding --overwrite; if (!(Test-Path 'docs/demo-video.mp4')) { throw 'missing output' }"` | ✅ (path target exists) |
| SUB-03 | Reproducible output and verification evidence procedure exists | reproducibility | `powershell -File .\scripts\verify-demo-render.ps1` (Wave 0 to add) | ❌ Wave 0 |
| SET-01/SET-02 | Ending proof frame includes real deployed addresses | content assertion | `powershell -Command "Select-String -Path remotion/HackathonDemoVideo.tsx,docs/demo-script.md -Pattern '0x233FE6112E5Ad4Db1c83358B30D581F837314BB1|0x1cf190eabe490B50AaBE91b4567ebe88126e8D24'"` | ✅ |
| ID-01 | Runtime identity precompile claim remains evidence-backed in demo text/visuals | content assertion | `powershell -Command "Select-String -Path remotion/HackathonDemoVideo.tsx,docs/demo-script.md -Pattern '0x0000000000000000000000000000000000000818'"` | ✅ |

### Sampling Rate
- **Per task commit:** `npx remotion compositions remotion/index.ts`
- **Per wave merge:** `npm run video:render -- --codec=h264 --crf=18 --pixel-format=yuv420p --concurrency=1 --disallow-parallel-encoding --overwrite`
- **Phase gate:** run reproducibility (two-render hash check) + content literal checks before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Add `scripts/verify-demo-render.ps1` for one-command reproducibility and artifact checks.
- [ ] Normalize composition ID in source/script to `HackathonDemo90`.
- [ ] Add a frame ledger comment block in the 90-second composition file to prevent timing drift.

## Sources

### Primary (HIGH confidence)
- Repository files: `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/phases/04-submission-documentation/04-RESEARCH.md`, `package.json`, `remotion/Root.tsx`, `remotion/PitchVideo.tsx`, `remotion/HackathonDemoVideo.tsx`, `docs/demo-script.md`
- Local command outputs: `npx remotion compositions remotion/index.ts`, `npm view remotion version`, `npm view @remotion/cli version`, `npm view @remotion/renderer version`

### Secondary (MEDIUM confidence)
- Remotion CLI render docs: https://www.remotion.dev/docs/cli/render
- Remotion Composition docs: https://www.remotion.dev/docs/composition
- Remotion renderer docs (`renderMedia`): https://www.remotion.dev/docs/renderer/render-media

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - directly grounded in repo + npm version checks
- Architecture: HIGH - based on existing Remotion structure and phase objective constraints
- Pitfalls: HIGH - derived from deterministic-render and evidence-integrity requirements

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (refresh if Remotion major/minor behavior changes or submission constraints change)
