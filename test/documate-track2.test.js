const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocuMate Track 2 Prototype", function () {
  describe("DocuMateMarketplace", function () {
    it("enforces 75/20/5 split in purchase(address)", async function () {
      const [owner, creator, buyer, treasury] = await ethers.getSigners();
      const burn = "0x000000000000000000000000000000000000dEaD";

      const Factory = await ethers.getContractFactory("DocuMateMarketplace");
      const marketplace = await Factory.deploy(treasury.address, burn, ethers.ZeroAddress);
      await marketplace.waitForDeployment();

      await marketplace.setUseMockVerification(true);
      await marketplace.setMockVerified(buyer.address, true);

      const payment = ethers.parseEther("1");
      const creatorAmount = (payment * 75n) / 100n;
      const treasuryAmount = (payment * 20n) / 100n;
      const burnAmount = payment - creatorAmount - treasuryAmount;

      await expect(() =>
        marketplace.connect(buyer).purchase(creator.address, { value: payment })
      ).to.changeEtherBalances(
        [buyer, creator, treasury, burn],
        [payment * -1n, creatorAmount, treasuryAmount, burnAmount]
      );
    });

    it("blocks mint for unverified users", async function () {
      const [, user, treasury] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory("DocuMateMarketplace");
      const marketplace = await Factory.deploy(treasury.address, ethers.ZeroAddress, ethers.ZeroAddress);
      await marketplace.waitForDeployment();

      await marketplace.setUseMockVerification(true);
      await expect(
        marketplace.connect(user).mintTemplate("ipfs://template", "LEGAL", ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(marketplace, "NotVerified");
    });

    it("allows verified users to mint", async function () {
      const [owner, user, treasury] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory("DocuMateMarketplace");
      const marketplace = await Factory.deploy(treasury.address, ethers.ZeroAddress, ethers.ZeroAddress);
      await marketplace.waitForDeployment();

      await marketplace.connect(owner).setUseMockVerification(true);
      await marketplace.connect(owner).setMockVerified(user.address, true);

      await expect(
        marketplace.connect(user).mintTemplate("ipfs://template", "LEGAL", ethers.parseEther("1"))
      ).to.emit(marketplace, "TemplateMinted");
    });

    it("pays the current seller on resale in purchaseTemplate", async function () {
      const [owner, creator, buyer, treasury] = await ethers.getSigners();
      const burn = "0x000000000000000000000000000000000000dEaD";

      const Factory = await ethers.getContractFactory("DocuMateMarketplace");
      const marketplace = await Factory.deploy(treasury.address, burn, ethers.ZeroAddress);
      await marketplace.waitForDeployment();

      await marketplace.connect(owner).setUseMockVerification(true);
      await marketplace.connect(owner).setMockVerified(creator.address, true);
      await marketplace.connect(owner).setMockVerified(buyer.address, true);

      const price = ethers.parseEther("1");
      await marketplace.connect(creator).mintTemplate("ipfs://template", "LEGAL", price);

      const sellerAmount = (price * 75n) / 100n;
      const treasuryAmount = (price * 20n) / 100n;
      const burnAmount = price - sellerAmount - treasuryAmount;

      await expect(() =>
        marketplace.connect(buyer).purchaseTemplate(1, { value: price })
      ).to.changeEtherBalances(
        [buyer, creator, treasury, burn],
        [price * -1n, sellerAmount, treasuryAmount, burnAmount]
      );
    });
  });

  describe("DocuMateStaking", function () {
    it("stakes then slashes after validated breach", async function () {
      const [owner, reporter, target] = await ethers.getSigners();
      const Staking = await ethers.getContractFactory("DocuMateStaking");
      const staking = await Staking.deploy(owner.address);
      await staking.waitForDeployment();

      await staking.connect(target).stakeReputation({ value: ethers.parseEther("50") });

      await expect(staking.connect(reporter).reportBreach(target.address, "forged signature"))
        .to.emit(staking, "BreachReported");

      await expect(staking.connect(owner).validateBreach(1, true)).to.emit(staking, "BreachValidated");

      const info = await staking.getStakeInfo(target.address);
      expect(info[0]).to.equal(false);
      expect(info[1]).to.equal(0);

      const stats = await staking.getPoolStats();
      expect(stats[1]).to.equal(ethers.parseEther("50"));
    });
  });
});
