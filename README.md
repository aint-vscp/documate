# DocuMate

A decentralized document management and marketplace platform built on the Polkadot ecosystem. DocuMate lets professionals create, sign, sell, and verify document templates as NFTs, with self-sovereign identity via KILT Protocol and privacy-first AI drafting through Phala Network's Trusted Execution Environment.

## What It Does

- **Document Studio** - Create and mint professional document templates (legal, creative, engineering) as NFTs on Asset Hub
- **Template Marketplace** - Buy and sell verified templates with an immutable 75/20/5 revenue split (Creator / Treasury / Burn)
- **Decentralized Identity** - Self-sovereign professional identity and credentials via KILT Protocol DIDs
- **Proof-of-Contract CV** - On-chain reputation built from verified transactions, queryable by anyone
- **Privacy-First AI** - AI-assisted document drafting inside Phala TEE so your data never leaves the enclave
- **Breach Reporting** - Community-driven accountability with admin-verified breach reports and reputation tagging
- **Admin Panel** - Full admin dashboard for user management, template verification, breach investigation, and audit logs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router, Turbopack), React 19, Tailwind CSS |
| Database | SQLite via Prisma 7 + libSQL adapter |
| Identity | KILT Protocol (DID, Verifiable Credentials) |
| NFTs | Polkadot Asset Hub (template minting, ownership) |
| Privacy AI | Phala Network TEE |
| Smart Contracts | ink! (Rust) - Marketplace contract |
| State Management | Zustand |
| Wallets | Polkadot.js extension |

## Architecture

