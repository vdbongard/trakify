# The Episode still: load fade, cache memory and the stand-in layer

The Episode page is reused for every Episode, and the still it renders is replaced as soon as the
next Episode's own request lands. Two problems follow: returning to an Episode it showed a moment
ago mounts a fresh still with no memory of that artwork, and the page often captures a view
transition before its own still request has landed.

## Fading in is a per-URL decision

The component remembers the still files the app has already painted, keyed by the URL it showed
them from. A still whose URL has not been painted fades in on load. A still whose URL the app has
already painted is back from the browser cache and is shown straight away — fading it in again
would flash the artwork from nothing.

A named still never fades in, regardless of that memory: it has to be on screen when the browser
takes the snapshot, and it is swapped out for a fresh instance when the request lands.

The record is cleared by a test hook so each test starts with a fresh browser. Application code
does not clear it.

## Two layers cover the same box

The still is two layers: this page's own image, and behind it the smaller copy the view it came from
was showing. Both cover the same box, so the smaller one is only ever what shows while the larger
one has nothing to paint. The smaller copy is the size the History lists it in — the very file this
page's own image is a bigger version of — so it is already in the browser cache.

Without it, the Episode page asks for a bigger file than the row showed, and on a slow connection
the artwork vanishes into an empty box for as long as that file takes. The copy is only used when
the still is the incoming side of a running transition; a still that merely keeps its name at rest
fades in as usual.

## Fallbacks still represent the Episode

A fallback still is a generic image, but it still stands for this Episode, so it is linked like the
artwork it replaces.

The Trakt Episode is known even when TMDB has no detail record for it, so the component takes both:
the Trakt Episode drives identity and navigation, the TMDB record drives the image.

## Consequences

A new artwork surface that can be entered by a view transition must render a container from its
first frame and decide its fade from whether that URL has been painted before, not from whether the
image is complete.
