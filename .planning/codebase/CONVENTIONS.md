# Coding Conventions

**Analysis Date:** 2026-03-18

## Naming Patterns

**Files:**
- Route handlers use Next.js App Router naming with `route.ts` under API paths, e.g. `src/app/api/auth/challenge/route.ts`, `src/app/api/documents/route.ts`, `src/app/api/documents/[id]/route.ts`.
- UI pages use `page.tsx` and optional `layout.tsx`, e.g. `src/app/dashboard/documents/new/page.tsx`, `src/app/admin/layout.tsx`.
- React components use PascalCase file names, e.g. `src/components/document/DocumentEditor.tsx`, `src/components/chain/WalletConnect.tsx`.
- Hooks use `useXxx.ts` naming, e.g. `src/hooks/useWallet.ts`, `src/hooks/useEVMWallet.ts`, `src/hooks/useDocuMateContract.ts`.
- Type collections and barrel exports use `index.ts`, e.g. `src/types/index.ts`, `src/components/document/index.ts`, `src/config/index.ts`.

**Functions:**
- General functions use camelCase, e.g. `normalizeAddress`, `isValidEvmAddress`, `parsePayload` in `src/app/api/documents/route.ts`.
- API route exports use uppercase HTTP method names (`GET`, `POST`) in route files, e.g. `src/app/api/documents/route.ts`, `src/app/api/auth/challenge/route.ts`.
- React components use PascalCase function names, e.g. `DocumentEditor` in `src/components/document/DocumentEditor.tsx`, `NewDocumentPage` in `src/app/dashboard/documents/new/page.tsx`.

**Variables:**
- Local variables and state use camelCase (`receiverAddress`, `isGenerating`, `selectedTemplate`) in `src/app/dashboard/documents/new/page.tsx`.
- Immutable constants use SCREAMING_SNAKE_CASE for shared constants (`AUTH_CONFIG`, `FREE_TEMPLATES`, `PURCHASED_TEMPLATES_KEY`) in `src/lib/auth/siwp.ts` and `src/lib/document/templateService.ts`.
- Type aliases/interfaces use PascalCase (`DocumentTemplate`, `VerificationResult`, `WalletState`) in `src/types/index.ts` and `src/hooks/useWallet.ts`.

**Types:**
- Interface names are PascalCase and descriptive (`VerifiableCredential`, `TransactionResult`, `AuthSession`) in `src/types/index.ts` and `src/lib/auth/siwp.ts`.
- Union literal types are used for finite states (`DocumentStatus`, `TransactionStatus`, `NetworkId`) in `src/types/index.ts`.

## Code Style

**Formatting:**
- Primary style control is ESLint via `eslint.config.mjs` and script `npm run lint` in `package.json`.
- Semicolons are used consistently across TypeScript and JavaScript files, e.g. `src/app/api/documents/route.ts`, `src/hooks/useWallet.ts`, `scripts/testnet-smoke-track2.js`.
- String literals predominantly use double quotes.
- Existing code uses mixed indentation widths across files (2-space in `test/documate-track2.test.js`, 4-space in many TypeScript files such as `src/lib/auth/siwp.ts`). Preserve local file style when editing.

**Linting:**
- Lint base extends Next core-web-vitals (`eslint-config-next/core-web-vitals`) in `eslint.config.mjs`.
- Project-specific disabled rules include:
  - `@typescript-eslint/no-unused-expressions`
  - `react-hooks/set-state-in-effect`
  - `react-hooks/immutability`
  - `react-hooks/purity`
  - `import/no-anonymous-default-export`
- Ignore patterns include build/artifact folders (`.next/**`, `out/**`, `artifacts/**`, `cache/**`, `node_modules/**`) in `eslint.config.mjs`.

## Import Organization

**Order:**
1. Framework/runtime imports first (e.g. `next/server`, `react`, `next/navigation`) in `src/app/api/documents/route.ts` and `src/app/dashboard/documents/new/page.tsx`.
2. Internal alias imports next (`@/...`) in most app/library files.
3. `type` imports are usually separated with `import type`, e.g. `src/app/api/documents/route.ts`, `src/lib/document/templateService.ts`.

**Path Aliases:**
- `@/*` -> `./src/*` configured in `tsconfig.json`.
- Alias usage is standard for internal imports, e.g. `@/lib/db`, `@/types`, `@/hooks/useEVMWallet`.

## Error Handling

**Patterns:**
- Server handlers use `try/catch` with structured JSON errors and HTTP status codes via `NextResponse.json`, e.g. `src/app/api/documents/route.ts`, `src/app/api/auth/challenge/route.ts`.
- Input validation follows early returns for bad requests (400/404/429), e.g. address and chain checks in `src/app/api/auth/challenge/route.ts`.
- Client flows often degrade gracefully when non-critical sync fails (swallowed catch with comment), e.g. `handleCreate` in `src/app/dashboard/documents/new/page.tsx`.
- Utility helpers return nullable or boolean results instead of throwing for expected parse/validation failures, e.g. `parsePayload` in `src/app/api/documents/route.ts`, `verifyChallengeExpiry` in `src/lib/auth/siwp.ts`.

## Logging

**Framework:** console

**Patterns:**
- API and scripts use `console.error` in catch blocks and `console.log` for operational steps.
- Representative files: `src/app/api/documents/route.ts`, `src/app/api/auth/challenge/route.ts`, `scripts/testnet-smoke-track2.js`, `scripts/demo-fallback-check.js`.
- No dedicated logging abstraction or observability SDK detected.

## Comments

**When to Comment:**
- Multi-line section banners and purpose comments are common in complex files, e.g. `src/lib/auth/siwp.ts`, `src/hooks/useWallet.ts`, `src/lib/document/templateService.ts`.
- Inline comments are used to explain intent for non-obvious logic or constraints (SSR dynamic import, production TODOs, fallback behavior).

**JSDoc/TSDoc:**
- Function-level docblocks are used frequently in utility/service modules, e.g. `generateChallenge` and `verifySignedChallenge` in `src/lib/auth/siwp.ts`, parser helpers in `src/components/document/DocumentEditor.tsx`.
- React page/component files rely more on brief header comments than full API docblocks.

## Function Design

**Size:**
- API route handlers tend to keep transport logic and validation in a single function (`GET`/`POST`) and extract small helpers nearby, e.g. `src/app/api/documents/route.ts`.
- Some UI modules contain larger in-file helper logic (text formalization and preview workflow) in `src/app/dashboard/documents/new/page.tsx`.

**Parameters:**
- Typed object parameters are common in utility modules and hooks (`config` objects, typed payloads), e.g. `withRateLimit` in `src/lib/security/rateLimit.ts`.
- Next route handlers use typed `NextRequest` and typed `context.params` objects, e.g. `src/app/api/documents/[id]/route.ts`.

**Return Values:**
- API endpoints return `NextResponse` JSON envelopes with predictable keys (`success`, `data`, `error`) in most routes.
- Utility functions often return domain types plus nullable fallback (`DocumentInstance | null`, `NextResponse | null`).

## Module Design

**Exports:**
- Predominantly named exports for hooks/services/utils (`export function`, `export const`).
- Default exports are used mainly for Next page components and some components (`export default function NewDocumentPage`, `export default DocumentEditor`).

**Barrel Files:**
- Barrel export pattern is actively used for module boundaries:
  - `src/components/document/index.ts`
  - `src/components/chain/index.ts`
  - `src/lib/auth/index.ts`
  - `src/config/index.ts`

---

*Convention analysis: 2026-03-18*
