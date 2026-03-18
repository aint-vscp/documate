# DocuMate

## What This Is

DocuMate is a decentralized contract governance and professional reputation network on Polkadot Hub EVM, focused on evidence-backed trust decisions for document workflows.

## Core Value

Every critical trust decision in contract work must be verifiable from immutable on-chain evidence.

## Current State

- Latest shipped milestone: v1.0.0 Hackathon Submission (archived 2026-03-19)
- Archive roadmap: .planning/milestones/v1.0.0-ROADMAP.md
- Archive requirements: .planning/milestones/v1.0.0-REQUIREMENTS.md
- Delivery status at archive time: 7/21 plans executed with summaries; 10/15 requirements complete
- Known carry-over gaps: DOC-01, DOC-03, REP-01, REP-02, SUB-03

## Next Milestone Goals

- Close remaining v1 trust-layer and reputation gaps with full end-to-end verification.
- Complete submission checklist coherence and finalize release-tag workflow.
- Preserve deterministic proof standards for docs, video, and testnet checks.

## Constraints

- Keep stack continuity (Next.js, Prisma, Hardhat, Remotion) for speed and reliability.
- Maintain Polkadot Hub Track 2 alignment with runtime precompile proof path.
- No secrets in repo; .env remains local and untracked.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Track 2 narrative centers on precompile 0x0818 | Strongest Polkadot-native differentiator | Good |
| Keep useMockVerification default false | Testnet proof must be runtime-backed | Good |
| Use deterministic release gates before tagging | Prevent narrative-only release claims | Good |
| Archive v1.0.0 with explicit known gaps | Preserve historical record while acknowledging debt | Pending follow-up |

## History

<details>
<summary>v1.0.0 planning baseline snapshot</summary>

- Original active focus included document anchoring, TEE visibility, reputation derivation, and submission lock.
- Hard deadline context drove YOLO-mode execution with evidence-first checkpoints.

</details>

---
*Last updated: 2026-03-19 after v1.0.0 milestone archive*
