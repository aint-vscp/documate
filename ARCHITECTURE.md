# DocuMate Architecture & Implementation Plan

## 📁 Project Folder Structure

```
documate/
├── .env.local                    # Environment variables
├── .env.example                  # Template for env vars
├── next.config.mjs
├── package.json
├── tailwind.config.ts
├── tsconfig.json
│
├── contracts/                    # Smart Contracts (Ink!/Solidity)
│   ├── marketplace/
│   │   ├── Cargo.toml
│   │   └── lib.rs               # The 75/20/5 Split Logic
│   ├── subscription/
│   │   └── lib.rs               # SaaS Subscription NFT
│   └── scripts/
│       ├── deploy.ts            # Deployment scripts
│       └── test.ts              # Contract tests
│
├── indexer/                      # Blockchain Indexer (SubQuery/Squid)
│   ├── schema.graphql           # POC-1 Data Schema
│   ├── src/
│   │   ├── mappings/
│   │   │   ├── handlePOC.ts     # Proof of Contract listener
│   │   │   └── handleSale.ts    # Marketplace sale listener
│   │   └── index.ts
│   └── project.yaml
│
├── public/
│   ├── icons/
│   └── templates/               # Default template previews
│
├── src/
│   ├── app/                     # Next.js 15 App Router
│   │   ├── globals.css
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Landing page
│   │   │
│   │   ├── api/                 # API Routes (The Hub)
│   │   │   ├── auth/
│   │   │   │   └── [...siwe]/route.ts    # Sign-In with Wallet
│   │   │   ├── documents/
│   │   │   │   └── generate/route.ts     # AI document generation
│   │   │   ├── marketplace/
│   │   │   │   ├── list/route.ts         # List template for sale
│   │   │   │   ├── buy/route.ts          # Purchase flow
│   │   │   │   └── verify/route.ts       # Admin verification
│   │   │   ├── phala-proxy/
│   │   │   │   └── route.ts              # TEE bridge
│   │   │   ├── reputation/
│   │   │   │   └── [id]/route.ts         # Fetch user reputation
│   │   │   ├── subscription/
│   │   │   │   ├── check/route.ts        # Verify subscription
│   │   │   │   └── webhook/route.ts      # Payment webhook
│   │   │   └── ipfs/
│   │   │       ├── upload/route.ts       # Upload encrypted content
│   │   │       └── decrypt/route.ts      # Decrypt for NFT owners
│   │   │
│   │   ├── dashboard/           # Authenticated User Area
│   │   │   ├── layout.tsx       # Dashboard shell with sidebar
│   │   │   ├── profile/
│   │   │   │   └── page.tsx     # DID + Reputation display
│   │   │   ├── documents/
│   │   │   │   ├── page.tsx     # User's documents list
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── filing/
│   │   │   │   └── page.tsx     # DocuWriter (AI Drafting)
│   │   │   ├── market/
│   │   │   │   └── page.tsx     # Browse marketplace
│   │   │   └── studio/
│   │   │       ├── page.tsx     # Creator dashboard
│   │   │       ├── create/page.tsx        # Mint new template
│   │   │       └── earnings/page.tsx      # Revenue analytics
│   │   │
│   │   ├── market/              # Public Marketplace
│   │   │   ├── page.tsx         # Browse all templates
│   │   │   └── [id]/page.tsx    # Template detail page
│   │   │
│   │   └── admin/               # Admin Panel (Protected)
│   │       ├── layout.tsx
│   │       ├── page.tsx         # Dashboard overview
│   │       ├── verification/
│   │       │   └── page.tsx     # Blue Check queue
│   │       ├── breaches/
│   │       │   └── page.tsx     # Breach reports
│   │       └── analytics/
│   │           └── page.tsx     # Platform metrics
│   │
│   ├── components/
│   │   ├── ui/                  # Base UI Components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Toast.tsx
│   │   │
│   │   ├── chain/               # Blockchain Components
│   │   │   ├── WalletConnect.tsx
│   │   │   ├── DidBadge.tsx
│   │   │   ├── CVCards.tsx      # Reputation cards
│   │   │   ├── TransactionStatus.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── document/            # Document Components
│   │   │   ├── DocumentEditor.tsx
│   │   │   ├── SignaturePanel.tsx
│   │   │   ├── TemplateGallery.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── market/              # Marketplace Components
│   │   │   ├── TemplateCard.tsx
│   │   │   ├── PriceDisplay.tsx
│   │   │   ├── RevenueSplit.tsx # Shows 75/20/5 breakdown
│   │   │   ├── BuyButton.tsx
│   │   │   ├── VerifiedBadge.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── studio/              # Creator Studio Components
│   │   │   ├── TemplateBuilder.tsx
│   │   │   ├── PlaceholderEditor.tsx
│   │   │   ├── PricingForm.tsx
│   │   │   ├── EarningsChart.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── ai/                  # AI/DocuWriter Components
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── PromptInput.tsx
│   │   │   ├── TEEStatusBadge.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── admin/               # Admin Components
│   │       ├── VerificationQueue.tsx
│   │       ├── BreachReport.tsx
│   │       ├── RevenueChart.tsx
│   │       └── index.ts
│   │
│   ├── hooks/
│   │   ├── useWallet.ts         # Wallet state (Zustand)
│   │   ├── useSubscription.ts   # SaaS tier checking
│   │   ├── useReputation.ts     # Fetch user reputation
│   │   ├── useMarketplace.ts    # Marketplace actions
│   │   ├── useTEE.ts            # Phala TEE interactions
│   │   └── useAdmin.ts          # Admin actions
│   │
│   ├── lib/
│   │   ├── polkadot/            # Polkadot SDK Wrappers
│   │   │   ├── assetHub.ts      # Asset Hub connection
│   │   │   ├── kilt.ts          # KILT DID operations
│   │   │   ├── phala.ts         # Phala TEE bridge
│   │   │   └── index.ts
│   │   │
│   │   ├── contracts/           # Contract ABIs & Calls
│   │   │   ├── marketplace.ts   # Marketplace contract calls
│   │   │   ├── subscription.ts  # Subscription contract calls
│   │   │   └── index.ts
│   │   │
│   │   ├── document/            # Document Services
│   │   │   ├── templateService.ts
│   │   │   ├── documentStore.ts
│   │   │   ├── signatureService.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── storage/             # IPFS/Crust Integration
│   │   │   ├── ipfs.ts          # IPFS upload/download
│   │   │   ├── encryption.ts    # Client-side encryption
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/                # Authentication
│   │   │   ├── session.ts       # Session management
│   │   │   └── middleware.ts    # Route protection
│   │   │
│   │   └── utils/
│   │       ├── format.ts        # Address formatting
│   │       ├── constants.ts     # Chain constants, addresses
│   │       └── index.ts
│   │
│   ├── types/
│   │   ├── index.ts             # Core type definitions
│   │   ├── contracts.ts         # Contract types
│   │   └── api.ts               # API request/response types
│   │
│   └── config/
│       ├── chains.ts            # Network configurations
│       ├── contracts.ts         # Deployed contract addresses
│       └── features.ts          # Feature flags
│
├── prisma/                      # Database (Off-chain)
│   ├── schema.prisma            # User settings, admin logs
│   └── migrations/
│
└── information/                 # Documentation
    ├── prd.md
    ├── businessmodel.md
    ├── ddoc.md
    └── wdoc.md
```

