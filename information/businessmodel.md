# 💼 Business Model: DocuMate

**Strategy:** Hybrid Web3 Marketplace & SaaS
**Core Revenue Split:** 75% Creator / 20% Company / 5% Burn

### 1. The "Flywheel" Value Proposition

This model relies on a self-reinforcing loop where high-quality templates attract high-value users, who then pay for subscriptions.

* **For Creators (Supply):** "Monetize your professional IP with a 75% take rate—higher than any Web2 competitor."
* **For Users (Demand):** "Draft privacy-preserved, legally binding contracts using AI that actually knows the law."
* **For Investors (Growth):** "A sustainable 20% take rate on a high-ticket marketplace, plus recurring SaaS revenue."

---

### 2. Revenue Streams (How You Make Money)

You have **three distinct revenue engines**. This diversification reduces risk for investors.

#### A. Marketplace Transaction Fees (The Cash Cow)

* **Mechanism:** You take a **20% Commission** on every template sold.
* **Why it works:** Unlike $5 Fiverr gigs, legal templates are high-ticket items ($50–$500). A 20% cut on a $100 NDA is **$20 pure revenue** per transaction.
* **Projected Volume:**
* *Year 1 Goal:* 5,000 templates sold avg @ $75.
* *Revenue:* $375,000 GMV  **$75,000 Net Revenue.**



#### B. "DocuWriter" SaaS Subscription (The ARR)

* **Mechanism:** **$20/month** for Power Users (Recurring Revenue).
* **Value Add:** Access to Phala TEE (Privacy) + Unlimited AI Drafting.
* **Cost of Goods Sold (COGS):** Phala compute & LLM API costs are estimated at ~$3-$5 per active user.
* **Margin:** ~75-85% Gross Margin.
* **Projected Volume:**
* *Year 1 Goal:* 1,000 active subscribers.
* *Revenue:* **$240,000 Annual Recurring Revenue (ARR).**



#### C. Verification Services (The Trust Premium)

* **Mechanism:** **$50 - $100 One-Time Fee** for "Blue Check" status.
* **Why creators pay:** Verified templates sell 3x-5x more because buyers trust them.
* **Margin:** High (Time-cost of manual review).
* **Projected Volume:**
* *Year 1 Goal:* 200 Verified Templates.
* *Revenue:* **$15,000 (Operational Cash Flow).**



---

### 3. Unit Economics: The "Cost of a Template"

This section proves to investors that your **75% payout to creators** is necessary to build high-quality supply.

**The Problem:** A high-quality legal template is expensive to produce.

* **Creator's Sunk Cost:** ~$650 - $1,200 (Legal Research, Drafting, Audit).
* **The "Break-Even" Point:**
* Selling Price: $50
* Creator Net Earnings: $37.50 (75%)
* *Sales needed to break even:* **~21 sales.**



**The Solution:**
By offering 75% (instead of Upwork's sliding scale or Gumroad's lack of discovery), you lower the "Risk Threshold" for creators. If you took 45%, they would need **40+ sales** just to break even, which is too risky. **75% is the strategic incentives wedge.**

---

### 4. Operational Costs (Burn Rate)

To justify the **20% Company Cut**, you need to show where that money goes.

1. **Phala Network / TEE Compute:** Paying for the "Privacy" nodes. This scales with usage (Variable Cost).
2. **IPFS / Arweave Storage:** Hosting the encrypted template metadata (Fixed/Variable Cost).
3. **Legal/Audit Team:** The humans who perform the "Blue Check" verification (Fixed Cost).
4. **Smart Contract Gas:** Subsidizing "signless" transactions for UX (Optional/Marketing Cost).

---

### 5. Investor Pitch Summary

* **We don't sell tokens; we sell utility.** The $DOCU token represents real yield from marketplace volume.
* **We aren't a 'Crypto Project'; we are a Fintech SaaS.** We use blockchain for the specific problem of *Identity* and *Privacy*, not just for hype.
* **The 20% Take Rate is defensible.** It is low enough to prevent creators from leaving, but high enough to build a unicorn valuation.

### 6. Next Steps for Development

Since you have locked in the **75/20/5 model**, your immediate technical priorities (based on the PRD) are:

1. **Smart Contract:** Write the `split_revenue` function in your Polkadot/Ink! contract to automatically route 75% to the seller, 20% to the treasury wallet, and 5% to the burn address.
2. **Marketplace UI:** Add a "Net Earnings" calculator for creators so they see "List for $100 -> You get $75" immediately.
3. **Admin Panel:** Build the "Verification Queue" to start collecting those $50 audit fees.