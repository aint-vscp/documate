# SUBMISSION CHECKLIST (EVIDENCE-BACKED)

Generated: 2026-03-18T18:28:40.6224726+08:00

## Project and Track

- [x] Project: DocuMate
- [x] Track: Polkadot Solidity Hackathon Track 2 (PVM Smart Contracts)
- [x] Network: Polkadot Hub Testnet
- [x] Chain ID: 420420417

## Contract Targets

- [x] Marketplace address: 0x233FE6112E5Ad4Db1c83358B30D581F837314BB1
- [x] Staking address: 0x1cf190eabe490B50AaBE91b4567ebe88126e8D24

## Security and Configuration

- [x] .env is not tracked by git
	Evidence:
	Command: git ls-files .env
	Output: empty

- [x] Mock verification default is OFF
	Evidence:
	contracts/DocuMateMarketplace.sol:97 useMockVerification = false;

- [x] Runtime identity precompile address is wired
	Evidence:
	contracts/DocuMateMarketplace.sol:16 DEFAULT_IDENTITY_PRECOMPILE = 0x0000000000000000000000000000000000000818;
	contracts/DocuMateMarketplace.sol:240 identityPrecompile.staticcall(
	contracts/DocuMateMarketplace.sol:241 abi.encodeWithSelector(IIdentityPrecompile.identity.selector, account)

- [x] Rate limiting exists on auth and market API routes
	Evidence:
	src/app/api/auth/challenge/route.ts:12 withRateLimit(request, "auth-challenge", ...)
	src/app/api/auth/verify/route.ts:13 withRateLimit(request, "auth-verify", ...)
	src/app/api/market/mint/route.ts:69 withRateLimit(request, "market-mint", ...)
	src/app/api/market/purchase/route.ts:13 withRateLimit(request, "market-purchase", ...)

## Validation Commands

- [x] npm audit --omit=dev reports no vulnerabilities
	Evidence:
	found 0 vulnerabilities

- [x] npm run lint passes
	Evidence:
	documate@0.1.0 lint
	eslint . --ext .ts,.tsx,.js,.mjs --quiet --report-unused-disable-directives-severity off

- [x] npm run build passes and expected API routes exist
	Evidence:
	Compiled successfully
	Route table contains:
	- /api/auth/challenge
	- /api/auth/verify
	- /api/market/mint
	- /api/market/purchase

- [x] npx hardhat test passes
	Evidence:
	5 passing (985ms)
	includes: pays the current seller on resale in purchaseTemplate

- [x] npm run testnet:config-check confirms live testnet state
	Evidence:
	Config check passed.
	Marketplace: 0x233FE6112E5Ad4Db1c83358B30D581F837314BB1
	Staking: 0x1cf190eabe490B50AaBE91b4567ebe88126e8D24
	totalVolume(wei): 50000000000000
	totalBurned(wei): 2500000000000
	split(1 PAS): 750000000000000000 200000000000000000 50000000000000000
	isVerified(wallet): false

## Submission Documents

- [x] README.md rewritten with Track 2 positioning
- [x] docs/precompile-integration.md updated with staticcall and selector details
- [x] docs/demo-script.md updated for 3-minute walkthrough
- [x] docs/judge-qa.md updated with likely judge responses

## Explorer References

- [x] Marketplace explorer URL included
	https://blockscout-testnet.polkadot.io/address/0x233FE6112E5Ad4Db1c83358B30D581F837314BB1
- [x] Staking explorer URL included
	https://blockscout-testnet.polkadot.io/address/0x1cf190eabe490B50AaBE91b4567ebe88126e8D24

## Final Status

- [x] DOCUMATE SUBMISSION READY
