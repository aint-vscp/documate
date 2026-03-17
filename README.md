# DocuMate

> **Decentralized Reputation & Marketplace Engine** — preventing consumer fraud ($10B+ annually) and employment scams ($367M+ annually) through on-chain document verification and immutable revenue splitting on Polkadot Hub EVM.

[![Track 1: EVM Smart Contracts](https://img.shields.io/badge/Track%201-EVM%20Smart%20Contracts-E6007A?style=for-the-badge)](https://polkadot.com)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=for-the-badge)](https://soliditylang.org)
[![Polkadot Hub](https://img.shields.io/badge/Polkadot%20Hub-EVM-E6007A?style=for-the-badge)](https://polkadot.com)

---

## What is DocuMate?

DocuMate is a decentralized contract governance and professional reputation network built on Polkadot Hub EVM. It combines:

- **On-chain document verification** — Upload document hashes to the blockchain with KILT DID identity verification, creating tamper-proof records.
- **Immutable 75/20/5 revenue splitting** — Every marketplace transaction enforces a fixed split: 75% to the creator, 20% to the DocuMate treasury, 5% to the community staking pool. These ratios are hardcoded as Solidity constants and cannot be changed.
- **TEE-backed document classification** — A simulated Phala Phat Contract classifies documents into Gold, Silver, or Bronze reputation tiers based on digital signatures and document structure.
- **Proof of Contract standard** — Building toward verified freelancer CVs backed by on-chain contract history.

---

## Quick Navigation for Judges

| What | Path |
|------|------|
| **Solidity Contract** | [`contracts/DocuMate.sol`](./contracts/DocuMate.sol) |
| **Deploy Script (Track 2)** | [`scripts/deploy-track2.js`](./scripts/deploy-track2.js) |
| **TEE Validation API** | [`src/app/api/validate-document/route.ts`](./src/app/api/validate-document/route.ts) |
| **EVM Wallet Hook** | [`src/hooks/useEVMWallet.ts`](./src/hooks/useEVMWallet.ts) |
| **Contract Hook** | [`src/hooks/useDocuMateContract.ts`](./src/hooks/useDocuMateContract.ts) |
| **Contract ABI & Config** | [`src/config/DocuMateABI.ts`](./src/config/DocuMateABI.ts) |
| **Hackathon Winning Playbook** | [`HACKATHON_WINNING_PLAYBOOK.md`](./HACKATHON_WINNING_PLAYBOOK.md) |
| **Technical Summary (1 page)** | [`TECHNICAL_SUMMARY.md`](./TECHNICAL_SUMMARY.md) |
| **Current Architecture** | [`ARCHITECTURE_CURRENT.md`](./ARCHITECTURE_CURRENT.md) |
| **Demo Fallback Plan** | [`DEMO_FALLBACK.md`](./DEMO_FALLBACK.md) |
| **Dashboard** | `http://localhost:3000/dashboard` |

---

## Hackathon Alignment

This repository is structured for the Polkadot Solidity Hackathon and aims to score strongly on both delivery and technical depth:

- **Track 1 fit (EVM Smart Contracts):** Solidity-based application flows and marketplace mechanics on Polkadot Hub.
- **Track 2 fit (PVM + native functionality):** precompile integration patterns, staking/slashing, and runtime-aware contract architecture.
- **Production mindset:** testnet deployment, smoke tests, contract tests, and release checklist.

Execution details are maintained in [`HACKATHON_WINNING_PLAYBOOK.md`](./HACKATHON_WINNING_PLAYBOOK.md).

---

## Architecture

```
DocuMate.sol (Polkadot Hub EVM - Deployed)
    |
    |-- onlyVerified modifier (mocked KILT DID precompile)
    |-- uploadDocument()      -> stores document hash on-chain
    |-- executeTransaction()  -> 75/20/5 revenue split
    |       |-- 75% -> Creator
    |       |-- 20% -> DocuMate Treasury
    |       |-- 5%  -> Community Staking Pool
    |
Next.js Dashboard (/dashboard)
    |-- MetaMask wallet connection (auto-adds Polkadot Hub Testnet)
    |-- useEVMWallet (zustand store) -> wallet state management
    |-- useDocuMateContract (hook)   -> all contract interactions via ethers.js v6
    |-- TEE Validation API (/api/validate-document)
    |       |-- Simulates Phala Phat Contract
    |       |-- Classifies: Gold / Silver / Bronze
    |-- Prisma + SQLite (templates, users, purchases, breach reports)
```

---

## Deployed Contracts (Current Testnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| **Marketplace** | `0x233FE6112E5Ad4Db1c83358B30D581F837314BB1` | [Blockscout](https://blockscout-testnet.polkadot.io/address/0x233FE6112E5Ad4Db1c83358B30D581F837314BB1) |
| **Staking** | `0x1cf190eabe490B50AaBE91b4567ebe88126e8D24` | [Blockscout](https://blockscout-testnet.polkadot.io/address/0x1cf190eabe490B50AaBE91b4567ebe88126e8D24) |

| Field | Value |
|-------|-------|
| **Network** | Polkadot Hub TestNet |
| **Chain ID** | `420420417` |
| **RPC** | `https://eth-rpc-testnet.polkadot.io/` |

---

## Smart Contract: DocuMate.sol

### Key Functions

| Function | Access | Description |
|----------|--------|-------------|
| `mockKiltPrecompile(address)` | `onlyOwner` | Simulates KILT DID precompile verification |
| `revokeVerification(address)` | `onlyOwner` | Revoke a verified address |
| `uploadDocument(string)` | `onlyVerified` | Store a document IPFS hash on-chain |
| `executeTransaction(address)` | `onlyVerified`, `payable` | Execute a marketplace transaction with 75/20/5 split |
| `calculateSplit(uint256)` | `view` | Preview split amounts for a given total |
| `isVerified(address)` | `view` | Check if an address has verified identity |
| `getPlatformStats()` | `view` | Get total transactions and volume |
| `getDocument(uint256)` | `view` | Get document details by ID |
| `getUserDocuments(address)` | `view` | Get all document IDs for a user |

### Revenue Split (Immutable)

```
Total Payment
    |-- 75% -> Creator (content/service provider)
    |-- 20% -> DocuMate Treasury (platform revenue)
    |-- 5%  -> Community Staking Pool
```

These percentages are `uint8 public constant` values in the contract — they cannot be modified after deployment.

### KILT DID Precompile Note

The `onlyVerified` modifier currently checks an internal mapping populated by `mockKiltPrecompile()`. In production on Polkadot Hub, this is replaced by a native precompile call to the KILT identity pallet, enabling trustless DID verification without any centralized mapping.

---

## Features

### Profile & DID Verification (`/dashboard/profile`)
Create a KILT Light DID locally (stored in localStorage) and verify it on-chain via the smart contract. Shows verification badge, on-chain activity stats, and reputation score.

### DocuWriter (`/dashboard/documents/new`)
AI-assisted document creation from professional templates (NDA, Employment Contract, Service Agreement, Lease). Fill in party details and generate a complete document ready for signing.

### Document Signing (`/dashboard/documents/[id]`)
Review, edit, and finalize documents. On finalization, the document hash is uploaded to the blockchain via `uploadDocument()`, creating an immutable on-chain record with a transaction hash and block explorer link.

### DocuMarket (`/dashboard/market`)
A template marketplace where creators sell document templates. Purchases execute the on-chain `executeTransaction()` with the 75/20/5 revenue split. Pricing is in PAS (testnet native token).

### Template Studio (`/dashboard/studio`)
Create and publish document templates to the marketplace. Templates are stored in the database and available for purchase on DocuMarket.

### Filing Cabinet (`/dashboard/filing`)
Organize and browse all signed documents. Filter by status, search by name, and access document details.

### Admin Panel (`/admin`)
Admin-only interface (restricted to deployer wallet) for managing the verification queue and reviewing breach reports.

---

## Setup For Testnet

### Prerequisites

- **Node.js** >= 18
- **MetaMask** browser extension
- **PAS testnet tokens** from the [Polkadot Hub Testnet Faucet](https://faucet.polkadot.io/)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env` in project root:

```env
DATABASE_URL="file:./dev.db"
PRIVATE_KEY="0xYOUR_TESTNET_PRIVATE_KEY"
ADMIN_PRIVATE_KEY="0xYOUR_TESTNET_PRIVATE_KEY"
POLKADOT_HUB_RPC_URL="https://eth-rpc-testnet.polkadot.io/"
MARKETPLACE_CONTRACT_ADDRESS="0x233FE6112E5Ad4Db1c83358B30D581F837314BB1"
STAKING_CONTRACT_ADDRESS="0x1cf190eabe490B50AaBE91b4567ebe88126e8D24"
```

Variable purpose:

- `PRIVATE_KEY`: deployer/operator wallet for Hardhat scripts
- `ADMIN_PRIVATE_KEY`: signer used by admin breach API for on-chain slashing
- `MARKETPLACE_CONTRACT_ADDRESS`: deployed marketplace contract
- `STAKING_CONTRACT_ADDRESS`: deployed staking contract

### 3. Initialize database

```bash
npx prisma generate
npx prisma db push
```

### 4. Compile and run tests

```bash
npm run contracts:compile
npm run contracts:test
```

### 5. Optional: deploy fresh contracts to testnet

If you need your own deployment (new owner or fresh state):

```bash
node scripts/deploy-track2.js
```

After deployment, copy addresses into:

- `.env` (`MARKETPLACE_CONTRACT_ADDRESS`, `STAKING_CONTRACT_ADDRESS`)
- `src/config/DocuMateABI.ts`
- `src/config/DocuMateStakingABI.ts`

### 6. Run live testnet checks

Smoke test (deploy + tx flow):

```bash
node scripts/testnet-smoke-track2.js
```

Config check (read current deployed state from `.env`):

```bash
node scripts/testnet-config-check.js
```

### 7. Start the app

```bash
npm run dev
```

Open **http://localhost:3000/dashboard**.

---

## Production Readiness Guide

### 1. Environment and secrets

- Use a dedicated production deployer/admin wallet.
- Rotate any key that was ever committed or shared.
- Store production secrets in a secret manager (not `.env` in git).
- Keep `PRIVATE_KEY` and `ADMIN_PRIVATE_KEY` out of frontend hosting environments unless server routes must sign transactions.

### 2. Contract deployment strategy

- Deploy fresh marketplace and staking contracts for production.
- Record deployment metadata: contract addresses, chain ID, deployer, tx hashes, and block numbers.
- Update these files with production addresses:
    - `src/config/DocuMateABI.ts`
    - `src/config/DocuMateStakingABI.ts`

### 3. Verification and security controls

- Switch from mock verification to precompile/real verification mode before production usage.
- Ensure admin-only slashing endpoints are wallet-gated and audited.
- Add backend rate limiting and request validation for admin routes.
- Enable monitoring/alerting for failed slash transactions and verification failures.

### 4. App and database hosting

Frontend:

- Deploy Next.js app to Vercel (or equivalent).
- Set only required runtime env vars.

Database:

- Move from SQLite to managed Postgres/Turso for production reliability.
- Run schema migration before release.

### 5. Release checklist

Run before every release:

```bash
npm ci
npm run lint
npm run contracts:compile
npm run contracts:test
node scripts/testnet-config-check.js
```

Recommended post-deploy checks:

- Verify marketplace and staking ownership on-chain.
- Execute one real purchase and one stake flow on target network.
- Validate admin breach flow from API to on-chain `slashStake`.
- Confirm explorer links and dashboard reads are correct.

---

## TEE Validation (Phala Simulation)

**Endpoint:** `POST /api/validate-document`

Simulates a Phala Network Phat Contract executing inside a Trusted Execution Environment to validate document authenticity.

Current validator behavior:

- Parses PDF signature structures (`ByteRange`, `Contents`, `SubFilter`)
- Attempts PKCS#7/CMS verification using `node-forge`
- Rejects flat scans/image-only files for the high-trust tier
- Returns validation metadata with confidence and tier

| Tier | Classification | Trigger |
|------|---------------|---------|
| Gold (T1) | Cryptographically valid signature | Signature dictionary is present and PKCS#7/CMS verification succeeds |
| Silver (T2) | Structured but unverified signature context | Signature metadata detected, but full cryptographic verification not conclusive |
| Bronze (T3) | No trustworthy signature evidence | No usable signature structure or likely scan-only content |

Each response includes a mock TEE attestation hash, confidence score, and simulated Phala worker ID.

---

## 60-Second Demo Walkthrough

1. **(0-10s)** Open `http://localhost:3000/dashboard`. Show the sidebar with all sections: Profile, Documents, DocuWriter, DocuMarket, Template Studio, Filing Cabinet.

2. **(10-20s)** Click **Connect MetaMask**. MetaMask auto-switches to Polkadot Hub TestNet (Chain ID 420420417). Show the connected wallet address and "Polkadot Hub" chain indicator.

3. **(20-30s)** Go to **Profile**. Click **Verify DID on Polkadot Hub**. Show the green "Verified on Polkadot Hub" badge appear after the on-chain transaction confirms.

4. **(30-45s)** Go to **DocuWriter**. Select a template, fill in details, create the document. Open it, click **Sign & Finalize**. Show the transaction hash and block explorer link confirming the document hash is stored on-chain.

5. **(45-60s)** Go to **DocuMarket**. Purchase a template. Show the on-chain `executeTransaction` with the 75/20/5 split: 75% to the creator, 20% to DocuMate treasury, 5% to the community staking pool.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.24 (Polkadot Hub EVM) |
| Frontend | Next.js 15 (App Router, Turbopack) |
| Styling | TailwindCSS 3 |
| Wallet | MetaMask via ethers.js v6 |
| State Management | zustand 5 |
| Identity | KILT DID (mocked via precompile simulation) |
| TEE | Phala Phat Contract (mocked via API route) |
| Database | Prisma 7 + SQLite |
| Deployment | Hardhat |
| Language | TypeScript 5, Solidity |

---

## Project Structure

```
documate/
├── contracts/
│   └── DocuMate.sol              # Solidity smart contract
├── scripts/
│   ├── deploy-track2.js          # Deploy marketplace + staking
│   ├── testnet-smoke-track2.js   # Live smoke flow on testnet
│   └── testnet-config-check.js   # Validate configured addresses/state
├── src/
│   ├── app/
│   │   ├── admin/                # Admin panel (verification, breaches)
│   │   ├── api/
│   │   │   ├── admin/            # Admin API routes
│   │   │   ├── market/           # Marketplace API (mint, templates, purchase)
│   │   │   └── validate-document/# TEE validation API
│   │   ├── dashboard/
│   │   │   ├── documents/        # Document list, create, sign
│   │   │   ├── filing/           # Filing cabinet
│   │   │   ├── market/           # DocuMarket
│   │   │   ├── profile/          # Profile & DID verification
│   │   │   └── studio/           # Template studio
│   │   ├── globals.css
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   └── chain/
│   │       └── WalletConnect.tsx  # MetaMask wallet connection UI
│   ├── config/
│   │   └── DocuMateABI.ts        # Contract ABI, address, network config
│   └── hooks/
│       ├── useDocuMateContract.ts # Contract interaction hook
│       └── useEVMWallet.ts       # MetaMask wallet state (zustand)
├── prisma/
│   └── schema.prisma             # Database schema
├── hardhat.config.js             # Hardhat configuration
├── package.json
└── README.md
```

---

## License

MIT
