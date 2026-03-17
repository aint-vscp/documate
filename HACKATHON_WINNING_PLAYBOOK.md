# DocuMate Hackathon Winning Playbook

This playbook turns the Polkadot Solidity Hackathon requirements into a concrete execution checklist for this repository.

## 1) Program Context

- Event: Polkadot Solidity Hackathon (first Solidity hackathon on Polkadot)
- Window: Feb 15 to Mar 24, 2026
- Demo days: Mar 24 to Mar 25, 2026
- Builder resources:
  - Codecamp: https://codecamp.openguild.wtf
  - Builders Hub: https://build.openguild.wtf/hackathon-resources
- Community support:
  - OpenGuild Discord: https://discord.gg/WWgzkDfPQF
  - Polkadot Developer Support: https://t.me/substratedevs

## 2) Track Strategy

DocuMate should position as a dual-track submission with one clear story:

- Track 1 (EVM Smart Contracts):
  - Marketplace transaction enforcement and value flow using Solidity.
  - End-user dApp flow with wallet-connected interactions on Polkadot Hub.
- Track 2 (PVM Smart Contracts / native functionality):
  - Solidity interfaces and integration pattern for native precompiles.
  - Reputation staking and breach slashing flow.
  - Runtime-aware architecture to bridge private verification signals and public on-chain reputation.

Judge narrative:

- Problem: fraud and fake credentials in hiring and contract work.
- Solution: cryptographic document trust + on-chain incentive and penalty system.
- Why Polkadot Hub: native interoperability, EVM compatibility, and first-class path toward XCM-native extensions.

## 3) Mandatory Submission Checklist

Status snapshot: verified on 2026-03-17.

Product and code:

- [x] All contracts compile cleanly.
- [x] All contract tests pass.
- [x] Testnet addresses are deployed and verified in docs.
- [x] Frontend reads the same addresses configured in env/config files.
- [x] Live demo flow works start-to-finish on Polkadot Hub testnet.

Proof package for judges:

- [x] 3 to 5 minute demo video recorded.
- [x] Architecture diagram included and up to date.
- [x] README includes setup, test, and production-readiness instructions.
- [x] Pitch deck clearly maps features to Track 1 and Track 2 criteria.
- [x] One-page technical summary (what is production-ready vs mock).

Operational readiness:

- [x] Production keys are not exposed in repository history.
- [x] Release checklist executed before submission freeze.
- [x] Contingency backup RPC and fallback demo script prepared.

## 4) Technical Acceptance Criteria

Status snapshot: verified on 2026-03-17.

Contracts and economics:

- [x] Revenue split is deterministic and enforced on-chain.
- [x] Staking flow works with stake, report breach, validate breach, and slash.
- [x] Unauthorized slashing attempts fail.

Identity and verification:

- [x] Verified-only operations are protected by contract modifier checks.
- [x] Production path for precompile-based verification is documented and toggled correctly.

TEE validation:

- [x] Document validation route prefers cryptographic signature evidence.
- [x] Flat scan or non-cryptographic files do not receive highest trust tier.

Testnet proof:

- [x] Smoke test script demonstrates deploy + interactions successfully.
- [x] Config check script confirms owner, balances, and expected state variables.

Evidence files:

- `README.md`
- `Pitch.md`
- `TECHNICAL_SUMMARY.md`
- `ARCHITECTURE_CURRENT.md`
- `scripts/testnet-smoke-track2.js`
- `scripts/testnet-config-check.js`
- `scripts/demo-fallback-check.js`
- `DEMO_FALLBACK.md`

## 5) Timeline to Demo Day

T-7 to T-5 days:

- Freeze features.
- Close all high-severity bugs.
- Finish final contract and API tests.

T-4 to T-3 days:

- Record full demo run on testnet.
- Finalize pitch deck and architecture visual.
- Dry run Q and A with strict timing.

T-2 to T-1 days:

- Re-run deployment validation scripts.
- Confirm all links, addresses, and commands in README.
- Tag release branch and lock non-critical changes.

Demo day:

- Use a scripted flow: problem, architecture, live demo, economics, roadmap.
- Keep one backup wallet and one backup network plan ready.

## 6) Judge-Facing Differentiators

To maximize ranking potential, emphasize:

- Trust stack: cryptographic document validation plus on-chain reputation incentives.
- Enforcement stack: deterministic split and slashing economics in smart contracts.
- Ecosystem fit: clear path from current contracts to deeper native Polkadot integrations.
- Product viability: not just a prototype, but a testnet-validated system with release controls.

## 7) Production-Ready Delta (Post-Hackathon)

Document these as next milestones so judges see continuity:

- Replace all mock verification paths with runtime precompile-backed checks.
- Add formalized access control and event monitoring dashboard.
- Complete external security review and threat model.
- Upgrade persistence and observability stack for sustained usage.

## 8) Team Operating Rules Until Submission

- No unreviewed contract changes after feature freeze.
- Every PR must include test evidence.
- Every demo-impacting change must be validated on testnet.
- README and pitch artifacts are updated in the same PR as technical changes.

If this playbook conflicts with implementation reality, update the implementation first, then immediately update this file and README to keep judge-facing documentation truthful.
