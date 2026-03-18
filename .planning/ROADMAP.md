# Roadmap: DocuMate

## Milestones

- 🚧 **v1.0.0 Hackathon Submission** — Phases 1-7 (target: 2026-03-20)

## Phases

### Phase 1: Audit Partially-Built Systems
**Goal**: Audit three partially-built systems and prove what is truly on-chain versus DB-only or UI-only.
**Depends on**: none
Plans:
- [ ] 01-01: Confirm document hash is written on-chain, not only in database records
- [ ] 01-02: Confirm Gold/Silver/Bronze TEE output is surfaced in user-facing UI
- [ ] 01-03: Confirm reputation tags derive from on-chain history, not only DB state

### Phase 2: Wire Gaps Found in Audit
**Goal**: Implement fixes discovered in Phase 1 across document anchoring, TEE UX, and reputation derivation.
**Depends on**: Phase 1
Plans:
- [ ] 02-01: Fix document hash on-chain write path and verification references
- [ ] 02-02: Make TEE Gold/Silver/Bronze tier clearly visible in UI flows
- [ ] 02-03: Connect reputation tags to contract history signals and evidence panels

### Phase 3: End-to-End Prototype Test on Testnet
**Goal**: Validate the full user journey on Polkadot Hub testnet with evidence at each step.
**Depends on**: Phase 2
Plans:
- [ ] 03-01: Run wallet connect through KILT verify and DocuWriter draft flow
- [ ] 03-02: Validate on-chain hash mint plus TEE classification and UI rendering
- [ ] 03-03: Execute marketplace purchase, verify 75/20/5 split, and confirm reputation tag generation

### Phase 4: Submission Documentation
**Goal**: Produce final judge-facing documentation with full product story and hard evidence.
**Depends on**: Phase 3
Plans:
- [ ] 04-01: Rewrite README with complete narrative and Track 2 differentiator
- [ ] 04-02: Finalize precompile-integration.md, demo-script.md, and judge-qa.md
- [ ] 04-03: Complete SUBMISSION.md with concrete evidence checklist

### Phase 5: Remotion Demo Video
**Goal**: Produce a 90-second YC Demo Day style video covering all five systems and ending with live contract proof.
**Depends on**: Phase 4
Plans:
- [ ] 05-01: Build 90-second storyline showing all five systems in sequence
- [ ] 05-02: Add live demo ending frame held for 30 seconds with real contract address
- [ ] 05-03: Render and verify reproducible video output from npm script

### Phase 6: Codebase Cleanup
**Goal**: Remove unused files and dead dependencies without breaking behavior.
**Depends on**: Phase 5
Plans:
- [ ] 06-01: Remove dead files, stale scripts, and obsolete artifacts
- [ ] 06-02: Prune unused dependencies and validate lockfile integrity
- [ ] 06-03: Re-run build and tests to prove no regressions from cleanup

### Phase 7: Final Validation and Release
**Goal**: Run release gate checks and tag v1.0.0.
**Depends on**: Phase 6
Plans:
- [ ] 07-01: Run npm audit, lint, build, hardhat test, and testnet config check
- [ ] 07-02: Verify submission evidence and release readiness checklist
- [ ] 07-03: Create and verify git tag v1.0.0

## Progress

| Phase | Status | Plans | Progress |
|-------|--------|-------|----------|
| 1     | 1/3 | In Progress|  |
| 2     | ○      | 0/3   | 0%       |
| 3     | ○      | 0/3   | 0%       |
| 4     | ○      | 0/3   | 0%       |
| 5     | ○      | 0/3   | 0%       |
| 6     | ○      | 0/3   | 0%       |
| 7     | ○      | 0/3   | 0%       |

---
*Last updated: 2026-03-18 after initialization*