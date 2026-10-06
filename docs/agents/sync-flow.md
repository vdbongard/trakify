# Sync flow

Login triggers sync in `SyncService` (`src/app/shared/services/sync.service.ts`). Skipped when `?sync=0` is in the URL.

- Gate: `shouldSyncOnLogin()` (`src/app/shared/helper/sync.ts`) — syncs when stale (>1h) or when no cached data exists. Empty-array caches count as data.
- Full sync on first load or `force`; otherwise incremental diff against Trakt `lastActivity`.
- Bookkeeping in `completeSync()`: a blocking failure writes nothing (retry next load). `lastActivity` advances only on a fully clean sync. `lastFetchedAt.sync` advances whenever nothing blocked.
- Store version (`SYNC_STORE_KEY`, currently v2): a mismatch wipes all caches via `discardOutdatedStores()`. Bump `e2e/helpers/seed.ts` together with it.
- Traps: trusting a recent `lastFetchedAt.sync` after caches were cleared leaves the app permanently empty — always check `hasCachedData` too. A 404 for an unaired watchlist episode is permanent, not a failure (`syncWatchlistEpisode`).

Progress `nextEpisode` line: `info.service.ts` calls `episodeService.toNextEpisode()`, which falls back to the compact overview `next_episode` plus stored translation (no per-show fetch, ADR 0003). Rendered by `firstAiredDate` in `show-list-item-content.component.ts` — blank when `first_aired` is missing.
