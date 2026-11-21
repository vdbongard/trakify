# View transitions and artwork morphs

Trakify morphs artwork between views with the browser's View Transitions API. The router runs the
transition; the app only decides which elements carry a `view-transition-name`, and for how long.
This ADR records the rules those names follow, because every one of them exists to prevent a
specific visible glitch.

## The still is named on its wrapper, not on the image

The Episode page always refetches its still. The image therefore does not exist yet when the browser
captures the new view of a navigation into the page. The name lives on the wrapper (which exists
from the first render), and the wrapper stands in the artwork the linking view already showed until
the page's own image lands. `EPISODE_STILL_TRANSITION_NAME` is the shared name; the e2e helper
mirrors it and `src/_view-transition.scss` styles it, so all three must agree.

A named still also skips the load fade: it has to be on screen when the browser takes the snapshot.
A still that only keeps its name at rest (the Episode page after the morph) fades in as usual.

## A name belongs to one morph

A name left on an element is captured by every later transition. When that later view has no
counterpart, the browser holds the old artwork on top of the arriving page instead of morphing it
anywhere. So:

- The History row and the Show page's Next Episode still are named on the click that starts the
  navigation, not on render.
- The Episode page keeps its still's name at rest, so a later back or forward navigation can morph
  it out — between two Episodes, back to the Show page, or back to the History row.
- A view that names its artwork up front (the Show page coming back from an Episode) drops the name
  once that one morph has run, using `ViewTransitionService.finished`.

The History page clears the row it named before naming another. This matters because a rewatch
lists the same Episode twice, and a view transition is dropped when two elements in one view share
a name. For the same reason only the followed row is named, never both.

## A back navigation carries no Episode

The router restores the history entry that was left; it does not hand the returning page the
Episode it came from. The returning view therefore reads the URL that was left to work out which
Episode to name — `@helper/episodeUrl` for the Show page, `@helper/history` for the History page.
The Show page reads that URL before the router clears the navigation, and hands it to the Next
Episode component rather than letting the child read it, because a child first renders after the
router has cleared the navigation it belongs to.

## The Episode page reads navigation state from the current entry, every time

The router reuses the Episode page when only the Episode in the URL changes. A field initialised
once would keep the state of the Episode the linking view opened, feeding that Episode's still to
the loading slot and naming it on every arrow navigation. The page therefore reads the current
history entry for every Episode. The router writes the entry before it activates the page, and a
back or forward navigation restores the entry it lands on, so the still morphs between Episodes
again.

## Stale-while-revalidate keeps the episode block mounted

When "Mark as seen" changes the next-episode coordinates, the next-episode queries keep serving the
previous episode until the new one resolves. Removing the element and re-inserting it made the
seasons below jump. The same rule applies to the Next Episode message: it renders as soon as the
optimistic advance converges the store to "no next", not when the request resolves, or the block is
empty between the card leaving and the message arriving.

## The poster comes from the show response, not the season detail

A show in progress shows the poster of the season it is on. That poster is read from the TMDB show's
own `seasons` list — the response the Progress list row already carries — rather than from the
separately fetched season detail. A row and the Show page it links to therefore resolve the same
artwork before any season request lands, so the poster does not change underneath the user once
that request does. The fallback is deliberately the navigation's season snapshot, not the live
season: it is the same snapshot the row resolved against, so the two agree even when a response
carries no season list. The season detail is kept as a fallback, and the show-level poster last.

## CSS rules that follow from the above

- Only hold the outgoing artwork when a counterpart exists. An Episode page entered from a view
  that named the artwork keeps its name at rest; navigating on to a view with no still of that
  Episode captures the name too. In that transition the old copy is the only child of its image
  pair, and holding it would leave the artwork sitting on top of the arriving page. It fades out
  with the page instead.
- Override the UA `plus-lighter` blend with a plain cross-fade. The default adds the incoming
  snapshot to the outgoing one, which only works while the outgoing one is fading out. Holding the
  outgoing artwork breaks that and washes the artwork out to near-white. The blend comes from a UA
  animation, so the override is `!important`.
- Named UI layers (wrapper, toolbar and its shadow, snackbar) sit above the page transition.

## Consequences

Any new view that names artwork must answer three questions: which element exists on the first
render, when the name is removed, and what the counterpart is on the other side. A name that cannot
answer all three is left off. `e2e/helpers/transitions.ts` records both sides of every router
transition so the suite can assert these rules.
