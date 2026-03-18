# Testing Patterns

**Analysis Date:** 2026-03-18

## Test Framework

**Runner:**
- Hardhat test runner (Mocha under Hardhat toolbox) driven by `hardhat test` script in `package.json`.
- Config and test paths are defined in `hardhat.config.js` (`paths.tests: "./test"`).

**Assertion Library:**
- Chai (`expect`) with Hardhat chai matchers (event and balance assertions), evidenced in `test/documate-track2.test.js`.

**Run Commands:**
```bash
npm run contracts:test        # Run smart contract tests (Hardhat)
npm run contracts:compile     # Compile contracts before test execution
npm run release:checklist     # Lint + compile + tests + testnet/demo checks
```

## Test File Organization

**Location:**
- Contract tests are in top-level `test/` directory, not co-located with source modules.
- Observed suite: `test/documate-track2.test.js`.

**Naming:**
- Uses `*.test.js` naming convention for Hardhat test discovery.

**Structure:**
```
test/
  documate-track2.test.js
```

## Test Structure

**Suite Organization:**
```javascript
describe("DocuMate Track 2 Prototype", function () {
  describe("DocuMateMarketplace", function () {
    it("enforces 75/20/5 split in purchase(address)", async function () {
      // deploy + exercise + assert
    });
  });

  describe("DocuMateStaking", function () {
    it("stakes then slashes after validated breach", async function () {
      // deploy + exercise + assert
    });
  });
});
```
Pattern source: `test/documate-track2.test.js`.

**Patterns:**
- Setup pattern: acquire signers via `await ethers.getSigners()`, deploy via `ethers.getContractFactory(...).deploy(...)`, then `waitForDeployment()`.
- Teardown pattern: explicit teardown hooks are not used; each test deploys fresh contract instances.
- Assertion pattern:
  - state assertions (`expect(info[0]).to.equal(false)`)
  - event assertions (`to.emit(..., "TemplateMinted")`)
  - revert assertions (`to.be.revertedWithCustomError(...)`)
  - balance delta assertions (`to.changeEtherBalances(...)`)

## Mocking

**Framework:**
- No JavaScript mocking library detected (no Jest/Vitest mock APIs in repo test code).

**Patterns:**
```javascript
await marketplace.setUseMockVerification(true);
await marketplace.setMockVerified(buyer.address, true);
```
Pattern source: `test/documate-track2.test.js`.

**What to Mock:**
- Contract-level verification behavior is toggled through explicit on-contract mock switches (`setUseMockVerification`, `setMockVerified`) instead of external mocking frameworks.

**What NOT to Mock:**
- Core token/payment economics and stake-slash flow are executed against deployed in-memory contracts and asserted end-to-end in the test suite (`purchase`, `purchaseTemplate`, `stakeReputation`, `validateBreach`) in `test/documate-track2.test.js`.

## Fixtures and Factories

**Test Data:**
```javascript
const payment = ethers.parseEther("1");
const creatorAmount = (payment * 75n) / 100n;
const treasuryAmount = (payment * 20n) / 100n;
const burnAmount = payment - creatorAmount - treasuryAmount;
```
Pattern source: `test/documate-track2.test.js`.

**Location:**
- No separate fixture or factory modules detected.
- Data setup is inline per test case in `test/documate-track2.test.js`.

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# Not configured in package scripts or hardhat config.
# No dedicated coverage tool (e.g., solidity-coverage, jest --coverage) detected.
```

## Test Types

**Unit Tests:**
- Not detected for frontend/backend TypeScript modules under `src/`.

**Integration Tests:**
- Smart contract integration tests are present in `test/documate-track2.test.js`, covering contract interactions and economic flows with deployed instances.

**E2E Tests:**
- Browser E2E framework configuration is not detected (`playwright.config.*` and `cypress.config.*` not present in workspace).
- Operational testnet checks exist as script-based validations rather than test-runner E2E:
  - `scripts/testnet-smoke-track2.js`
  - `scripts/demo-fallback-check.js`
  - `scripts/testnet-config-check.js`

## Common Patterns

**Async Testing:**
```javascript
const marketplace = await Factory.deploy(treasury.address, burn, ethers.ZeroAddress);
await marketplace.waitForDeployment();

await expect(() =>
  marketplace.connect(buyer).purchase(creator.address, { value: payment })
).to.changeEtherBalances(...);
```
Pattern source: `test/documate-track2.test.js`.

**Error Testing:**
```javascript
await expect(
  marketplace.connect(user).mintTemplate("ipfs://template", "LEGAL", ethers.parseEther("1"))
).to.be.revertedWithCustomError(marketplace, "NotVerified");
```
Pattern source: `test/documate-track2.test.js`.

---

*Testing analysis: 2026-03-18*
