# 3-Minute Demo Script

## 0:00 - 0:20 Opening

Say:
DocuMate turns freelance agreements into verifiable on-chain commitments. We remove screenshot trust by enforcing identity-gated actions and deterministic payouts in Solidity.

## 0:20 - 0:45 Network and Track Context

Show:
- Chain: Polkadot Hub Testnet
- Chain ID: 420420417
- Marketplace: 0x233FE6112E5Ad4Db1c83358B30D581F837314BB1

Say:
This is Track 2 because Solidity calls the runtime identity precompile at 0x0000000000000000000000000000000000000818.

## 0:45 - 1:20 Identity-Gated Template Flow

Go to:
- /dashboard/studio

Narrate:
- onlyVerified gates mint and purchase flows.
- _isVerified uses staticcall with IIdentityPrecompile.identity.selector.
- Contract default is useMockVerification = false.

## 1:20 - 2:00 Marketplace Purchase and Split

Go to:
- /dashboard/market

Narrate:
- Execute purchase flow.
- Revenue split is fixed on-chain to 75/20/5.
- Show tx hash and explorer link.

## 2:00 - 2:35 Staking and Accountability

Show:
- Staking contract address: 0x1cf190eabe490B50AaBE91b4567ebe88126e8D24
- Breach workflow from admin page to slashing outcome

Narrate:
- Proven abuse has economic consequence via staking slash path.

## 2:35 - 3:00 Close

Say:
DocuMate delivers a practical trust layer on Polkadot Hub: runtime identity checks, deterministic settlement, and slashable accountability.

## Demo Route Checklist

- /dashboard
- /dashboard/studio
- /dashboard/market
- /dashboard/profile
- /admin/breaches

## Backup if Wallet/Network Fails

- Run npm run testnet:config-check
- Show Config check passed, addresses, non-zero totalVolume and totalBurned, and split(1 PAS) output
