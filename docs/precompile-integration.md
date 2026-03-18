# Precompile Integration Proof (Track 2)

## Objective

Prove that DocuMate uses a Polkadot Hub runtime precompile from Solidity, not a mock-only or plain-EVM path.

## Runtime Address

Identity precompile constant in contracts/DocuMateMarketplace.sol:

0x0000000000000000000000000000000000000818

Reference line evidence from command output:
- contracts/DocuMateMarketplace.sol:16 DEFAULT_IDENTITY_PRECOMPILE = 0x000...0818

## Interface Used

contracts/interfaces/IIdentityPrecompile.sol declares:
- function identity(address who) external view returns (Registration memory)
- Registration includes bool isValid

## Staticcall Path in Marketplace Contract

The verification logic in _isVerified(address account) uses:

- (bool ok, bytes memory data) = identityPrecompile.staticcall(...)
- abi.encodeWithSelector(IIdentityPrecompile.identity.selector, account)
- returns false when call fails or response is malformed
- decodes first 32-byte word to bool

Evidence from command output:
- contracts/DocuMateMarketplace.sol:240 identityPrecompile.staticcall(
- contracts/DocuMateMarketplace.sol:241 abi.encodeWithSelector(IIdentityPrecompile.identity.selector, account)

## Mock Mode Default

Constructor sets:

useMockVerification = false

Evidence:
- contracts/DocuMateMarketplace.sol:97 useMockVerification = false

Deploy script behavior:
- scripts/deploy-track2.js only enables mock when USE_MOCK_VERIFICATION evaluates to true
- .env.example does not set USE_MOCK_VERIFICATION

## Why This Is Polkadot Hub Specific

This identity call is a runtime precompile endpoint exposed by Polkadot Hub PVM. In plain EVM networks, runtime identity state from Polkadot is not natively available at this precompile address. Equivalent behavior would require introducing an off-chain oracle or bridge trust layer, which changes the trust model.

## Live Network Context

- Network: Polkadot Hub Testnet
- Chain ID: 420420417
- Marketplace: 0x233FE6112E5Ad4Db1c83358B30D581F837314BB1
- Staking: 0x1cf190eabe490B50AaBE91b4567ebe88126e8D24

From npm run testnet:config-check:
- Config check passed.
- isVerified(wallet): false for zero address
- totalVolume(wei): 50000000000000
- totalBurned(wei): 2500000000000
- split(1 PAS): 750000000000000000 200000000000000000 50000000000000000

These values and the verification call path support Track 2 alignment: real runtime integration on testnet with non-zero live contract state.
