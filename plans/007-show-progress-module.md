# 007 — One Show Progress module

- **Status**: TODO
- **Commit**: 3d122e53
- **Severity**: HIGH
- **Category**: Architecture / deepening
- **Estimated scope**: ~15 files; net deletion

## Problem

Show Progress (see `GLOSSARY.md`) is derived in many small places that each re-combine the same
inputs, and recent bugs landed in the callers, not the helpers (1e059d58, 4463d141, 942976d2):

- **Remaining Episodes has four definitions**: `EpisodeCountComponent` (`aired − completed` without
  seasonal detail, else `getRemainingEpisodes`, which returns `-1` until TMDB loads),
  `hasNoNewEpisodes` (`aired <= completed` + season-0 rule), `sortByShowProgress`
  (`completed / aired`).
- **The `next_episode` encoding leaks**: `undefined` = unknown, `null` = none, trakt id `0`
  (`SYNTHETIC_EPISODE_TRAKT_ID`) = pending, season `0` = none. Checked by hand in 3 templates,
  `show.component.ts`, `hasNoNewEpisodes`, `EpisodeService.toNextEpisode` and `ExecuteService`.
- **Duplicates**: `getNextEpisode` (`helper/shows.ts`) re-implements `toNextEpisode`;
  `nextSeasonNumber` / `nextEpisodeNumber` (`show.component.ts` ~L272–322) are copy-paste twins.
- **ExecuteService writes the synthetic Next Episode itself** (`addEpisodeOptimistically`, ~L115–150)
  including the TMDB lookahead.

## Decisions (settled)

1. **Scope**: Remaining Episodes, Aired Episodes (per Show and per Season), the Next Episode state,
   and the Progress list filter/sort keys.
2. **Shape**: root-injected `ShowProgressService` in `src/app/pages/shows/data/`, reading the
   progress, episodes, TMDB-season and translation stores itself. Pure rules may stay as private
   functions (internal seam for its own tests) but are not exported.
3. **Remaining Episodes is a best known count, never `-1`**: overview count until seasonal detail
   arrives; `unknown` only when there is no progress at all (ADR 0003: overview data is authoritative
   until the Show page opens).
4. **Next Episode is an explicit union** at the interface: `unknown` | `none` | `pending` | `episode`
   (with whatever Trakt / TMDB / translation detail is stored). The raw `next_episode` encoding exists
   only inside the stores and this module.
5. **Read interface**: one entry point per Show — `progress(show)` → signal of
   `{ remaining, aired, nextEpisode, seasons: Map<number, { aired, remaining }> }` (exact type names
   are the executor's call). Filter and sort read the same object.
6. **One write**: "an Episode was marked seen / unseen for this Show". The module owns the lookahead
   and the `pending` entry; `ExecuteService` calls it and keeps the Trakt request, snackbar and loading
   state. The lookahead must tolerate a Show with no TMDB id.
7. **Show page reconciliation**: the module reconciles the Show page's on-page detailed progress fetch
   with the overview store. The page passes the fetched result in; moving the fetch itself is left to
   a later Show detail module.
8. **Replace, don't layer**: delete `getRemainingEpisodes`, `getAiredEpisodes`,
   `getAiredEpisodesInSeason`, `hasNoNewEpisodes`, `getNextEpisode`, `sortByShowProgress`,
   `EpisodeService.toNextEpisode` and the Show page's `nextSeasonNumber` / `nextEpisodeNumber`; port
   their spec cases onto the module.
9. **Tests**: table-driven specs against real in-memory stores (no HTTP). Cases: the 4 Next Episode
   states, unaired Show, specials (season 0), TMDB missing / not loaded yet, ended Show, overview-only
   vs. seasonal detail.

## Constraints

- ADR 0003: no TMDB season or episode prefetch to compute Aired Episodes; keep the overview-only
  fallback and stored next-episode translation (`docs/agents/sync-flow.md`, "Progress nextEpisode
  line").
- ADR 0004: History invalidation stays where it is (ExecuteService) in this plan.
- No visible behaviour change except where it fixes a definition mismatch; existing e2e must pass.

## Steps (one green commit each; unit + full `pnpm e2e`)

0. **Separate fix first**: `ExecuteService.addEpisodeOptimistically` calls
   `TmdbService.getTmdbEpisode`, which throws when `show.ids.tmdb == null`, before the `try` in
   `addEpisode` — so marking the Next Episode seen on a Show without a TMDB id never sends the Trakt
   request. Add a regression test, make the lookahead skip when there is no TMDB id.
   `fix(execute): mark episodes seen for shows without a TMDB id`.
1. Add `ShowProgressService` + table-driven spec (no callers yet).
2. Move `EpisodeCountComponent`, `season-header`, `show-season-item` onto it.
3. Move `InfoService` filter and sort onto it.
4. Move `show.component.ts` and `show-next-episode` onto it (drop the tuple / `?? true` tri-state).
5. Move `ExecuteService` mark / unmark onto the module's write.
6. Delete the old helpers and their specs; fix stale comments (`MarkWatchedProgress` "both stores",
   `isNewShow` comment, `isDetailedProgress` use at `show.component.ts:161` if now dead).

## Done when

- `grep` finds no `next_episode` reads outside the stores, sync code and `ShowProgressService`.
- No caller computes Remaining Episodes or Aired Episodes itself.
- `pnpm test`, `pnpm lint:check`, `pnpm format:check`, `pnpm e2e` green.
