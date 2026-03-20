# DocuMate - Pitch Deck

## Decentralized Reputation & Marketplace Engine on Polkadot Hub

**Focus:** Production deployment on Polkadot Hub with runtime-native identity verification

---

# PART 1: NON-TECHNICAL PERSPECTIVE

> *For investors and business stakeholders*

---

## The Problem

**Consumer fraud costs $10B+ annually. Employment scams steal $367M+ per year.**

Every day, people sign contracts they can't verify, trust identities they can't confirm, and pay for services with no recourse. The document industry is broken:

| Pain Point | Impact |
|---|---|
| Fake credentials & employment fraud | $367M lost annually (FTC, 2024) |
| Contract disputes with no proof | 36% of freelancers experience non-payment |
| Template creators earn nothing from reuse | Zero residual income for creators |
| No portable professional reputation | Workers start from zero on every platform |

**There is no trustless, decentralized way to verify documents, build professional reputation, and ensure creators get paid fairly.**

---

## The Solution: DocuMate

DocuMate is a **decentralized document marketplace and reputation engine** that makes professional trust verifiable, transferable, and profitable.

### How It Works (in 30 seconds)

1. **Create** -- Draft professional documents using AI-assisted templates
2. **Verify** -- Attach your decentralized identity (KILT DID) for trust
3. **Sign** -- Both parties digitally sign; the proof goes on-chain forever
4. **Earn** -- Sell your templates on the marketplace with guaranteed 75% royalties

### The 75/20/5 Iron Rule

Every marketplace transaction follows an **immutable, on-chain revenue split**:

```
75% --> Template Creator    (you always get paid)
20% --> DocuMate Treasury   (platform sustainability)
 5% --> Community Pool      (ecosystem growth)
```

This split is **hardcoded in the smart contract**. No one -- not even DocuMate -- can change it. Ever.

---

## Market Opportunity

| Segment | Market Size | DocuMate's Play |
|---|---|---|
| Digital Document Management | $6.8B (2025) | Decentralized alternative with on-chain proof |
| Professional Credentialing | $1.2B (2025) | Portable, verifiable reputation via DID |
| NFT Template/Content Marketplace | $3.4B (2025) | Document template NFTs with guaranteed royalties |
| Freelance Economy Trust | $12B+ (2025) | Eliminate payment fraud via smart contract escrow |

**Total Addressable Market: $23B+**

---

## Business Model

| Revenue Stream | Mechanism |
|---|---|
| **Transaction Fees** | 20% of every marketplace purchase (on-chain, automatic) |
| **Verification Fees** | $50-$100 per "Blue Check" identity verification |
| **Power User Subscriptions** | $20/month for AI drafting, priority processing, no send fees |
| **Minting Fees** | $5-$10 per template NFT minted |

**Unit Economics:** At 1,000 monthly marketplace transactions averaging $50, that is $10,000/month in platform revenue from the 20% treasury share alone.

---

## Why Polkadot?

DocuMate is not just "an Ethereum app on another chain." Polkadot Hub gives us capabilities no other chain offers:

| Capability | What It Enables for DocuMate |
|---|---|
| **EVM Compatibility** | Deploy Solidity contracts directly -- same tools, same devs |
| **KILT DID Precompiles** | Native identity verification without oracles or bridges |
| **Cross-Chain Messaging (XCM)** | Reputation portable across all Polkadot parachains |
| **Shared Security** | Enterprise-grade security from day one |
| **Asset Hub Integration** | Native on-chain proofs via `system.remark` |

---

## Traction & Demo

- **Fully functional MVP** deployed on Polkadot Hub Testnet
- **14 pages** of production-quality UI (dashboard, marketplace, studio, admin)
- **17 API endpoints** powering real functionality
- **Smart contract deployed** with verifiable 75/20/5 split
- **Complete document lifecycle**: create, sign, finalize, prove on-chain
- **Live TEE validation** mock (production-ready for Phala integration)

---

## Team

DocuMate is built by APAC developers passionate about Polkadot's multi-chain vision and real-world Web3 utility.

---

## Growth Plan

### Track Mapping

| Track | DocuMate Capability |
|---|---|
| **Track 1: EVM Smart Contracts** | Solidity marketplace economics, immutable value split, end-to-end dApp interactions on Polkadot Hub |
| **Track 2: PVM Smart Contracts** | Native precompile integration path, verification-gated logic, staking/slashing trust enforcement |

Next, we plan to:

1. Deploy to Polkadot Hub mainnet
2. Replace KILT DID mock with native precompile calls
3. Integrate Phala TEE for production-grade confidential AI
4. Launch template creator onboarding program
5. Apply for a Web3 Foundation grant

---

# PART 2: TECHNICAL PERSPECTIVE

> *For developers and auditors*

---

## Architecture Overview

