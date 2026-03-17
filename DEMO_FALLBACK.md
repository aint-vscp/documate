# Demo Fallback Plan

Use this plan if live transactions fail during judging.

## Backup RPC

Primary:

- https://eth-rpc-testnet.polkadot.io/

Backup candidates (configure one in `POLKADOT_HUB_RPC_URL` if needed):

- Use a self-hosted archive/full node endpoint if your team has one.
- Keep one team member running a pre-tested RPC endpoint proxy.

## Fallback Script (Read-Only Proof)

Run:

```bash
node scripts/demo-fallback-check.js
```

This prints:

- active wallet
- marketplace owner + treasury
- verification status
- split math for 1 PAS
- staking owner + pool stats

## Fallback Demo Sequence (90 seconds)

1. Show deployed addresses in README and config files.
2. Run `node scripts/demo-fallback-check.js` live.
3. Open both contracts in Blockscout and show recent tx/events.
4. Explain that write-path demo was pre-validated via `testnet-smoke-track2.js` and tests.

## If Write Tx Fails During Demo

- Confirm wallet network is Polkadot Hub testnet (420420417).
- Switch to backup funded wallet.
- Lower tx complexity and run one mint or purchase action only.
- Continue with read-only proof path to complete the demo narrative.
