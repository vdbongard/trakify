# Implementing the bulk-progress-sync tickets

How to run implementation of spec #1354 ("Rate-limit-safe sync via bulk Trakt
progress") in a fresh OpenCode session — one ticket per session, no long
conversation carried forward.

## Workflow per ticket

1. **Start a new session in the repo's worktree** — `AGENTS.md` (repo
   conventions) loads automatically.
2. **Pick the frontier ticket**: open tickets with no open blockers, first in
   map order. T1 (`#1355`) has no blockers and is first.
3. **Read it**: `gh issue view <n> --comments` (reads ticket + comments).
4. **Claim it**: `gh issue edit <n> --add-assignee @me`.
5. **Implement TDD-first** at the seams from AGENTS.md (Seam 1 = sync pipeline
   vs mocked `HttpClient`; Seam 2 = concurrency/retry operator as its own unit;
   Seam 3 = optimistic updates on both stores). Definition of done = the
   ticket's acceptance criteria.
6. **Verify**: `pnpm test:coverage` (targeted specs), `pnpm lint:check`,
   `pnpm format:check`.
7. **Resolve**: comment on the ticket with files changed + verification, then
   `gh issue close <n>`. The native `blocked_by` edges auto-update the frontier
   for the next session.

## Starter prompt (paste into the new session)

For ticket T1 — Rate-limit safety net (#1355):

> Implement issue #1355 (Rate-limit safety net, part of spec #1354),
> TDD-first.
>
> Design context:
>
> - Parent spec: `gh issue view 1354 --comments`
> - ADR: `docs/adr/0003-bulk-progress-sync.md`
> - Glossary: `CONTEXT.md`
>
> Scope: a reusable safety net for sync HTTP — at most 8 requests in flight;
> on a 429 retry honoring `Retry-After` up to 3 attempts, exponential backoff
> and jitter; applied at the fetch layer so every sync request goes through it.
>
> Files today: `src/app/shared/services/sync.service.ts` (fan-out) and
> `src/app/shared/services/sync-data.service.ts` (fetch + existing retry).
> Test prior art (mocked `HttpClient` via `vi.fn`):
> `sync.service.spec.ts` and `sync-data.service.spec.ts`.
>
> Definition of done = the ticket's acceptance criteria, each covered by a
> passing test. Then `pnpm lint:check` and `pnpm format:check`.
>
> Report: comment on #1355 with files changed + test results, then close it.

For later tickets, swap the issue number and keep the same skeleton — each
ticket body already contains its own What to build / Acceptance criteria /
Blocked by sections.