---

## 🚀 Phased Implementation Strategy

### PHASE 1: THE FOUNDATION (Weeks 1-4)
**Goal:** Launch the Marketplace with the 75/20/5 revenue split.

| Week | Deliverable | Priority |
|------|-------------|----------|
| 1 | Smart Contract: `DocuMarketplace.ink!` with split logic | 🔴 Critical |
| 1 | Deploy to Westend Asset Hub (Testnet) | 🔴 Critical |
| 2 | IPFS Integration: Encrypted template upload | 🔴 Critical |
| 2 | Frontend: Template listing page (`/market`) | 🟡 High |
| 3 | Frontend: Creator Studio (`/dashboard/studio`) | 🟡 High |
| 3 | Frontend: Buy flow with wallet signing | 🟡 High |
| 4 | Testing: End-to-end purchase flow | 🔴 Critical |
| 4 | Revenue Dashboard for Creators | 🟢 Medium |

### PHASE 2: THE TRUST LAYER (Weeks 5-8)
**Goal:** Implement Identity & Reputation.

| Week | Deliverable | Priority |
|------|-------------|----------|
| 5 | KILT Light DID creation flow | 🔴 Critical |
| 5 | Profile page with DID display | 🟡 High |
| 6 | POC-1 Indexer: Listen for payment memos | 🔴 Critical |
| 6 | Dynamic Tag Assignment logic | 🟡 High |
| 7 | Admin Dashboard: Verification Queue | 🟡 High |
| 7 | "Blue Check" credential issuance (KILT) | 🟡 High |
| 8 | Breach Reporting system | 🟢 Medium |
| 8 | Reputation caching & display | 🟢 Medium |

### PHASE 3: THE SAAS ENGINE (Weeks 9-12)
**Goal:** Launch the Privacy-First AI (DocuWriter).

| Week | Deliverable | Priority |
|------|-------------|----------|
| 9 | Phala Phat Contract deployment | 🔴 Critical |
| 9 | Client-side encryption for prompts | 🔴 Critical |
| 10 | Subscription NFT contract | 🟡 High |
| 10 | Subscription check middleware | 🟡 High |
| 11 | DocuWriter UI (Split-screen chat + editor) | 🟡 High |
| 11 | Template auto-fill from DID | 🟢 Medium |
| 12 | Rate limiting for Free tier | 🟢 Medium |
| 12 | Power User upgrade flow | 🟢 Medium |

### PHASE 4: POLISH & LAUNCH (Weeks 13-16)
**Goal:** Production readiness.

| Week | Deliverable | Priority |
|------|-------------|----------|
| 13 | Security audit (Smart Contracts) | 🔴 Critical |
| 13 | UI/UX polish (Animations, loading states) | 🟡 High |
| 14 | Mainnet deployment preparation | 🔴 Critical |
| 14 | Documentation & Help Center | 🟢 Medium |
| 15 | Beta testing with select creators | 🟡 High |
| 15 | Analytics integration | 🟢 Medium |
| 16 | Public launch | 🔴 Critical |
| 16 | Marketing site updates | 🟢 Medium |

---

## 🔐 Key Contract Addresses (To Be Deployed)

```typescript
// config/contracts.ts
export const CONTRACTS = {
  // Testnet (Westend Asset Hub)
  testnet: {
    marketplace: "5G...",      // DocuMarketplace contract
    subscription: "5H...",     // Subscription NFT contract
    treasury: "5F...",         // Company treasury wallet
    burn: "0x000...000",       // Burn address
  },
  // Mainnet (Polkadot Asset Hub)
  mainnet: {
    marketplace: "",
    subscription: "",
    treasury: "",
    burn: "0x000...000",
  }
};

// The Iron Rules - NEVER CHANGE THESE
export const REVENUE_SPLIT = {
  CREATOR: 75,    // 75% to creator
  COMPANY: 20,    // 20% to treasury
  BURN: 5,        // 5% burned
} as const;
```
