# DocuMate

## What This Is

DocuMate is a decentralized contract governance and professional reputation network built on Polkadot Hub EVM. It prevents consumer and employment fraud through on-chain document verification, identity-gated access, and immutable contract history. The product philosophy is: You are what you sign.

## Core Value

Every critical trust decision in contract work must be verifiable from immutable on-chain evidence.

## Requirements

### Validated

- ✓ Runtime identity precompile integration at 0x0000000000000000000000000000000000000818 is wired in marketplace verification flow — existing
- ✓ Marketplace and staking contracts are deployed on Polkadot Hub testnet (chainId 420420417) — existing
- ✓ 75/20/5 marketplace split and staking slash path are implemented in Solidity and exercised by tests — existing
- ✓ Baseline quality gates pass (lint, build, hardhat tests, testnet config check, npm audit) — existing

### Active

- [ ] Wire document hash anchoring end to end in UI and API with verified on-chain references
- [ ] Complete TEE Gold/Silver/Bronze classification path and surface status clearly in UX
- [ ] Finalize reputation tags derived from on-chain contract history with breach/slash signals
- [ ] Lock hackathon submission assets (docs, video, proof narrative, checklist) for March 20, 2026
- [ ] Run final release validation and cut v1.0.0 tag

### Out of Scope

- Mainnet production deployment before hackathon deadline — focus is testnet proof and judge validation speed
- Multi-chain support beyond Polkadot Hub EVM in this milestone — would dilute Track 2 focus
- Full legal review of generated templates — current scope is technical trust and traceability infrastructure

## Context

- Track: Polkadot Solidity Hackathon Track 2 (PVM Smart Contracts)
- Judges: OpenGuild and Web3 Foundation
- Deadline: March 20, 2026
- Testnet: Polkadot Hub, chainId 420420417, RPC https://eth-rpc-testnet.polkadot.io/
- Contracts:
  - Marketplace: 0x233FE6112E5Ad4Db1c83358B30D581F837314BB1
  - Staking: 0x1cf190eabe490B50AaBE91b4567ebe88126e8D24
- Technical stack: Next.js 16.1.7, Prisma 6.19.2, Hardhat, ESLint 9 flat config, Remotion
- Security state: .env untracked, useMockVerification defaults to false
- Delivery focus: close three partially-built subsystems and finalize submission confidence

## Constraints

- Tech stack: Remain on current stack and architecture — speed and consistency before deadline
- Timeline: Hard deadline March 20, 2026 — prioritize demonstrable proof over speculative expansion
- Network: Must prove behavior on Polkadot Hub testnet — Track 2 alignment requires runtime precompile path
- Security: No secrets committed to git; .env remains local only — avoid submission-disqualifying leaks
- Verification: Claims must be backed by real command output or concrete file evidence — audit-grade proof standard

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Track 2 narrative centers on precompile 0x0818 | Strongest Polkadot-native differentiator vs generic EVM | ✓ Good |
| Keep useMockVerification default false | Ensure testnet proof is runtime-backed, not simulated | ✓ Good |
| Use Remotion for judge-facing video | Fast iteration and deterministic render pipeline from code | ✓ Good |
| Operate in YOLO workflow mode | Deadline pressure favors rapid execution with minimal gating | — Pending |

---
*Last updated: 2026-03-18 after initialization*