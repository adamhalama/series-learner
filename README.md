# Series Learner Tracker

Mobile-first web app for tracking TV series/movie watch time by language with a learning-language budget rule.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Convex
- Bun

## Local Development

1. Install dependencies:
```bash
bun install
```

2. Start local Convex and Next dev servers together:
```bash
bun run dev
```

3. Open the app:
- App: [http://localhost:3000](http://localhost:3000)
- Convex dashboard (local): [http://127.0.0.1:6790](http://127.0.0.1:6790)

## Scripts
- `bun run dev` - run Next + Convex local runtime
- `bun run dev:web` - run Next only
- `bun run dev:convex` - run Convex only
- `bun run lint` - lint project
- `bun run typecheck` - type-check project
- `bun run test` - run tests once
- `bun run test:watch` - run tests in watch mode

## Product Rules Implemented
- Track `series` and `movies`
- One active learning language
- Non-learning budget compared against learning language (all-time cumulative)
- Soft enforcement: over-budget is allowed, but debt and warnings are shown
- First log requires minutes if none exist; later logs auto-fill previous minutes and remain editable

## Deployment Path
- Local-first now using local Convex
- Keep env-based Convex config (`NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`) so switching to hosted Convex later is straightforward
