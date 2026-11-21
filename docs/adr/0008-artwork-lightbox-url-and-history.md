# The artwork lightbox lives in the URL and owns one history entry

`createArtworkLightbox` binds PhotoSwipe to a gallery that may not contain its artwork yet, and the
open viewer's state lives in the URL (`#artwork=<name>`). Both choices exist to remove races that
the previous implementation could not win.

## Bind the container, resolve items on click

PhotoSwipe attaches its click listener to the element(s) it is handed. With
`gallery: '.image-link'` those are the artwork links themselves, so they have to be in the DOM when
`init()` runs. The artwork only arrives with its own TMDB request; on a slow or cold connection the
link is not there yet, no listener is attached, and the click falls through to the browser and opens
the image in a new tab. The fixed timeouts both pages used to wait out were a race against that
request.

Binding to `gallery` — a container that always exists — and resolving items through `children` on
each click removes the dependency on when the artwork renders. A link added after `init()` is picked
up because the listener sits on the container and the items are queried at click time.

## The URL is the only state

`#artwork=<name>` names the open artwork. Because the state lives in the URL it can be shared:
opening the same link elsewhere opens the same artwork, and going forward onto an entry that named
it opens it again.

Opening gives the viewer a history entry of its own, so the back button closes it instead of walking
out of the page while it is still on screen. That route change would otherwise run a view transition
over the viewer's animation, which is what made the artwork glitch. Closing the viewer any other way
gives the entry back, so it never costs the user an extra back press.

A forward navigation, or a page opened straight from a shared link, arrives on a URL that already
names the viewer. That entry is already there, and pushing a second one would cost an extra back
press. Angular reads `ɵrouterUrl` on back and forward: with the page URL in it, Angular keeps out of
the way instead of navigating to the viewer's own URL, which would push a second entry and run a
view transition over the viewer's animation.

An entry opened by this viewer names an index. Anything else found in `pswp` belongs to someone else
— an older release left a boolean there — and giving it back would skip a back press. When the page
was opened from a shared link there is no entry of ours to give back, so closing stops naming the
viewer in the URL instead of leaving the page.

## Opening and closing are serialised

- `close()` is a no-op until PhotoSwipe's opening animation ends, because it will not reverse a
  transition mid-flight. A back press that arrives before then sets a flag, and the close runs when
  the opening animation finishes.
- An open request waits while the artwork has not rendered, and while a closing viewer is still on
  screen. It opens the item the current history entry named, or the gallery's first when the URL
  names only the artwork (a shared link arrived on a page that never pushed an entry).
- A viewer that is still closing clears `window.pswp` only after the current listener has run, so
  the open path must not assume a present `pswp` means a usable viewer.

## Consequences

The lightbox is usable on a cold connection, the back button always closes it, and a shared link
opens the same artwork. Any new artwork gallery must expose a container that exists before the
artwork does; binding directly to the images reintroduces the race.
