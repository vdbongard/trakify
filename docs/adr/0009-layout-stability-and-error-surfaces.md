# Layout stability and where errors appear

Trakify treats content that is already on screen as something the reader is looking at. Refreshes
must not move it, and failures must not insert themselves above it. The same rule drives the
reserved boxes and the image-loading inputs.

## Errors: Snackbar for a refresh, inline for a first load

A failed refresh of content that is already on screen goes to a Snackbar. A Snackbar overlays the
page, so the rows, header, poster, description and cast stay where they are. A block inserted above
that content pushes it down — a layout shift for information the reader did not ask for.

A failure that leaves nothing to show keeps the inline error in the template: there is no content
below for it to push down. This split is applied consistently on the History, Show, Episode, Season,
Search, Upcoming, Watchlist and Statistics pages.

`QueryErrorNoticeService` implements the Snackbar side:

- A Query reports failure only after its own retries are exhausted, which lands seconds after the
  page rendered.
- Identical messages are suppressed for a short window, so several queries failing for the same
  reason report once instead of queueing one Snackbar each.
- The service is provided by each page, so the de-duplication window belongs to that page: the same
  message failing on the next page is still reported there.
- Leaving the page takes the notice with it.
- `Retry` refetches the query rather than reloading the app. Mutations keep using `onError`, whose
  action reloads.

Retries retry only the request that failed: the next page for a pagination failure, so the rows
already on screen are not fetched again.

## Reserved boxes

- The Show page's cast section has a fixed-height wrapper, so the sections below never move when the
  cast arrives. It stays in place when the show has no cast, with a message inside it: sizing it to
  the message instead would shift the page the other way. The message is centred with a transform
  rather than a margin so the reserved height is unaffected.
- The Episode page holds the still's slot open while the Episode loads. The page fetches the still
  itself, and a view transition into the page needs the named element there when the new view is
  captured (ADR 0006).
- The History row's artwork sits in a fixed 16:9 slot that clips whatever it holds; the image keeps
  its own aspect ratio so NgOptimizedImage never reports a distorted ratio.
- A Show row's network line keeps its height before the network name arrives, so the text below does
  not jump.
- The Next Episode block deliberately does _not_ reserve a placeholder. The block is up to ~700px
  tall once the episode arrives, and a placeholder that size is not worth the flash it caused on
  every page load.

## Images: preload decisions are frozen at first render

`NgOptimizedImage` rejects a `priority` change after an image has initialised, and rejects a
`loading` input next to `priority`. Row position therefore decides preloading once, at the first
render, and is frozen:

- A row in the first page request loads eagerly; later pages stay lazy.
- Poster preloading follows the row's position in the whole list, so a list split into pages
  preloads one screenful rather than a screenful per page.
- A priority poster leaves `loading` undefined.
- The first screenful of History artwork is worth preloading, as on Show rows.

## Text that must not guess

- The Episode header never falls back to the episode number while the detail request is in flight.
  It shows a TMDB title if one has landed, otherwise it stays blank. Falling back to the number is
  what flashed "Episode 2" during navigation.
- `isNewShow` is tri-state: `undefined` while the parent is still working out whether the show is
  already in progress. The header withholds the watchlist button during that window instead of
  flashing it in and then removing it. The episode component coerces with `booleanAttribute`, which
  would turn `undefined` into `false` and treat an unknown show as already started, so the page
  passes the tri-state only to the header.
- The Trailer button is disabled only when TMDB has said there is no trailer. The bulk TMDB cache
  has no `videos` key, so an in-app navigation first sees a show without video data; treating that
  as "no trailer" made the button flip from disabled to enabled for the majority of shows. The
  tooltip sits on the wrapper because a disabled button receives no pointer events.
- Breadcrumb parts may shrink below their content width so they ellipsize instead of being clipped
  by the wrapper on a narrow viewport.

## The Show accordion measures height

`height` is a layout property, but an accordion is the one case with no transform equivalent:
`scaleY` would stretch the text. Only the wrapper is measured; the text inside is clipped and the
button stays outside it.

The start height is committed in one style pass before the target is written, because writing both
in the same pass collapses into a single change and a transition needs two distinct computed values.
`scrollHeight` reports the content height of the state just rendered even while the box is clipped,
so the target needs no double render.

When the user prefers reduced motion, the global rule zeroes every transition duration and no
`transitionend` fires. Without a measurement there is no inline height to leave behind, so the box
does not stay pinned at a stale height.

## Error copy is written for the reader

`HttpErrorResponse` implements `Error` without extending it, so `isError` names it explicitly when
deciding whether a value carries a message worth showing.

The message shown is a sentence the reader can act on, not `HttpErrorResponse.message`.
That property names the URL and the transport ("Http failure response for
https://api.trakt.tv/shows/x: 0 undefined"), which reads as a crash to anyone outside the console and
says nothing they can do about it.

## Consequences

A new page that refetches content on screen must use the Snackbar path and keep its inline error for
the empty case. A new image list must decide eager/lazy from a frozen position, never from a value
that can change after the image initialised.
