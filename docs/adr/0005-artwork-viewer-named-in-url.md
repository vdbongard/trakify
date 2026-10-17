# The open artwork viewer is named in the URL

An artwork viewer (the PhotoSwipe lightbox on a Show poster or Episode still) is named by the URL —
`#photo=<index>` — and that name is the one place its open state lives. `createArtworkLightbox`
reads it on load, so a shared link opens the same artwork, and reads it again on every back and
forward, so going forward onto an entry that named the viewer opens it again.

Opening pushes a history entry for the viewer, so the back button closes it instead of walking out
of the page while it is still on screen. The route change back would otherwise run a view transition
over the viewer's own opening or closing animation, which is what made the artwork glitch; closing
the viewer any other way gives the entry back, so it never costs an extra back press.

The pushed entry also carries Angular's `ɵrouterUrl` state key, holding the page URL without the
viewer's hash. The router treats a back or forward that only differs by the fragment as a
navigation; with the entry's own URL in that key it sees the URL as unchanged and skips, which keeps
it from pushing a second entry and from running that transition. `ɵrouterUrl` is private to Angular,
so it is the one coupling to watch on a router upgrade: if it ever goes, back and forward regain a
duplicate entry and a view transition, and the forward test in `e2e/episode.spec.ts` (a single back
from a reopened viewer) starts to fail.

A page opened directly from a shared link never pushed an entry of its own, so the back button has
nothing of ours to give back: it leaves the page, and the viewer closes as it goes. That is the one
case where closing the viewer is not the back button's only job, because the browser had no earlier
entry inside the app to return to.
