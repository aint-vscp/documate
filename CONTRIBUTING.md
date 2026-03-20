# Contributing

## Development setup

1. Install dependencies: `npm install`
2. Create `.env` from `.env.example`
3. Generate Prisma client: `npx prisma generate`
4. Start dev server: `npm run dev`

## Branch and PR workflow

1. Create a feature branch from `main`
2. Keep PRs focused and small when possible
3. Include tests or validation notes for behavior changes
4. Use the PR template checklist before requesting review

## Required checks before merge

- `npm run lint`
- `npm run build`
- `npx hardhat test`
- `npm audit --omit=dev`

## Security

- Never commit `.env` or private keys
- Use environment variables for secrets
- Report vulnerabilities privately to maintainers
