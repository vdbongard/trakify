# Optimistic mark-as-seen

Marking an episode seen updates the stores first and calls Trakt afterwards. The UI therefore moves
on the tap, and the follow-up sync converges the watched/watchlist stores with the server.

## The optimistic update owns the advance

`ShowService.markEpisodeSeenOptimistically` advances the common fields (`completed`,
`next_episode`) in the unified Show Progress map and patches the seasonal detail when it is present.
It returns whether the watched episode was the current next episode, i.e. whether the caller still
has to converge the following episode with a TMDB lookahead.

The lookahead rules:

- Without a TMDB id there is nothing to look ahead with, so the synthetic advance from the optimistic
  mark stays until the next sync replaces it.
- A failing lookahead must not hang the mark: it falls through without advancing.
- When no further episode exists, the store converges to the same "no next" state the server would
  report.
- While the real next episode is being fetched, the store keeps a synthetic next episode carrying
  the real season/number. That keeps the Show page's lazy query keys stable and never blanks the
  episode block, so there is no layout shift.

The synthetic episode uses a sentinel Trakt id (`0`). It is a network-free approximation with no
real Trakt entry, so its id can never match a real episode; consumers must fall back to
season/number when matching.

## Un-marking restores the real episode

Un-watching the earliest unwatched episode makes it the next episode again, and restoring the real
episode (with its own metadata) undoes the synthetic advance. Un-watching a later episode leaves the
next episode untouched.

A temporarily `undefined` `next_episode` is not persisted: `JSON.stringify` drops the key, so the
write is made with `save: false` for that transient state.

## When there is no local record

A show that was never opened has no detailed progress record. There is nothing optimistic to
advance; the API round-trip and the follow-up sync populate the stores. The "Adding new show..."
toast is limited to shows not yet in the watched list, so it does not reappear on every mark while a
sync is still running.

The toast belongs to the very first watched episode of a show. The decision is captured before the
optimistic mark (which increments `completed`), so marking a later episode while the first sync is
still in flight does not show it again.

A watched show should not linger on the watchlist, so marking an episode removes it from the
watchlist. A watchlist-only show keeps its watchlist entry; removing it is the explicit "remove from
watchlist" action. Watchlist-only shows still need a sync so the watched/watchlist stores converge
with the server.

## History is invalidated, not patched

History is read from Trakt on demand (ADR 0004), so there is no local Play store to update.
Invalidating the query is what makes the mounted History tab show the Play the user just created —
or drop the one they just removed.

`firstValueFrom` is used rather than `lastValueFrom`: it keeps the previous `take(1)` semantics. The
batched history stream never completes, so `lastValueFrom` would hang on batched marks.

## Stores must publish a new leaf

`ExecuteService` updates nested progress records optimistically, then publishes a shallow copy of
the root store. The Episode page copies the leaf it reads too. Otherwise Angular's computed equality
sees the same mutated episode object and the Mark as seen/unseen label never refreshes.

## Consequences

A new optimistic mutation must say whether it needs a follow-up sync, whether it may show the
first-episode toast, and what it does when the local record is missing. Anything that matches an
episode must handle the sentinel id.