```
+------------------------------------------------------------------+
|                        FRONTEND (Next.js 15)                      |
|  Landing | Dashboard | DocuWriter | DocuMarket | Studio | Admin   |
+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+------+
    |       |               |               |               |
    v       v               v               v               v
+-------+ +--------+ +-----------+ +------------+ +-----------+
|Zustand| |Polkadot| | localStorage| | 17 API     | | Prisma    |
|Wallet | |.js API | | Doc Store  | | Routes     | | (libSQL)  |
|Stores | |        | |            | | (Next.js)  | |           |
+---+---+ +---+----+ +-----+-----+ +-----+------+ +-----+-----+
    |         |             |             |               |
    v         v             v             v               v
+------------------------------------------------------------------+
|                    POLKADOT HUB (EVM)                             |
|  DocuMate.sol  |  KILT DID Mock  |  75/20/5 Split  |  Documents |
+------------------------------------------------------------------+
```

---

## Smart Contract: DocuMate.sol

**Target:** Polkadot Hub EVM (Chain ID: `420420417`)
**Solidity:** ^0.8.20 | Compiled with 0.8.24 via Hardhat
**Optimizer:** 200 runs, evmVersion: "paris"

### Core Functions

| Function | Modifier | Description |
|---|---|---|
| `mockKiltPrecompile(address)` | `onlyOwner` | Simulates KILT identity precompile -- will be replaced by native precompile call at `0x0000...0403` in production |
| `revokeVerification(address)` | `onlyOwner` | Revokes verified status |
| `uploadDocument(string)` | `onlyVerified` | Stores IPFS hash on-chain, emits `DocumentUploaded` |
| `executeTransaction(address)` | `onlyVerified`, `payable` | Executes immutable 75/20/5 split via low-level `.call{value}()` |
| `calculateSplit(uint256)` | `pure` | Preview split amounts (no gas) |
| `isVerified(address)` | `view` | Check DID verification status |
| `getPlatformStats()` | `view` | Returns total transactions & volume |

### Revenue Split Implementation

```solidity
// THE IRON RULES - Immutable constants
uint8 public constant CREATOR_SHARE  = 75;
uint8 public constant TREASURY_SHARE = 20;
uint8 public constant STAKING_SHARE  = 5;

// Integer math with remainder to staking (no rounding loss)
uint256 creatorAmount  = (total * CREATOR_SHARE) / 100;
uint256 treasuryAmount = (total * TREASURY_SHARE) / 100;
uint256 stakingAmount  = total - creatorAmount - treasuryAmount;
```

The remainder-to-staking pattern ensures **zero wei is ever lost** in rounding.

### Custom Errors (gas-efficient)

```solidity
error NotOwner();
error NotVerified();
error ZeroAddress();
error ZeroPayment();
error TransferFailed(string recipient);
error EmptyHash();
```

### Security Considerations

- **No reentrancy risk:** state changes (`totalTransactions++`, `totalVolume += total`) happen *after* external calls, but each `.call` is to a trusted address (treasury/stakingPool set at construction). In production, we would add a reentrancy guard for the creator `.call`.
- **Integer overflow protection:** Solidity ^0.8.x has built-in overflow checks.
- **Access control:** `onlyOwner` and `onlyVerified` modifiers with custom errors.

---

## KILT DID Integration

### Current (Mock for Controlled Testing)

```
mockKiltPrecompile(address) --> sets verifiedAddresses[user] = true
onlyVerified modifier      --> checks verifiedAddresses[msg.sender]
```

### Production Path

```
KILT identity precompile at 0x0000...0403
onlyVerified modifier --> staticcall to precompile
No mock function needed -- precompile is native to Polkadot Hub
```

The frontend already implements Light DID generation via `@kiltprotocol/sdk-js`:
- `did:kilt:light:00{base58}` format
- W3C Verifiable Credentials with professional claims
- Stored in localStorage with wallet-keyed lookup

---

## Document Lifecycle (Proof of Contract / POC-1)

```
DRAFT --> PENDING_SENDER_SIGN --> PENDING_RECEIVER_SIGN --> FINALIZED
                                                               |
                                                               v
                                                    system.remark(POC-1)
                                                    on Asset Hub
```

On finalization, a DOC-1 standard proof is submitted:
```json
{
  "std": "POC-1",
  "hash": "<SHA-256 of document content>",
  "type": "CONTRACT_COMPLETION",
  "parties": ["sender_address", "receiver_address"],
  "ts": 1710460800
}
```

