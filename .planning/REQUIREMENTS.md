# Requirements: DocuMate

**Defined:** 2026-03-18
**Core Value:** Every critical trust decision in contract work must be verifiable from immutable on-chain evidence.

## v1 Requirements

### Identity and Access

- [x] **ID-01**: Runtime identity precompile integration exists at 0x0000000000000000000000000000000000000818
- [x] **ID-02**: Marketplace critical actions are gated by verification path
- [x] **ID-03**: Mock verification is off by default in production path

### Contracts and Settlement

- [x] **SET-01**: Marketplace contract is deployed on Polkadot Hub testnet
- [x] **SET-02**: Staking contract is deployed on Polkadot Hub testnet
- [x] **SET-03**: Revenue split is deterministically enforced as 75/20/5
- [x] **SET-04**: Breach and slashing path exists with contract tests

### Document Trust Layer

- [ ] **DOC-01**: Document hash anchoring is fully wired and verifiable end to end in UI and API
- [x] **DOC-02**: Template drafting and storage flow exists in app
- [ ] **DOC-03**: TEE Gold/Silver/Bronze classification is fully visible in UI and user flow

### Reputation and Enforcement

- [ ] **REP-01**: Reputation tags are derived from on-chain contract history in live UX
- [ ] **REP-02**: Breach outcomes permanently affect reputation state in user-facing profile

### Submission and Demo

- [x] **SUB-01**: Judge-facing README and supporting docs are present
- [x] **SUB-02**: Remotion demo video renders to docs/demo-video.mp4
- [ ] **SUB-03**: Final submission checklist includes complete evidence and release tag v1.0.0

## v2 Requirements

### Ecosystem Expansion

- **V2-01**: Mainnet deployment hardening and production ops
- **V2-02**: Extended legal template catalog with jurisdiction presets
- **V2-03**: Broader partner integrations for enterprise document workflows

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mainnet launch before deadline | Risky under time pressure; testnet proof is milestone goal |
| Multi-chain deployment | Weakens Track 2 narrative and verification clarity |
| Full legal counsel workflow automation | Not required for current hackathon submission milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ID-01 | Phase 1 | Complete |
| ID-02 | Phase 1 | Complete |
| ID-03 | Phase 1 | Complete |
| SET-01 | Phase 1 | Complete |
| SET-02 | Phase 1 | Complete |
| SET-03 | Phase 1 | Complete |
| SET-04 | Phase 1 | Complete |
| DOC-02 | Phase 2 | Complete |
| DOC-01 | Phase 3 | Pending |
| DOC-03 | Phase 3 | Pending |
| REP-01 | Phase 3 | Pending |
| REP-02 | Phase 4 | Pending |
| SUB-01 | Phase 5 | Complete |
| SUB-02 | Phase 5 | Complete |
| SUB-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initialization*