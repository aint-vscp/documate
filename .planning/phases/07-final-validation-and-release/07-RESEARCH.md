---
phase: 07
slug: final-validation-and-release
status: draft
created: 2026-03-18
---

# Phase 07 Research - Final Validation and Release

## Goal

Execute final release gates and produce a verifiable v1.0.0 release tag without introducing last-minute regressions.

## Phase Inputs

- Prior phases established:
  - testnet contracts and runtime precompile evidence
  - judge-facing docs and submission package
  - reproducible demo render pipeline
  - cleanup baseline and tracked remotion source
- Remaining hard requirement focus:
  - SUB-03: complete evidence checklist and release tag v1.0.0

## Release Risks

1. Incomplete gate execution before tagging.
- Risk: invalid release claim if one gate is skipped.

2. Evidence drift across docs and source.
- Risk: judge-facing checklist may not match actual artifacts.

3. Tagging mistakes.
- Risk: duplicate/incorrect tag target, or tag before clean status.

## Recommended Strategy

1. Run deterministic gate suite first.
- Include audit, lint, build, contract test, and testnet config check.
- Capture pass outputs in phase summaries.

2. Perform evidence checklist verification second.
- Verify required docs exist and contain critical constants.
- Verify demo artifact and render command contract still align.

3. Tag only after clean-state confirmation.
- Confirm branch status clean.
- Confirm tag does not already exist.
- Create annotated tag v1.0.0 and verify resolution.

## Evidence Anchors

- Chain ID: 420420417
- Marketplace: 0x233FE6112E5Ad4Db1c83358B30D581F837314BB1
- Staking: 0x1cf190eabe490B50AaBE91b4567ebe88126e8D24
- Identity precompile: 0x0000000000000000000000000000000000000818
- Split: 75/20/5
- Demo output: docs/demo-video.mp4

## Deliverables

- 07-01 plan: release gates run with deterministic command evidence.
- 07-02 plan: submission evidence and checklist coherence verification.
- 07-03 plan: clean tag creation and tag verification workflow.