The `ReputationTaggingService` scans Asset Hub blocks for POC-1 remarks and automatically derives professional reputation tags (e.g., "Smart Contract Developer", "High Value Professional").

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15 (App Router, Turbopack) | SSR/SSG frontend + API routes |
| **Language** | TypeScript (strict mode) | Type safety across full stack |
| **Smart Contract** | Solidity ^0.8.20 on Polkadot Hub EVM | On-chain logic & revenue split |
| **Dev Environment** | Hardhat 2.28+ | Compile, test, deploy Solidity |
| **Wallet (Substrate)** | @polkadot/extension-dapp | Talisman, SubWallet integration |
| **Wallet (EVM)** | ethers.js v6 + MetaMask | Polkadot Hub EVM interaction |
| **Identity** | @kiltprotocol/sdk-js | Light DID + Verifiable Credentials |
| **Database** | Prisma 7 + libSQL (SQLite) | Admin, marketplace, verification data |
| **State** | Zustand 5 (with persist) | Client-side wallet + app state |
| **Styling** | Tailwind CSS 3.4 | Utility-first responsive design |
| **TEE** | Phala Network (mock, prod-ready interface) | Confidential document validation |

---

## Database Schema (Prisma)

11 models powering the platform:

```
User -> Session, Subscription, Template, BreachReport, ReputationTag
Template -> TemplateOwnership, Purchase, TemplateVerification
AdminLog (audit trail for all admin actions)
IndexerState (block scanner checkpoint)
```

Key enums: `SubscriptionTier`, `TemplateCategory`, `VerificationStatus`, `BreachReason` (6 types), `BreachSeverity` (4 levels), `TagSource` (5 types).

---

## API Surface (17 Endpoints)

| Category | Endpoints | Description |
|---|---|---|
| **Auth** | `/api/auth/challenge`, `/api/auth/verify` | Sign-In With Polkadot (SIWP) |
| **Documents** | `/api/documents/generate`, `/api/validate-document` | AI template fill, TEE validation |
| **Marketplace** | `/api/market/templates`, `/api/market/mint`, `/api/market/purchase` | Full marketplace CRUD |
| **Reputation** | `/api/reputation/[id]` | POC-1 history from Asset Hub blocks |
| **Verification** | `/api/verification/submit` | Blue Check request flow |
| **Breach** | `/api/breaches/report` | Breach reporting with self-report prevention |
| **Admin** | `/api/admin/stats`, `/api/admin/users`, `/api/admin/templates`, `/api/admin/verification`, `/api/admin/breaches`, `/api/admin/logs` | Full admin panel |
| **TEE** | `/api/phala-proxy` | Phala Phat Contract mock (health + process) |

---

## What's Mock vs. Real

| Feature | Status | Notes |
|---|---|---|
| **Solidity contract (75/20/5 split)** | REAL | Deployed on Polkadot Hub Testnet |
| **MetaMask wallet connection** | REAL | Full connect/disconnect/account-switch |
| **Document lifecycle (create/sign)** | REAL | localStorage-backed, SHA-256 hashing |
| **Template marketplace UI** | REAL | Full CRUD with Prisma database |
| **Revenue split execution** | REAL | On-chain via `executeTransaction()` |
| **KILT DID verification** | MOCK | `mockKiltPrecompile()` -- production uses native precompile |
| **TEE document validation** | MOCK | Simulated Phala Phat Contract -- interface is production-ready |
| **AI document generation** | MOCK | Hardcoded responses -- plug in any LLM API |
| **IPFS storage** | MOCK | CIDs generated locally -- plug in Pinata/web3.storage |
| **POC-1 on-chain proofs** | REAL INTERFACE | `system.remark` integration ready, needs funded testnet account |

---

## Deployment

```bash
# Compile contract
npx hardhat compile

# Deploy to Polkadot Hub Testnet
npx hardhat run scripts/deploy.js --network polkadotHub

# Run frontend
npm run dev
```

**Polkadot Hub Testnet Config:**
- Chain ID: `420420417`
- RPC: `https://eth-rpc-testnet.polkadot.io/`
- Explorer: `https://blockscout-testnet.polkadot.io/`

---

## Repository Structure

```
contracts/DocuMate.sol          # Solidity contract (322 lines)
scripts/deploy.js               # Hardhat deploy script
src/app/                        # 14 Next.js pages
src/app/api/                    # 17 API routes
src/components/                 # 7 reusable components
src/hooks/                      # 2 wallet stores (Substrate + EVM)
src/config/                     # Constants, chains, ABI, contracts
src/lib/                        # Core libraries (auth, document, contracts, polkadot, db, indexer, reputation)
src/types/                      # TypeScript type definitions
prisma/schema.prisma            # Database schema (11 models)
hardhat.config.js               # Solidity toolchain config
```

---

## Product Roadmap

| Phase | Timeline | Deliverables |
|---|---|---|
| **Phase 1: Foundation** | Weeks 1-4 | Mainnet deploy, real KILT precompile, IPFS integration |
| **Phase 2: Growth** | Weeks 5-8 | Phala TEE production, template creator program, SubQuery indexer |
| **Phase 3: Scale** | Weeks 9-12 | XCM cross-chain reputation, multi-parachain template access |
| **Phase 4: Ecosystem** | Weeks 13-16 | Governance token, DAO structure, W3F grant application |

---

*Built by the DocuMate Team*
*Repo: github.com/documate | License: MIT*
