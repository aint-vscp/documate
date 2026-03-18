# Coding Conventions

**Analysis Date:** 2026-03-18

## Naming Patterns

**Files:**
- React route files follow Next App Router naming: `page.tsx`, `layout.tsx`, `route.ts` in `src/app/**`.
- React component files use PascalCase filenames: `src/components/document/DocumentEditor.tsx`, `src/components/chain/WalletConnect.tsx`.
- Hooks use `use*` camelCase filenames: `src/hooks/useEVMWallet.ts`, `src/hooks/useWallet.ts`.
- Utility/service files use lower camelCase names by domain: `src/lib/document/templateService.ts`, `src/lib/security/rateLimit.ts`.
- Barrel exports use `index.ts`: `src/components/chain/index.ts`, `src/lib/document/index.ts`.

**Functions:**
- Exported functions use camelCase: `withRateLimit`, `verifySignedChallenge`, `renderTemplate`.
- API route handlers are uppercase HTTP verbs as required by Next (`GET`, `POST`) in `src/app/api/**/route.ts`.
- Internal helpers stay camelCase and near usage (`normalizeAddress`, `escapeSqlString`, `switchToPolkadotHub`).

**Variables:**
- Local/state variables use camelCase (`selectedTemplate`, `placeholderValues`, `isConnecting`).
- Constants use UPPER_SNAKE_CASE (`AUTH_CONFIG`, `FREE_TEMPLATES`, `REVENUE_SPLIT`).
- Literal union types are used for controlled states (`type Step = "select" | "fill" | "preview"` in `src/app/dashboard/documents/new/page.tsx`).

**Types:**
- Interfaces and type aliases use PascalCase (`DocumentTemplate`, `AuthSession`, `TransactionStatus`) in `src/types/index.ts`.
- State interfaces are colocated with stores (`EVMWalletState` in `src/hooks/useEVMWallet.ts`).

## Code Style

**Formatting:**
- No dedicated Prettier/Biome config detected (`.prettierrc*` and `biome.json` not present).
- Style is governed by TypeScript + ESLint + existing code style.
- Semicolons are consistently present across TS/JS files.
- Indentation is mostly 4 spaces in app/lib TS files and 2 spaces in Hardhat tests/scripts (`test/documate-track2.test.js`, `scripts/*.js`).

**Linting:**
- Primary config: `eslint.config.mjs` using `eslint-config-next/core-web-vitals`.
- Legacy config also present: `.eslintrc.json` with `next/core-web-vitals` + `next/typescript`.
- Lint command: `npm run lint` → `eslint . --ext .ts,.tsx,.js,.mjs --quiet --report-unused-disable-directives-severity off` from `package.json`.
- Notable disabled rules in `eslint.config.mjs`:
  - `@typescript-eslint/no-unused-expressions`
  - `react-hooks/set-state-in-effect`
  - `react-hooks/immutability`
  - `react-hooks/purity`
  - `import/no-anonymous-default-export`

## Import Organization

**Order:**
1. Framework/runtime imports first (`next/server`, `react`, `zustand`, `ethers`).
2. Internal alias imports second (`@/lib/*`, `@/hooks/*`, `@/types`).
3. Type-only imports where appropriate (`import type { DocumentTemplate } from "@/types"`).

**Path Aliases:**
- Use `@/*` → `./src/*` from `tsconfig.json`.
- Convention: prefer alias imports for internal modules in app code (`src/app/api/documents/route.ts`, `src/app/dashboard/documents/new/page.tsx`).

## Error Handling

**Patterns:**
- API routes consistently wrap logic in `try/catch` and return JSON errors with HTTP status:
  - `src/app/api/documents/route.ts`
  - `src/app/api/auth/verify/route.ts`
  - `src/app/api/market/mint/route.ts`
- Input validation is explicit and early-return based (address regex, required fields, tx-hash checks).
- Client hooks convert unknown errors to user-facing messages (`mapProviderError` in `src/hooks/useEVMWallet.ts`).
- Graceful fallback pattern is common: return empty arrays/null on parse failures (`src/lib/document/templateService.ts`).

## Logging

**Framework:** console

**Patterns:**
- Server/API logging uses `console.error("<Context>:", error)` before returning sanitized client errors.
- Operational scripts use `console.log` for stage-by-stage progress and `console.error` in top-level catch:
  - `scripts/testnet-smoke-track2.js`
  - `scripts/demo-fallback-check.js`

## Comments

**When to Comment:**
- Section-divider comments (`// ============================================================`) are used heavily in hooks/services for navigability.
- JSDoc blocks document public functions and workflow intent in library files (`src/lib/auth/siwp.ts`, `src/lib/contracts/marketplace.ts`).
- API files often include endpoint-level header comments describing route purpose.

**JSDoc/TSDoc:**
- Present and meaningful in domain/service modules (`src/lib/auth/siwp.ts`, `src/lib/contracts/marketplace.ts`, `src/lib/document/templateService.ts`).
- Less prevalent in page components where intent is encoded through JSX structure and names.

## Function Design

**Size:**
- Utility/service functions are typically small-to-medium and single-purpose.
- UI page files can be large and orchestration-heavy (`src/app/dashboard/filing/page.tsx`, `src/app/dashboard/documents/new/page.tsx`).

**Parameters:**
- Object parameters are preferred for multi-argument domain operations (`verifySignedChallenge`, `createSignInMessage`).
- Primitive positional args are common in helper utilities (`escapeSqlString(value: string)`).

**Return Values:**
- APIs return structured JSON envelopes with `success` + `data`/`error` patterns in many routes.
- Domain functions frequently return typed discriminated shapes (`{ ok: boolean; error?: string }`, `{ valid: boolean; missing: string[] }`).

## Module Design

**Exports:**
- Mixed strategy:
  - Named exports for utilities/hooks (`src/lib/security/rateLimit.ts`, `src/hooks/useWallet.ts`).
  - Default exports mainly for Next pages/components (`src/app/**/page.tsx`, `src/components/document/DocumentEditor.tsx`).
- Constants and interfaces are frequently exported for reuse (`src/types/index.ts`, `src/lib/contracts/marketplace.ts`).

**Barrel Files:**
- Barrel files are actively used to simplify imports:
  - `src/components/chain/index.ts`
  - `src/components/document/index.ts`
  - `src/lib/document/index.ts`
- Convention: keep barrel files thin and re-export only; no business logic inside.

---

*Convention analysis: 2026-03-18*
