# Translations are warmed before a view renders

Trakt and TMDB return titles in the original language. The viewer's language lives in the
translation store, and every row, header and breadcrumb reads its title from that store. If the
store is cold when the view renders, the view paints the original title and swaps it a beat later.
Trakify therefore warms the store before the render rather than letting each row fetch behind the
paint.

## Warm once per page, not once per row

`ensureShowsTranslations` and `ensureEpisodesTranslations` take a page of items and make one request
per Show or Episode, not one per row. They are called by:

- the Show page before it resolves, so its header and breadcrumb never paint the original title;
- the History page before a page of Plays resolves, so its rows are titled from the first frame;
- the Upcoming page for the page that just arrived, so its requests are sent before the calendar
  asks for the next page instead of queueing behind the whole translation backlog;
- the sync, for the next episode of every library show (cache-skipping), so the progress list's
  next-episode line stays translated.

Warm-up is best effort per item: a failed request keeps the row and lets the next page load.

The History's first page is additionally warmed by a resolver before the router starts a transition
into the page (ADR 0004). The row the reader followed has to be rendered — and named for the view
transition — when the browser captures the new view, which happens in the page's first pass. After a
reload nothing the History rendered from is cached, so the Plays are not there in time. Only a
return from an Episode is worth it: that is the one arrival with a still to morph out of. The
warm-up is bounded, so a slow network gets the loading spinner instead of a view that stops
responding to the tap that asked for it, and best effort, so a History that cannot be read shows its
own error rather than failing the navigation.

## Episode translations never apply to en-US

This is a preserved contract: episode translations do not apply when the viewer's language is
`en-US`, even when the store still holds a value from a previous language. The sync clears that
value on the next sync.

## A Play's artwork is keyed by Episode

History rows ask for one TMDB Episode per Episode, never one per Play. A rewatch lists the same
Episode twice and must not fire two requests for the same still. The same rule decides which Plays
are worth a request at all: only those whose Show has a TMDB id, because without one there is no
artwork to ask for and the queries of two Shows would collide. `dedupeByKey` keeps the first item of
each key while preserving order, which is how a list collapses to the items that need their own
fetch.

The Episode title translation rides along with the still. The page's own warm-up usually fetched it
already, so it is generally a cache hit, but it keeps the row translated when a page arrives without
that warm-up.

## History presentation follows the server's order

- Day headings read `Today`/`Yesterday`, then the weekday and date, with the year once the Play is
  not from the current year. Dates render in the viewer's local timezone.
- Plays are grouped into day sections preserving the order Trakt returned (newest first). Only
  adjacent Plays can share a group: the server is the ordering authority, so re-grouping out of
  order would silently reorder the History.
- A Play's Episode within its Show is what tells two Plays of the same Episode apart.
- The row's link wraps the row in the History page, matching `t-show-list-item-wrapper`; only the
  artwork advertises that the row is clickable, and the Play details keep the default cursor.

## The next episode's air date may come from the overview

The next episode's detail is no longer pre-fetched during sync (ADR 0003). When it is missing, the
progress list falls back to the overview's compact `next_episode`, which carries its air date
(`first_aired` is a base field of Trakt's progress response), blended with its stored translation.
That keeps the list row's line without a per-show request. Sorting prefers the stored detail but
falls back to the same value, so it still works when no detail is stored.

## Null API answers

Trakt returns `null` (204 No Content) when a user has no stats yet; the stats API normalises that
rather than treating it as a failure.

## Consequences

A new list of Shows or Episodes that renders titles must call the matching warm-up before its first
render, and must dedupe its artwork requests by Episode. A new title source must state whether it
applies to `en-US`.
