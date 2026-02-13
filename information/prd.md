# Product Requirements Document: DocuMate

## 1. Product Overview

**Product Name:** DocuMate
**Tagline:** The Immutable Professional Reputation & Contract Network.
**Core Philosophy:** "You are what you sign." A professional's identity is defined by their proven contract history.
**Business Goal:** To build a profitable, investor-ready platform that balances a high-utility "Take Rate" with a thriving Creator Economy.

## 2. Feature Specifications

### 2.1. Dynamic Profile & Reputation Engine

**Goal:** Eliminate fake resumes by deriving user tags strictly from on-chain contract activity.

* **Dynamic Role Tagging:**
* System analyzes Proof of Contract (POC) metadata to assign tags (e.g., "Smart Contract Audit," "Graphic Design").
* **Immutability:** Reputation Tags and Contract History are immutable.


* **Breach of Contract:**
* Reporting mechanism for employers to flag contract violations.
* Verified breaches result in a permanent **"High Risk"** or **"Breach"** tag on the user's profile.



### 2.2. DocuWriter (Hybrid SaaS & Pay-Per-Use)

**Goal:** A privacy-first tool for creating legally binding agreements, offering both free access and power-user features.

* **Service Tiers:**
1. **Free Tier:**
* Basic AI Drafting (Standard speed).
* Pay-per-send (Transaction fee only).


2. **Power User Subscription ($20/month):**
* **"Privacy-First AI Drafting"** (Phala TEE).
* Unlimited revisions.
* Priority processing for complex legal queries.




* **Workflow:**
* **Drafting:** AI generates structured documents based on user prompts.
* **Revision:** "Chat-to-Revise" allows granular edits (e.g., "Change jurisdiction to Singapore").
* **Execution:** Sending a document for signature incurs a blockchain transaction fee ($DOCU).



### 2.3. DocuMarket (Template Marketplace)

**Goal:** A sustainable creator economy where verified templates are bought and sold as NFTs.

* **Template Studio:**
* Creators define "Master Templates" with mandatory variable fields (e.g., `{{ClientName}}`).
* **Minting:** Creators pay a gas/storage fee ($5-$10) to tokenize the template.


* **"Blue Check" Verification:**
* **Feature:** Creators can apply for "Verified by DocuMate" status.
* **Process:** Manual audit by DocuMate legal team/admins to ensure no loopholes.
* **Cost:** One-time fee of **$50 - $100** paid by the Creator.
* **Benefit:** Higher visibility and trust badge on the marketplace.



## 3. Business Model & Tokenomics (The "Sweet Spot")

This section defines how the platform generates revenue, rewards creators, and creates token scarcity.

### 3.1. The Revenue Split (75 / 20 / 5)

Applied to every transaction on DocuMarket (e.g., Template Sales).

| Stakeholder | Split | Rationale |
| --- | --- | --- |
| **Creator (User)** | **75%** | **Incentive:** Beats industry standards (Upwork ~80%, Gumroad ~90% w/o crypto). Attracts high-quality legal/engineering IP. |
| **DocuMate (Company)** | **20%** | **Revenue:** Standard "Take Rate" for high-utility platforms (comparable to Apple/Steam/Uber). Creates sustainable cash flow. |
| **Burn Protocol** | **5%** | **Token Value:** Deflationary mechanism. Every transaction permanently removes $DOCU from circulation, satisfying crypto-native investors. |

### 3.2. Creator Economy Logic (The "Sunk Cost" Defense)

The platform is designed to help creators recover their initial investment in creating high-quality IP.

* **Creator's Investment (Est. ~$650 - $1,200):**
* Legal Research: $300 - $600
* Drafting & Logic: $200 - $500
* Peer Review/Audit: $150


* **Break-Even Strategy:**
* Because of this sunk cost, creators need volume.
* *Scenario:* Selling a template for **$50**.
* *Net Earnings:* $37.50 per sale (75%).
* *Result:* Creator breaks even after ~17-20 sales. Every sale after is pure profit.



### 3.3. Company Revenue Streams (Investor Pitch)

1. **Transaction Fees (The 20% Cut):**
* Primary revenue source from GMV (Gross Merchandise Value).
* *Example:* On $10M in platform sales, DocuMate earns **$2M Revenue**.


2. **Verification Fees (100% Margin):**
* $50-$100 per template for "Verified" status.
* Direct revenue stream to cover operational/legal review costs.


3. **SaaS Subscription (High Margin):**
* $20/month for "Power Users" utilizing Phala TEE.
* Cost of goods (compute) is low; markup is profit.



## 4. Technical Requirements

### 4.1. Smart Contracts & Asset Hub

* **Royalty Logic:** The contract must enforce the **75/20/5 split** automatically upon NFT purchase.
* `Transfer 75% -> Creator_Address`
* `Transfer 20% -> Treasury_Address`
* `Transfer 5% -> Burn_Address`


* **Metadata Extensions:**
* `isVerified`: Boolean (Controlled by Admin key).
* `subscriptionStatus`: Enum (Free, Pro).



### 4.2. Admin Dashboard (Internal Tool)

* **Verification Queue:** A view for Admins to see templates requesting "Blue Check" verification.
* **Action:** Admins must be able to:
* View the full template content (decrypted).
* Approve (triggers `isVerified = true` on-chain).
* Reject (with feedback).


* **Breach Management:** Interface to review breach reports and apply negative reputation tags.

### 4.3. Database Schema (Updates)

* **Table: `Subscriptions**`
* `userId`: string
* `tier`: "Free" | "PowerUser"
* `expiresAt`: timestamp


* **Table: `TemplateVerification**`
* `templateId`: string
* `status`: "Pending" | "Approved" | "Rejected"
* `auditLog`: string (Notes from the reviewer)



## 5. User Stories (Updated for Business Logic)

| Actor | Feature | Description |
| --- | --- | --- |
| **Creator** | Monetization | As a lawyer, I want to sell my NDA template for $100. I expect to receive $75 per sale to cover my 4 hours of research time. |
| **Creator** | Verification | As a creator, I want to pay $50 to get my template "Verified" so buyers trust it more and I get more sales volume. |
| **Investor** | ROI | As an investor, I want to see that the company takes a sustainable 20% cut of all sales to ensure long-term profitability. |
| **Power User** | SaaS | As a high-volume freelancer, I want to pay $20/month to draft contracts privately using TEEs without per-document delays. |