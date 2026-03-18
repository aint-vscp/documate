---
phase: 06
slug: codebase-cleanup
status: draft
created: 2026-03-18
---

# Phase 06 Research - Codebase Cleanup

## Goal

Remove unused files and dependencies while preserving all submission behavior, testnet verification, and demo render reproducibility.

## Current State Findings

1. Active demo source under remotion is ignored by git.
- Current ignore rule: `/remotion` in .gitignore.
- Risk: source changes are not tracked or reviewable, while package scripts rely on remotion assets.

2. Build and runtime stack is broad (Next.js + Hardhat + Prisma + Remotion + Polkadot SDK).
- Cleanup must avoid removing chain/testnet tooling required by release and judge evidence flows.

3. Cleanup phase should be conservative and evidence-driven.
- Remove only files and dependencies that are provably unused.
- Validate every cleanup step with deterministic commands.

## Cleanup Strategy

1. File and artifact cleanup first.
- Build an evidence-backed keep/remove inventory.
- Remove dead files only when there are zero code/doc references.
- Align ignore rules to track source-of-truth files (including remotion source).

2. Dependency cleanup second.
- Detect unused and missing dependency edges.
- Remove dead dependencies and re-install to stabilize lockfile.
- Keep dependencies needed for scripts and test tooling.

3. Regression proof last.
- Run lint/build/contracts/testnet checks.
- Confirm Remotion composition contract is still discoverable.

## Candidate Areas

- .gitignore: stop ignoring active source folder remotion.
- package.json: remove stale scripts only after reference checks.
- scripts/: remove obsolete helpers only when no references and no workflow usage remain.
- docs/: retain judge-facing and demo files unless explicitly obsolete and unreferenced.

## Safety Rules

- No destructive cleanup without reference proof.
- Never remove files generated as evidence artifacts if current workflow depends on them.
- Keep commands non-watch and deterministic.
- Any failure in release gates blocks cleanup merge.

## Phase Deliverables

- 06-01 plan: dead files, stale scripts, obsolete artifacts inventory and removals.
- 06-02 plan: dependency pruning and lockfile integrity.
- 06-03 plan: full regression gate and cleanup proof summary.
