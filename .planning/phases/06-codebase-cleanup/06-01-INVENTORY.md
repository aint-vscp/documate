# Phase 06-01 Cleanup Inventory

Date: 2026-03-18

## Decision

No files were approved for removal in this plan run.

## Scripts Inventory

| File | Reference Evidence | Decision | Rationale |
|------|--------------------|----------|-----------|
| scripts/demo-fallback-check.js | Referenced by package.json scripts, DEMO_FALLBACK.md, architecture docs | keep | Used by fallback demo proof path |
| scripts/deploy-track2.js | Referenced by docs/precompile-integration.md and architecture/codebase docs | keep | Active deployment path for track-2 narrative |
| scripts/deploy.js | Referenced by Pitch.md and source comments | keep | Legacy deploy helper still documented and referenced |
| scripts/testnet-config-check.js | Referenced by package.json scripts and multiple phase plans | keep | Core deterministic evidence command |
| scripts/testnet-smoke-track2.js | Referenced by package.json scripts and architecture/testing docs | keep | End-to-end smoke path still active |

## Docs Inventory

| File | Reference Evidence | Decision | Rationale |
|------|--------------------|----------|-----------|
| docs/demo-script.md | Referenced by roadmap, README, plans, and submission docs | keep | Required demo narrative asset |
| docs/demo-video.mp4 | Referenced by SUB-02 requirement and render pipeline | keep | Required rendered evidence artifact |
| docs/judge-qa.md | Referenced by README and planning artifacts | keep | Judge evidence responses |
| docs/precompile-integration.md | Referenced by README and submission checks | keep | Track-2 proof anchor |

## Ignore Policy Change

- Updated .gitignore to stop ignoring remotion source.
- Reason: remotion files are active source-of-truth for demo composition and must remain reviewable in git history.