```
src/
  app/              # Next.js App Router pages & API routes
    api/            # REST endpoints (admin, market, breaches, auth, etc.)
    admin/          # Admin panel (stats, verification, breaches, users, templates, logs)
    dashboard/      # User dashboard (documents, studio, market, profile, filing)
  components/       # React components (chain, document, market)
  config/           # Chain configs, constants, contract addresses
  hooks/            # React hooks (useWallet)
  lib/              # Core libraries
    auth/           # SIWP (Sign-In With Polkadot)
    contracts/      # Marketplace contract service
    db/             # Prisma client (libSQL adapter)
    document/       # Document store, signatures, templates
    indexer/        # On-chain event indexer
    polkadot/       # Asset Hub, KILT, Phala integrations
    reputation/     # Reputation scoring & tagging
  types/            # TypeScript interfaces
contracts/          # ink! smart contracts (marketplace)
prisma/             # Database schema & migrations
```

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- A Polkadot-compatible browser wallet ([Polkadot.js extension](https://polkadot.js.org/extension/), [Talisman](https://www.talisman.xyz/), or [SubWallet](https://www.subwallet.app/))
- (Optional) [Rust + cargo-contract](https://use.ink/getting-started/setup) for ink! contract development

## Local Development Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/documate.git
cd documate
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
# Database - SQLite (local file)
DATABASE_URL="file:./dev.db"

# Optional: Phala TEE proxy endpoint
# PHALA_TEE_ENDPOINT="https://your-phala-endpoint.example"
```

### 3. Initialize the database

```bash
npx prisma generate
npx prisma db push
```

This creates the SQLite database (`dev.db`) and generates the Prisma client with all models (User, Template, Purchase, BreachReport, ReputationTag, AdminLog, etc.).

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app uses Turbopack for fast HMR.

### 5. Connect a wallet

Install a Polkadot wallet extension, create or import an account on Westend (testnet), and connect it through the app. You can get testnet WND tokens from the [Westend faucet](https://faucet.polkadot.io/westend).

## Production Deployment

### 1. Environment variables

Set these in your hosting provider:

```env
# Required
DATABASE_URL="file:./prod.db"          # Or a remote libSQL/Turso URL
NODE_ENV="production"

# Optional - contract addresses (fill after deploying contracts)
# See src/config/contracts.ts
```

For a remote database (recommended for production), use [Turso](https://turso.tech/):

```env
DATABASE_URL="libsql://your-db-name.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"
```

Then update `src/lib/db/index.ts` to pass the auth token:

```typescript
const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});
```

### 2. Build

```bash
npm run build
```

This compiles all pages and API routes, runs TypeScript type checking and ESLint, and outputs to `.next/`.

### 3. Start

```bash
npm start
```

Runs the production server on port 3000 (override with `PORT` env var).

### 4. Deploy to Vercel (recommended)

```bash
npx vercel --prod
```

Or connect the GitHub repo to [Vercel](https://vercel.com) for automatic deployments on push. Set environment variables in the Vercel dashboard.

### 5. Deploy smart contracts (optional)

The ink! marketplace contract lives in `contracts/marketplace/`. To deploy:

```bash
cd contracts/marketplace
cargo contract build --release
cargo contract upload --suri "//Alice" --url wss://westend-asset-hub-rpc.polkadot.io
cargo contract instantiate --suri "//Alice" --constructor new --args "TREASURY_ADDRESS" --url wss://westend-asset-hub-rpc.polkadot.io
```

After deployment, update the contract address in `src/config/contracts.ts`.

## Testing

### Type checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

### Full build verification

```bash
npm run build
```

This is the most comprehensive check - it compiles all pages, runs type checking, lints, and verifies all API routes can be statically analyzed. Exit code 0 means everything passes.

### Manual testing checklist

**Wallet & Identity:**
1. Connect a Polkadot wallet at any dashboard page
2. Navigate to `/dashboard/profile` and create a DID (KILT identity)
3. Verify the DID badge appears and credentials display correctly

**Marketplace:**
1. Go to `/dashboard/studio` to create and mint a template
2. Visit `/dashboard/market` to browse templates
3. Purchase a template and verify the 75/20/5 revenue split in the confirmation

**Breach Reporting:**
1. On `/dashboard/profile`, click "Report Breach"
2. Fill in a target wallet address, select a reason, add description
3. Submit and verify the report appears in `/admin/breaches`

**Admin Panel** (requires `isAdmin: true` on User record):
1. `/admin` - Dashboard with aggregate stats
2. `/admin/verification` - Approve/reject template verification requests
3. `/admin/breaches` - Investigate, confirm, or dismiss breach reports
4. `/admin/users` - Search and view all registered users
5. `/admin/templates` - Browse and filter all templates
6. `/admin/logs` - View admin action audit trail

To make a user admin, update the database directly:

```bash
npx prisma studio
```

Then set `isAdmin = true` on the target user record.

### API routes reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/challenge` | GET | Get SIWP auth challenge |
| `/api/auth/verify` | POST | Verify signed challenge |
| `/api/market/templates` | GET | List templates (filters: category, search, verified) |
| `/api/market/mint` | POST | Mint a new template NFT |
| `/api/market/purchase` | POST | Purchase a template |
| `/api/verification/submit` | POST | Submit template for verification |
| `/api/breaches/report` | POST | Report a breach of contract |
| `/api/reputation/:id` | GET | Get user reputation profile |
| `/api/documents/generate` | POST | Generate document via AI |
| `/api/phala-proxy` | POST | Proxy to Phala TEE |
| `/api/admin/stats` | GET | Admin dashboard statistics |
| `/api/admin/verification` | GET/POST | Manage verification requests |
| `/api/admin/breaches` | GET/POST | Manage breach reports |
| `/api/admin/users` | GET | List/search users |
| `/api/admin/templates` | GET | List/filter templates |
| `/api/admin/logs` | GET | Admin audit log |

## Revenue Model

Every template sale enforces an immutable split, mirrored in both the ink! smart contract and the application code:

| Recipient | Share | Purpose |
|-----------|-------|---------|
| Creator | 75% | Paid to the template author |
| Treasury | 20% | DocuMate platform revenue |
| Burn | 5% | Token deflation mechanism |

## License

Private - All rights reserved.
