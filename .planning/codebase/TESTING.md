# Testing Patterns

**Analysis Date:** 2026-03-18

## Test Framework

**Runner:**
- Hardhat test runner (Mocha under Hardhat) with Chai matchers.
- Config: `hardhat.config.js`

**Assertion Library:**
- Chai (`expect`) with Hardhat-specific matchers like `.to.changeEtherBalances`, `.to.emit`, `.to.be.revertedWithCustomError`.

**Run Commands:**
```bash
npm run contracts:test      # Run smart contract tests (hardhat test)
npm run testnet:smoke       # Execute write-path testnet smoke validation script
npm run release:checklist   # Run lint + compile + tests + environment checks
```

## Test File Organization

**Location:**
- Contract tests live in top-level `test/` directory as configured in `hardhat.config.js` (`paths.tests = "./test"`).

**Naming:**
- `*.test.js` pattern in `test/` (current file: `test/documate-track2.test.js`).

**Structure:**
```
test/
└── documate-track2.test.js
```

## Test Structure

**Suite Organization:**
```javascript
describe("DocuMate Track 2 Prototype", function () {
  describe("DocuMateMarketplace", function () {
    it("enforces 75/20/5 split in purchase(address)", async function () {
      // deploy
      // arrange
      // assert balances/events/errors
    });
  });

  describe("DocuMateStaking", function () {
    it("stakes then slashes after validated breach", async function () {
      // deploy, execute breach flow, assert pool/stake state
    });
  });
});
```

**Patterns:**
- Setup pattern: deploy fresh contracts per test via `ethers.getContractFactory(...).deploy(...)`.
- Teardown pattern: no explicit teardown; tests rely on isolated deployments and Hardhat network reset behavior.
- Assertion pattern: state/effect assertions over event and balance changes rather than snapshots.

## Mocking

**Framework:**
- No external mocking framework (no Sinon/Jest/Vitest mocks detected).
- Functional mocking is done through on-chain feature flags and contract methods.

**Patterns:**
```javascript
await marketplace.setUseMockVerification(true);
await marketplace.setMockVerified(user.address, true);

await expect(
  marketplace.connect(user).mintTemplate("ipfs://template", "LEGAL", ethers.parseEther("1"))
).to.emit(marketplace, "TemplateMinted");
```

**What to Mock:**
- Identity verification precompile is toggled to mock mode in tests (`setUseMockVerification`, `setMockVerified`).
- External integration behavior is emulated in non-test scripts/API routes (mock TEE/IPFS behavior), but not via dedicated unit mock libraries.

**What NOT to Mock:**
- Core token economics and payout mechanics are tested against real contract execution (e.g., 75/20/5 split assertions with ether balance deltas).

## Fixtures and Factories

**Test Data:**
```javascript
const [owner, creator, buyer, treasury] = await ethers.getSigners();
const payment = ethers.parseEther("1");
const creatorAmount = (payment * 75n) / 100n;
```

**Location:**
- No shared fixtures/factory utilities detected.
- Test data and deployments are inlined inside each `it(...)` block in `test/documate-track2.test.js`.

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
Not configured in package scripts.
No repository-level coverage threshold file detected.
```

## Test Types

**Unit Tests:**
- Solidity behavior-focused tests in `test/documate-track2.test.js` validate contract functions and error paths in isolation from frontend/API.

**Integration Tests:**
- Script-based integration/smoke checks against RPC and deployed contracts:
  - `scripts/testnet-smoke-track2.js`
  - `scripts/demo-fallback-check.js`
- These scripts validate deployment wiring, chain ID, contract ownership/state, and selected end-to-end transactions.

**E2E Tests:**
- Not used for web UI/API flows (no Playwright/Cypress config or first-party specs detected in repository source).

## Common Patterns

**Async Testing:**
```javascript
await expect(() =>
  marketplace.connect(buyer).purchase(creator.address, { value: payment })
).to.changeEtherBalances(
  [buyer, creator, treasury, burn],
  [payment * -1n, creatorAmount, treasuryAmount, burnAmount]
);
```

**Error Testing:**
```javascript
await expect(
  marketplace.connect(user).mintTemplate("ipfs://template", "LEGAL", ethers.parseEther("1"))
).to.be.revertedWithCustomError(marketplace, "NotVerified");
```

---

*Testing analysis: 2026-03-18*
