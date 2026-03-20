# Changelog

All notable changes to this project are documented in this file.

## 2026-03-20

### Added
- Runtime contract address override with `NEXT_PUBLIC_DOCUMATE_CONTRACT_ADDRESS`.
- KILT status endpoint for UI fallback and operational visibility.
- Manual wallet verification script via `npm run verify:wallet`.
- Community repository scaffolding (issue templates, PR template, CI workflow).

### Changed
- Production-first documentation set in `README.md`, `docs/DEMO.md`, and `docs/FAQ.md`.
- Vercel-ready build and Prisma configuration for serverless deployment.
- Remotion composition naming updated for product branding.
- Landing page and closing scenes rewritten to remove event-specific framing.

### Security
- Added stronger contract capability checks before write calls.
- Confirmed `.env` remains untracked and required runtime secrets are documented.
