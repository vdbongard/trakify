# Sync pipeline: staged publishes, bookkeeping and failure isolation

ADR 0003 defines _what_ the sync fetches. This ADR defines _how_ the results are written, when the
list UI is allowed to repaint, and which bookkeeping markers survive a partial failure.

## Stores are a signal/localStorage hybrid

`SyncDataService` owns a signal per store and persists each write to localStorage. Writes come in
two shapes: whole-store values (`array`/`object`) and records that are mutated in place
(`objects`/`arrays`, e.g. the Show Progress map). The difference matters for staging: an in-place
record mutation needs no staged value, because the mutation is already visible to readers; a
whole-store write has nothing to mutate, so its fetched value is staged and applied by `flush()`.

## One publish per sync, not one per step

A sync writes many stores. Publishing each step immediately makes the list UI jump once per step.
Instead `beginBatch()` raises a depth counter and `endBatch()` publishes each store that actually
staged a write exactly once.

- While the counter is above zero, `flush()` only records the deferred callback and `syncValue()`
  only stages the value.
- Staged signals are tracked in a set, and a mid-sync `flush()` registers only those. Flushing an
  untouched store, or a helper flush with nothing new, must never wake the UI.
- `shouldDefer()` centralises the "explicitly deferred or inside a batch" check that every staging
  path uses (array/object/paged/bulk/evict and the sync helpers).
- `markStaged()` lets a caller that mutated a record in place register it for the batch.

The bulk stores must still be published _mid-sync_, after the bulk steps and before the detail
steps. The later steps read them back (translations per show, items per list, watchlist episodes,
orphan cleanup). Staged whole-store writes are invisible to `s()` readers until flushed, so without
that mid-sync flush the later steps would read pre-sync values, skip work, or evict freshly synced
entries as orphans. The final flush publishes the remaining detail stores.

## Concurrent callers share one request

Fetches are keyed by request URL in an in-flight map. Page queries, the optimistic executor and the
sync helpers therefore share one HTTP request instead of each firing a duplicate. The entry is
dropped once the request settles; later callers re-fetch rather than replaying a settled value.

Persistence is decided by each caller's own `persist` flag, not by the caller that opened the shared
request. A `persist=false` opener (the Show page's next-episode query merging a translation without
storing it) must not swallow a later `persist=true` caller's write; otherwise the store stays empty
and a follow-up sync re-fetches the same URL.

## Blocking failures and item failures are different

A sync failure is one of two kinds:

- **Blocking**: a top-level batch rejected. The store's state is unknown, so the sync must be
  retried rather than recorded as done.
- **Item**: one isolated resource failed. Only that resource is missing; the rest of the sync is
  valid. Each isolated syncable resolves `0` on success and `1` on failure, and the batch reports
  the total so the summary stays item-accurate.

The bookkeeping follows from that split:

- A blocking failure returns early and writes nothing.
- The last-activity marker is the baseline for the incremental diff, so it advances only on a
  completely clean sync. Withholding it on an item failure keeps `syncAll` true, which makes the
  next sync refetch with `force` and retries the failed items.
- The fetch timestamp and the store version are written whenever no blocking failure occurred. The
  staleness window and the cache format are both satisfied by a partial sync; gating them on
  perfection turned one unavailable resource into a forced full re-sync on every page load.

The store version describes the _format_ of the caches, not their contents. Bump it when the
persisted format changes to trigger a one-time full re-sync. A forced upgrade sync arms the
migration; the version marker is recorded by the sync itself only after it fully succeeded. If a
blocking failure leaves the caches unknown, the marker stays absent and the next load re-arms the
migration.

## Only a real logout may drop the stores

A cold start with an expired access token reports "logged out" until `AuthService.refresh()`
resolves. That is not a logout. Wiping caches hydrated from localStorage in that window leaves the
progress list empty for the rest of the session, because the following incremental sync sees cached
data and skips re-fetching it.

When a real logout does clear the stores, the config survives — and it carries the timestamp
claiming the deleted caches are current. That timestamp must be cleared, or the next login looks up
to date, skips the sync, and lands on a permanently empty progress page. The store version is
deliberately kept: it describes the format, so there is nothing stale-format left to re-migrate.

Staleness is never decided by the timestamp alone. `hasCachedData` is consulted as well, because a
logout (or any cleared cache) leaves empty stores behind a recent timestamp. It answers whether the
key exists, not how much it holds: an account with nothing watched caches an empty array, and
treating that as "no data" would re-sync on every page load.

## Identity and eviction

- List items are keyed by the numeric Trakt id, not the slug. Trakt refuses some numeric list slugs
  (e.g. `"1"`) with "List is private or does not exist" (403), while the id always resolves. Lists
  are still looked up by slug for routing. This is store format v2.
- Orphan cleanup removes store entries whose Trakt id no longer belongs to any synced show. It runs
  against fresh bulk data, so freshly synced entries survive and genuine orphans are evicted.
- The watchlist pre-fetches S1E1 because the page shows its air date and sorts by it. A show that has
  not premiered has no S1E1 and Trakt answers 404; that is a permanent "no such episode", not a sync
  failure, so it is tolerated. Shows reporting no aired episodes are skipped.
- Per-show episode detail and TMDB season data are deliberately not pre-fetched (ADR 0003). Only the
  next episode's translation is fetched, cache-skipping, so the progress list's next-episode line
  stays translated.

## Consequences

A new store write must declare whether it stages or publishes, and a new sync step must run inside
the batch and before the flush that later steps depend on. A new marker must state whether it
describes content (withhold on item failure) or format (write on any non-blocking sync).
