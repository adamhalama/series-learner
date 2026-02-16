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

