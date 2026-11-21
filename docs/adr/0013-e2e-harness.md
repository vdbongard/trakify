# E2E harness: hermetic traffic, seeded state and recorded transitions

The Playwright suite runs against the real app with every network request answered locally. These
are the rules that keep it hermetic and make the UI states it needs reproducible.

## Block first, mock second

`blockExternalTraffic` intercepts all real Trakt/TMDB traffic and answers 404 JSON, so a test never
leaves the host. It is registered first; the specific `mockTrakt`/`mockTmdb` handlers are registered
afterwards. Playwright evaluates route handlers in reverse registration order, so the specific
handler wins.

## Artwork is mocked at the size TMDB serves

`image.tmdb.org/t/p/<size>/...` is answered with a stand-in of the real aspect ratio: 16:9 stills at
`w300`, 2:3 posters at `w185`. The 1x1 PNG `blockExternalTraffic` installs would hide aspect-ratio
bugs, and it makes `NgOptimizedImage` warn (NG02952) about every image. The artwork mock is
registered after `blockExternalTraffic`.

`gate` holds an answer back until it resolves, and `delayMs` delays a response, for testing what a
view shows while an image or its owning response is still on its way. For an artwork response that
also delays the artwork link, which the lightbox tests rely on: the link must still open in the
lightbox when it appears late.

## Seeded state mirrors the app's own bookkeeping

`seed.ts` writes app data, the OAuth token and a freshly synced config into localStorage before any
app code runs. It mirrors the app's sync-store versioning: without the version marker the app treats
the seeded stores as pre-upgrade caches and discards them (`discardOutdatedStores` +
`clearCacheKeys`), so no seeded page state would render. The marker must be bumped together with
`SYNC_STORE_VERSION` in `sync.service.ts`. Applying the injection script again on the same page
replaces the seeded values.

Fixtures are hand-crafted builders whose shape matches the Trakt/TMDB responses and the objects the
app stores in localStorage. Two progress shapes exist and are not interchangeable:

- `showsProgress` is the detailed per-show store, filled on demand by the Show page.
- `showsProgressOverview` is the compact bulk store the Progress list and Statistics read.

The shared watched-show seed builds the watchlist, progress, overview, episodes and TMDB rows
together. A History fixture that models a rewatch lists the same Episode twice, with the first Play
being the one the tests follow.

## Transitions are recorded from the router

`e2e/helpers/transitions.ts` records the view-transition names of every transition the router starts:
the old view's before the update, the new view's after it — still before the browser takes its
snapshot of the new view, which is the moment a name has to be on the element. The recorded names
exclude empty captures.

The still's transition is stretched so the browser's pseudo tree can be read while it runs; the real
transition is over in a quarter second and tests that inspect what was put on it need longer. The
helper name must match `EPISODE_STILL_TRANSITION_NAME`.

## Real services, stubbed requests

Where a component reads query options that the route also uses, the spec injects the real service
and stubs only the request. That keeps the component and the route warming the same query.

Tests that need a request in flight resolve it on a macrotask, so the observer subscribes while the
request is running, as it does against a real API. An instant mock would let the page pipeline finish
first and a mounting observer would legitimately refetch stale data.

## Consequences

A new endpoint needs a fixture and a mock handler registered after `blockExternalTraffic`. A new
seeded store needs its key and, where relevant, the version marker. A new named artwork surface
needs its transition name asserted through the recorder.
