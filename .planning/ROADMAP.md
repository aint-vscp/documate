# Roadmap: DocuMate

## Milestones

- 🚧 **v1.0.0 Hackathon Submission** — Phases 1-5 (target: 2026-03-20)

## Phases

### Phase 1: Baseline Proof Lock
**Goal**: Freeze and verify the current deployed foundation for judge review.
**Depends on**: none
Plans:
- [ ] 01-01: Re-run testnet and security evidence suite with fresh timestamps
- [ ] 01-02: Consolidate explorer and contract proof references for submission artifacts

### Phase 2: Document Trust Path Completion
**Goal**: Complete document hash anchoring path from creation to verifiable on-chain proof.
**Depends on**: Phase 1
Plans:
- [ ] 02-01: Wire document hash write path in API and contract integration points
- [ ] 02-02: Surface document hash and verification status in dashboard UX
- [ ] 02-03: Add tests and fallback handling for missing or invalid hash states

### Phase 3: TEE Validation UX Completion
**Goal**: Make Gold/Silver/Bronze validation visible, understandable, and stable in user flows.
**Depends on**: Phase 2
Plans:
- [ ] 03-01: Finalize TEE classification mapping from validation pipeline
- [ ] 03-02: Render classification badges and rationale in document views
- [ ] 03-03: Validate error handling and confidence messaging for judges

### Phase 4: Reputation Tag Pipeline Completion
**Goal**: Derive and present reputation tags from on-chain contract history and breach outcomes.
**Depends on**: Phase 2
Plans:
- [ ] 04-01: Finalize reputation tag derivation rules from contract events/history
- [ ] 04-02: Connect breach/slash outcomes to user-facing reputation state
- [ ] 04-03: Add profile-level evidence panels showing why tags were assigned

### Phase 5: Submission Finalization and Release
**Goal**: Finish docs/video polish, cleanup, final validation, and release tag v1.0.0.
**Depends on**: Phases 3-4
Plans:
- [ ] 05-01: Finalize submission docs and ensure every claim has concrete evidence
- [ ] 05-02: Polish and verify Remotion demo render + script reproducibility
- [ ] 05-03: Run final validation gate and prepare release tagging checklist

## Progress

| Phase | Status | Plans | Progress |
|-------|--------|-------|----------|
| 1     | ○      | 0/2   | 0%       |
| 2     | ○      | 0/3   | 0%       |
| 3     | ○      | 0/3   | 0%       |
| 4     | ○      | 0/3   | 0%       |
| 5     | ○      | 0/3   | 0%       |

---
*Last updated: 2026-03-18 after initialization*