# Series Learner Tracker
*For very serious language learners 😝*

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
- `bun run build:vercel` - deploy Convex and build Next in one step (used by Vercel)
- `bun run lint` - lint project
- `bun run typecheck` - type-check project
- `bun run test` - run tests once
- `bun run test:watch` - run tests in watch mode
- `bun run deploy:convex` - deploy Convex functions/data model
- `bun run deploy:vercel` - create a production Vercel deployment

## Product Rules Implemented
- Track `series` and `movies`
- One active learning language
- Non-learning budget compared against learning language (all-time cumulative)
- Soft enforcement: over-budget is allowed, but debt and warnings are shown
- First log requires minutes if none exist; later logs auto-fill previous minutes and remain editable

## Deployment (Vercel + Convex Cloud)

### 1. Login with CLIs
```bash
bunx convex login
bunx vercel login
```

### 2. Link this folder to a Vercel project
```bash
bunx vercel link
```

### 3. Add Convex deploy key to Vercel (sensitive env var)
Create a production deploy key in Convex Dashboard:
- Deployment settings -> Deploy keys

Then add it to Vercel:
```bash
bunx vercel env add CONVEX_DEPLOY_KEY production --sensitive
```

### 4. (Optional) Add lightweight app gate password
Generate random values locally:
```bash
openssl rand -base64 24 | tr -d '\n' | tr '/+' '_-' | cut -c1-32
openssl rand -hex 32
```

Add them to your local `.env.local`:
```bash
APP_GATE_PASSWORD=<random-password>
APP_GATE_SECRET=<random-secret>
```

Add same values to Vercel as sensitive production env vars:
```bash
bunx vercel env add APP_GATE_PASSWORD production --sensitive
bunx vercel env add APP_GATE_SECRET production --sensitive
```

### 5. Deploy
```bash
bunx vercel --prod
```

`vercel.json` is configured so Vercel runs:
- `bun install --frozen-lockfile`
- `bun run build:vercel`

That `build:vercel` step runs:
- `convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd "next build"`

So `NEXT_PUBLIC_CONVEX_URL` is injected at build time automatically and points your frontend at hosted Convex.

## Security Notes
- TLS: production traffic is HTTPS on Vercel; `NEXT_PUBLIC_CONVEX_URL` is enforced to HTTPS in production code.
- Secrets: keep `CONVEX_DEPLOY_KEY` only in Vercel env vars; never put secrets in URLs.
- App gate uses an `HttpOnly` session cookie signed with HMAC and validated in middleware.
- Current gap: app writes are still public (no app auth yet). Anyone who can use the site can mutate data.
- Interim mitigation without app login: enable Vercel Deployment Protection (Vercel Authentication or Password Protection) so only you can access the deployment.
- Recommended next hardening: add app-level authentication before sharing publicly.

## License
MIT. See [LICENSE](./LICENSE).



## TODOs
- [ ] add books sections - to each book have a checkmark something like "adding to allowance" meaning that it will also count as "learning"
- [ ] Switch back to WebSockets mode, figure out what was wrong
- [ ] 
