# AGENTS.md — Working Effectively In This Repo

This is an app that tracks the watchtime of series, and what language they were watched, to promote watching in languages the user wants to learn.

## Safety Expectations (Call These Out Explicitly)

For any new or modified code, enforce:
- Encrypted transport (TLS). No plaintext TCP.
- Secrets never go in URLs. Use header-based auth (e.g., Authorization).
- State changes must have an idempotency/concurrency strategy.
- Never log full URLs or any secrets (redact tokens).

If you encounter a violation in the repo or in a proposed change, explicitly call it out and propose a safer alternative.
Do not quietly change security-sensitive behavior. Call it out.


## A Note To The Agent

We are building this together. When you learn something non-obvious, add it here so future changes go faster.

## Learned Notes

- For LAN testing from a phone, `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210` breaks writes because phone loopback is not the dev machine. Use the machine hostname/IP (or client-side rewrite) for Convex URL resolution.
- For production deploys, `NEXT_PUBLIC_CONVEX_URL` must be HTTPS and should be injected by `convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd "next build"`.
- Lightweight app gate is implemented with middleware + signed HttpOnly cookie using `APP_GATE_PASSWORD` and `APP_GATE_SECRET`.
- Running `convex dev --local` rewrites local Convex env values in `.env.local`; if you want local Next.js to hit cloud Convex, run web-only (`next dev`) with cloud `NEXT_PUBLIC_CONVEX_URL` configured.
- If Convex WebSocket is unstable, mutations can still succeed via HTTP fallback while `useQuery` data remains stale; prefer HTTP snapshot data when disconnected and poll snapshots to keep UI consistent.
- App now supports HTTP-only Convex mode in `src/app/page.tsx` (queries + mutations over `/api/query` and `/api/mutation`), eliminating WebSocket dependence for dashboard behavior.
